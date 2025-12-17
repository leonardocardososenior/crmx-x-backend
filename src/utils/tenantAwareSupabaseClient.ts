// Tenant-aware Supabase client wrapper for multi-tenant database operations

import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { supabase, supabaseAdmin } from '../supabaseClient';
import { 
  TenantContext, 
  TenantOperationResult,
  DatabaseContextConfig
} from '../types/tenant';
import { 
  TenantErrorFactory,
  DatabaseConnectivityError
} from '../types/tenantErrors';
import { 
  DatabaseContextManager,
  defaultDatabaseContextManager
} from './databaseContextManager';
import { generateSchemaName } from './tenantValidation';
import { 
  withPerformanceMonitoring,
  tenantPerformanceMonitor
} from './tenantPerformanceMonitor';
import { 
  withPooledConnection,
  tenantConnectionPool
} from './tenantConnectionPool';

/**
 * Configuration for tenant-aware Supabase client
 */
export interface TenantAwareClientConfig {
  /** Whether to use admin client for operations */
  useAdminClient: boolean;
  /** Whether to automatically manage database context */
  autoManageContext: boolean;
  /** Database context configuration */
  contextConfig?: DatabaseContextConfig;
}

/**
 * Default configuration for tenant-aware client
 */
export const DEFAULT_TENANT_AWARE_CONFIG: TenantAwareClientConfig = {
  useAdminClient: false,
  autoManageContext: true
};

