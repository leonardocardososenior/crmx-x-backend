// Tenant error response formatting utilities
// Requirements: 1.1, 1.2, 1.4, 2.3, 4.3

import { 
  TenantError,
  TenantErrorCode,
  TenantErrorResponse,
  isTenantError
} from '../types/tenantErrors';
import { TenantRequest } from '../types/tenant';
import { getCurrentTenantId } from './tenantHelpers';
import { getLanguageFromRequest, getTenantErrorMessage } from './translations';

/**
 * Error response formatting configuration
 */
export interface ErrorFormatterConfig {
  includeStackTrace: boolean;
  includeRequestDetails: boolean;
  includeTimestamp: boolean;
  customMessages: Record<string, string>;
  sanitizeDetails: boolean;
}

/**
 * Default error formatter configuration
 */
export const DEFAULT_ERROR_FORMATTER_CONFIG: ErrorFormatterConfig = {
  includeStackTrace: process.env.NODE_ENV === 'development',
  includeRequestDetails: process.env.NODE_ENV === 'development',
  includeTimestamp: true,
  customMessages: {},
  sanitizeDetails: true
};

/**
 * Comprehensive tenant error response formatter
 */
export class TenantErrorFormatter {
  private config: ErrorFormatterConfig;

  constructor(config: Partial<ErrorFormatterConfig> = {}) {
    this.config = { ...DEFAULT_ERROR_FORMATTER_CONFIG, ...config };
  }

  /**
   * Formats tenant error for HTTP response
   * Requirements: 1.1, 1.2, 1.4, 2.3, 4.3
   */
  formatError(
    error: TenantError,
    req?: TenantRequest
  ): TenantErrorResponse {
    const requestId = req ? (req as any).requestId : error.requestId;
    const tenantId = req ? getCurrentTenantId(req) : error.tenantId;

    const response: TenantErrorResponse = {
      error: {
        code: error.code,
        message: this.getFormattedMessage(error, req),
        requestId: requestId || this.generateRequestId(),
        timestamp: this.config.includeTimestamp ? new Date().toISOString() : undefined as any
      }
    };

    // Add tenant ID if available
    if (tenantId) {
      response.error.tenantId = tenantId;
    }

    // Add details based on configuration and error type
    if (this.shouldIncludeDetails(error)) {
      response.error.details = this.formatDetails(error, req);
    }

    return response;
  }

  /**
   * Formats multiple tenant errors (for batch operations)
   */
  formatMultipleErrors(
    errors: TenantError[],
    req?: TenantRequest
  ): { errors: TenantErrorResponse['error'][] } {
    return {
      errors: errors.map(error => this.formatError(error, req).error)
    };
  }

  /**
   * Gets formatted error message with custom overrides
   */
  private getFormattedMessage(error: TenantError, req?: TenantRequest): string {
    // Check for custom message override
    const customMessage = this.config.customMessages[error.code];
    if (customMessage) {
      return customMessage;
    }

    // Return localized message based on error code
    return this.getLocalizedMessage(error.code, error.message, req);
  }

  /**
   * Gets localized error messages
   * Requirements: 1.1, 1.2, 1.4, 2.3, 4.3
   */
  private getLocalizedMessage(code: TenantErrorCode, defaultMessage: string, req?: TenantRequest): string {
    // Get language from request if available
    const language = req ? getLanguageFromRequest(req as any) : 'pt-BR';
    
    // Use translation system for localized messages
    return getTenantErrorMessage(code, language);
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
    if (this.isClientError(error.code)) {
      return true;
    }

    // Include details for specific error types that benefit from additional context
    const detailsAllowedErrors = [
      TenantErrorCode.TENANT_FORMAT_INVALID,
      TenantErrorCode.TENANT_ID_MALFORMED,
      TenantErrorCode.SCHEMA_VALIDATION_FAILED
    ];

    return detailsAllowedErrors.includes(error.code);
  }

