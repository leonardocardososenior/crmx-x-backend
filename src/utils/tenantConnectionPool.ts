// Connection pooling optimizations for multi-tenant usage
// Requirements: 4.5

import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { supabase, supabaseAdmin } from '../supabaseClient';
import { 
  TenantContext,
  TenantOperationResult,
  DatabaseContextConfig
} from '../types/tenant';
import { 
  TenantErrorFactory
} from '../types/tenantErrors';
import { 
  tenantPerformanceMonitor,
  ConnectionPoolStats
} from './tenantPerformanceMonitor';
import { tenantLogger } from './tenantLogger';

/**
 * Connection pool configuration for multi-tenant usage
 */
export interface TenantConnectionPoolConfig {
  /** Maximum number of connections per tenant */
  maxConnectionsPerTenant: number;
  /** Maximum total connections across all tenants */
  maxTotalConnections: number;
  /** Connection idle timeout in milliseconds */
  idleTimeout: number;
  /** Connection acquisition timeout in milliseconds */
  acquisitionTimeout: number;
  /** Whether to enable connection pooling */
  enabled: boolean;
  /** Minimum connections to maintain per active tenant */
  minConnectionsPerTenant: number;
  /** Interval for cleaning up idle connections (ms) */
  cleanupInterval: number;
  /** Whether to enable connection pool monitoring */
  enableMonitoring: boolean;
}

/**
 * Default connection pool configuration
 */
export const DEFAULT_CONNECTION_POOL_CONFIG: TenantConnectionPoolConfig = {
  maxConnectionsPerTenant: 5,
  maxTotalConnections: 50,
  idleTimeout: 300000, // 5 minutes
  acquisitionTimeout: 30000, // 30 seconds
  enabled: true,
  minConnectionsPerTenant: 1,
  cleanupInterval: 60000, // 1 minute
  enableMonitoring: true
};

/**
 * Connection wrapper with metadata
 */
interface PooledConnection {
  /** The Supabase client instance */
  client: SupabaseClient;
  /** Tenant ID this connection is associated with */
  tenantId: string;
  /** When the connection was created */
  createdAt: Date;
  /** When the connection was last used */
  lastUsedAt: Date;
  /** Whether the connection is currently in use */
  inUse: boolean;
  /** Connection ID for tracking */
  connectionId: string;
  /** Whether this is an admin connection */
  isAdmin: boolean;
}

/**
 * Connection pool statistics
 */
interface PoolStatistics {
  /** Total connections in pool */
  totalConnections: number;
  /** Active connections by tenant */
  activeConnectionsByTenant: Map<string, number>;
  /** Idle connections by tenant */
  idleConnectionsByTenant: Map<string, number>;
  /** Waiting requests */
  waitingRequests: number;
  /** Connection acquisitions per minute */
  acquisitionsPerMinute: number;
  /** Average connection acquisition time */
  averageAcquisitionTime: number;
}

/**
 * Tenant-aware connection pool manager
 */
export class TenantConnectionPool {
  private config: TenantConnectionPoolConfig;
  private connections: Map<string, PooledConnection[]> = new Map();
  private waitingQueue: Array<{
    tenantId: string;
    isAdmin: boolean;
    resolve: (connection: PooledConnection) => void;
    reject: (error: Error) => void;
    requestedAt: Date;
  }> = [];
  private cleanupTimer: NodeJS.Timeout | null = null;
  private statistics: PoolStatistics = {
    totalConnections: 0,
    activeConnectionsByTenant: new Map(),
    idleConnectionsByTenant: new Map(),
    waitingRequests: 0,
    acquisitionsPerMinute: 0,
    averageAcquisitionTime: 0
  };
  private acquisitionTimes: number[] = [];

  constructor(config: TenantConnectionPoolConfig = DEFAULT_CONNECTION_POOL_CONFIG) {
    this.config = { ...config };
    
    if (this.config.enabled) {
      this.startCleanupTimer();
    }
  }

