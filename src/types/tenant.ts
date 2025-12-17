// Tenant-related types and interfaces for multi-tenant schema management

import { Request } from 'express';

/**
 * Represents the context of a tenant within a request
 */
export interface TenantContext {
  /** Unique identifier for the tenant */
  tenantId: string;
  /** PostgreSQL schema name for this tenant (format: crmx_database_{{tenant}}) */
  schemaName: string;
  /** Whether the tenant has been validated */
  isValidated: boolean;
  /** Timestamp when the tenant context was created */
  createdAt?: Date;
}

/**
 * Cache entry for schema validation results
 */
export interface SchemaValidationCache {
  /** Tenant identifier */
  tenantId: string;
  /** Whether the schema exists */
  exists: boolean;
  /** When the validation was last performed */
  lastChecked: Date;
  /** Time-to-live for this cache entry in milliseconds */
  ttl: number;
}

/**
 * Result of a schema migration operation
 */
export interface MigrationResult {
  /** Whether the migration was successful */
  success: boolean;
  /** Name of the schema that was migrated */
  schemaName: string;
  /** When the migration was executed */
  executedAt: Date;
  /** Error message if migration failed */
  error?: string;
}

/**
 * Configuration for tenant operations
 */
export interface TenantConfig {
  /** Schema name prefix (default: 'crmx_database_') */
  schemaPrefix: string;
  /** Cache TTL for schema validation in milliseconds (default: 5 minutes) */
  validationCacheTtl: number;
  /** Maximum length for tenant identifiers */
  maxTenantIdLength: number;
  /** Allowed characters pattern for tenant identifiers */
  allowedCharactersPattern: RegExp;
}

/**
 * Tenant validation result
 */
export interface TenantValidationResult {
  /** Whether the tenant ID is valid */
  isValid: boolean;
  /** Error message if validation failed */
  error?: string;
  /** Sanitized tenant ID if validation passed */
  sanitizedTenantId?: string;
}

/**
 * Schema creation options
 */
export interface SchemaCreationOptions {
  /** Whether to run migrations after creating schema */
  runMigrations: boolean;
  /** Path to the migration script */
  migrationScriptPath: string;
  /** Whether to handle concurrent creation attempts */
  handleConcurrency: boolean;
}

/**
 * Database context configuration
 */
export interface DatabaseContextConfig {
  /** PostgreSQL search_path to set */
  searchPath: string;
  /** Connection timeout in milliseconds */
  connectionTimeout: number;
  /** Whether to reset context after operations */
  autoReset: boolean;
}

/**
 * Tenant operation result
 */
export interface TenantOperationResult<T = any> {
  /** Whether the operation was successful */
  success: boolean;
  /** Result data if successful */
  data?: T;
  /** Error information if failed */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  /** Tenant context used for the operation */
  tenantContext?: TenantContext;
}

/**
 * Extended Express Request interface with tenant context
 */
export interface TenantRequest extends Request {
  /** Tenant context for this request */
  tenant?: TenantContext;
  /** Request ID for tracking */
  requestId?: string;
}

/**
 * Tenant middleware configuration
 */
export interface TenantMiddlewareConfig {
  /** Header name to extract tenant from (default: 'tenant') */
  tenantHeaderName: string;
  /** Whether to create schemas automatically */
  autoCreateSchemas: boolean;
  /** Schema creation options */
  schemaCreationOptions: SchemaCreationOptions;
  /** Validation cache configuration */
  cacheConfig: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
}

/**
 * Schema existence check result
 */
export interface SchemaExistenceResult {
  /** Whether the schema exists */
  exists: boolean;
  /** Schema name that was checked */
  schemaName: string;
  /** Whether result came from cache */
  fromCache: boolean;
  /** Error if check failed */
  error?: string;
}

/**
 * Concurrent schema creation lock
 */
export interface SchemaCreationLock {
  /** Tenant ID being processed */
  tenantId: string;
  /** When the lock was acquired */
  acquiredAt: Date;
  /** Lock timeout in milliseconds */
  timeout: number;
  /** Whether the lock is still active */
  isActive(): boolean;
}