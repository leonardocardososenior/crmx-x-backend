// Database context management system for multi-tenant schema isolation

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase, supabaseAdmin } from '../supabaseClient';
import { 
  TenantContext, 
  DatabaseContextConfig,
  TenantOperationResult
} from '../types/tenant';
import { 
  TenantErrorFactory,
  DatabaseConnectivityError
} from '../types/tenantErrors';
import { generateSchemaName } from './tenantValidation';

/**
 * Default database context configuration
 */
export const DEFAULT_DATABASE_CONTEXT_CONFIG: DatabaseContextConfig = {
  searchPath: 'public',
  connectionTimeout: 30000, // 30 seconds
  autoReset: true
};

/**
 * Database context manager for handling tenant-specific database operations
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export class DatabaseContextManager {
  private config: DatabaseContextConfig;
  private currentContext: TenantContext | null = null;
  private contextStack: TenantContext[] = [];

  constructor(config: DatabaseContextConfig = DEFAULT_DATABASE_CONTEXT_CONFIG) {
    this.config = { ...config };
  }

  /**
   * Sets the database context for a specific tenant
   * Simplified version - assumes schema exists and connects directly
   * Requirements: 3.1, 3.2, 3.4
   */
  async setTenantContext(
    tenantId: string,
    requestId?: string
  ): Promise<TenantOperationResult<void>> {
    try {
      const schemaName = generateSchemaName(tenantId);
      
      // Create tenant context
      const context: TenantContext = {
        tenantId,
        schemaName,
        isValidated: true,
        createdAt: new Date()
      };

      // Set search_path for the tenant schema (Requirement 3.1)
      // Assumes schema exists - no validation needed
      const searchPath = `"${schemaName}", public`;
      const setSearchPathResult = await this.setSearchPath(searchPath);
      
      if (!setSearchPathResult.success) {
        const error = TenantErrorFactory.createDatabaseConnectivityError(
          tenantId,
          { 
            reason: 'Failed to set search_path for tenant schema',
            details: setSearchPathResult.error
          },
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

      // Store current context (Requirement 3.2)
      this.currentContext = context;
      
      return {
        success: true,
        tenantContext: context
      };

    } catch (error) {
      const dbError = TenantErrorFactory.createDatabaseConnectivityError(
        tenantId,
        { 
          reason: 'Failed to configure database context',
          originalError: error instanceof Error ? error.message : String(error)
        },
        requestId
      );
      
      return {
        success: false,
        error: {
          code: dbError.code,
          message: dbError.message,
          details: dbError.details
        }
      };
    }
  }

  /**
   * Gets the current tenant context
   * Requirements: 3.2
   */
  getTenantContext(): TenantContext | null {
    return this.currentContext;
  }

  /**
   * Resets the database context to default
   * Requirements: 3.4, 3.5
   */
  async resetContext(requestId?: string): Promise<TenantOperationResult<void>> {
    try {
      // Reset search_path to default
      const resetResult = await this.setSearchPath(this.config.searchPath);
      
      if (!resetResult.success) {
        const error = TenantErrorFactory.createDatabaseConnectivityError(
          this.currentContext?.tenantId || 'unknown',
          { 
            reason: 'Failed to reset database context',
            details: resetResult.error
          },
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

      // Clear current context
      this.currentContext = null;
      
      return {
        success: true
      };

    } catch (error) {
      const dbError = TenantErrorFactory.createDatabaseConnectivityError(
        this.currentContext?.tenantId || 'unknown',
        { 
          reason: 'Failed to reset database context',
          originalError: error instanceof Error ? error.message : String(error)
        },
        requestId
      );
      
      return {
        success: false,
        error: {
          code: dbError.code,
          message: dbError.message,
          details: dbError.details
        }
      };
    }
  }

  /**
   * Executes an operation within a specific tenant context
   * Requirements: 3.3, 3.4, 3.5
   */
  async executeInTenantContext<T>(
    tenantId: string,
    operation: () => Promise<T>,
    requestId?: string
  ): Promise<TenantOperationResult<T>> {
    // Push current context to stack for isolation (Requirement 3.3)
    if (this.currentContext) {
      this.contextStack.push(this.currentContext);
    }

    try {
      // Set tenant context
      const setContextResult = await this.setTenantContext(tenantId, requestId);
      if (!setContextResult.success) {
        return {
          success: false,
          error: setContextResult.error
        };
      }

      // Execute the operation within tenant context (Requirement 3.4)
      const result = await operation();

      return {
        success: true,
        data: result,
        tenantContext: this.currentContext!
      };

    } catch (error) {
      const operationError = TenantErrorFactory.createDatabaseConnectivityError(
        tenantId,
        { 
          reason: 'Operation failed within tenant context',
          originalError: error instanceof Error ? error.message : String(error)
        },
        requestId
      );
      
      return {
        success: false,
        error: {
          code: operationError.code,
          message: operationError.message,
          details: operationError.details
        }
      };

    } finally {
      // Restore previous context or reset (Requirement 3.5)
      if (this.config.autoReset) {
        if (this.contextStack.length > 0) {
          const previousContext = this.contextStack.pop()!;
          await this.setTenantContext(previousContext.tenantId, requestId);
        } else {
          await this.resetContext(requestId);
        }
      }
    }
  }

  /**
   * Switches between different tenants in the same request cycle
   * Requirements: 3.3
   */
  async switchTenantContext(
    newTenantId: string,
    requestId?: string
  ): Promise<TenantOperationResult<TenantContext>> {
    const previousContext = this.currentContext;
    
    try {
      // Set new tenant context
      const setContextResult = await this.setTenantContext(newTenantId, requestId);
      if (!setContextResult.success) {
        return {
          success: false,
          error: setContextResult.error
        };
      }

      return {
        success: true,
        data: this.currentContext!,
        tenantContext: this.currentContext!
      };

    } catch (error) {
      // Try to restore previous context on failure
      if (previousContext) {
        await this.setTenantContext(previousContext.tenantId, requestId);
      }

      const switchError = TenantErrorFactory.createDatabaseConnectivityError(
        newTenantId,
        { 
          reason: 'Failed to switch tenant context',
          originalError: error instanceof Error ? error.message : String(error)
        },
        requestId
      );
      
      return {
        success: false,
        error: {
          code: switchError.code,
          message: switchError.message,
          details: switchError.details
        }
      };
    }
  }

  /**
   * Ensures schema isolation between different tenant requests
   * Requirements: 3.3, 3.5
   */
  async ensureIsolation(requestId?: string): Promise<TenantOperationResult<void>> {
    try {
      // Verify current context is properly isolated
      if (!this.currentContext) {
        return {
          success: true // No context means default isolation
        };
      }

      // Verify search_path is correctly set
      const verifyResult = await this.verifySearchPath(this.currentContext.schemaName);
      if (!verifyResult.success) {
        // Re-establish context if verification fails
        const reestablishResult = await this.setTenantContext(
          this.currentContext.tenantId,
          requestId
        );
        
        if (!reestablishResult.success) {
          return reestablishResult;
        }
      }

      return {
        success: true,
        tenantContext: this.currentContext
      };

    } catch (error) {
      const isolationError = TenantErrorFactory.createDatabaseConnectivityError(
        this.currentContext?.tenantId || 'unknown',
        { 
          reason: 'Failed to ensure tenant isolation',
          originalError: error instanceof Error ? error.message : String(error)
        },
        requestId
      );
      
      return {
        success: false,
        error: {
          code: isolationError.code,
          message: isolationError.message,
          details: isolationError.details
        }
      };
    }
  }

  /**
   * Cleans up tenant-specific resources
   * Requirements: 3.5
   */
  async cleanup(requestId?: string): Promise<TenantOperationResult<void>> {
    try {
      // Reset context
      const resetResult = await this.resetContext(requestId);
      if (!resetResult.success) {
        return resetResult;
      }

      // Clear context stack
      this.contextStack = [];

      return {
        success: true
      };

    } catch (error) {
      const cleanupError = TenantErrorFactory.createDatabaseConnectivityError(
        this.currentContext?.tenantId || 'unknown',
        { 
          reason: 'Failed to cleanup tenant resources',
          originalError: error instanceof Error ? error.message : String(error)
        },
        requestId
      );
      
      return {
        success: false,
        error: {
          code: cleanupError.code,
          message: cleanupError.message,
          details: cleanupError.details
        }
      };
    }
  }

  /**
   * Gets current configuration
   */
  getConfig(): DatabaseContextConfig {
    return { ...this.config };
  }

  /**
   * Updates configuration
   */
  updateConfig(newConfig: Partial<DatabaseContextConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Sets the PostgreSQL search_path
   * Private helper method
   */
  private async setSearchPath(searchPath: string): Promise<TenantOperationResult<void>> {
    try {
      // Use admin client for setting search_path
      const { error } = await supabaseAdmin.rpc('set_search_path', {
        path: searchPath
      });

      if (error) {
        return {
          success: false,
          error: {
            code: 'SEARCH_PATH_SET_FAILED',
            message: 'Failed to set search_path',
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
          message: 'Database connection failed while setting search_path',
          details: { originalError: error instanceof Error ? error.message : String(error) }
        }
      };
    }
  }

  /**
   * Verifies that the search_path is correctly set
   * Private helper method
   */
  private async verifySearchPath(expectedSchema: string): Promise<TenantOperationResult<boolean>> {
    try {
      const { data, error } = await supabaseAdmin.rpc('get_current_search_path');

      if (error) {
        return {
          success: false,
          error: {
            code: 'SEARCH_PATH_VERIFY_FAILED',
            message: 'Failed to verify search_path',
            details: { supabaseError: error }
          }
        };
      }

      const currentPath = data as string;
      const isCorrect = currentPath.includes(`"${expectedSchema}"`);

      return {
        success: true,
        data: isCorrect
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_CONNECTION_FAILED',
          message: 'Database connection failed while verifying search_path',
          details: { originalError: error instanceof Error ? error.message : String(error) }
        }
      };
    }
  }
}

/**
 * Default database context manager instance
 */
export const defaultDatabaseContextManager = new DatabaseContextManager();

/**
 * Convenience function to set tenant context
 */
export async function setTenantDatabaseContext(
  tenantId: string,
  requestId?: string
): Promise<TenantOperationResult<void>> {
  return defaultDatabaseContextManager.setTenantContext(tenantId, requestId);
}

/**
 * Convenience function to reset database context
 */
export async function resetDatabaseContext(
  requestId?: string
): Promise<TenantOperationResult<void>> {
  return defaultDatabaseContextManager.resetContext(requestId);
}

/**
 * Convenience function to execute operation in tenant context
 */
export async function executeInTenantContext<T>(
  tenantId: string,
  operation: () => Promise<T>,
  requestId?: string
): Promise<TenantOperationResult<T>> {
  return defaultDatabaseContextManager.executeInTenantContext(tenantId, operation, requestId);
}