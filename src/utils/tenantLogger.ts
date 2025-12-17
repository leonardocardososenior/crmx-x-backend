// Enhanced logging utilities for tenant operations
// Requirements: 1.1, 1.2, 1.4, 2.3, 4.3

import { logger } from './logger';
import { 
  TenantError,
  TenantErrorCode,
  isTenantError
} from '../types/tenantErrors';
import { TenantContext } from '../types/tenant';

/**
 * Tenant operation types for structured logging
 */
export enum TenantOperationType {
  HEADER_VALIDATION = 'header_validation',
  SCHEMA_VALIDATION = 'schema_validation',
  SCHEMA_CREATION = 'schema_creation',
  SCHEMA_MIGRATION = 'schema_migration',
  CONTEXT_SETUP = 'context_setup',
  CONTEXT_CLEANUP = 'context_cleanup',
  DATABASE_CONNECTION = 'database_connection',
  TENANT_PROCESSING = 'tenant_processing',
  SECURITY_EVENT = 'security_event',
  PERFORMANCE_METRIC = 'performance_metric'
}

/**
 * Tenant log entry structure
 */
export interface TenantLogEntry {
  operation: TenantOperationType;
  tenantId?: string;
  requestId?: string;
  success: boolean;
  duration?: number;
  details?: any;
  error?: TenantError;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Enhanced tenant logger class
 */
export class TenantLogger {
  private module = 'TENANT';

  /**
   * Logs tenant header validation events
   * Requirement: 1.1, 1.2, 1.4
   */
  logHeaderValidation(
    success: boolean,
    tenantId?: string,
    requestId?: string,
    error?: TenantError,
    details?: any
  ): void {
    const entry: TenantLogEntry = {
      operation: TenantOperationType.HEADER_VALIDATION,
      tenantId,
      requestId,
      success,
      details,
      error,
      timestamp: new Date().toISOString()
    };

    if (success) {
      logger.info(this.module, `Tenant header validation successful`, {
        ...entry,
        validatedTenantId: tenantId
      });
    } else {
      const errorCode = error?.code || 'UNKNOWN';
      const errorMessage = error?.message || 'Header validation failed';
      
      logger.warn(this.module, `Tenant header validation failed: ${errorMessage}`, {
        ...entry,
        errorCode,
        errorType: this.getErrorType(errorCode)
      });

      // Log security events for suspicious patterns
      this.logSecurityEvent(errorCode, tenantId, requestId, details);
    }
  }

  /**
   * Logs schema validation events
   * Requirement: 4.3
   */
  logSchemaValidation(
    tenantId: string,
    success: boolean,
    exists?: boolean,
    fromCache?: boolean,
    requestId?: string,
    error?: TenantError,
    duration?: number
  ): void {
    const entry: TenantLogEntry = {
      operation: TenantOperationType.SCHEMA_VALIDATION,
      tenantId,
      requestId,
      success,
      duration,
      details: { exists, fromCache },
      error,
      timestamp: new Date().toISOString()
    };

    if (success) {
      logger.info(this.module, `Schema validation completed for tenant ${tenantId}`, {
        ...entry,
        schemaExists: exists,
        cacheHit: fromCache
      });
    } else {
      const errorCode = error?.code || 'UNKNOWN';
      const errorMessage = error?.message || 'Schema validation failed';
      
      logger.error(this.module, `Schema validation failed for tenant ${tenantId}: ${errorMessage}`, error, {
        ...entry,
        errorCode,
        isDatabaseError: this.isDatabaseConnectivityError(errorCode)
      });
    }
  }

  /**
   * Logs schema creation events
   * Requirement: 2.3
   */
  logSchemaCreation(
    tenantId: string,
    success: boolean,
    schemaName?: string,
    requestId?: string,
    error?: TenantError,
    duration?: number,
    migrationResult?: any
  ): void {
    const entry: TenantLogEntry = {
      operation: TenantOperationType.SCHEMA_CREATION,
      tenantId,
      requestId,
      success,
      duration,
      details: { schemaName, migrationResult },
      error,
      timestamp: new Date().toISOString()
    };

    if (success) {
      logger.info(this.module, `Schema created successfully for tenant ${tenantId}`, {
        ...entry,
        schemaName,
        migrationExecuted: !!migrationResult
      });
    } else {
      const errorCode = error?.code || 'UNKNOWN';
      const errorMessage = error?.message || 'Schema creation failed';
      
      logger.error(this.module, `Schema creation failed for tenant ${tenantId}: ${errorMessage}`, error, {
        ...entry,
        errorCode,
        schemaName,
        isCreationError: this.isSchemaCreationError(errorCode)
      });
    }
  }

