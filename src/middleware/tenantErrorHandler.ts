// Comprehensive tenant error handling middleware
// Requirements: 1.1, 1.2, 1.4, 2.3, 4.3

import { Request, Response, NextFunction } from 'express';
import { 
  TenantError,
  TenantErrorCode,
  TenantErrorResponse,
  isTenantError,
  isTenantHeaderError,
  isSchemaOperationError,
  isDatabaseConnectivityError,
  isConcurrencyError
} from '../types/tenantErrors';
import { TenantRequest } from '../types/tenant';
import { logger } from '../utils/logger';
import { getCurrentTenantId } from '../utils/tenantHelpers';

/**
 * Tenant error handling configuration
 */
export interface TenantErrorHandlerConfig {
  includeStackTrace: boolean;
  logAllErrors: boolean;
  enableMetrics: boolean;
  customErrorMessages?: Record<string, string>;
}

/**
 * Default tenant error handler configuration
 */
export const DEFAULT_TENANT_ERROR_CONFIG: TenantErrorHandlerConfig = {
  includeStackTrace: process.env.NODE_ENV === 'development',
  logAllErrors: true,
  enableMetrics: true
};

/**
 * Tenant error metrics for monitoring
 */
class TenantErrorMetrics {
  private errorCounts = new Map<string, number>();
  private errorsByTenant = new Map<string, number>();
  private lastReset = Date.now();

  incrementError(errorCode: string, tenantId?: string): void {
    // Increment global error count
    const currentCount = this.errorCounts.get(errorCode) || 0;
    this.errorCounts.set(errorCode, currentCount + 1);

    // Increment tenant-specific error count
    if (tenantId) {
      const tenantKey = `${tenantId}:${errorCode}`;
      const tenantCount = this.errorsByTenant.get(tenantKey) || 0;
      this.errorsByTenant.set(tenantKey, tenantCount + 1);
    }
  }

  getErrorCount(errorCode: string): number {
    return this.errorCounts.get(errorCode) || 0;
  }

  getTenantErrorCount(tenantId: string, errorCode: string): number {
    const tenantKey = `${tenantId}:${errorCode}`;
    return this.errorsByTenant.get(tenantKey) || 0;
  }

  getMetrics(): any {
    return {
      totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0),
      errorsByCode: Object.fromEntries(this.errorCounts),
      errorsByTenant: Object.fromEntries(this.errorsByTenant),
      periodStart: new Date(this.lastReset).toISOString(),
      periodDuration: Date.now() - this.lastReset
    };
  }

  reset(): void {
    this.errorCounts.clear();
    this.errorsByTenant.clear();
    this.lastReset = Date.now();
  }
}

// Global metrics instance
export const tenantErrorMetrics = new TenantErrorMetrics();

/**
 * Comprehensive tenant error handler middleware
 * Requirements: 1.1, 1.2, 1.4, 2.3, 4.3
 */
export class TenantErrorHandler {
  private config: TenantErrorHandlerConfig;

  constructor(config: Partial<TenantErrorHandlerConfig> = {}) {
    this.config = { ...DEFAULT_TENANT_ERROR_CONFIG, ...config };
  }

  /**
   * Main error handling middleware function
   */
  handleError = (
    error: any,
    req: TenantRequest,
    res: Response,
    next: NextFunction
  ): void => {
    const requestId = (req as any).requestId;
    const tenantId = getCurrentTenantId(req);

    // Only handle tenant-related errors, pass others to next handler
    if (!isTenantError(error)) {
      next(error);
      return;
    }

    const tenantError = error as TenantError;

    // Log the error with appropriate level
    this.logTenantError(tenantError, req);

    // Update metrics if enabled
    if (this.config.enableMetrics) {
      tenantErrorMetrics.incrementError(tenantError.code, tenantId || undefined);
    }

    // Determine HTTP status code
    const statusCode = this.getStatusCodeForError(tenantError);

    // Create structured error response
    const errorResponse = this.createErrorResponse(tenantError, req);

    // Send response
    res.status(statusCode).json(errorResponse);
  };

  /**
   * Logs tenant errors with appropriate context and level
   */
  private logTenantError(error: TenantError, req: TenantRequest): void {
    if (!this.config.logAllErrors) {
      return;
    }

    const requestId = (req as any).requestId;
    const tenantId = getCurrentTenantId(req);
    const method = req.method;
    const path = req.path;

    const logContext = {
      errorCode: error.code,
      tenantId: error.tenantId || tenantId,
      requestId: error.requestId || requestId,
      statusCode: error.statusCode,
      method,
      path,
      details: error.details,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    };

    // Log with appropriate level based on error type
    const errorMessage = error.message;
    if (isTenantHeaderError(error)) {
      // Header validation errors are warnings (client errors)
      logger.warn('TENANT_ERROR', `Tenant header validation failed: ${errorMessage}`, logContext);
    } else if (isDatabaseConnectivityError(error)) {
      // Database connectivity errors are critical
      logger.error('TENANT_ERROR', `Database connectivity error: ${errorMessage}`, error, logContext);
    } else if (isSchemaOperationError(error)) {
      // Schema operation errors are errors
      logger.error('TENANT_ERROR', `Schema operation failed: ${errorMessage}`, error, logContext);
    } else if (isConcurrencyError(error)) {
      // Concurrency errors are warnings (temporary issues)
      logger.warn('TENANT_ERROR', `Concurrency error: ${errorMessage}`, logContext);
    } else {
      // Generic tenant errors
      logger.error('TENANT_ERROR', `Tenant processing error: ${errorMessage}`, error, logContext);
    }

    // Log additional security events for suspicious patterns
    this.logSecurityEvents(error, req);
  }

