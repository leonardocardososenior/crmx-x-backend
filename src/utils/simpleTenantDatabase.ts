// Simplified tenant database utilities
// Assumes schemas exist and are managed manually

import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin, createTenantClient } from '../supabaseClient';

/**
 * Simple tenant database manager that connects directly to tenant schemas
 * No validation or creation - assumes schemas exist
 */
export class SimpleTenantDatabase {
  private tenantClients: Map<string, SupabaseClient<any, any, any>> = new Map();

  /**
   * Gets or creates a Supabase client for a specific tenant
   */
  getTenantClient(tenantId: string): SupabaseClient<any, any, any> {
    if (!this.tenantClients.has(tenantId)) {
      const client = createTenantClient(tenantId);
      this.tenantClients.set(tenantId, client);
    }
    
    return this.tenantClients.get(tenantId)!;
  }

  /**
   * Executes a query in the tenant's schema using direct client configuration
   */
  async executeInTenantSchema<T>(
    tenantId: string,
    operation: (client: SupabaseClient<any, any, any>) => Promise<T>
  ): Promise<T> {
    console.log(`🔍 [TENANT DEBUG] executeInTenantSchema called for tenant: ${tenantId}`);
    console.log(`🔍 [TENANT DEBUG] Expected schema: crmx_database_${tenantId}`);
    
    // Get the tenant-specific client (configured with schema)
    const tenantClient = this.getTenantClient(tenantId);
    
    console.log(`🔍 [TENANT DEBUG] About to execute operation with tenant client`);
    const result = await operation(tenantClient);
    console.log(`🔍 [TENANT DEBUG] Operation completed`);
    
    return result;
  }

  /**
   * Creates a client that uses RPC functions to query tenant schemas
   */
  private createTenantRPCClient(schemaName: string) {
    const self = this;
    
    return {
      from: (tableName: string) => {
        console.log(`🔍 [TENANT DEBUG] RPC Client - from table: ${tableName} in schema: ${schemaName}`);
        
        return {
          select: (columns = '*', options: any = {}) => {
            console.log(`🔍 [TENANT DEBUG] RPC Client - select: ${columns}`);
            
            const queryBuilder = {
              order: (column: string, opts: any = {}) => {
                const direction = opts.ascending === false ? 'DESC' : 'ASC';
                const orderClause = `${column} ${direction}`;
                console.log(`🔍 [TENANT DEBUG] RPC Client - order: ${orderClause}`);
                
                return {
                  limit: async (count: number) => {
                    console.log(`🔍 [TENANT DEBUG] RPC Client - limit: ${count}`);
                    return await self.executeRPCQuery(schemaName, tableName, columns, '', orderClause, count, 0);
                  },
                  range: (start: number, end: number) => {
                    const limit = end - start + 1;
                    const offset = start;
                    console.log(`🔍 [TENANT DEBUG] RPC Client - range: ${start}-${end} (limit: ${limit}, offset: ${offset})`);
                    
                    return {
                      then: async (resolve: any, reject: any) => {
                        try {
                          const result = await self.executeRPCQuery(schemaName, tableName, columns, '', orderClause, limit, offset);
                          resolve(result);
                        } catch (error) {
                          reject(error);
                        }
                      }
                    };
                  }
                };
              },
              range: (start: number, end: number) => {
                const limit = end - start + 1;
                const offset = start;
                console.log(`🔍 [TENANT DEBUG] RPC Client - range: ${start}-${end} (limit: ${limit}, offset: ${offset})`);
                
                return {
                  then: async (resolve: any, reject: any) => {
                    try {
                      const result = await self.executeRPCQuery(schemaName, tableName, columns, '', 'created_at DESC', limit, offset);
                      resolve(result);
                    } catch (error) {
                      reject(error);
                    }
                  }
                };
              }
            };
            
            return queryBuilder;
          },
          insert: (data: any) => {
            console.log(`🔍 [TENANT DEBUG] RPC Client - insert into: ${tableName}`);
            
            return {
              select: () => {
                return {
                  single: async () => {
                    return await self.executeRPCInsert(schemaName, tableName, data);
                  }
                };
              }
            };
          },
          update: (data: any) => {
            console.log(`🔍 [TENANT DEBUG] RPC Client - update: ${tableName}`);
            
            return {
              eq: (column: string, value: any) => {
                return {
                  select: () => {
                    return {
                      single: async () => {
                        return await self.executeRPCUpdate(schemaName, tableName, data, `${column} = '${value}'`);
                      }
                    };
                  }
                };
              }
            };
          },
          delete: () => {
            console.log(`🔍 [TENANT DEBUG] RPC Client - delete from: ${tableName}`);
            
            return {
              eq: (column: string, value: any) => {
                return {
                  then: async (resolve: any, reject: any) => {
                    try {
                      const result = await self.executeRPCDelete(schemaName, tableName, `${column} = '${value}'`);
                      resolve(result);
                    } catch (error) {
                      reject(error);
                    }
                  }
                };
              }
            };
          }
        };
      }
    };
  }