  /**
   * Logs schema migration events
   * Requirement: 2.3
   */
  logSchemaMigration(
    tenantId: string,
    schemaName: string,
    success: boolean,
    requestId?: string,
    error?: TenantError,
    duration?: number,
    migrationDetails?: any
  ): void {
    const entry: TenantLogEntry = {
      operation: TenantOperationType.SCHEMA_MIGRATION,
      tenantId,
      requestId,
      success,
      duration,
      details: { schemaName, migrationDetails },
      error,
      timestamp: new Date().toISOString()
    };

    if (success) {
      logger.info(this.module, `Schema migration completed for tenant ${tenantId}`, {
        ...entry,
        schemaName,
        migrationDetails
      });
    } else {
      const errorCode = error?.code || 'UNKNOWN';
      const errorMessage = error?.message || 'Schema migration failed';
      
      logger.error(this.module, `Schema migration failed for tenant ${tenantId}: ${errorMessage}`, error, {
        ...entry,
        errorCode,
        schemaName
      });
    }
  }

  /**
   * Logs database context setup events
   */
  logContextSetup(
    tenantId: string,
    success: boolean,
    schemaName?: string,
    requestId?: string,
    error?: TenantError,
    duration?: number
  ): void {
    const entry: TenantLogEntry = {
      operation: TenantOperationType.CONTEXT_SETUP,
      tenantId,
      requestId,
      success,
      duration,
      details: { schemaName },
      error,
      timestamp: new Date().toISOString()
    };

    if (success) {
      logger.info(this.module, `Database context setup completed for tenant ${tenantId}`, {
        ...entry,
        schemaName
      });
    } else {
      const errorCode = error?.code || 'UNKNOWN';
      const errorMessage = error?.message || 'Context setup failed';
      
      logger.error(this.module, `Database context setup failed for tenant ${tenantId}: ${errorMessage}`, error, {
        ...entry,
        errorCode,
        schemaName
      });
    }
  }

  /**
   * Logs database context cleanup events
   */
  logContextCleanup(
    tenantId: string,
    success: boolean,
    requestId?: string,
    error?: TenantError,
    duration?: number
  ): void {
    const entry: TenantLogEntry = {
      operation: TenantOperationType.CONTEXT_CLEANUP,
      tenantId,
      requestId,
      success,
      duration,
      error,
      timestamp: new Date().toISOString()
    };

    if (success) {
      logger.debug(this.module, `Database context cleanup completed for tenant ${tenantId}`, entry);
    } else {
      const errorCode = error?.code || 'UNKNOWN';
      const errorMessage = error?.message || 'Context cleanup failed';
      
      logger.warn(this.module, `Database context cleanup failed for tenant ${tenantId}: ${errorMessage}`, {
        ...entry,
        errorCode
      });
    }
  }

  /**
   * Logs database connectivity events
   * Requirement: 4.3
   */
  logDatabaseConnectivity(
    success: boolean,
    tenantId?: string,
    requestId?: string,
    error?: TenantError,
    duration?: number,
    connectionDetails?: any
  ): void {
    const entry: TenantLogEntry = {
      operation: TenantOperationType.DATABASE_CONNECTION,
      tenantId,
      requestId,
      success,
      duration,
      details: connectionDetails,
      error,
      timestamp: new Date().toISOString()
    };

    if (success) {
      logger.debug(this.module, `Database connectivity check successful`, {
        ...entry,
        tenantId
      });
    } else {
      const errorCode = error?.code || 'UNKNOWN';
      const errorMessage = error?.message || 'Database connectivity failed';
      
      logger.error(this.module, `Database connectivity failed: ${errorMessage}`, error, {
        ...entry,
        errorCode,
        tenantId,
        isConnectivityError: this.isDatabaseConnectivityError(errorCode)
      });
    }
  }

