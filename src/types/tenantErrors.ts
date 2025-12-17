// Tenant-specific error types and response structures

/**
 * Tenant error codes for consistent error handling
 */
export enum TenantErrorCode {
  // Header validation errors (400)
  TENANT_HEADER_MISSING = 'TENANT_HEADER_MISSING',
  TENANT_HEADER_EMPTY = 'TENANT_HEADER_EMPTY',
  TENANT_FORMAT_INVALID = 'TENANT_FORMAT_INVALID',
  TENANT_ID_MALFORMED = 'TENANT_ID_MALFORMED',

  // Schema operation errors (500)
  SCHEMA_CREATION_FAILED = 'SCHEMA_CREATION_FAILED',
  SCHEMA_MIGRATION_FAILED = 'SCHEMA_MIGRATION_FAILED',
  SCHEMA_VALIDATION_FAILED = 'SCHEMA_VALIDATION_FAILED',
  SCHEMA_ACCESS_DENIED = 'SCHEMA_ACCESS_DENIED',

  // Database connectivity errors (503)
  DATABASE_UNAVAILABLE = 'DATABASE_UNAVAILABLE',
  DATABASE_CONNECTION_TIMEOUT = 'DATABASE_CONNECTION_TIMEOUT',
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',

  // Context management errors (500)
  CONTEXT_SETUP_FAILED = 'CONTEXT_SETUP_FAILED',
  CONTEXT_CLEANUP_FAILED = 'CONTEXT_CLEANUP_FAILED',
  SEARCH_PATH_UPDATE_FAILED = 'SEARCH_PATH_UPDATE_FAILED',

  // Concurrency errors (409)
  SCHEMA_CREATION_CONFLICT = 'SCHEMA_CREATION_CONFLICT',
  CONCURRENT_OPERATION_FAILED = 'CONCURRENT_OPERATION_FAILED',

  // Generic tenant errors
  TENANT_PROCESSING_FAILED = 'TENANT_PROCESSING_FAILED',
  TENANT_CONTEXT_INVALID = 'TENANT_CONTEXT_INVALID'
}

/**
 * Base tenant error class
 */
export class TenantError extends Error {
  public readonly code: TenantErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly tenantId?: string;
  public readonly requestId?: string;

  constructor(
    code: TenantErrorCode,
    message: string,
    statusCode: number,
    details?: any,
    tenantId?: string,
    requestId?: string
  ) {
    super(message);
    this.name = 'TenantError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.tenantId = tenantId;
    this.requestId = requestId;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, TenantError.prototype);
  }

  /**
   * Convert error to JSON response format
   */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        tenantId: this.tenantId,
        requestId: this.requestId,
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * Tenant header validation error (400)
 */
export class TenantHeaderError extends TenantError {
  constructor(
    code: TenantErrorCode,
    message: string,
    details?: any,
    requestId?: string
  ) {
    super(code, message, 400, details, undefined, requestId);
    this.name = 'TenantHeaderError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, TenantHeaderError.prototype);
  }
}

/**
 * Schema operation error (500)
 */
export class SchemaOperationError extends TenantError {
  constructor(
    code: TenantErrorCode,
    message: string,
    tenantId?: string,
    details?: any,
    requestId?: string
  ) {
    super(code, message, 500, details, tenantId, requestId);
    this.name = 'SchemaOperationError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, SchemaOperationError.prototype);
  }
}

/**
 * Database connectivity error (503)
 */
export class DatabaseConnectivityError extends TenantError {
  constructor(
    code: TenantErrorCode,
    message: string,
    tenantId?: string,
    details?: any,
    requestId?: string
  ) {
    super(code, message, 503, details, tenantId, requestId);
    this.name = 'DatabaseConnectivityError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, DatabaseConnectivityError.prototype);
  }
}

/**
 * Concurrency error (409)
 */
export class ConcurrencyError extends TenantError {
  constructor(
    code: TenantErrorCode,
    message: string,
    tenantId?: string,
    details?: any,
    requestId?: string
  ) {
    super(code, message, 409, details, tenantId, requestId);
    this.name = 'ConcurrencyError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ConcurrencyError.prototype);
  }
}

/**
 * Tenant error response format
 */
export interface TenantErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    tenantId?: string;
    requestId?: string;
    timestamp: string;
  };
}

/**
 * Factory functions for creating specific tenant errors
 */
