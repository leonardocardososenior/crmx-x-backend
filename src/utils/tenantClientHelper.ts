// Helper utilities for getting tenant-aware Supabase clients from request context
// Requirements: 3.1, 3.2, 3.4, 3.5

import { TenantRequest } from '../types/tenant';
import { 
  TenantAwareSupabaseClient,
  createTenantClient,
  createAdminTenantClient
} from './tenantAwareSupabaseClient';
import { supabase, supabaseAdmin } from '../supabaseClient';

/**
 * Gets a tenant-aware Supabase client from the request context
 * Requirements: 3.1, 3.2, 3.4
 */
export function getTenantClient(req: TenantRequest): TenantAwareSupabaseClient {
  if (!req.tenant || !req.tenant.isValidated) {
    throw new Error('Valid tenant context is required. Ensure tenant middleware is properly configured.');
  }

  return createTenantClient(req.tenant.tenantId);
}

/**
 * Gets a tenant-aware admin Supabase client from the request context
 * Requirements: 3.1, 3.2, 3.4
 */
export function getTenantAdminClient(req: TenantRequest): TenantAwareSupabaseClient {
  if (!req.tenant || !req.tenant.isValidated) {
    throw new Error('Valid tenant context is required. Ensure tenant middleware is properly configured.');
  }

  return createAdminTenantClient(req.tenant.tenantId);
}

/**
 * Executes a database operation using the tenant-aware client
 * Requirements: 3.1, 3.4, 3.5
 */
export async function executeWithTenantClient<T>(
  req: TenantRequest,
  operation: (client: TenantAwareSupabaseClient) => Promise<T>
): Promise<T> {
  const client = getTenantClient(req);
  return client.executeInTenantContext(operation, (req as any).requestId)
    .then(result => {
      if (!result.success) {
        throw new Error(result.error?.message || 'Tenant operation failed');
      }
      return result.data!;
    });
}

/**
 * Executes a database operation using the tenant-aware admin client
 * Requirements: 3.1, 3.4, 3.5
 */
export async function executeWithTenantAdminClient<T>(
  req: TenantRequest,
  operation: (client: TenantAwareSupabaseClient) => Promise<T>
): Promise<T> {
  const client = getTenantAdminClient(req);
  return client.executeInTenantContext(operation, (req as any).requestId)
    .then(result => {
      if (!result.success) {
        throw new Error(result.error?.message || 'Tenant admin operation failed');
      }
      return result.data!;
    });
}

/**
 * Gets the tenant ID from the request context
 */
export function getTenantId(req: TenantRequest): string {
  if (!req.tenant || !req.tenant.isValidated) {
    throw new Error('Valid tenant context is required. Ensure tenant middleware is properly configured.');
  }

  return req.tenant.tenantId;
}

/**
 * Gets the tenant schema name from the request context
 */
export function getTenantSchemaName(req: TenantRequest): string {
  if (!req.tenant || !req.tenant.isValidated) {
    throw new Error('Valid tenant context is required. Ensure tenant middleware is properly configured.');
  }

  return req.tenant.schemaName;
}

/**
 * Checks if the request has a valid tenant context
 */
export function hasTenantContext(req: TenantRequest): boolean {
  return !!(req.tenant && req.tenant.isValidated);
}

/**
 * Legacy compatibility function - returns tenant-aware admin client
 * This allows existing code using supabaseAdmin to work with minimal changes
 * Requirements: 3.1, 3.2, 3.4
 */
export function getSupabaseAdmin(req: TenantRequest): TenantAwareSupabaseClient {
  return getTenantAdminClient(req);
}

/**
 * Legacy compatibility function - returns tenant-aware regular client
 * This allows existing code using supabase to work with minimal changes
 * Requirements: 3.1, 3.2, 3.4
 */
export function getSupabase(req: TenantRequest): TenantAwareSupabaseClient {
  return getTenantClient(req);
}