  /**
   * Logs security-related events for monitoring
   */
  private logSecurityEvents(error: TenantError, req: TenantRequest): void {
    const requestId = (req as any).requestId;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    // Log repeated invalid tenant format attempts
    if (error.code === TenantErrorCode.TENANT_FORMAT_INVALID) {
      logger.warn('SECURITY', 'Invalid tenant format attempt detected', {
        errorCode: error.code,
        requestId,
        ip,
        userAgent,
        details: error.details
      });
    }

    // Log potential SQL injection attempts in tenant headers
    if (error.code === TenantErrorCode.TENANT_ID_MALFORMED && 
        error.details?.reason?.includes('unsafe')) {
      logger.warn('SECURITY', 'Potentially malicious tenant ID detected', {
        errorCode: error.code,
        requestId,
        ip,
        userAgent,
        details: error.details
      });
    }
  }

  /**
   * Determines appropriate HTTP status code for tenant errors
   * Requirements: 1.1, 1.2, 1.4, 2.3, 4.3
   */
  private getStatusCodeForError(error: TenantError): number {
    // Use the status code from the error if available
    if (error.statusCode) {
      return error.statusCode;
    }

    // Map error codes to HTTP status codes based on requirements
    switch (error.code) {
      // Requirement 1.1, 1.2, 1.4 - Header validation errors (400)
      case TenantErrorCode.TENANT_HEADER_MISSING:
      case TenantErrorCode.TENANT_HEADER_EMPTY:
      case TenantErrorCode.TENANT_FORMAT_INVALID:
      case TenantErrorCode.TENANT_ID_MALFORMED:
        return 400;
      
      // Requirement 4.3 - Database connectivity errors (503)
      case TenantErrorCode.DATABASE_UNAVAILABLE:
      case TenantErrorCode.DATABASE_CONNECTION_TIMEOUT:
      case TenantErrorCode.DATABASE_CONNECTION_FAILED:
        return 503;
      
      // Requirement 2.3 - Schema creation errors (500)
      case TenantErrorCode.SCHEMA_CREATION_FAILED:
      case TenantErrorCode.SCHEMA_MIGRATION_FAILED:
      case TenantErrorCode.SCHEMA_VALIDATION_FAILED:
      case TenantErrorCode.CONTEXT_SETUP_FAILED:
      case TenantErrorCode.CONTEXT_CLEANUP_FAILED:
      case TenantErrorCode.SEARCH_PATH_UPDATE_FAILED:
        return 500;
      
      // Concurrency errors (409)
      case TenantErrorCode.SCHEMA_CREATION_CONFLICT:
      case TenantErrorCode.CONCURRENT_OPERATION_FAILED:
        return 409;
      
      // Access denied errors (403)
      case TenantErrorCode.SCHEMA_ACCESS_DENIED:
        return 403;
      
      // Generic tenant errors (500)
      default:
        return 500;
    }
  }

  /**
   * Creates structured error response
   */
  private createErrorResponse(error: TenantError, req: TenantRequest): TenantErrorResponse {
    const requestId = (req as any).requestId;
    const tenantId = getCurrentTenantId(req);

    const response: TenantErrorResponse = {
      error: {
        code: error.code,
        message: this.getErrorMessage(error),
        tenantId: error.tenantId || tenantId || undefined,
        requestId: error.requestId || requestId,
        timestamp: new Date().toISOString()
      }
    };

    // Include details in development or for specific error types
    if (this.shouldIncludeDetails(error)) {
      response.error.details = error.details;
    }

    return response;
  }

  /**
   * Gets user-friendly error message, with custom overrides if configured
   */
  private getErrorMessage(error: TenantError): string {
    // Check for custom error messages
    if (this.config.customErrorMessages?.[error.code]) {
      return this.config.customErrorMessages[error.code];
    }

    // Return the original error message
    return error.message;
  }

  /**
   * Determines whether to include error details in response
   */
  private shouldIncludeDetails(error: TenantError): boolean {
    // Always include details in development
    if (this.config.includeStackTrace) {
      return true;
    }

    // Include details for client errors (4xx) to help with debugging
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return true;
    }