export class TenantErrorFactory {
  /**
   * Create tenant header missing error
   */
  static createHeaderMissingError(requestId?: string): TenantHeaderError {
    return new TenantHeaderError(
      TenantErrorCode.TENANT_HEADER_MISSING,
      'Tenant header is required',
      undefined,
      requestId
    );
  }

  /**
   * Create tenant header empty error
   */
  static createHeaderEmptyError(requestId?: string): TenantHeaderError {
    return new TenantHeaderError(
      TenantErrorCode.TENANT_HEADER_EMPTY,
      'Tenant header cannot be empty',
      undefined,
      requestId
    );
  }

  /**
   * Create tenant format invalid error
   */
  static createFormatInvalidError(requestId?: string, details?: any): TenantHeaderError {
    return new TenantHeaderError(
      TenantErrorCode.TENANT_FORMAT_INVALID,
      'Invalid tenant format',
      details,
      requestId
    );
  }

  /**
   * Create malformed tenant ID error
   */
  static createMalformedTenantError(requestId?: string, details?: any): TenantHeaderError {
    return new TenantHeaderError(
      TenantErrorCode.TENANT_ID_MALFORMED,
      'Invalid tenant format',
      details,
      requestId
    );
  }

  /**
   * Create schema creation failed error
   */
  static createSchemaCreationError(
    tenantId: string,
    details?: any,
    requestId?: string
  ): SchemaOperationError {
    return new SchemaOperationError(
      TenantErrorCode.SCHEMA_CREATION_FAILED,
      'Schema creation failed',
      tenantId,
      details,
      requestId
    );
  }

  /**
   * Create schema migration failed error
   */
  static createSchemaMigrationError(
    tenantId: string,
    details?: any,
    requestId?: string
  ): SchemaOperationError {
    return new SchemaOperationError(
      TenantErrorCode.SCHEMA_MIGRATION_FAILED,
      'Schema migration failed',
      tenantId,
      details,
      requestId
    );
  }

  /**
   * Create database connectivity error
   */
  static createDatabaseConnectivityError(
    tenantId?: string,
    details?: any,
    requestId?: string
  ): DatabaseConnectivityError {
    return new DatabaseConnectivityError(
      TenantErrorCode.DATABASE_UNAVAILABLE,
      'Database service unavailable',
      tenantId,
      details,
      requestId
    );
  }

  /**
   * Create schema validation error
   */
  static createSchemaValidationError(
    tenantId: string,
    details?: any,
    requestId?: string
  ): SchemaOperationError {
    return new SchemaOperationError(
      TenantErrorCode.SCHEMA_VALIDATION_FAILED,
      'Schema validation failed',
      tenantId,
      details,
      requestId
    );
  }

  /**
   * Create concurrent operation error
   */
  static createConcurrencyError(
    tenantId: string,
    details?: any,
    requestId?: string
  ): ConcurrencyError {
    return new ConcurrencyError(
      TenantErrorCode.CONCURRENT_OPERATION_FAILED,
      'Concurrent operation failed',
      tenantId,
      details,
      requestId
    );
  }

  /**
   * Create context setup error
   */
  static createContextSetupError(
    tenantId: string,
    details?: any,
    requestId?: string
  ): SchemaOperationError {
    return new SchemaOperationError(
      TenantErrorCode.CONTEXT_SETUP_FAILED,
      'Failed to setup tenant context',
      tenantId,
      details,
      requestId
    );
  }
}

/**
 * Type guard to check if error is a tenant error
 */
export function isTenantError(error: any): error is TenantError {
  return error instanceof TenantError;
}

/**
 * Type guard to check if error is a tenant header error
 */
export function isTenantHeaderError(error: any): error is TenantHeaderError {
  return error instanceof TenantHeaderError;
}

/**
 * Type guard to check if error is a schema operation error
 */
export function isSchemaOperationError(error: any): error is SchemaOperationError {
  return error instanceof SchemaOperationError;
}

/**
 * Type guard to check if error is a database connectivity error
 */
export function isDatabaseConnectivityError(error: any): error is DatabaseConnectivityError {
  return error instanceof DatabaseConnectivityError;
}

/**
 * Type guard to check if error is a concurrency error
 */
export function isConcurrencyError(error: any): error is ConcurrencyError {
  return error instanceof ConcurrencyError;
}