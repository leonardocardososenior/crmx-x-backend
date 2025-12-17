// Schema creation and migration system for multi-tenant architecture

import { readFileSync } from 'fs';
import { join } from 'path';
import { supabaseAdmin } from '../supabaseClient';
import { 
  MigrationResult, 
  SchemaCreationOptions,
  TenantOperationResult,
  SchemaCreationLock
} from '../types/tenant';
import { 
  TenantErrorFactory,
  SchemaOperationError,
  ConcurrencyError,
  DatabaseConnectivityError
} from '../types/tenantErrors';
import { generateSchemaName, DEFAULT_TENANT_CONFIG } from './tenantValidation';
import { logTenantOperation } from './tenantHelpers';
import { logger } from './logger';

/**
 * Default schema creation options
 */
export const DEFAULT_SCHEMA_CREATION_OPTIONS: SchemaCreationOptions = {
  runMigrations: true,
  migrationScriptPath: 'src/database/schema.sql',
  handleConcurrency: true
};

/**
 * In-memory lock manager for concurrent schema creation
 */
class SchemaCreationLockManager {
  private locks = new Map<string, SchemaCreationLock>();
  private readonly lockTimeout = 30000; // 30 seconds

  /**
   * Acquire a lock for schema creation
   */
  async acquireLock(tenantId: string): Promise<boolean> {
    const existingLock = this.locks.get(tenantId);
    
    // Check if existing lock is still active
    if (existingLock && existingLock.isActive()) {
      return false;
    }
    
    // Clean up expired lock
    if (existingLock) {
      this.locks.delete(tenantId);
    }
    
    // Create new lock
    const lock: SchemaCreationLock = {
      tenantId,
      acquiredAt: new Date(),
      timeout: this.lockTimeout,
      isActive: function() {
        const now = new Date();
        const age = now.getTime() - this.acquiredAt.getTime();
        return age < this.timeout;
      }
    };
    
    this.locks.set(tenantId, lock);
    return true;
  }
  
  /**
   * Release a lock for schema creation
   */
  releaseLock(tenantId: string): void {
    this.locks.delete(tenantId);
  }
  
  /**
   * Clean up expired locks
   */
  cleanup(): void {
    for (const [tenantId, lock] of this.locks) {
      if (!lock.isActive()) {
        this.locks.delete(tenantId);
      }
    }
  }
}

// Global lock manager instance
const lockManager = new SchemaCreationLockManager();

// Clean up expired locks every minute
setInterval(() => {
  lockManager.cleanup();
}, 60000);

