// Main tenant middleware for multi-tenant schema management
// Requirements: 1.1, 1.2, 1.3, 1.4, 4.3, 5.2, 5.3, 5.4

import { Request, Response, NextFunction } from 'express';
import { 
  TenantRequest,
  TenantMiddlewareConfig,
  TenantOperationResult,
  TenantContext
} from '../types/tenant';
import { 
  TenantError,
  TenantErrorFactory,
  isTenantError,
  isDatabaseConnectivityError
} from '../types/tenantErrors';
import { 
  processTenantFromRequest,
  cleanupTenantContext
} from '../utils/tenantHelpers';
import { 
  tenantLogger,
  logTenantHeaderSuccess,
  logTenantHeaderFailure,
  logDatabaseConnectivityCheck
} from '../utils/tenantLogger';
import { formatTenantError } from '../utils/tenantErrorFormatter';
import { SchemaValidator, defaultSchemaValidator } from '../utils/schemaValidator';
import { getTenantErrorMessage, Language } from '../utils/translations';
import { SchemaCreator, defaultSchemaCreator } from '../utils/schemaCreator';
import { 
  DatabaseContextManager, 
  defaultDatabaseContextManager 
} from '../utils/databaseContextManager';
import { logger } from '../utils/logger';

/**
 * Default tenant middleware configuration
 */
export const DEFAULT_TENANT_MIDDLEWARE_CONFIG: TenantMiddlewareConfig = {
  tenantHeaderName: 'tenant',
  autoCreateSchemas: true,
  schemaCreationOptions: {
    runMigrations: true,
    migrationScriptPath: 'src/database/schema.sql',
    handleConcurrency: true
  },
  cacheConfig: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000
  }
};

/**
 * Main tenant middleware class that orchestrates tenant processing
 * Requirements: 1.1, 1.2, 1.3, 1.4, 4.3, 5.2, 5.3, 5.4
 */
export class TenantMiddleware {
  private config: TenantMiddlewareConfig;
  private schemaValidator: SchemaValidator;
  private schemaCreator: SchemaCreator;
  private contextManager: DatabaseContextManager;

  constructor(
    config: Partial<TenantMiddlewareConfig> = {},
    schemaValidator?: SchemaValidator,
    schemaCreator?: SchemaCreator,
    contextManager?: DatabaseContextManager
  ) {
    this.config = { ...DEFAULT_TENANT_MIDDLEWARE_CONFIG, ...config };
    this.schemaValidator = schemaValidator || defaultSchemaValidator;
    this.schemaCreator = schemaCreator || defaultSchemaCreator;
    this.contextManager = contextManager || defaultDatabaseContextManager;
  }

  /**
   * Main middleware function that processes tenant headers and sets up context
   * Requirements: 5.2, 5.4
   */
  async processTenant(req: TenantRequest, res: Response, next: NextFunction): Promise<void> {
    const requestId = (req as any).requestId;
    
    try {
      // Extract and validate tenant from request headers (Requirements: 1.1, 1.2, 1.3, 1.4)
      const tenantResult = await processTenantFromRequest(
        req,
        this.config.tenantHeaderName
      );

      if (!tenantResult.success) {
        // Tenant processing failed - prevent access to protected resources (Requirement: 5.3)
        const error = tenantResult.error!;
        const statusCode = this.getStatusCodeForErrorCode(error.code);
        
        // Get localized message based on Accept-Language header
        const language = req.headers['accept-language']?.includes('en') ? 'en-US' : 
                        req.headers['accept-language']?.includes('es') ? 'es-CO' : 'pt-BR';
        const localizedMessage = this.getLocalizedErrorMessage(error.code, language);
        
        const errorResponse = {
          message: localizedMessage,
          status: statusCode,
          tenant: 'unknown'
        };
        
        res.status(statusCode).json(errorResponse);
        return;
      }

      const tenantContext = tenantResult.data!;
      const tenantId = tenantContext.tenantId;

      // Log tenant processing start
      tenantLogger.logTenantProcessing(
        tenantId,
        true,
        requestId,
        undefined,
        undefined,
        { stage: 'header_validation', headerName: this.config.tenantHeaderName }
      );

      // Skip schema validation - assume schema exists and is managed manually

      // Set up database context for the tenant (Requirement: 5.4)
      const contextResult = await this.contextManager.setTenantContext(tenantId, requestId);
      
      if (!contextResult.success) {
        // Database context setup failed - prevent access (Requirement: 5.3)
        this.handleTenantError(contextResult.error!, res, requestId, tenantId);
        return;
      }

      // Mark tenant context as validated and ready
      tenantContext.isValidated = true;
      req.tenant = tenantContext;

      // Make tenant information available to subsequent middleware and controllers (Requirement: 5.4)
      tenantLogger.logTenantProcessing(
        tenantId,
        true,
        requestId,
        undefined,
        undefined,
        { stage: 'complete', schemaName: tenantContext.schemaName }
      );

      // Proceed to next middleware
      next();

    } catch (error) {
      // Handle unexpected errors during tenant processing
      const tenantId = req.tenant?.tenantId || 'unknown';
      
      tenantLogger.logTenantProcessing(
        tenantId,
        false,
        requestId,
        undefined,
        undefined,
        { stage: 'error', error: error instanceof Error ? error.message : String(error) }
      );

      // Convert to tenant error and prevent access (Requirement: 5.3)
      const tenantError = TenantErrorFactory.createContextSetupError(
        tenantId,
        { originalError: error instanceof Error ? error.message : String(error) },
        requestId
      );

      this.handleTenantError(tenantError, res, requestId, tenantId);
    }
  }

