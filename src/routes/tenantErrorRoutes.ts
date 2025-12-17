// Tenant error monitoring and management routes
// Requirements: 1.1, 1.2, 1.4, 2.3, 4.3

import { Router, Request, Response } from 'express';
import { 
  tenantErrorMetrics,
  tenantErrorMonitor,
  TenantErrorHandler
} from '../middleware/tenantErrorHandler';
import { TenantRequest } from '../types/tenant';
import { requireTenantContext } from '../middleware/tenantMiddleware';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * Get tenant error metrics
 * GET /tenant-errors/metrics
 */
router.get('/metrics', asyncHandler(async (req: Request, res: Response) => {
  const metrics = tenantErrorMetrics.getMetrics();
  
  res.json({
    success: true,
    data: {
      ...metrics,
      generatedAt: new Date().toISOString()
    }
  });
}));

/**
 * Get tenant error metrics for specific tenant
 * GET /tenant-errors/metrics/:tenantId
 */
router.get('/metrics/:tenantId', requireTenantContext, asyncHandler(async (req: TenantRequest, res: Response) => {
  const { tenantId } = req.params;
  
  // Verify tenant matches request context
  if (req.tenant?.tenantId !== tenantId) {
    res.status(403).json({
      success: false,
      error: {
        code: 'TENANT_MISMATCH',
        message: 'Cannot access metrics for different tenant'
      }
    });
    return;
  }
  
  const allMetrics = tenantErrorMetrics.getMetrics();
  
  // Filter metrics for specific tenant
  const tenantMetrics = Object.entries(allMetrics.errorsByTenant)
    .filter(([key]) => key.startsWith(`${tenantId}:`))
    .reduce((acc, [key, value]) => {
      const errorCode = key.split(':')[1];
      acc[errorCode] = value as number;
      return acc;
    }, {} as Record<string, number>);
  
  res.json({
    success: true,
    data: {
      tenantId,
      errorsByCode: tenantMetrics,
      totalErrors: Object.values(tenantMetrics).reduce((sum, count) => sum + count, 0),
      generatedAt: new Date().toISOString()
    }
  });
}));

/**
 * Reset tenant error metrics
 * POST /tenant-errors/metrics/reset
 */
router.post('/metrics/reset', asyncHandler(async (req: Request, res: Response) => {
  // This endpoint should be protected in production
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({
      success: false,
      error: {
        code: 'OPERATION_NOT_ALLOWED',
        message: 'Metrics reset not allowed in production'
      }
    });
    return;
  }
  
  tenantErrorMetrics.reset();
  
  res.json({
    success: true,
    message: 'Tenant error metrics reset successfully',
    resetAt: new Date().toISOString()
  });
}));

/**
 * Get tenant error handler configuration
 * GET /tenant-errors/config
 */
router.get('/config', asyncHandler(async (req: Request, res: Response) => {
  // This endpoint should be protected in production
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({
      success: false,
      error: {
        code: 'OPERATION_NOT_ALLOWED',
        message: 'Configuration access not allowed in production'
      }
    });
    return;
  }
  
  // Create a temporary handler to get default config
  const handler = new TenantErrorHandler();
  const config = handler.getConfig();
  
  res.json({
    success: true,
    data: config
  });
}));

/**
 * Health check for tenant error handling system
 * GET /tenant-errors/health
 */
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  const metrics = tenantErrorMetrics.getMetrics();
  const totalErrors = metrics.totalErrors;
  const criticalErrors = Object.entries(metrics.errorsByCode)
    .filter(([code]) => [
      'DATABASE_UNAVAILABLE',
      'SCHEMA_CREATION_FAILED',
      'SCHEMA_MIGRATION_FAILED'
    ].includes(code))
    .reduce((sum, [, count]) => sum + (count as number), 0);
  
  const healthStatus = criticalErrors > 10 ? 'unhealthy' : 
                      criticalErrors > 5 ? 'degraded' : 'healthy';
  
  const statusCode = healthStatus === 'unhealthy' ? 503 : 
                    healthStatus === 'degraded' ? 200 : 200;
  
  res.status(statusCode).json({
    success: true,
    data: {
      status: healthStatus,
      totalErrors,
      criticalErrors,
      periodStart: metrics.periodStart,
      periodDuration: metrics.periodDuration,
      checkedAt: new Date().toISOString()
    }
  });
}));