  /**
   * Acquires a connection for a specific tenant
   */
  async acquireConnection(
    tenantId: string,
    isAdmin: boolean = false,
    requestId?: string
  ): Promise<TenantOperationResult<PooledConnection>> {
    if (!this.config.enabled) {
      // Return a new connection without pooling
      const client = isAdmin ? supabaseAdmin : supabase;
      const connection: PooledConnection = {
        client,
        tenantId,
        createdAt: new Date(),
        lastUsedAt: new Date(),
        inUse: true,
        connectionId: this.generateConnectionId(),
        isAdmin
      };
      
      return {
        success: true,
        data: connection
      };
    }

    const startTime = Date.now();

    try {
      // Check if we can get an existing idle connection
      const existingConnection = this.getIdleConnection(tenantId, isAdmin);
      if (existingConnection) {
        existingConnection.inUse = true;
        existingConnection.lastUsedAt = new Date();
        
        const acquisitionTime = Date.now() - startTime;
        this.recordAcquisitionTime(acquisitionTime);
        this.updateStatistics();

        if (this.config.enableMonitoring) {
          tenantPerformanceMonitor.recordMetric({
            operation: 'connection_acquisition',
            tenantId,
            duration: acquisitionTime,
            startTime: new Date(startTime),
            endTime: new Date(),
            success: true,
            cacheHit: true, // Reused existing connection
            metadata: { connectionId: existingConnection.connectionId, isAdmin }
          });
        }

        return {
          success: true,
          data: existingConnection
        };
      }

      // Check if we can create a new connection
      if (this.canCreateNewConnection(tenantId)) {
        const newConnection = await this.createNewConnection(tenantId, isAdmin);
        
        const acquisitionTime = Date.now() - startTime;
        this.recordAcquisitionTime(acquisitionTime);
        this.updateStatistics();

        if (this.config.enableMonitoring) {
          tenantPerformanceMonitor.recordMetric({
            operation: 'connection_acquisition',
            tenantId,
            duration: acquisitionTime,
            startTime: new Date(startTime),
            endTime: new Date(),
            success: true,
            cacheHit: false, // New connection created
            metadata: { connectionId: newConnection.connectionId, isAdmin }
          });
        }

        return {
          success: true,
          data: newConnection
        };
      }

      // Need to wait for an available connection
      return this.waitForConnection(tenantId, isAdmin, startTime, requestId);

    } catch (error) {
      const acquisitionTime = Date.now() - startTime;
      
      if (this.config.enableMonitoring) {
        tenantPerformanceMonitor.recordMetric({
          operation: 'connection_acquisition',
          tenantId,
          duration: acquisitionTime,
          startTime: new Date(startTime),
          endTime: new Date(),
          success: false,
          metadata: { error: error instanceof Error ? error.message : String(error), isAdmin }
        });
      }

      const poolError = TenantErrorFactory.createDatabaseConnectivityError(
        tenantId,
        {
          reason: 'Failed to acquire database connection from pool',
          originalError: error instanceof Error ? error.message : String(error)
        },
        requestId
      );

      return {
        success: false,
        error: {
          code: poolError.code,
          message: poolError.message,
          details: poolError.details
        }
      };
    }
  }

  /**
   * Releases a connection back to the pool
   */
  releaseConnection(connection: PooledConnection): void {
    if (!this.config.enabled) {
      return; // No pooling, nothing to release
    }

    connection.inUse = false;
    connection.lastUsedAt = new Date();

    // Check if there are waiting requests for this tenant
    const waitingIndex = this.waitingQueue.findIndex(
      req => req.tenantId === connection.tenantId && req.isAdmin === connection.isAdmin
    );

    if (waitingIndex !== -1) {
      const waitingRequest = this.waitingQueue.splice(waitingIndex, 1)[0];
      connection.inUse = true;
      connection.lastUsedAt = new Date();
      
      const acquisitionTime = Date.now() - waitingRequest.requestedAt.getTime();
      this.recordAcquisitionTime(acquisitionTime);
      
      waitingRequest.resolve(connection);
    }

    this.updateStatistics();
  }

  /**
   * Gets current pool statistics
   */
  getStatistics(): PoolStatistics {
    this.updateStatistics();
    return { ...this.statistics };
  }

  /**
   * Gets connection pool stats for performance monitoring
   */
  getConnectionPoolStats(): ConnectionPoolStats {
    const stats = this.getStatistics();
    const totalActive = Array.from(stats.activeConnectionsByTenant.values())
      .reduce((sum, count) => sum + count, 0);
    const totalIdle = Array.from(stats.idleConnectionsByTenant.values())
      .reduce((sum, count) => sum + count, 0);

    return {
      totalConnections: stats.totalConnections,
      activeConnections: totalActive,
      idleConnections: totalIdle,
      waitingRequests: stats.waitingRequests,
      utilization: stats.totalConnections > 0 ? (totalActive / stats.totalConnections) * 100 : 0
    };
  }

  /**
   * Cleans up idle connections for a specific tenant
   */
  cleanupTenantConnections(tenantId: string): void {
    const tenantConnections = this.connections.get(tenantId) || [];
    const now = new Date();

    const connectionsToRemove = tenantConnections.filter(conn => {
      const idleTime = now.getTime() - conn.lastUsedAt.getTime();
      return !conn.inUse && idleTime > this.config.idleTimeout;
    });

    if (connectionsToRemove.length > 0) {
      const remainingConnections = tenantConnections.filter(
        conn => !connectionsToRemove.includes(conn)
      );

      if (remainingConnections.length > 0) {
        this.connections.set(tenantId, remainingConnections);
      } else {
        this.connections.delete(tenantId);
      }

      tenantLogger.logPerformanceMetric(
        'connection_cleanup',
        tenantId,
        0,
        undefined,
        { removedConnections: connectionsToRemove.length }
      );
    }
  }

