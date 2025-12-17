// Performance monitoring system for multi-tenant operations
// Requirements: 4.5

import { tenantLogger } from './tenantLogger';
import { TenantContext } from '../types/tenant';

/**
 * Performance metrics for tenant operations
 */
export interface TenantPerformanceMetrics {
  /** Operation name */
  operation: string;
  /** Tenant ID */
  tenantId: string;
  /** Operation duration in milliseconds */
  duration: number;
  /** Timestamp when operation started */
  startTime: Date;
  /** Timestamp when operation completed */
  endTime: Date;
  /** Whether operation was successful */
  success: boolean;
  /** Cache hit/miss information */
  cacheHit?: boolean;
  /** Database connection pool information */
  connectionPoolStats?: ConnectionPoolStats;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Connection pool statistics
 */
export interface ConnectionPoolStats {
  /** Total connections in pool */
  totalConnections: number;
  /** Active connections */
  activeConnections: number;
  /** Idle connections */
  idleConnections: number;
  /** Waiting requests */
  waitingRequests: number;
  /** Pool utilization percentage */
  utilization: number;
}

/**
 * Aggregated performance statistics
 */
export interface TenantPerformanceStats {
  /** Total operations */
  totalOperations: number;
  /** Average duration */
  averageDuration: number;
  /** Minimum duration */
  minDuration: number;
  /** Maximum duration */
  maxDuration: number;
  /** Success rate percentage */
  successRate: number;
  /** Cache hit rate percentage */
  cacheHitRate: number;
  /** Operations per second */
  operationsPerSecond: number;
  /** Last updated timestamp */
  lastUpdated: Date;
}

/**
 * Performance monitoring configuration
 */
export interface PerformanceMonitorConfig {
  /** Whether to enable performance monitoring */
  enabled: boolean;
  /** Maximum number of metrics to keep in memory */
  maxMetricsHistory: number;
  /** Interval for aggregating statistics (ms) */
  aggregationInterval: number;
  /** Threshold for slow operation warnings (ms) */
  slowOperationThreshold: number;
  /** Whether to log performance metrics */
  enableLogging: boolean;
}

/**
 * Default performance monitor configuration
 */
export const DEFAULT_PERFORMANCE_CONFIG: PerformanceMonitorConfig = {
  enabled: true,
  maxMetricsHistory: 1000,
  aggregationInterval: 60000, // 1 minute
  slowOperationThreshold: 1000, // 1 second
  enableLogging: true
};

/**
 * Tenant performance monitor class
 */
export class TenantPerformanceMonitor {
  private config: PerformanceMonitorConfig;
  private metrics: Map<string, TenantPerformanceMetrics[]> = new Map();
  private aggregatedStats: Map<string, TenantPerformanceStats> = new Map();
  private connectionPoolStats: ConnectionPoolStats | null = null;
  private aggregationTimer: NodeJS.Timeout | null = null;

  constructor(config: PerformanceMonitorConfig = DEFAULT_PERFORMANCE_CONFIG) {
    this.config = { ...config };
    
    if (this.config.enabled) {
      this.startAggregation();
    }
  }

  /**
   * Records a performance metric for a tenant operation
   */
  recordMetric(metric: TenantPerformanceMetrics): void {
    if (!this.config.enabled) {
      return;
    }

    const key = `${metric.tenantId}:${metric.operation}`;
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const metrics = this.metrics.get(key)!;
    metrics.push(metric);

    // Maintain maximum history size
    if (metrics.length > this.config.maxMetricsHistory) {
      metrics.shift();
    }

    // Log slow operations
    if (this.config.enableLogging && metric.duration > this.config.slowOperationThreshold) {
      tenantLogger.logPerformanceMetric(
        metric.operation,
        metric.tenantId,
        metric.duration,
        undefined,
        {
          slow: true,
          cacheHit: metric.cacheHit,
          connectionPoolStats: metric.connectionPoolStats
        }
      );
    }
  }

  /**
   * Creates a performance wrapper for tenant operations
   */
  wrapOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    tenantId: string,
    metadata?: Record<string, any>
  ): Promise<T> {
    if (!this.config.enabled) {
      return operation();
    }

    const startTime = new Date();
    const startTimestamp = Date.now();

    return operation()
      .then(result => {
        const endTime = new Date();
        const duration = Date.now() - startTimestamp;

        this.recordMetric({
          operation: operationName,
          tenantId,
          duration,
          startTime,
          endTime,
          success: true,
          connectionPoolStats: this.connectionPoolStats || undefined,
          metadata
        });

        return result;
      })
      .catch(error => {
        const endTime = new Date();
        const duration = Date.now() - startTimestamp;

        this.recordMetric({
          operation: operationName,
          tenantId,
          duration,
          startTime,
          endTime,
          success: false,
          connectionPoolStats: this.connectionPoolStats || undefined,
          metadata: { ...metadata, error: error.message }
        });

        throw error;
      });
  }

  /**
   * Updates connection pool statistics
   */
  updateConnectionPoolStats(stats: ConnectionPoolStats): void {
    this.connectionPoolStats = stats;
  }

  /**
   * Gets performance statistics for a specific tenant and operation
   */
  getStats(tenantId: string, operation?: string): TenantPerformanceStats | null {
    const key = operation ? `${tenantId}:${operation}` : tenantId;
    return this.aggregatedStats.get(key) || null;
  }

