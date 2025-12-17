// Simplified tenant middleware - assumes schemas exist and are managed manually
// No validation or creation - just connects to the tenant schema

import { Request, Response, NextFunction } from 'express';
import { TenantRequest, TenantContext } from '../types/tenant';
import { logger } from '../utils/logger';

/**
 * Simplified tenant middleware that just extracts tenant ID and sets context
 * Assumes all schemas exist and are properly configured
 */
export function simpleTenantMiddleware(
  req: TenantRequest, 
  res: Response, 
  next: NextFunction
): void {
  try {
    // Extract tenant ID from header
    let tenantHeader = req.headers['tenant'] as string;
    tenantHeader
    
    if (!tenantHeader) {
      res.status(400).json({
        message: 'Tenant header is required',
        status: 400,
        tenant: 'unknown'
      });
      return;
    }

    const tenantId = tenantHeader.trim();
    
    if (!tenantId) {
      res.status(400).json({
        message: 'Tenant ID cannot be empty',
        status: 400,
        tenant: 'unknown'
      });
      return;
    }

    // Basic validation - only alphanumeric and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(tenantId)) {
      res.status(400).json({
        message: 'Invalid tenant ID format',
        status: 400,
        tenant: tenantId
      });
      return;
    }

    // Create tenant context - assumes schema exists
    const schemaName = `crmx_database_${tenantId}`;
    const tenantContext: TenantContext = {
      tenantId,
      schemaName,
      isValidated: true,
      createdAt: new Date()
    };

    // Set tenant context in request
    req.tenant = tenantContext;

    logger.info('TENANT', `Tenant context set for: ${tenantId}`, {
      tenantId,
      schemaName,
      requestId: (req as any).requestId
    });

    next();

  } catch (error) {
    logger.error('TENANT', 'Failed to process tenant middleware', error as Error, {
      tenantId: req.tenant?.tenantId || 'unknown',
      requestId: (req as any).requestId
    });

    res.status(500).json({
      message: 'Internal server error processing tenant',
      status: 500,
      tenant: req.tenant?.tenantId || 'unknown'
    });
  }
}

/**
 * Middleware to require valid tenant context (use after simpleTenantMiddleware)
 */
export function requireTenantContext(
  req: TenantRequest, 
  res: Response, 
  next: NextFunction
): void {
  if (!req.tenant || !req.tenant.isValidated) {
    res.status(400).json({
      message: 'Valid tenant context is required for this operation',
      status: 400,
      tenant: req.tenant?.tenantId || 'unknown'
    });
    return;
  }
  
  next();
}

/**
 * Cleanup middleware - simplified version
 */
export function simpleTenantCleanup(
  req: TenantRequest, 
  res: Response, 
  next: NextFunction
): void {
  // Simple cleanup - just clear the tenant context
  if (req.tenant) {
    logger.debug('TENANT', `Cleaning up tenant context for: ${req.tenant.tenantId}`);
    req.tenant = undefined;
  }
  
  next();
}