  /**
   * Formats error details with sanitization
   */
  private formatDetails(error: TenantError, req?: TenantRequest): any {
    let details = error.details || {};

    // Add request details if configured
    if (this.config.includeRequestDetails && req) {
      details = {
        ...details,
        request: {
          method: req.method,
          path: req.path,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        }
      };
    }

    // Sanitize details if configured
    if (this.config.sanitizeDetails) {
      details = this.sanitizeDetails(details);
    }

    return details;
  }

  /**
   * Sanitizes error details to remove sensitive information
   */
  private sanitizeDetails(details: any): any {
    if (!details || typeof details !== 'object') {
      return details;
    }

    const sanitized = { ...details };

    // Remove sensitive fields
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'cookie',
      'session'
    ];

    const sanitizeObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }

      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object') {
          result[key] = sanitizeObject(value);
        } else {
          result[key] = value;
        }
      }
      
      return result;
    };

    return sanitizeObject(sanitized);
  }

  /**
   * Checks if error code represents a client error (4xx)
   */
  private isClientError(code: TenantErrorCode): boolean {
    const clientErrorCodes = [
      TenantErrorCode.TENANT_HEADER_MISSING,
      TenantErrorCode.TENANT_HEADER_EMPTY,
      TenantErrorCode.TENANT_FORMAT_INVALID,
      TenantErrorCode.TENANT_ID_MALFORMED,
      TenantErrorCode.SCHEMA_ACCESS_DENIED
    ];

    return clientErrorCodes.includes(code);
  }

  /**
   * Generates a request ID if not available
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Updates formatter configuration
   */
  updateConfig(newConfig: Partial<ErrorFormatterConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets current configuration
   */
  getConfig(): ErrorFormatterConfig {
    return { ...this.config };
  }
}

/**
 * Default error formatter instance
 */
export const defaultTenantErrorFormatter = new TenantErrorFormatter();

/**
 * Formats tenant error for HTTP response (convenience function)
 */
export function formatTenantError(
  error: TenantError,
  req?: TenantRequest,
  config?: Partial<ErrorFormatterConfig>
): TenantErrorResponse {
  const formatter = config ? new TenantErrorFormatter(config) : defaultTenantErrorFormatter;
  return formatter.formatError(error, req);
}

/**
 * Formats multiple tenant errors (convenience function)
 */
export function formatMultipleTenantErrors(
  errors: TenantError[],
  req?: TenantRequest,
  config?: Partial<ErrorFormatterConfig>
): { errors: TenantErrorResponse['error'][] } {
  const formatter = config ? new TenantErrorFormatter(config) : defaultTenantErrorFormatter;
  return formatter.formatMultipleErrors(errors, req);
}

/**
 * Creates a standardized error response for non-tenant errors
 */
export function formatGenericError(
  error: Error,
  statusCode: number = 500,
  req?: TenantRequest
): TenantErrorResponse {
  const requestId = req ? (req as any).requestId : undefined;
  const tenantId = req ? getCurrentTenantId(req) : undefined;

  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: statusCode >= 500 ? 'Internal server error' : error.message,
      requestId: requestId || defaultTenantErrorFormatter['generateRequestId'](),
      tenantId: tenantId || undefined,
      timestamp: new Date().toISOString(),
      details: process.env.NODE_ENV === 'development' ? {
        originalError: error.message,
        stack: error.stack
      } : undefined
    }
  };
}

/**
 * HTTP status code mapping for tenant errors
 */
