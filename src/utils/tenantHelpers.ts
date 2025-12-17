// Comprehensive tenant helper functions and utilities

import { Request } from 'express';
import { 
  TenantContext, 
  TenantRequest, 
  TenantValidationResult,
  TenantOperationResult,
  TenantConfig
} from '../types/tenant';
import { 
  TenantErrorFactory,
  TenantError,
  isTenantError
} from '../types/tenantErrors';
import { 
  validateTenantHeader,
  createTenantContext,
  generateSchemaName,
  isSafeTenantId,
  DEFAULT_TENANT_CONFIG
} from './tenantValidation';
import { logger } from './logger';

/**
 * Extracts tenant ID from HTTP request headers
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
export function extractTenantFromRequest(
  req: Request,
  headerName: string = 'tenant'
): TenantValidationResult {
  const tenantHeader = req.headers[headerName.toLowerCase()];
  return validateTenantHeader(tenantHeader);
}

/**
 * Sets up tenant context in request object
 */
export function setupTenantContext(
  req: TenantRequest,
  tenantId: string,
  config: TenantConfig = DEFAULT_TENANT_CONFIG
): TenantContext {
  const context = createTenantContext(tenantId, config);
  req.tenant = context;
  return context;
}

/**
 * Gets tenant context from request object
 */
export function getTenantContext(req: TenantRequest): TenantContext | null {
  return req.tenant || null;
}

/**
 * Validates that tenant context exists and is valid
 */
export function requireTenantContext(req: TenantRequest): TenantContext {
  const context = getTenantContext(req);
  if (!context) {
    throw TenantErrorFactory.createContextSetupError(
      'unknown',
      { reason: 'Tenant context not found in request' },
      (req as any).requestId
    );
  }
  
  if (!context.isValidated) {
    throw TenantErrorFactory.createContextSetupError(
      context.tenantId,
      { reason: 'Tenant context is not validated' },
      (req as any).requestId
    );
  }
  
  return context;
}

/**
 * Processes tenant from request and sets up context
 */
export async function processTenantFromRequest(
  req: TenantRequest,
  headerName: string = 'tenant',
  config: TenantConfig = DEFAULT_TENANT_CONFIG
): Promise<TenantOperationResult<TenantContext>> {
  try {
    const requestId = (req as any).requestId;
    
    // Extract and validate tenant from request
    const validation = extractTenantFromRequest(req, headerName);
    
    if (!validation.isValid) {
      let error: TenantError;
      
      switch (validation.error) {
        case 'Tenant header is required':
          error = TenantErrorFactory.createHeaderMissingError(requestId);
          break;
        case 'Tenant header cannot be empty':
          error = TenantErrorFactory.createHeaderEmptyError(requestId);
          break;
        case 'Invalid tenant format':
          error = TenantErrorFactory.createFormatInvalidError(requestId);
          break;
        default:
          error = TenantErrorFactory.createMalformedTenantError(requestId);
          break;
      }
      
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      };
    }
    
    const tenantId = validation.sanitizedTenantId!;
    
    // Additional safety check
    if (!isSafeTenantId(tenantId)) {
      const error = TenantErrorFactory.createFormatInvalidError(
        requestId,
        { reason: 'Tenant ID contains unsafe characters or reserved names' }
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
    
    // Setup tenant context
    const context = setupTenantContext(req, tenantId, config);
    
    return {
      success: true,
      data: context,
      tenantContext: context
    };
    
  } catch (error) {
    const requestId = (req as any).requestId;
    
    if (isTenantError(error)) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      };
    }
    
    // Unexpected error
    const tenantError = TenantErrorFactory.createContextSetupError(
      'unknown',
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
 * Cleans up tenant context from request
 */
export function cleanupTenantContext(req: TenantRequest): void {
  if (req.tenant) {
    delete req.tenant;
  }
}

/**
 * Gets schema name for current tenant context
 */
export function getCurrentSchemaName(req: TenantRequest): string | null {
  const context = getTenantContext(req);
  return context ? context.schemaName : null;
}

/**
 * Gets tenant ID for current tenant context
 */
export function getCurrentTenantId(req: TenantRequest): string | null {
  const context = getTenantContext(req);
  return context ? context.tenantId : null;
}

/**
 * Checks if request has valid tenant context
 */
export function hasValidTenantContext(req: TenantRequest): boolean {
  const context = getTenantContext(req);
  return context !== null && context.isValidated;
}

/**
 * Creates a tenant operation result for success
 */
export function createSuccessResult<T>(
  data: T,
  tenantContext?: TenantContext
): TenantOperationResult<T> {
  return {
    success: true,
    data,
    tenantContext
  };
}

/**
 * Creates a tenant operation result for error
 */
export function createErrorResult(
  error: TenantError,
  tenantContext?: TenantContext
): TenantOperationResult {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: error.details
    },
    tenantContext
  };
}

/**
 * Wraps async operations with tenant error handling
 */
export async function withTenantErrorHandling<T>(
  operation: () => Promise<T>,
  tenantId?: string,
  requestId?: string
): Promise<TenantOperationResult<T>> {
  try {
    const result = await operation();
    return createSuccessResult(result);
  } catch (error) {
    if (isTenantError(error)) {
      return createErrorResult(error);
    }
    
    // Convert unknown errors to tenant errors
    const tenantError = TenantErrorFactory.createContextSetupError(
      tenantId || 'unknown',
      { originalError: error instanceof Error ? error.message : String(error) },
      requestId
    );
    
    return createErrorResult(tenantError);
  }
}

/**
 * Logs tenant operation for debugging and monitoring
 */
export function logTenantOperation(
  operation: string,
  tenantId: string,
  success: boolean,
  details?: any,
  requestId?: string
): void {
  const logData = {
    operation,
    tenantId,
    success,
    details,
    requestId,
    timestamp: new Date().toISOString()
  };
  
  if (success) {
    logger.info('TENANT', `${operation} succeeded for tenant ${tenantId}`, logData);
  } else {
    logger.error('TENANT', `${operation} failed for tenant ${tenantId}`, undefined, logData);
  }
}

/**
 * Formats tenant error for HTTP response
 * @deprecated Use formatTenantError from tenantErrorFormatter instead
 */
export function formatTenantErrorResponse(error: TenantError) {
  return {
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
      tenantId: error.tenantId,
      requestId: error.requestId,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Validates tenant configuration
 */
export function validateTenantConfig(config: Partial<TenantConfig>): TenantConfig {
  return {
    schemaPrefix: config.schemaPrefix || DEFAULT_TENANT_CONFIG.schemaPrefix,
    validationCacheTtl: config.validationCacheTtl || DEFAULT_TENANT_CONFIG.validationCacheTtl,
    maxTenantIdLength: config.maxTenantIdLength || DEFAULT_TENANT_CONFIG.maxTenantIdLength,
    allowedCharactersPattern: config.allowedCharactersPattern || DEFAULT_TENANT_CONFIG.allowedCharactersPattern
  };
}