  /**
   * Cleans up all idle connections
   */
  cleanupIdleConnections(): void {
    for (const tenantId of this.connections.keys()) {
      this.cleanupTenantConnections(tenantId);
    }
    this.updateStatistics();
  }

  /**
   * Gets current configuration
   */
  getConfig(): TenantConnectionPoolConfig {
    return { ...this.config };
  }

  /**
   * Updates configuration
   */
  updateConfig(newConfig: Partial<TenantConnectionPoolConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.enabled && !this.cleanupTimer) {
      this.startCleanupTimer();
    } else if (!this.config.enabled && this.cleanupTimer) {
      this.stopCleanupTimer();
    }
  }

  /**
   * Shuts down the connection pool
   */
  shutdown(): void {
    this.stopCleanupTimer();
    
    // Reject all waiting requests
    for (const waitingRequest of this.waitingQueue) {
      waitingRequest.reject(new Error('Connection pool is shutting down'));
    }
    this.waitingQueue = [];
    
    // Clear all connections
    this.connections.clear();
    this.updateStatistics();
  }

  /**
   * Gets an idle connection for a tenant
   */
  private getIdleConnection(tenantId: string, isAdmin: boolean): PooledConnection | null {
    const tenantConnections = this.connections.get(tenantId) || [];
    return tenantConnections.find(conn => !conn.inUse && conn.isAdmin === isAdmin) || null;
  }

  /**
   * Checks if a new connection can be created
   */
  private canCreateNewConnection(tenantId: string): boolean {
    const tenantConnections = this.connections.get(tenantId) || [];
    const totalConnections = Array.from(this.connections.values())
      .reduce((sum, conns) => sum + conns.length, 0);

    return tenantConnections.length < this.config.maxConnectionsPerTenant &&
           totalConnections < this.config.maxTotalConnections;
  }

  /**
   * Creates a new connection for a tenant
   */
  private async createNewConnection(tenantId: string, isAdmin: boolean): Promise<PooledConnection> {
    const client = isAdmin ? supabaseAdmin : supabase;
    
    const connection: PooledConnection = {
      client,
      tenantId,
      createdAt: new Date(),
      lastUsedAt: new Date(),
      inUse: true,
      connectionId: this.generateConnectionId(),
      isAdmin
    };

    // Add to pool
    if (!this.connections.has(tenantId)) {
      this.connections.set(tenantId, []);
    }
    this.connections.get(tenantId)!.push(connection);

    return connection;
  }

  /**
   * Waits for an available connection
   */
  private waitForConnection(
    tenantId: string,
    isAdmin: boolean,
    startTime: number,
    requestId?: string
  ): Promise<TenantOperationResult<PooledConnection>> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        // Remove from queue
        const index = this.waitingQueue.findIndex(req => req.resolve === resolveWrapper);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
        }

        const acquisitionTime = Date.now() - startTime;
        
        if (this.config.enableMonitoring) {
          tenantPerformanceMonitor.recordMetric({
            operation: 'connection_acquisition',
            tenantId,
            duration: acquisitionTime,
            startTime: new Date(startTime),
            endTime: new Date(),
            success: false,
            metadata: { timeout: true, isAdmin }
          });
        }

        const timeoutError = TenantErrorFactory.createDatabaseConnectivityError(
          tenantId,
          {
            reason: 'Connection acquisition timeout',
            timeout: this.config.acquisitionTimeout
          },
          requestId
        );

        resolve({
          success: false,
          error: {
            code: timeoutError.code,
            message: timeoutError.message,
            details: timeoutError.details
          }
        });
      }, this.config.acquisitionTimeout);

      const resolveWrapper = (connection: PooledConnection) => {
        clearTimeout(timeout);
        const acquisitionTime = Date.now() - startTime;
        this.recordAcquisitionTime(acquisitionTime);
        
        if (this.config.enableMonitoring) {
          tenantPerformanceMonitor.recordMetric({
            operation: 'connection_acquisition',
            tenantId,
            duration: acquisitionTime,
            startTime: new Date(startTime),
            endTime: new Date(),
            success: true,
            cacheHit: true, // Waited for existing connection
            metadata: { waited: true, connectionId: connection.connectionId, isAdmin }
          });
        }

        resolve({
          success: true,
          data: connection
        });
      };

      const rejectWrapper = (error: Error) => {
        clearTimeout(timeout);
        const acquisitionTime = Date.now() - startTime;
        
        if (this.config.enableMonitoring) {
          tenantPerformanceMonitor.recordMetric({
            operation: 'connection_acquisition',
            tenantId,
            duration: acquisitionTime,
            startTime: new Date(startTime),
            endTime: new Date(),
            success: false,
            metadata: { error: error.message, isAdmin }
          });
        }

        const poolError = TenantErrorFactory.createDatabaseConnectivityError(
          tenantId,
          {
            reason: 'Connection pool error',
            originalError: error.message
          },
          requestId
        );

        resolve({
          success: false,
          error: {
            code: poolError.code,
            message: poolError.message,
            details: poolError.details
          }
        });
      };

      this.waitingQueue.push({
        tenantId,
        isAdmin,
        resolve: resolveWrapper,
        reject: rejectWrapper,
        requestedAt: new Date()
      });

      this.updateStatistics();
    });
  }

  /**
   * Generates a unique connection ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Records connection acquisition time for statistics
   */
  private recordAcquisitionTime(time: number): void {
    this.acquisitionTimes.push(time);
    
    // Keep only last 100 acquisition times
    if (this.acquisitionTimes.length > 100) {
      this.acquisitionTimes.shift();
    }
  }

  /**
   * Updates internal statistics
   */
  private updateStatistics(): void {
    this.statistics.totalConnections = Array.from(this.connections.values())
      .reduce((sum, conns) => sum + conns.length, 0);
    
    this.statistics.activeConnectionsByTenant.clear();
    this.statistics.idleConnectionsByTenant.clear();

    for (const [tenantId, connections] of this.connections) {
      const activeCount = connections.filter(conn => conn.inUse).length;
      const idleCount = connections.filter(conn => !conn.inUse).length;
      
      this.statistics.activeConnectionsByTenant.set(tenantId, activeCount);
      this.statistics.idleConnectionsByTenant.set(tenantId, idleCount);
    }

    this.statistics.waitingRequests = this.waitingQueue.length;

    if (this.acquisitionTimes.length > 0) {
      this.statistics.averageAcquisitionTime = 
        this.acquisitionTimes.reduce((sum, time) => sum + time, 0) / this.acquisitionTimes.length;
    }

    // Update performance monitor with pool stats (avoid circular call)
    if (this.config.enableMonitoring) {
      const totalActive = Array.from(this.statistics.activeConnectionsByTenant.values())
        .reduce((sum, count) => sum + count, 0);
      const totalIdle = Array.from(this.statistics.idleConnectionsByTenant.values())
        .reduce((sum, count) => sum + count, 0);

      const poolStats: ConnectionPoolStats = {
        totalConnections: this.statistics.totalConnections,
        activeConnections: totalActive,
        idleConnections: totalIdle,
        waitingRequests: this.statistics.waitingRequests,
        utilization: this.statistics.totalConnections > 0 ? (totalActive / this.statistics.totalConnections) * 100 : 0
      };
      
      tenantPerformanceMonitor.updateConnectionPoolStats(poolStats);
    }
  }

  /**
   * Starts the cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      return;
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanupIdleConnections();
    }, this.config.cleanupInterval);
  }

  /**
   * Stops the cleanup timer
   */
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