  /**
   * Logs complete tenant processing events
   */
  logTenantProcessing(
    tenantId: string,
    success: boolean,
    requestId?: string,
    error?: TenantError,
    duration?: number,
    processingDetails?: any
  ): void {
    const entry: TenantLogEntry = {
      operation: TenantOperationType.TENANT_PROCESSING,
      tenantId,
      requestId,
      success,
      duration,
      details: processingDetails,
      error,
      timestamp: new Date().toISOString()
    };

    if (success) {
      logger.info(this.module, `Tenant processing completed successfully for ${tenantId}`, {
        ...entry,
        processingSteps: processingDetails
      });
    } else {
      const errorCode = error?.code || 'UNKNOWN';
      const errorMessage = error?.message || 'Tenant processing failed';
      
      logger.error(this.module, `Tenant processing failed for ${tenantId}: ${errorMessage}`, error, {
        ...entry,
        errorCode,
        processingStage: processingDetails?.stage
      });
    }
  }

  /**
   * Logs security events related to tenant operations
   */
  logSecurityEvent(
    eventType: string,
    tenantId?: string,
    requestId?: string,
    details?: any,
    severity: 'low' | 'medium' | 'high' = 'medium'
  ): void {
    const entry: TenantLogEntry = {
      operation: TenantOperationType.SECURITY_EVENT,
      tenantId,
      requestId,
      success: false, // Security events are always concerning
      details: { eventType, severity, ...details },
      timestamp: new Date().toISOString()
    };

    const message = `Security event detected: ${eventType}`;
    
    switch (severity) {
      case 'high':
        logger.error(this.module, message, undefined, entry);
        break;
      case 'medium':
        logger.warn(this.module, message, entry);
        break;
      case 'low':
        logger.info(this.module, message, entry);
        break;
    }
  }

  /**
   * Logs performance metrics for tenant operations
   */
  logPerformanceMetric(
    operation: string,
    tenantId: string,
    duration: number,
    requestId?: string,
    metadata?: any
  ): void {
    const entry: TenantLogEntry = {
      operation: TenantOperationType.PERFORMANCE_METRIC,
      tenantId,
      requestId,
      success: true,
      duration,
      details: { operation, ...metadata },
      timestamp: new Date().toISOString()
    };

    // Log slow operations as warnings
    const level = duration > 5000 ? 'warn' : duration > 1000 ? 'info' : 'debug';
    
    const message = `Tenant operation ${operation} completed in ${duration}ms for tenant ${tenantId}`;
    
    switch (level) {
      case 'warn':
        logger.warn(this.module, `SLOW OPERATION: ${message}`, entry);
        break;
      case 'info':
        logger.info(this.module, message, entry);
        break;
      case 'debug':
        logger.debug(this.module, message, entry);
        break;
    }
  }

  /**
   * Logs tenant context information
   */
  logTenantContext(
    context: TenantContext,
    operation: string,
    requestId?: string,
    metadata?: any
  ): void {
    logger.debug(this.module, `Tenant context ${operation}`, {
      tenantId: context.tenantId,
      schemaName: context.schemaName,
      isValidated: context.isValidated,
      createdAt: context.createdAt,
      operation,
      requestId,
      ...metadata
    });
  }

  /**
   * Helper method to determine error type for categorization
   */
  private getErrorType(errorCode: string): string {
    switch (errorCode) {
      case TenantErrorCode.TENANT_HEADER_MISSING:
      case TenantErrorCode.TENANT_HEADER_EMPTY:
        return 'missing_header';
      case TenantErrorCode.TENANT_FORMAT_INVALID:
      case TenantErrorCode.TENANT_ID_MALFORMED:
        return 'invalid_format';
      case TenantErrorCode.DATABASE_UNAVAILABLE:
      case TenantErrorCode.DATABASE_CONNECTION_TIMEOUT:
      case TenantErrorCode.DATABASE_CONNECTION_FAILED:
        return 'database_connectivity';
      case TenantErrorCode.SCHEMA_CREATION_FAILED:
      case TenantErrorCode.SCHEMA_MIGRATION_FAILED:
        return 'schema_operation';
      default:
        return 'unknown';
    }
  }