/**
 * Tenant-aware Supabase client wrapper that handles multi-tenant database operations
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export class TenantAwareSupabaseClient {
  private baseClient: SupabaseClient;
  private contextManager: DatabaseContextManager;
  private config: TenantAwareClientConfig;
  private currentTenantId: string | null = null;

  constructor(
    baseClient?: SupabaseClient,
    contextManager?: DatabaseContextManager,
    config: TenantAwareClientConfig = DEFAULT_TENANT_AWARE_CONFIG
  ) {
    this.baseClient = baseClient || (config.useAdminClient ? supabaseAdmin : supabase);
    this.contextManager = contextManager || defaultDatabaseContextManager;
    this.config = { ...config };
  }

  /**
   * Creates a new client instance configured for a specific tenant
   * Requirements: 3.1, 3.2
   */
  withTenant(tenantId: string): TenantAwareSupabaseClient {
    const tenantClient = new TenantAwareSupabaseClient(
      this.baseClient,
      this.contextManager,
      this.config
    );
    tenantClient.currentTenantId = tenantId;
    return tenantClient;
  }

  /**
   * Executes a query within the tenant's schema context
   * Requirements: 3.1, 3.4, 4.5 (with performance optimization)
   */
  async executeQuery<T>(
    query: string,
    params?: any[],
    requestId?: string
  ): Promise<TenantOperationResult<T>> {
    if (!this.currentTenantId) {
      const error = TenantErrorFactory.createContextSetupError(
        'unknown',
        { reason: 'No tenant ID specified for query execution' },
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

    return withPerformanceMonitoring(
      async () => {
        try {
          // Set tenant context if auto-management is enabled
          if (this.config.autoManageContext) {
            const contextResult = await this.contextManager.setTenantContext(
              this.currentTenantId!,
              requestId
            );
            
            if (!contextResult.success) {
              return {
                success: false,
                error: contextResult.error
              };
            }
          }

          // Execute the query using pooled connection
          const queryResult = await withPooledConnection(
            this.currentTenantId!,
            async (client) => {
              const { data, error } = await client.rpc('execute_tenant_query', {
                query_sql: query,
                query_params: params || []
              });

              if (error) {
                throw new Error(`Query execution failed: ${error.message}`);
              }

              return data as T;
            },
            this.config.useAdminClient,
            requestId
          );

          if (!queryResult.success) {
            const queryError = TenantErrorFactory.createDatabaseConnectivityError(
              this.currentTenantId!,
              { 
                reason: 'Query execution failed',
                details: queryResult.error
              },
              requestId
            );
            
            return {
              success: false,
              error: {
                code: queryError.code,
                message: queryError.message,
                details: queryError.details
              }
            };
          }

          return {
            success: true,
            data: queryResult.data!,
            tenantContext: this.contextManager.getTenantContext() || undefined
          };

        } catch (error) {
          const executionError = TenantErrorFactory.createDatabaseConnectivityError(
            this.currentTenantId!,
            { 
              reason: 'Unexpected error during query execution',
              originalError: error instanceof Error ? error.message : String(error)
            },
            requestId
          );
          
          return {
            success: false,
            error: {
              code: executionError.code,
              message: executionError.message,
              details: executionError.details
            }
          };
        }
      },
      'tenant_query_execution',
      this.currentTenantId,
      { 
        queryLength: query.length,
        paramCount: params?.length || 0,
        useAdminClient: this.config.useAdminClient
      }
    );
  }

  /**
   * Executes a Supabase table operation within tenant context
   * Requirements: 3.1, 3.4
   */
  async from<T>(tableName: string): Promise<TenantTableBuilder<T>> {
    if (!this.currentTenantId) {
      throw new Error('No tenant ID specified for table operation');
    }

    // Set tenant context if auto-management is enabled
    if (this.config.autoManageContext) {
      const contextResult = await this.contextManager.setTenantContext(this.currentTenantId);
      if (!contextResult.success) {
        throw new Error(`Failed to set tenant context: ${contextResult.error?.message}`);
      }
    }

    return new TenantTableBuilder<T>(
      this.baseClient.from(tableName),
      this.currentTenantId,
      this.contextManager
    );
  }

  /**
   * Gets the underlying Supabase client
   */
  getClient(): SupabaseClient {
    return this.baseClient;
  }

  /**
   * Gets the current tenant ID
   */
  getCurrentTenantId(): string | null {
    return this.currentTenantId;
  }

  /**
   * Gets the current tenant context
   */
  getCurrentTenantContext(): TenantContext | null {
    return this.contextManager.getTenantContext();
  }

  /**
   * Executes an operation within tenant context with automatic cleanup
   * Requirements: 3.3, 3.5
   */
  async executeInTenantContext<T>(
    operation: (client: TenantAwareSupabaseClient) => Promise<T>,
    requestId?: string
  ): Promise<TenantOperationResult<T>> {
    if (!this.currentTenantId) {
      const error = TenantErrorFactory.createContextSetupError(
        'unknown',
        { reason: 'No tenant ID specified for context execution' },
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

    return this.contextManager.executeInTenantContext(
      this.currentTenantId,
      () => operation(this),
      requestId
    );
  }

  /**
   * Ensures tenant isolation is maintained
   * Requirements: 3.3, 3.5
   */
  async ensureIsolation(requestId?: string): Promise<TenantOperationResult<void>> {
    return this.contextManager.ensureIsolation(requestId);
  }

  /**
   * Cleans up tenant-specific resources
   * Requirements: 3.5
   */
  async cleanup(requestId?: string): Promise<TenantOperationResult<void>> {
    this.currentTenantId = null;
    return this.contextManager.cleanup(requestId);
  }

  /**
   * Creates a new client with admin privileges
   */
  asAdmin(): TenantAwareSupabaseClient {
    return new TenantAwareSupabaseClient(
      supabaseAdmin,
      this.contextManager,
      { ...this.config, useAdminClient: true }
    );
  }

  /**
   * Creates a new client with regular user privileges
   */
  asUser(): TenantAwareSupabaseClient {
    return new TenantAwareSupabaseClient(
      supabase,
      this.contextManager,
      { ...this.config, useAdminClient: false }
    );
  }
}

/**
 * Tenant-aware table builder that wraps Supabase table operations
 */
export class TenantTableBuilder<T> {
  private tableBuilder: any;
  private tenantId: string;
  private contextManager: DatabaseContextManager;

  constructor(
    tableBuilder: any,
    tenantId: string,
    contextManager: DatabaseContextManager
  ) {
    this.tableBuilder = tableBuilder;
    this.tenantId = tenantId;
    this.contextManager = contextManager;
  }

  /**
   * Select operation with tenant context
   */
  select(columns?: string) {
    return new TenantQueryBuilder(
      this.tableBuilder.select(columns),
      this.tenantId,
      this.contextManager
    );
  }

  /**
   * Insert operation with tenant context
   */
  insert(values: Partial<T> | Partial<T>[]) {
    return new TenantQueryBuilder(
      this.tableBuilder.insert(values),
      this.tenantId,
      this.contextManager
    );
  }

  /**
   * Update operation with tenant context
   */
  update(values: Partial<T>) {
    return new TenantQueryBuilder(
      this.tableBuilder.update(values),
      this.tenantId,
      this.contextManager
    );
  }

  /**
   * Delete operation with tenant context
   */
  delete() {
    return new TenantQueryBuilder(
      this.tableBuilder.delete(),
      this.tenantId,
      this.contextManager
    );
  }

  /**
   * Upsert operation with tenant context
   */
  upsert(values: Partial<T> | Partial<T>[]) {
    return new TenantQueryBuilder(
      this.tableBuilder.upsert(values),
      this.tenantId,
      this.contextManager
    );
  }
}

/**
 * Tenant-aware query builder that ensures operations run in correct schema
 */
export class TenantQueryBuilder {
  private queryBuilder: any;
  private tenantId: string;
  private contextManager: DatabaseContextManager;

  constructor(
    queryBuilder: any,
    tenantId: string,
    contextManager: DatabaseContextManager
  ) {
    this.queryBuilder = queryBuilder;
    this.tenantId = tenantId;
    this.contextManager = contextManager;
  }

  /**
   * Executes the query within tenant context
   */
  async execute(): Promise<TenantOperationResult<any>> {
    try {
      // Ensure tenant context is set
      const contextResult = await this.contextManager.setTenantContext(this.tenantId);
      if (!contextResult.success) {
        return {
          success: false,
          error: contextResult.error
        };
      }

      // Execute the query
      const { data, error } = await this.queryBuilder;

      if (error) {
        const queryError = TenantErrorFactory.createDatabaseConnectivityError(
          this.tenantId,
          { 
            reason: 'Query execution failed',
            supabaseError: error
          }
        );
        
        return {
          success: false,
          error: {
            code: queryError.code,
            message: queryError.message,
            details: queryError.details
          }
        };
      }

      return {
        success: true,
        data,
        tenantContext: this.contextManager.getTenantContext() || undefined
      };

    } catch (error) {
      const executionError = TenantErrorFactory.createDatabaseConnectivityError(
        this.tenantId,
        { 
          reason: 'Unexpected error during query execution',
          originalError: error instanceof Error ? error.message : String(error)
        }
      );
      
      return {
        success: false,
        error: {
          code: executionError.code,
          message: executionError.message,
          details: executionError.details
        }
      };
    }
  }

  // Proxy common query builder methods
  eq(column: string, value: any) {
    this.queryBuilder = this.queryBuilder.eq(column, value);
    return this;
  }

  neq(column: string, value: any) {
    this.queryBuilder = this.queryBuilder.neq(column, value);
    return this;
  }

  gt(column: string, value: any) {
    this.queryBuilder = this.queryBuilder.gt(column, value);
    return this;
  }

  gte(column: string, value: any) {
    this.queryBuilder = this.queryBuilder.gte(column, value);
    return this;
  }

  lt(column: string, value: any) {
    this.queryBuilder = this.queryBuilder.lt(column, value);
    return this;
  }

  lte(column: string, value: any) {
    this.queryBuilder = this.queryBuilder.lte(column, value);
    return this;
  }

  like(column: string, pattern: string) {
    this.queryBuilder = this.queryBuilder.like(column, pattern);
    return this;
  }

  ilike(column: string, pattern: string) {
    this.queryBuilder = this.queryBuilder.ilike(column, pattern);
    return this;
  }

  in(column: string, values: any[]) {
    this.queryBuilder = this.queryBuilder.in(column, values);
    return this;
  }

  is(column: string, value: any) {
    this.queryBuilder = this.queryBuilder.is(column, value);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.queryBuilder = this.queryBuilder.order(column, options);
    return this;
  }

  limit(count: number) {
    this.queryBuilder = this.queryBuilder.limit(count);
    return this;
  }

  range(from: number, to: number) {
    this.queryBuilder = this.queryBuilder.range(from, to);
    return this;
  }

  single() {
    this.queryBuilder = this.queryBuilder.single();
    return this;
  }

  maybeSingle() {
    this.queryBuilder = this.queryBuilder.maybeSingle();
    return this;
  }
}

/**
 * Default tenant-aware Supabase client instance
 */
export const defaultTenantAwareClient = new TenantAwareSupabaseClient();

/**
 * Creates a tenant-aware client for a specific tenant
 */
export function createTenantClient(
  tenantId: string,
  config?: TenantAwareClientConfig
): TenantAwareSupabaseClient {
  const client = config 
    ? new TenantAwareSupabaseClient(undefined, undefined, config)
    : defaultTenantAwareClient;
  
  return client.withTenant(tenantId);
}

/**
 * Creates an admin tenant-aware client for a specific tenant
 */
export function createAdminTenantClient(tenantId: string): TenantAwareSupabaseClient {
  return createTenantClient(tenantId, { 
    useAdminClient: true, 
    autoManageContext: true 
  });
}

/**
 * Convenience function to execute a query in tenant context
 */
export async function executeInTenantContext<T>(
  tenantId: string,
  operation: (client: TenantAwareSupabaseClient) => Promise<T>,
  requestId?: string
): Promise<TenantOperationResult<T>> {
  const client = createTenantClient(tenantId);
  return client.executeInTenantContext(operation, requestId);
}