export const TENANT_ERROR_STATUS_CODES: Record<TenantErrorCode, number> = {
  // Header validation errors (400)
  [TenantErrorCode.TENANT_HEADER_MISSING]: 400,
  [TenantErrorCode.TENANT_HEADER_EMPTY]: 400,
  [TenantErrorCode.TENANT_FORMAT_INVALID]: 400,
  [TenantErrorCode.TENANT_ID_MALFORMED]: 400,

  // Schema operation errors (500)
  [TenantErrorCode.SCHEMA_CREATION_FAILED]: 500,
  [TenantErrorCode.SCHEMA_MIGRATION_FAILED]: 500,
  [TenantErrorCode.SCHEMA_VALIDATION_FAILED]: 500,
  [TenantErrorCode.CONTEXT_SETUP_FAILED]: 500,
  [TenantErrorCode.CONTEXT_CLEANUP_FAILED]: 500,
  [TenantErrorCode.SEARCH_PATH_UPDATE_FAILED]: 500,

  // Database connectivity errors (503)
  [TenantErrorCode.DATABASE_UNAVAILABLE]: 503,
  [TenantErrorCode.DATABASE_CONNECTION_TIMEOUT]: 503,
  [TenantErrorCode.DATABASE_CONNECTION_FAILED]: 503,

  // Access errors (403)
  [TenantErrorCode.SCHEMA_ACCESS_DENIED]: 403,

  // Concurrency errors (409)
  [TenantErrorCode.SCHEMA_CREATION_CONFLICT]: 409,
  [TenantErrorCode.CONCURRENT_OPERATION_FAILED]: 409,

  // Generic errors (500)
  [TenantErrorCode.TENANT_PROCESSING_FAILED]: 500,
  [TenantErrorCode.TENANT_CONTEXT_INVALID]: 500
};

/**
 * Gets HTTP status code for tenant error
 */
export function getTenantErrorStatusCode(error: TenantError): number {
  // Special handling for CONTEXT_SETUP_FAILED when it's related to tenant header
  if (error.code === TenantErrorCode.CONTEXT_SETUP_FAILED) {
    // Check if the error is related to tenant header validation
    const errorMessage = error.message?.toLowerCase() || '';
    const errorDetails = error.details?.originalError?.toLowerCase() || '';
    
    if (errorMessage.includes('tenant header') || errorDetails.includes('tenant header')) {
      return 400; // Bad Request for header validation errors
    }
  }
  
  return error.statusCode || TENANT_ERROR_STATUS_CODES[error.code] || 500;
}

/**
 * Validates that error response follows the correct structure
 */
export function validateErrorResponse(response: any): response is TenantErrorResponse {
  return (
    response &&
    typeof response === 'object' &&
    response.error &&
    typeof response.error === 'object' &&
    typeof response.error.code === 'string' &&
    typeof response.error.message === 'string' &&
    (response.error.requestId === undefined || typeof response.error.requestId === 'string') &&
    (response.error.tenantId === undefined || typeof response.error.tenantId === 'string') &&
    (response.error.timestamp === undefined || typeof response.error.timestamp === 'string')
  );
}

/**
 * Error response builder for fluent API
 */
export class TenantErrorResponseBuilder {
  private error: Partial<TenantErrorResponse['error']> = {};

  static create(): TenantErrorResponseBuilder {
    return new TenantErrorResponseBuilder();
  }

  code(code: string): this {
    this.error.code = code;
    return this;
  }

  message(message: string): this {
    this.error.message = message;
    return this;
  }

  tenantId(tenantId: string): this {
    this.error.tenantId = tenantId;
    return this;
  }

  requestId(requestId: string): this {
    this.error.requestId = requestId;
    return this;
  }

  details(details: any): this {
    this.error.details = details;
    return this;
  }

  timestamp(timestamp?: string): this {
    this.error.timestamp = timestamp || new Date().toISOString();
    return this;
  }

  build(): TenantErrorResponse {
    if (!this.error.code || !this.error.message) {
      throw new Error('Error code and message are required');
    }

    return {
      error: {
        code: this.error.code,
        message: this.error.message,
        requestId: this.error.requestId,
        tenantId: this.error.tenantId,
        timestamp: this.error.timestamp || new Date().toISOString(),
        details: this.error.details
      }
    };
  }
}