/**
 * SchemaCreator class for managing PostgreSQL schema creation and migrations
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export class SchemaCreator {
  private options: SchemaCreationOptions;
  
  constructor(options: Partial<SchemaCreationOptions> = {}) {
    this.options = { ...DEFAULT_SCHEMA_CREATION_OPTIONS, ...options };
  }
  
  /**
   * Creates a new schema for the specified tenant
   * Requirements: 2.1, 2.3, 2.4, 2.5
   */
  async createSchema(
    tenantId: string, 
    requestId?: string
  ): Promise<TenantOperationResult<MigrationResult>> {
    const schemaName = generateSchemaName(tenantId);
    
    try {
      // Handle concurrent creation if enabled
      if (this.options.handleConcurrency) {
        const lockAcquired = await lockManager.acquireLock(tenantId);
        if (!lockAcquired) {
          const error = TenantErrorFactory.createConcurrencyError(
            tenantId,
            { reason: 'Another schema creation is in progress for this tenant' },
            requestId
          );
          
          logTenantOperation(
            'schema_creation',
            tenantId,
            false,
            { error: 'Concurrent creation conflict' },
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
      }
      
      try {
        // Check if schema already exists
        const existsResult = await this.checkSchemaExists(schemaName);
        if (existsResult.success && existsResult.data) {
          // Schema already exists, no need to create
          const result: MigrationResult = {
            success: true,
            schemaName,
            executedAt: new Date()
          };
          
          logTenantOperation(
            'schema_creation',
            tenantId,
            true,
            { reason: 'Schema already exists' },
            requestId
          );
          
          return {
            success: true,
            data: result
          };
        }
        
        // Create the schema
        const createResult = await this.executeSchemaCreation(schemaName);
        if (!createResult.success) {
          throw new SchemaOperationError(
            createResult.error!.code as any,
            createResult.error!.message,
            tenantId,
            createResult.error!.details,
            requestId
          );
        }
        
        // Run migrations if enabled
        let migrationResult: MigrationResult;
        if (this.options.runMigrations) {
          const migrationOperationResult = await this.runMigrations(schemaName, requestId);
          if (!migrationOperationResult.success) {
            // Clean up the created schema on migration failure
            await this.dropSchema(schemaName);
            throw new SchemaOperationError(
              migrationOperationResult.error!.code as any,
              migrationOperationResult.error!.message,
              tenantId,
              migrationOperationResult.error!.details,
              requestId
            );
          }
          migrationResult = migrationOperationResult.data!;
        } else {
          migrationResult = {
            success: true,
            schemaName,
            executedAt: new Date()
          };
        }
        
        // Log successful creation
        logTenantOperation(
          'schema_creation',
          tenantId,
          true,
          { schemaName, migrationsRun: this.options.runMigrations },
          requestId
        );
        
        return {
          success: true,
          data: migrationResult
        };
        
      } finally {
        // Always release the lock
        if (this.options.handleConcurrency) {
          lockManager.releaseLock(tenantId);
        }
      }
      
    } catch (error) {
      // Log the error
      logTenantOperation(
        'schema_creation',
        tenantId,
        false,
        { error: error instanceof Error ? error.message : String(error) },
        requestId
      );
      
      if (error instanceof SchemaOperationError || error instanceof ConcurrencyError) {
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details
          }
        };
      }
      
      // Convert unexpected errors to schema operation errors
      const schemaError = TenantErrorFactory.createSchemaCreationError(
        tenantId,
        { originalError: error instanceof Error ? error.message : String(error) },
        requestId
      );
      
      return {
        success: false,
        error: {
          code: schemaError.code,
          message: schemaError.message,
          details: schemaError.details
        }
      };
    }
  }
  
  /**
   * Executes migration scripts in the specified schema
   * Requirements: 2.2, 2.3, 2.4
   */
  async runMigrations(
    schemaName: string, 
    requestId?: string
  ): Promise<TenantOperationResult<MigrationResult>> {
    try {
      // Read the migration script
      const migrationScript = this.readMigrationScript();
      
      // Execute the migration script in the target schema
      const { error } = await supabaseAdmin.rpc('execute_migration_in_schema', {
        schema_name: schemaName,
        migration_sql: migrationScript
      });
      
      if (error) {
        const migrationError = TenantErrorFactory.createSchemaMigrationError(
          schemaName,
          { supabaseError: error },
          requestId
        );
        
        return {
          success: false,
          error: {
            code: migrationError.code,
            message: migrationError.message,
            details: migrationError.details
          }
        };
      }
      
      const result: MigrationResult = {
        success: true,
        schemaName,
        executedAt: new Date()
      };
      
      return {
        success: true,
        data: result
      };
      
    } catch (error) {
      const migrationError = TenantErrorFactory.createSchemaMigrationError(
        schemaName,
        { originalError: error instanceof Error ? error.message : String(error) },
        requestId
      );
      
      return {
        success: false,
        error: {
          code: migrationError.code,
          message: migrationError.message,
          details: migrationError.details
        }
      };
    }
  }
  
  /**
   * Handles concurrent schema creation attempts
   * Requirements: 2.5
   */
  async handleConcurrentCreation(
    tenantId: string,
    requestId?: string
  ): Promise<TenantOperationResult<MigrationResult>> {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.createSchema(tenantId, requestId);
      
      if (result.success) {
        return result;
      }
      
      // If it's not a concurrency error, don't retry
      if (result.error?.code !== 'CONCURRENT_OPERATION_FAILED') {
        return result;
      }
      
      // Wait before retrying
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
    
    // All retries failed
    const error = TenantErrorFactory.createConcurrencyError(
      tenantId,
      { reason: 'Failed to create schema after multiple attempts due to concurrent operations' },
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
  
  /**
   * Checks if a schema exists in the database
   */
  private async checkSchemaExists(schemaName: string): Promise<TenantOperationResult<boolean>> {
    try {
      const { data, error } = await supabaseAdmin.rpc('check_schema_exists', {
        schema_name: schemaName
      });
      
      if (error) {
        return {
          success: false,
          error: {
            code: 'SCHEMA_VALIDATION_FAILED',
            message: 'Failed to check schema existence',
            details: { supabaseError: error }
          }
        };
      }
      
      return {
        success: true,
        data: data as boolean
      };
      
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_CONNECTION_FAILED',
          message: 'Database connection failed during schema check',
          details: { originalError: error instanceof Error ? error.message : String(error) }
        }
      };
    }
  }
  
  /**
   * Executes the actual schema creation SQL
   */
  private async executeSchemaCreation(schemaName: string): Promise<TenantOperationResult<void>> {
    try {
      const { error } = await supabaseAdmin.rpc('create_tenant_schema', {
        schema_name: schemaName
      });
      
      if (error) {
        return {
          success: false,
          error: {
            code: 'SCHEMA_CREATION_FAILED',
            message: 'Failed to create schema',
            details: { supabaseError: error }
          }
        };
      }
      
      return {
        success: true
      };
      
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_CONNECTION_FAILED',
          message: 'Database connection failed during schema creation',
          details: { originalError: error instanceof Error ? error.message : String(error) }
        }
      };
    }
  }
  
  /**
   * Drops a schema (used for cleanup on migration failure)
   */
  private async dropSchema(schemaName: string): Promise<void> {
    try {
      await supabaseAdmin.rpc('drop_tenant_schema', {
        schema_name: schemaName
      });
    } catch (error) {
      // Log the error but don't throw - this is cleanup
      logger.error('SCHEMA_CLEANUP', `Failed to drop schema ${schemaName} during cleanup`, error as Error);
    }
  }
  
  /**
   * Reads the migration script from file system
   */
  private readMigrationScript(): string {
    try {
      const scriptPath = join(process.cwd(), this.options.migrationScriptPath);
      return readFileSync(scriptPath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read migration script from ${this.options.migrationScriptPath}: ${error}`);
    }
  }
}

/**
 * Default schema creator instance
 */
export const defaultSchemaCreator = new SchemaCreator();

/**
 * Convenience function to create a schema for a tenant
 */
export async function createTenantSchema(
  tenantId: string,
  options?: Partial<SchemaCreationOptions>,
  requestId?: string
): Promise<TenantOperationResult<MigrationResult>> {
  const creator = options ? new SchemaCreator(options) : defaultSchemaCreator;
  return creator.createSchema(tenantId, requestId);
}

/**
 * Convenience function to run migrations in a schema
 */
export async function runTenantMigrations(
  schemaName: string,
  options?: Partial<SchemaCreationOptions>,
  requestId?: string
): Promise<TenantOperationResult<MigrationResult>> {
  const creator = options ? new SchemaCreator(options) : defaultSchemaCreator;
  return creator.runMigrations(schemaName, requestId);
}