  /**
   * Helper method to check if error is database connectivity related
   */
  private isDatabaseConnectivityError(errorCode: string): boolean {
    return [
      TenantErrorCode.DATABASE_UNAVAILABLE,
      TenantErrorCode.DATABASE_CONNECTION_TIMEOUT,
      TenantErrorCode.DATABASE_CONNECTION_FAILED
    ].includes(errorCode as TenantErrorCode);
  }

  /**
   * Helper method to check if error is schema creation related
   */
  private isSchemaCreationError(errorCode: string): boolean {
    return [
      TenantErrorCode.SCHEMA_CREATION_FAILED,
      TenantErrorCode.SCHEMA_MIGRATION_FAILED,
      TenantErrorCode.SCHEMA_VALIDATION_FAILED
    ].includes(errorCode as TenantErrorCode);
  }
}

/**
 * Global tenant logger instance
 */
export const tenantLogger = new TenantLogger();

/**
 * Convenience functions for common tenant logging scenarios
 */

/**
 * Logs successful tenant header validation
 * Requirement: 1.3
 */
export function logTenantHeaderSuccess(
  tenantId: string,
  requestId?: string
): void {
  tenantLogger.logHeaderValidation(true, tenantId, requestId);
}

/**
 * Logs failed tenant header validation
 * Requirements: 1.1, 1.2, 1.4
 */
export function logTenantHeaderFailure(
  error: TenantError,
  requestId?: string
): void {
  tenantLogger.logHeaderValidation(false, error.tenantId, requestId, error);
}

/**
 * Logs schema operation with timing
 */
export function logSchemaOperationWithTiming<T>(
  operation: () => Promise<T>,
  operationType: 'validation' | 'creation' | 'migration',
  tenantId: string,
  requestId?: string
): Promise<T> {
  const startTime = Date.now();
  
  return operation()
    .then(result => {
      const duration = Date.now() - startTime;
      
      switch (operationType) {
        case 'validation':
          tenantLogger.logSchemaValidation(tenantId, true, undefined, undefined, requestId, undefined, duration);
          break;
        case 'creation':
          tenantLogger.logSchemaCreation(tenantId, true, undefined, requestId, undefined, duration);
          break;
        case 'migration':
          tenantLogger.logSchemaMigration(tenantId, `crmx_database_${tenantId}`, true, requestId, undefined, duration);
          break;
      }
      
      return result;
    })
    .catch(error => {
      const duration = Date.now() - startTime;
      const tenantError = isTenantError(error) ? error : undefined;
      
      switch (operationType) {
        case 'validation':
          tenantLogger.logSchemaValidation(tenantId, false, undefined, undefined, requestId, tenantError, duration);
          break;
        case 'creation':
          tenantLogger.logSchemaCreation(tenantId, false, undefined, requestId, tenantError, duration);
          break;
        case 'migration':
          tenantLogger.logSchemaMigration(tenantId, `crmx_database_${tenantId}`, false, requestId, tenantError, duration);
          break;
      }
      
      throw error;
    });
}

/**
 * Logs database connectivity check with automatic error detection
 * Requirement: 4.3
 */
export function logDatabaseConnectivityCheck(
  success: boolean,
  error?: any,
  tenantId?: string,
  requestId?: string,
  duration?: number
): void {
  const tenantError = isTenantError(error) ? error : undefined;
  tenantLogger.logDatabaseConnectivity(success, tenantId, requestId, tenantError, duration);
}

/**
 * Creates a performance monitoring wrapper for tenant operations
 */
export function withTenantPerformanceLogging<T>(
  operation: () => Promise<T>,
  operationName: string,
  tenantId: string,
  requestId?: string
): Promise<T> {
  const startTime = Date.now();
  
  return operation()
    .then(result => {
      const duration = Date.now() - startTime;
      tenantLogger.logPerformanceMetric(operationName, tenantId, duration, requestId);
      return result;
    })
    .catch(error => {
      const duration = Date.now() - startTime;
      tenantLogger.logPerformanceMetric(operationName, tenantId, duration, requestId, { 
        failed: true,
        error: error.message 
      });
      throw error;
    });
}