/**
 * Global tenant connection pool instance
 */
export const tenantConnectionPool = new TenantConnectionPool();

/**
 * Convenience function to acquire a connection
 */
export async function acquireTenantConnection(
  tenantId: string,
  isAdmin: boolean = false,
  requestId?: string
): Promise<TenantOperationResult<PooledConnection>> {
  return tenantConnectionPool.acquireConnection(tenantId, isAdmin, requestId);
}

/**
 * Convenience function to release a connection
 */
export function releaseTenantConnection(connection: PooledConnection): void {
  tenantConnectionPool.releaseConnection(connection);
}

/**
 * Convenience function to execute operation with pooled connection
 */
export async function withPooledConnection<T>(
  tenantId: string,
  operation: (client: SupabaseClient) => Promise<T>,
  isAdmin: boolean = false,
  requestId?: string
): Promise<TenantOperationResult<T>> {
  const connectionResult = await acquireTenantConnection(tenantId, isAdmin, requestId);
  
  if (!connectionResult.success) {
    return {
      success: false,
      error: connectionResult.error
    };
  }

  const connection = connectionResult.data!;
  
  try {
    const result = await operation(connection.client);
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    const operationError = TenantErrorFactory.createDatabaseConnectivityError(
      tenantId,
      {
        reason: 'Operation failed with pooled connection',
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
    releaseTenantConnection(connection);
  }
}