    // Don't include details for server errors in production
    return false;
  }

  /**
   * Updates configuration
   */
  updateConfig(newConfig: Partial<TenantErrorHandlerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets current configuration
   */
  getConfig(): TenantErrorHandlerConfig {
    return { ...this.config };
  }
}

/**
 * Default tenant error handler instance
 */
export const defaultTenantErrorHandler = new TenantErrorHandler();

/**
 * Express middleware function for tenant error handling
 * Requirements: 1.1, 1.2, 1.4, 2.3, 4.3
 */
export function tenantErrorHandler(
  config?: Partial<TenantErrorHandlerConfig>
): (error: any, req: TenantRequest, res: Response, next: NextFunction) => void {
  const handler = config ? new TenantErrorHandler(config) : defaultTenantErrorHandler;
  
  return (error: any, req: TenantRequest, res: Response, next: NextFunction) => {
    handler.handleError(error, req, res, next);
  };
}

/**
 * Convenience function to create tenant error handler with custom configuration
 */
export function createTenantErrorHandler(
  config: Partial<TenantErrorHandlerConfig>
): TenantErrorHandler {
  return new TenantErrorHandler(config);
}

/**
 * Middleware to handle async tenant errors
 */
export function asyncTenantErrorHandler(
  fn: (req: TenantRequest, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Error monitoring and alerting utilities
 */
export class TenantErrorMonitor {
  private alertThresholds: Record<TenantErrorCode, number> = {
    [TenantErrorCode.DATABASE_UNAVAILABLE]: 5, // Alert after 5 database errors
    [TenantErrorCode.SCHEMA_CREATION_FAILED]: 3, // Alert after 3 schema creation failures
    [TenantErrorCode.TENANT_FORMAT_INVALID]: 10, // Alert after 10 invalid format attempts
    [TenantErrorCode.TENANT_HEADER_MISSING]: 20,
    [TenantErrorCode.TENANT_HEADER_EMPTY]: 20,
    [TenantErrorCode.TENANT_ID_MALFORMED]: 15,
    [TenantErrorCode.SCHEMA_MIGRATION_FAILED]: 3,
    [TenantErrorCode.SCHEMA_VALIDATION_FAILED]: 5,
    [TenantErrorCode.SCHEMA_ACCESS_DENIED]: 5,
    [TenantErrorCode.DATABASE_CONNECTION_TIMEOUT]: 5,
    [TenantErrorCode.DATABASE_CONNECTION_FAILED]: 5,
    [TenantErrorCode.CONTEXT_SETUP_FAILED]: 5,
    [TenantErrorCode.CONTEXT_CLEANUP_FAILED]: 10,
    [TenantErrorCode.SEARCH_PATH_UPDATE_FAILED]: 5,
    [TenantErrorCode.SCHEMA_CREATION_CONFLICT]: 3,
    [TenantErrorCode.CONCURRENT_OPERATION_FAILED]: 5,
    [TenantErrorCode.TENANT_PROCESSING_FAILED]: 5,
    [TenantErrorCode.TENANT_CONTEXT_INVALID]: 5
  };

  /**
   * Checks if error count exceeds alert threshold
   */
  shouldAlert(errorCode: TenantErrorCode): boolean {
    const threshold = this.alertThresholds[errorCode];
    if (!threshold) {
      return false;
    }

    const count = tenantErrorMetrics.getErrorCount(errorCode);
    return count >= threshold;
  }

  /**
   * Triggers alert for critical tenant errors
   */
  triggerAlert(errorCode: TenantErrorCode, context?: any): void {
    logger.error('TENANT_ALERT', `Critical tenant error threshold exceeded: ${errorCode}`, undefined, {
      errorCode,
      threshold: this.alertThresholds[errorCode],
      currentCount: tenantErrorMetrics.getErrorCount(errorCode),
      context
    });

    // Here you could integrate with external alerting systems
    // like PagerDuty, Slack, email notifications, etc.
  }

  /**
   * Updates alert thresholds
   */
  updateThresholds(thresholds: Partial<Record<TenantErrorCode, number>>): void {
    Object.assign(this.alertThresholds, thresholds);
  }
}

/**
 * Global error monitor instance
 */
export const tenantErrorMonitor = new TenantErrorMonitor();

/**
 * Middleware to check for error patterns and trigger alerts
 */
export function tenantErrorMonitoringMiddleware(
  error: any,
  req: TenantRequest,
  res: Response,
  next: NextFunction
): void {
  if (isTenantError(error)) {
    const tenantError = error as TenantError;
    
    // Check if we should trigger an alert
    if (tenantErrorMonitor.shouldAlert(tenantError.code)) {
      tenantErrorMonitor.triggerAlert(tenantError.code, {
        tenantId: tenantError.tenantId,
        requestId: tenantError.requestId,
        message: tenantError.message
      });
    }
  }

  next(error);
}