  /**
   * Executes RPC query for SELECT operations
   */
  private async executeRPCQuery(
    schemaName: string, 
    tableName: string, 
    columns: string, 
    whereClause: string, 
    orderClause: string, 
    limit: number, 
    offset: number
  ): Promise<any> {
    try {
      console.log(`🔍 [TENANT DEBUG] Executing RPC query: ${schemaName}.${tableName}`);
      
      const { data, error } = await supabaseAdmin.rpc('get_tenant_data', {
        tenant_schema: schemaName,
        table_name: tableName,
        columns_list: columns,
        where_clause: whereClause,
        order_clause: orderClause,
        limit_count: limit,
        offset_count: offset
      });
      
      if (error) {
        console.error(`🔍 [TENANT DEBUG] RPC Error:`, error);
        throw error;
      }
      
      console.log(`🔍 [TENANT DEBUG] RPC Success - Records found: ${data?.length || 0}`);
      
      // Get total count for pagination
      const { data: countData, error: countError } = await supabaseAdmin.rpc('count_tenant_data', {
        tenant_schema: schemaName,
        table_name: tableName,
        where_clause: whereClause
      });
      
      const totalCount = countError ? 0 : countData;
      
      return {
        data: data || [],
        error: null,
        count: totalCount
      };
      
    } catch (error) {
      console.error(`🔍 [TENANT DEBUG] RPC Query failed:`, error);
      return {
        data: null,
        error: error,
        count: 0
      };
    }
  }

  /**
   * Executes RPC query for INSERT operations
   */
  private async executeRPCInsert(schemaName: string, tableName: string, data: any): Promise<any> {
    try {
      console.log(`🔍 [TENANT DEBUG] Executing RPC insert: ${schemaName}.${tableName}`);
      
      const { data: result, error } = await supabaseAdmin.rpc('insert_tenant_data', {
        tenant_schema: schemaName,
        table_name: tableName,
        data_json: JSON.stringify(data)
      });
      
      if (error) {
        console.error(`🔍 [TENANT DEBUG] RPC Insert Error:`, error);
        throw error;
      }
      
      console.log(`🔍 [TENANT DEBUG] RPC Insert Success`);
      
      return {
        data: result,
        error: null
      };
      
    } catch (error) {
      console.error(`🔍 [TENANT DEBUG] RPC Insert failed:`, error);
      return {
        data: null,
        error: error
      };
    }
  }

  /**
   * Placeholder for UPDATE operations
   */
  private async executeRPCUpdate(schemaName: string, tableName: string, data: any, whereClause: string): Promise<any> {
    console.log(`🔍 [TENANT DEBUG] RPC Update not implemented yet for: ${schemaName}.${tableName}`);
    return { data: null, error: new Error('Update not implemented') };
  }