/**
 * Get error patterns and analysis
 * GET /tenant-errors/analysis
 */
router.get('/analysis', asyncHandler(async (req: Request, res: Response) => {
  const metrics = tenantErrorMetrics.getMetrics();
  
  // Analyze error patterns
  const errorsByCode = metrics.errorsByCode;
  const errorsByTenant = metrics.errorsByTenant;
  
  // Find most common errors
  const mostCommonErrors = Object.entries(errorsByCode)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([code, count]) => ({ code, count }));
  
  // Find tenants with most errors
  const tenantErrorCounts = Object.entries(errorsByTenant)
    .reduce((acc, [key, count]) => {
      const tenantId = key.split(':')[0];
      acc[tenantId] = (acc[tenantId] || 0) + (count as number);
      return acc;
    }, {} as Record<string, number>);
  
  const tenantsWithMostErrors = Object.entries(tenantErrorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([tenantId, count]) => ({ tenantId, count }));
  
  // Calculate error rates
  const periodDurationHours = metrics.periodDuration / (1000 * 60 * 60);
  const errorRate = periodDurationHours > 0 ? metrics.totalErrors / periodDurationHours : 0;
  
  res.json({
    success: true,
    data: {
      summary: {
        totalErrors: metrics.totalErrors,
        errorRate: Math.round(errorRate * 100) / 100, // errors per hour
        periodDurationHours: Math.round(periodDurationHours * 100) / 100
      },
      mostCommonErrors,
      tenantsWithMostErrors,
      recommendations: generateRecommendations(errorsByCode),
      analyzedAt: new Date().toISOString()
    }
  });
}));

/**
 * Generate recommendations based on error patterns
 */
function generateRecommendations(errorsByCode: Record<string, number>): string[] {
  const recommendations: string[] = [];
  
  // Check for high database connectivity errors
  const dbErrors = (errorsByCode['DATABASE_UNAVAILABLE'] || 0) + 
                  (errorsByCode['DATABASE_CONNECTION_TIMEOUT'] || 0) + 
                  (errorsByCode['DATABASE_CONNECTION_FAILED'] || 0);
  
  if (dbErrors > 10) {
    recommendations.push('High database connectivity errors detected. Check database health and connection pool configuration.');
  }
  
  // Check for high header validation errors
  const headerErrors = (errorsByCode['TENANT_HEADER_MISSING'] || 0) + 
                      (errorsByCode['TENANT_HEADER_EMPTY'] || 0) + 
                      (errorsByCode['TENANT_FORMAT_INVALID'] || 0);
  
  if (headerErrors > 20) {
    recommendations.push('High tenant header validation errors. Consider improving client-side validation or API documentation.');
  }
  
  // Check for schema creation failures
  const schemaErrors = (errorsByCode['SCHEMA_CREATION_FAILED'] || 0) + 
                      (errorsByCode['SCHEMA_MIGRATION_FAILED'] || 0);
  
  if (schemaErrors > 5) {
    recommendations.push('Schema creation/migration failures detected. Review database permissions and migration scripts.');
  }
  
  // Check for concurrency issues
  const concurrencyErrors = (errorsByCode['SCHEMA_CREATION_CONFLICT'] || 0) + 
                           (errorsByCode['CONCURRENT_OPERATION_FAILED'] || 0);
  
  if (concurrencyErrors > 3) {
    recommendations.push('Concurrency conflicts detected. Consider implementing better locking mechanisms or retry logic.');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('No significant error patterns detected. System appears to be operating normally.');
  }
  
  return recommendations;
}

export default router;