  /**
   * Gets all performance statistics
   */
  getAllStats(): Map<string, TenantPerformanceStats> {
    return new Map(this.aggregatedStats);
  }

  /**
   * Gets recent metrics for a tenant and operation
   */
  getRecentMetrics(tenantId: string, operation: string, limit: number = 100): TenantPerformanceMetrics[] {
    const key = `${tenantId}:${operation}`;
    const metrics = this.metrics.get(key) || [];
    return metrics.slice(-limit);
  }

  /**
   * Clears all metrics and statistics
   */
  clear(): void {
    this.metrics.clear();
    this.aggregatedStats.clear();
  }

  /**
   * Gets current configuration
   */
  getConfig(): PerformanceMonitorConfig {
    return { ...this.config };
  }

  /**
   * Updates configuration
   */
  updateConfig(newConfig: Partial<PerformanceMonitorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.enabled && !this.aggregationTimer) {
      this.startAggregation();
    } else if (!this.config.enabled && this.aggregationTimer) {
      this.stopAggregation();
    }
  }

  /**
   * Starts the aggregation timer
   */
  private startAggregation(): void {
    if (this.aggregationTimer) {
      return;
    }

    this.aggregationTimer = setInterval(() => {
      this.aggregateStatistics();
    }, this.config.aggregationInterval);
  }

  /**
   * Stops the aggregation timer
   */
  private stopAggregation(): void {
    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer);
      this.aggregationTimer = null;
    }
  }

  /**
   * Aggregates performance statistics
   */
  private aggregateStatistics(): void {
    const now = new Date();

    for (const [key, metrics] of this.metrics) {
      if (metrics.length === 0) {
        continue;
      }

      const durations = metrics.map(m => m.duration);
      const successCount = metrics.filter(m => m.success).length;
      const cacheHits = metrics.filter(m => m.cacheHit === true).length;
      const cacheTotal = metrics.filter(m => m.cacheHit !== undefined).length;

      // Calculate time window for operations per second
      const oldestMetric = metrics[0];
      const newestMetric = metrics[metrics.length - 1];
      const timeWindowSeconds = (newestMetric.endTime.getTime() - oldestMetric.startTime.getTime()) / 1000;

      const stats: TenantPerformanceStats = {
        totalOperations: metrics.length,
        averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        successRate: (successCount / metrics.length) * 100,
        cacheHitRate: cacheTotal > 0 ? (cacheHits / cacheTotal) * 100 : 0,
        operationsPerSecond: timeWindowSeconds > 0 ? metrics.length / timeWindowSeconds : 0,
        lastUpdated: now
      };

      this.aggregatedStats.set(key, stats);
    }
  }

  /**
   * Cleanup method to be called on shutdown
   */
  shutdown(): void {
    this.stopAggregation();
    this.clear();
  }
}

/**
 * Global performance monitor instance
 */
export const tenantPerformanceMonitor = new TenantPerformanceMonitor();

/**
 * Convenience function to wrap operations with performance monitoring
 */
export function withPerformanceMonitoring<T>(
  operation: () => Promise<T>,
  operationName: string,
  tenantId: string,
  metadata?: Record<string, any>
): Promise<T> {
  return tenantPerformanceMonitor.wrapOperation(operation, operationName, tenantId, metadata);
}

/**
 * Convenience function to record cache hit/miss
 */
export function recordCacheMetric(
  operationName: string,
  tenantId: string,
  duration: number,
  cacheHit: boolean,
  metadata?: Record<string, any>
): void {
  const now = new Date();
  tenantPerformanceMonitor.recordMetric({
    operation: operationName,
    tenantId,
    duration,
    startTime: new Date(now.getTime() - duration),
    endTime: now,
    success: true,
    cacheHit,
    metadata
  });
}

/**
 * Gets performance summary for all tenants
 */
export function getPerformanceSummary(): {
  totalTenants: number;
  totalOperations: number;
  averageResponseTime: number;
  overallCacheHitRate: number;
  slowOperations: number;
} {
  const allStats = tenantPerformanceMonitor.getAllStats();
  
  if (allStats.size === 0) {
    return {
      totalTenants: 0,
      totalOperations: 0,
      averageResponseTime: 0,
      overallCacheHitRate: 0,
      slowOperations: 0
    };
  }

  const statsArray = Array.from(allStats.values());
  const totalOperations = statsArray.reduce((sum, stats) => sum + stats.totalOperations, 0);
  const totalDuration = statsArray.reduce((sum, stats) => sum + (stats.averageDuration * stats.totalOperations), 0);
  const totalCacheOperations = statsArray.reduce((sum, stats) => {
    return sum + (stats.totalOperations * (stats.cacheHitRate / 100));
  }, 0);

  const config = tenantPerformanceMonitor.getConfig();
  const slowOperations = statsArray.reduce((sum, stats) => {
    return sum + (stats.maxDuration > config.slowOperationThreshold ? 1 : 0);
  }, 0);

  return {
    totalTenants: new Set(Array.from(allStats.keys()).map(key => key.split(':')[0])).size,
    totalOperations,
    averageResponseTime: totalOperations > 0 ? totalDuration / totalOperations : 0,
    overallCacheHitRate: totalOperations > 0 ? (totalCacheOperations / totalOperations) * 100 : 0,
    slowOperations
  };
}