  /**
   * Placeholder for DELETE operations
   */
  private async executeRPCDelete(schemaName: string, tableName: string, whereClause: string): Promise<any> {
    console.log(`🔍 [TENANT DEBUG] RPC Delete not implemented yet for: ${schemaName}.${tableName}`);
    return { data: null, error: new Error('Delete not implemented') };
  }

  /**
   * Creates a client wrapper that automatically uses the correct schema
   */
  private createSchemaAwareClient(client: SupabaseClient<any, any, any>, tenantId: string): SupabaseClient<any, any, any> {
    const schemaName = `crmx_database_${tenantId}`;
    
    // Create a proxy that intercepts .from() calls and adds schema prefix
    return new Proxy(client, {
      get(target, prop) {
        if (prop === 'from') {
          return (tableName: string) => {
            console.log(`🔍 [TENANT DEBUG] Intercepting query for table: ${tableName}`);
            console.log(`🔍 [TENANT DEBUG] Using schema: ${schemaName}`);
            console.log(`🔍 [TENANT DEBUG] Full table reference: ${schemaName}.${tableName}`);
            
            // Use the schema-qualified table name (without extra quotes)
            const result = target.from(`${schemaName}.${tableName}`);
            console.log(`🔍 [TENANT DEBUG] Query builder created for: ${schemaName}.${tableName}`);
            return result;
          };
        }
        return target[prop as keyof typeof target];
      }
    });
  }

  /**
   * Executes raw SQL in tenant context with schema-qualified queries
   */
  async executeRawSQL(tenantId: string, sql: string, params?: any[]): Promise<any> {
    const schemaName = `crmx_database_${tenantId}`;
    
    // Replace table references with schema-qualified names
    const schemaQualifiedSQL = sql.replace(
      /FROM\s+(\w+)/gi, 
      `FROM "${schemaName}"."$1"`
    ).replace(
      /JOIN\s+(\w+)/gi, 
      `JOIN "${schemaName}"."$1"`
    ).replace(
      /UPDATE\s+(\w+)/gi, 
      `UPDATE "${schemaName}"."$1"`
    ).replace(
      /INSERT\s+INTO\s+(\w+)/gi, 
      `INSERT INTO "${schemaName}"."$1"`
    ).replace(
      /DELETE\s+FROM\s+(\w+)/gi, 
      `DELETE FROM "${schemaName}"."$1"`
    );
    
    // Execute the SQL using a custom RPC function (if available)
    try {
      const { data, error } = await supabaseAdmin.rpc('execute_sql', {
        sql: schemaQualifiedSQL,
        params: params || []
      });
      
      if (error) {
        throw new Error(`SQL execution failed: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.warn('Raw SQL execution not available, using regular queries');
      throw new Error('Raw SQL execution not supported in this configuration');
    }
  }

  /**
   * Clears cached clients (useful for cleanup)
   */
  clearCache(): void {
    this.tenantClients.clear();
  }

  /**
   * Removes a specific tenant client from cache
   */
  clearTenantCache(tenantId: string): void {
    this.tenantClients.delete(tenantId);
  }
}

// Default instance
export const simpleTenantDb = new SimpleTenantDatabase();

/**
 * Convenience function to get a tenant client
 */
export function getTenantClient(tenantId: string): SupabaseClient<any, any, any> {
  return simpleTenantDb.getTenantClient(tenantId);
}

/**
 * Convenience function to execute operations in tenant context
 */
export async function executeInTenantContext<T>(
  tenantId: string,
  operation: (client: SupabaseClient<any, any, any>) => Promise<T>
): Promise<T> {
  return simpleTenantDb.executeInTenantSchema(tenantId, operation);
}

/**
 * Convenience function for raw SQL execution
 */
export async function executeTenantSQL(
  tenantId: string, 
  sql: string, 
  params?: any[]
): Promise<any> {
  return simpleTenantDb.executeRawSQL(tenantId, sql, params);
}