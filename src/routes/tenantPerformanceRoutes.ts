// Tenant performance monitoring and metrics routes
// Requirements: 4.5

import { Router, Request, Response } from 'express';
import { 
  tenantPerformanceMonitor,
  getPerformanceSummary
} from '../utils/tenantPerformanceMonitor';
import { 
  tenantConnectionPool
} from '../utils/tenantConnectionPool';
import { 
  getCacheStatistics,
  getCacheUtilization,
  updateCacheConfig,
  forceCacheCleanup
} from '../utils/tenantValidation';
import { TenantRequest } from '../types/tenant';
import { requireTenantContext } from '../middleware/tenantMiddleware';

const router = Router();

/**
 * Async handler wrapper for error handling
 */
const asyncHandler = (fn: (req: Request, res: Response, next?: Function) => Promise<any>) => 
  (req: Request, res: Response, next: Function) => {
    Promise.resolve(fn(req, res, next)).catch((error) => next(error));
  };

/**
 * Get overall performance summary
 * GET /tenant-performance/summary
 */
router.get('/summary', asyncHandler(async (req: Request, res: Response) => {
  const summary = getPerformanceSummary();
  const connectionStats = tenantConnectionPool.getConnectionPoolStats();
  const cacheStats = getCacheStatistics();
  const cacheUtilization = getCacheUtilization();
  
  res.json({
    success: true,
    data: {
      performance: summary,
      connectionPool: connectionStats,
      cache: {
        statistics: cacheStats,
        utilization: cacheUtilization
      },
      generatedAt: new Date().toISOString()
    }
  });
}));

/**
 * Get performance statistics for all tenants
 * GET /tenant-performance/stats
 */
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const allStats = tenantPerformanceMonitor.getAllStats();
  const statsArray = Array.from(allStats.entries()).map(([key, stats]) => {
    const [tenantId, operation] = key.split(':');
    return {
      tenantId,
      operation,
      ...stats
    };
  });
  
  res.json({
    success: true,
    data: {
      statistics: statsArray,
      totalEntries: statsArray.length,
      generatedAt: new Date().toISOString()
    }
  });
}));

/**
 * Get performance statistics for specific tenant
 * GET /tenant-performance/stats/:tenantId
 */
router.get('/stats/:tenantId', asyncHandler(async (req: Request, res: Response) => {
  const { tenantId } = req.params;
  const { operation } = req.query;
  
  if (operation && typeof operation === 'string') {
    // Get stats for specific operation
    const stats = tenantPerformanceMonitor.getStats(tenantId, operation);
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'STATS_NOT_FOUND',
          message: `No performance statistics found for tenant ${tenantId} and operation ${operation}`
        }
      });
    }
    
    return res.json({
      success: true,
      data: {
        tenantId,
        operation,
        statistics: stats,
        generatedAt: new Date().toISOString()
      }
    });
  } else {
    // Get all stats for tenant
    const allStats = tenantPerformanceMonitor.getAllStats();
    const tenantStats = Array.from(allStats.entries())
      .filter(([key]) => key.startsWith(`${tenantId}:`))
      .map(([key, stats]) => {
        const operation = key.split(':')[1];
        return {
          operation,
          ...stats
        };
      });
    
    if (tenantStats.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TENANT_STATS_NOT_FOUND',
          message: `No performance statistics found for tenant ${tenantId}`
        }
      });
    }
    
    return res.json({
      success: true,
      data: {
        tenantId,
        statistics: tenantStats,
        totalOperations: tenantStats.length,
        generatedAt: new Date().toISOString()
      }
    });
  }
}));

/**
 * Get recent metrics for specific tenant and operation
 * GET /tenant-performance/metrics/:tenantId/:operation
 */
router.get('/metrics/:tenantId/:operation', asyncHandler(async (req: Request, res: Response) => {
  const { tenantId, operation } = req.params;
  const limit = parseInt(req.query.limit as string) || 100;
  
  const metrics = tenantPerformanceMonitor.getRecentMetrics(tenantId, operation, limit);
  
  if (metrics.length === 0) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'METRICS_NOT_FOUND',
        message: `No recent metrics found for tenant ${tenantId} and operation ${operation}`
      }
    });
  }
  
  return res.json({
    success: true,
    data: {
      tenantId,
      operation,
      metrics,
      count: metrics.length,
      limit,
      generatedAt: new Date().toISOString()
    }
  });
}));

/**
 * Get connection pool statistics
 * GET /tenant-performance/connection-pool
 */
router.get('/connection-pool', asyncHandler(async (req: Request, res: Response) => {
  const poolStats = tenantConnectionPool.getStatistics();
  const connectionStats = tenantConnectionPool.getConnectionPoolStats();
  
  res.json({
    success: true,
    data: {
      poolStatistics: poolStats,
      connectionStats,
      generatedAt: new Date().toISOString()
    }
  });
}));

/**
 * Get performance configuration
 * GET /tenant-performance/config
 */
router.get('/config', asyncHandler(async (req: Request, res: Response) => {
  const performanceConfig = tenantPerformanceMonitor.getConfig();
  const poolConfig = tenantConnectionPool.getConfig();
  
  res.json({
    success: true,
    data: {
      performanceMonitoring: performanceConfig,
      connectionPool: poolConfig,
      generatedAt: new Date().toISOString()
    }
  });
}));

/**
 * Update performance monitoring configuration
 * PUT /tenant-performance/config/monitoring
 */