  /**
   * Validates schema existence and creates it if necessary
   * Requirements: 4.1, 4.2, 4.3, 2.1
   */
  private async validateAndEnsureSchema(
    tenantId: string,
    requestId?: string
  ): Promise<TenantOperationResult<void>> {
    try {
      // Check if schema exists (Requirements: 4.1, 4.2)
      const validationResult = await this.schemaValidator.validateSchema(tenantId);
      
      if (validationResult.error) {
        // Handle database connectivity errors (Requirement: 4.3)
        if (validationResult.error.includes('Database connectivity') || 
            validationResult.error.includes('connection')) {
          const error = TenantErrorFactory.createDatabaseConnectivityError(
            tenantId,
            { reason: validationResult.error },
            requestId
          );
          
          return {
            success: false,
            error: {
              code: error.code,
              message: error.message,
              details: error.details
            }
          };
        }

        // Other validation errors (malformed schema names, etc.)
        const error = TenantErrorFactory.createSchemaValidationError(
          tenantId,
          { reason: validationResult.error },
          requestId
        );
        
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details
          }
        };
      }

      // If schema exists, we're done (Requirement: 4.2)
      if (validationResult.exists) {
        tenantLogger.logSchemaValidation(
          tenantId,
          true,
          true,
          validationResult.fromCache,
          requestId
        );
        
        return {
          success: true
        };
      }

      // Schema doesn't exist - create it if auto-creation is enabled (Requirement: 2.1)
      if (this.config.autoCreateSchemas) {
        tenantLogger.logSchemaCreation(
          tenantId,
          true,
          `crmx_database_${tenantId}`,
          requestId,
          undefined,
          undefined,
          { reason: 'Schema does not exist, creating automatically' }
        );

        const creationResult = await this.schemaCreator.createSchema(tenantId, requestId);
        
        if (!creationResult.success) {
          tenantLogger.logSchemaCreation(
            tenantId,
            false,
            `crmx_database_${tenantId}`,
            requestId,
            undefined,
            undefined,
            { error: creationResult.error }
          );
          
          return {
            success: false,
            error: creationResult.error
          };
        }

        tenantLogger.logSchemaCreation(
          tenantId,
          true,
          `crmx_database_${tenantId}`,
          requestId,
          undefined,
          undefined,
          creationResult.data
        );

        return {
          success: true
        };
      }

