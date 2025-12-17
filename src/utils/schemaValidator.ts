// Schema validation and management utilities for multi-tenant system

import { supabaseAdmin } from '../supabaseClient';
import { 
  SchemaExistenceResult, 
  TenantConfig, 
  TenantValidationResult,
  SchemaValidationCache 
} from '../types/tenant';
import { 
  validateTenantId, 
  generateSchemaName, 
  validateSchemaName,
  getCachedSchemaExistence,
  cacheSchemaExistence,
  DEFAULT_TENANT_CONFIG,
  isSafeTenantId
} from './tenantValidation';
import { 
  withPerformanceMonitoring,
  recordCacheMetric,
  tenantPerformanceMonitor
} from './tenantPerformanceMonitor';
import { 
  withPooledConnection,
  tenantConnectionPool
} from './tenantConnectionPool';

/**
 * SchemaValidator class handles schema existence checking, validation, and caching
 * Requirements: 4.1, 4.2, 4.4, 4.5
 */
export class SchemaValidator {
  private config: TenantConfig;

  constructor(config: TenantConfig = DEFAULT_TENANT_CONFIG) {
    this.config = config;
  }

  /**
   * Checks if a schema exists for the given tenant
   * Requirements: 4.1, 4.2, 4.5 (with performance optimization)
   */
  async schemaExists(tenantId: string): Promise<SchemaExistenceResult> {
    return withPerformanceMonitoring(
      async () => {
        try {
          // First validate the tenant ID format (Requirement 4.4)
          const validation = this.validateTenantIdFormat(tenantId);
          if (!validation.isValid) {
            return {
              exists: false,
              schemaName: generateSchemaName(tenantId, this.config),
              fromCache: false,
              error: validation.error
            };
          }

          const sanitizedTenantId = validation.sanitizedTenantId!;
          const schemaName = generateSchemaName(sanitizedTenantId, this.config);

          // Check cache first (Requirement 4.5)
          const startCacheCheck = Date.now();
          const cachedResult = getCachedSchemaExistence(sanitizedTenantId);
          if (cachedResult) {
            const cacheCheckDuration = Date.now() - startCacheCheck;
            recordCacheMetric('schema_validation', sanitizedTenantId, cacheCheckDuration, true, {
              schemaName,
              operation: 'cache_hit'
            });
            return cachedResult;
          }

          const cacheCheckDuration = Date.now() - startCacheCheck;
          recordCacheMetric('schema_validation', sanitizedTenantId, cacheCheckDuration, false, {
            schemaName,
            operation: 'cache_miss'
          });

          // Query database for schema existence using pooled connection (Requirement 4.1)
          const dbResult = await withPooledConnection(
            sanitizedTenantId,
            async (client) => {
              const { data, error } = await client.rpc('check_schema_exists', {
                schema_name: schemaName
              });

              if (error) {
                // Database connectivity error (Requirement 4.3)
                throw new Error(`Database connectivity error: ${error.message}`);
              }

              return data === true;
            },
            true // Use admin connection for schema checks
          );

          if (!dbResult.success) {
            throw new Error(dbResult.error?.message || 'Database query failed');
          }

          const exists = dbResult.data!;

          // Cache the result (Requirement 4.5)
          cacheSchemaExistence(sanitizedTenantId, exists, this.config.validationCacheTtl);

          return {
            exists,
            schemaName,
            fromCache: false
          };

        } catch (error) {
          // Handle database connectivity errors (Requirement 4.3)
          if (error instanceof Error) {
            return {
              exists: false,
              schemaName: generateSchemaName(tenantId, this.config),
              fromCache: false,
              error: error.message
            };
          }
          
          return {
            exists: false,
            schemaName: generateSchemaName(tenantId, this.config),
            fromCache: false,
            error: 'Unknown error occurred during schema validation'
          };
        }
      },
      'schema_existence_check',
      tenantId,
      { operation: 'schema_validation' }
    );
  }

  /**
   * Validates tenant ID format and returns sanitized version
   * Requirements: 4.4
   */
  validateTenantIdFormat(tenantId: string): TenantValidationResult {
    // Basic validation using existing utility
    const basicValidation = validateTenantId(tenantId, this.config);
    if (!basicValidation.isValid) {
      return basicValidation;
    }

    const sanitizedTenantId = basicValidation.sanitizedTenantId!;

    // Additional safety checks for database operations
    if (!isSafeTenantId(sanitizedTenantId)) {
      return {
        isValid: false,
        error: 'Invalid tenant format'
      };
    }

    return {
      isValid: true,
      sanitizedTenantId
    };
  }

  /**
   * Validates schema name format
   * Requirements: 4.4
   */
  validateSchemaNameFormat(schemaName: string): boolean {
    return validateSchemaName(schemaName, this.config);
  }

  /**
   * Generates schema name for a tenant ID
   */
  getSchemaName(tenantId: string): string {
    return generateSchemaName(tenantId, this.config);
  }

  /**
   * Validates schema existence with comprehensive error handling
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
   */
  async validateSchema(tenantId: string): Promise<SchemaExistenceResult> {
    try {
      // Validate tenant ID format first (Requirement 4.4)
      const validation = this.validateTenantIdFormat(tenantId);
      if (!validation.isValid) {
        return {
          exists: false,
          schemaName: this.getSchemaName(tenantId),
          fromCache: false,
          error: validation.error
        };
      }

      // Check schema existence
      const result = await this.schemaExists(validation.sanitizedTenantId!);
      
      // If schema exists, proceed with normal processing (Requirement 4.2)
      if (result.exists) {
        return result;
      }

      // Schema doesn't exist - this is not an error, just information
      return result;

    } catch (error) {
      // Handle database connectivity errors (Requirement 4.3)
      return {
        exists: false,
        schemaName: this.getSchemaName(tenantId),
        fromCache: false,
        error: error instanceof Error ? error.message : 'Database connectivity error'
      };
    }
  }

  /**
   * Clears cached validation result for a tenant
   */
  clearCache(tenantId: string): void {
    const validation = this.validateTenantIdFormat(tenantId);
    if (validation.isValid && validation.sanitizedTenantId) {
      // Clear from cache - we'll need to import the cache instance
      const { schemaValidationCache } = require('./tenantValidation');
      schemaValidationCache.delete(validation.sanitizedTenantId);
    }
  }

  /**
   * Clears all cached validation results
   */
  clearAllCache(): void {
    const { schemaValidationCache } = require('./tenantValidation');
    schemaValidationCache.clear();
  }

  /**
   * Gets current configuration
   */
  getConfig(): TenantConfig {
    return { ...this.config };
  }

  /**
   * Updates configuration
   */
  updateConfig(newConfig: Partial<TenantConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Default instance for easy usage
export const defaultSchemaValidator = new SchemaValidator();

/**
 * Convenience function for quick schema existence check
 */
export async function checkSchemaExists(tenantId: string): Promise<boolean> {
  const result = await defaultSchemaValidator.schemaExists(tenantId);
  return result.exists;
}

/**
 * Convenience function for schema validation with error handling
 */
export async function validateTenantSchema(tenantId: string): Promise<SchemaExistenceResult> {
  return await defaultSchemaValidator.validateSchema(tenantId);
}