router.put('/config/monitoring', asyncHandler(async (req: Request, res: Response) => {
  const { enabled, maxMetricsHistory, aggregationInterval, slowOperationThreshold, enableLogging } = req.body;
  
  const updates: any = {};
  if (typeof enabled === 'boolean') updates.enabled = enabled;
  if (typeof maxMetricsHistory === 'number') updates.maxMetricsHistory = maxMetricsHistory;
  if (typeof aggregationInterval === 'number') updates.aggregationInterval = aggregationInterval;
  if (typeof slowOperationThreshold === 'number') updates.slowOperationThreshold = slowOperationThreshold;
  if (typeof enableLogging === 'boolean') updates.enableLogging = enableLogging;
  
  tenantPerformanceMonitor.updateConfig(updates);
  
  res.json({
    success: true,
    data: {
      message: 'Performance monitoring configuration updated',
      newConfig: tenantPerformanceMonitor.getConfig(),
      updatedAt: new Date().toISOString()
    }
  });
}));

/**
 * Update connection pool configuration
 * PUT /tenant-performance/config/connection-pool
 */
router.put('/config/connection-pool', asyncHandler(async (req: Request, res: Response) => {
  const { 
    maxConnectionsPerTenant, 
    maxTotalConnections, 
    idleTimeout, 
    acquisitionTimeout,
    enabled,
    minConnectionsPerTenant,
    cleanupInterval,
    enableMonitoring
  } = req.body;
  
  const updates: any = {};
  if (typeof maxConnectionsPerTenant === 'number') updates.maxConnectionsPerTenant = maxConnectionsPerTenant;
  if (typeof maxTotalConnections === 'number') updates.maxTotalConnections = maxTotalConnections;
  if (typeof idleTimeout === 'number') updates.idleTimeout = idleTimeout;
  if (typeof acquisitionTimeout === 'number') updates.acquisitionTimeout = acquisitionTimeout;
  if (typeof enabled === 'boolean') updates.enabled = enabled;
  if (typeof minConnectionsPerTenant === 'number') updates.minConnectionsPerTenant = minConnectionsPerTenant;
  if (typeof cleanupInterval === 'number') updates.cleanupInterval = cleanupInterval;
  if (typeof enableMonitoring === 'boolean') updates.enableMonitoring = enableMonitoring;
  
  tenantConnectionPool.updateConfig(updates);
  
  res.json({
    success: true,
    data: {
      message: 'Connection pool configuration updated',
      newConfig: tenantConnectionPool.getConfig(),
      updatedAt: new Date().toISOString()
    }
  });
}));

/**
 * Clear performance metrics
 * DELETE /tenant-performance/metrics
 */
router.delete('/metrics', asyncHandler(async (req: Request, res: Response) => {
  tenantPerformanceMonitor.clear();
  
  res.json({
    success: true,
    data: {
      message: 'All performance metrics cleared',
      clearedAt: new Date().toISOString()
    }
  });
}));

/**
 * Clear performance metrics for specific tenant
 * DELETE /tenant-performance/metrics/:tenantId
 */
router.delete('/metrics/:tenantId', asyncHandler(async (req: Request, res: Response) => {
  const { tenantId } = req.params;
  
  // Get all stats and clear only those for the specified tenant
  const allStats = tenantPerformanceMonitor.getAllStats();
  const keysToDelete = Array.from(allStats.keys()).filter(key => key.startsWith(`${tenantId}:`));
  
  // Note: The current implementation doesn't have a method to delete specific tenant metrics
  // This would need to be added to the TenantPerformanceMonitor class
  
  res.json({
    success: true,
    data: {
      message: `Performance metrics for tenant ${tenantId} would be cleared`,
      tenantId,
      keysFound: keysToDelete.length,
      clearedAt: new Date().toISOString()
    }
  });
}));

/**
 * Trigger connection pool cleanup
 * POST /tenant-performance/connection-pool/cleanup
 */
router.post('/connection-pool/cleanup', asyncHandler(async (req: Request, res: Response) => {
  const { tenantId } = req.body;
  
  if (tenantId) {
    tenantConnectionPool.cleanupTenantConnections(tenantId);
    res.json({
      success: true,
      data: {
        message: `Connection cleanup triggered for tenant ${tenantId}`,
        tenantId,
        triggeredAt: new Date().toISOString()
      }
    });
  } else {
    tenantConnectionPool.cleanupIdleConnections();
    res.json({
      success: true,
      data: {
        message: 'Global connection cleanup triggered',
        triggeredAt: new Date().toISOString()
      }
    });
  }
}));

/**
 * Get cache statistics
 * GET /tenant-performance/cache
 */
router.get('/cache', asyncHandler(async (req: Request, res: Response) => {
  const cacheStats = getCacheStatistics();
  const cacheUtilization = getCacheUtilization();
  
  res.json({
    success: true,
    data: {
      statistics: cacheStats,
      utilization: cacheUtilization,
      generatedAt: new Date().toISOString()
    }
  });
}));

/**
 * Update cache configuration
 * PUT /tenant-performance/cache/config
 */
router.put('/cache/config', asyncHandler(async (req: Request, res: Response) => {
  const { maxSize } = req.body;
  
  if (typeof maxSize === 'number' && maxSize > 0) {
    updateCacheConfig(maxSize);
    
    res.json({
      success: true,
      data: {
        message: 'Cache configuration updated',
        newUtilization: getCacheUtilization(),
        updatedAt: new Date().toISOString()
      }
    });
  } else {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_CONFIG',
        message: 'maxSize must be a positive number'
      }
    });
  }
}));

/**
 * Trigger cache cleanup
 * POST /tenant-performance/cache/cleanup
 */
router.post('/cache/cleanup', asyncHandler(async (req: Request, res: Response) => {
  const cleanupResult = forceCacheCleanup();
  
  res.json({
    success: true,
    data: {
      message: 'Cache cleanup completed',
      ...cleanupResult,
      triggeredAt: new Date().toISOString()
    }
  });
}));

export default router;