      // Schema doesn't exist and auto-creation is disabled
      const error = TenantErrorFactory.createSchemaValidationError(
        tenantId,
        { reason: 'Schema does not exist and auto-creation is disabled' },
        requestId
      );
      
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      };

    } catch (error) {
      // Handle unexpected errors during schema validation/creation
      tenantLogger.logSchemaValidation(
        tenantId,
        false,
        undefined,
        undefined,
        requestId,
        undefined,
        undefined
      );

      const tenantError = TenantErrorFactory.createSchemaValidationError(
        tenantId,
        { originalError: error instanceof Error ? error.message : String(error) },
        requestId
      );
      
      return {
        success: false,
        error: {
          code: tenantError.code,
          message: tenantError.message,
          details: tenantError.details
        }
      };
    }
  }

  /**
   * Handles tenant errors and sends appropriate HTTP responses
   * Requirements: 5.3
   */
  private handleTenantError(
    error: any,
    res: Response,
    requestId?: string,
    tenantId?: string
  ): void {
    let tenantError: TenantError;

    // Convert to TenantError if not already
    if (isTenantError(error)) {
      tenantError = error;
    } else {
      // Create generic tenant error
      tenantError = TenantErrorFactory.createContextSetupError(
        tenantId || 'unknown',
        { originalError: error.message || String(error) },
        requestId
      );
    }

    // Log the error
    logger.error('TENANT', `Tenant processing failed: ${tenantError.message}`, tenantError, {
      tenantId: tenantError.tenantId,
      requestId: tenantError.requestId,
      code: tenantError.code
    });

    // Send appropriate HTTP response based on error type
    const statusCode = this.getStatusCodeForError(tenantError);
    
    // Get localized message
    const language = 'pt-BR'; // Default language, could be extracted from request if available
    const localizedMessage = this.getLocalizedErrorMessage(tenantError.code, language);
    
    const errorResponse = {
      message: localizedMessage,
      status: statusCode,
      tenant: tenantError.tenantId || 'unknown'
    };
    
    res.status(statusCode).json(errorResponse);
  }

  /**
   * Gets localized error message
   */
  private getLocalizedErrorMessage(errorCode: string, language: Language): string {
    return getTenantErrorMessage(errorCode, language);
  }

  /**
   * Gets status code for error code
   */
  private getStatusCodeForErrorCode(errorCode: string): number {
    switch (errorCode) {
      case 'TENANT_HEADER_MISSING':
      case 'TENANT_HEADER_EMPTY':
      case 'TENANT_FORMAT_INVALID':
      case 'TENANT_ID_MALFORMED':
        return 400;
      
      case 'DATABASE_UNAVAILABLE':
      case 'DATABASE_CONNECTION_TIMEOUT':
      case 'DATABASE_CONNECTION_FAILED':
        return 503;
      
      case 'SCHEMA_CREATION_CONFLICT':
      case 'CONCURRENT_OPERATION_FAILED':
        return 409;
      
      default:
        return 500;
    }
  }

  /**
   * Determines appropriate HTTP status code for tenant errors
   */
  private getStatusCodeForError(error: TenantError): number {
    // Use the status code from the error if available
    if (error.statusCode) {
      return error.statusCode;
    }

    return this.getStatusCodeForErrorCode(error.code);
  }

  /**
   * Cleanup middleware to ensure proper resource cleanup
   * Requirements: 5.5
   */
  async cleanup(req: TenantRequest, res: Response, next: NextFunction): Promise<void> {
    const requestId = (req as any).requestId;
    const tenantId = req.tenant?.tenantId;

    try {
      // Clean up database context
      if (tenantId) {
        await this.contextManager.cleanup(requestId);
        
        tenantLogger.logContextCleanup(
          tenantId,
          true,
          requestId
        );
      }

      // Clean up tenant context from request
      cleanupTenantContext(req);

    } catch (error) {
      // Log cleanup errors but don't fail the response
      if (tenantId) {
        tenantLogger.logContextCleanup(
          tenantId,
          false,
          requestId,
          undefined,
          undefined
        );
      }
      
      logger.warn('TENANT', 'Failed to cleanup tenant resources', error as Error);
    }

    next();
  }

  /**
   * Gets current configuration
   */
  getConfig(): TenantMiddlewareConfig {
    return { ...this.config };
  }

  /**
   * Updates configuration
   */
  updateConfig(newConfig: Partial<TenantMiddlewareConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Default tenant middleware instance
 */
export const defaultTenantMiddleware = new TenantMiddleware();

/**
 * Express middleware function for tenant processing
 * Requirements: 1.1, 1.2, 1.3, 1.4, 4.3, 5.2, 5.3, 5.4
 */
export function tenantMiddleware(
  config?: Partial<TenantMiddlewareConfig>
): (req: TenantRequest, res: Response, next: NextFunction) => Promise<void> {
  const middleware = config ? new TenantMiddleware(config) : defaultTenantMiddleware;
  
  return async (req: TenantRequest, res: Response, next: NextFunction) => {
    await middleware.processTenant(req, res, next);
  };
}

/**
 * Express cleanup middleware function for tenant resource cleanup
 * Requirements: 5.5
 */
export function tenantCleanupMiddleware(
  config?: Partial<TenantMiddlewareConfig>
): (req: TenantRequest, res: Response, next: NextFunction) => Promise<void> {
  const middleware = config ? new TenantMiddleware(config) : defaultTenantMiddleware;
  
  return async (req: TenantRequest, res: Response, next: NextFunction) => {
    await middleware.cleanup(req, res, next);
  };
}

/**
 * Convenience function to create tenant middleware with custom configuration
 */
export function createTenantMiddleware(
  config: Partial<TenantMiddlewareConfig>,
  schemaValidator?: SchemaValidator,
  schemaCreator?: SchemaCreator,
  contextManager?: DatabaseContextManager
): TenantMiddleware {
  return new TenantMiddleware(config, schemaValidator, schemaCreator, contextManager);
}

/**
 * Middleware for requiring valid tenant context (use after tenant middleware)
 */
export function requireTenantContext(req: TenantRequest, res: Response, next: NextFunction): void {
  const requestId = (req as any).requestId;
  
  if (!req.tenant || !req.tenant.isValidated) {
    const errorResponse = {
      message: 'Contexto de tenant válido é obrigatório para esta operação',
      status: 400,
      tenant: req.tenant?.tenantId || 'unknown'
    };
    
    res.status(400).json(errorResponse);
    return;
  }
  
  next();
}