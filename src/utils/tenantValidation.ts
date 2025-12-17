// Tenant validation utilities and helper functions

import { 
  TenantValidationResult, 
  TenantConfig, 
  TenantContext,
  SchemaValidationCache,
  SchemaExistenceResult
} from '../types/tenant';

/**
 * Default tenant configuration
 */
export const DEFAULT_TENANT_CONFIG: TenantConfig = {
  schemaPrefix: 'crmx_database_',
  validationCacheTtl: 5 * 60 * 1000, // 5 minutes
  maxTenantIdLength: 50,
  allowedCharactersPattern: /^[a-zA-Z0-9_-]+$/
};

/**
 * Validates a tenant ID according to the requirements
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
export function validateTenantId(
  tenantId: string | undefined | null,
  config: TenantConfig = DEFAULT_TENANT_CONFIG
): TenantValidationResult {
  // Check if tenant header is missing (Requirement 1.1)
  if (tenantId === undefined || tenantId === null) {
    return {
      isValid: false,
      error: 'Tenant header is required'
    };
  }

  // Check if tenant header is empty or whitespace only (Requirement 1.2)
  if (typeof tenantId !== 'string' || tenantId.trim().length === 0) {
    return {
      isValid: false,
      error: 'Tenant header cannot be empty'
    };
  }

  const trimmedTenantId = tenantId.trim();

  // Check tenant ID length
  if (trimmedTenantId.length > config.maxTenantIdLength) {
    return {
      isValid: false,
      error: 'Invalid tenant format'
    };
  }

  // Check for invalid characters (Requirement 1.4)
  if (!config.allowedCharactersPattern.test(trimmedTenantId)) {
    return {
      isValid: false,
      error: 'Invalid tenant format'
    };
  }

  // Valid tenant ID (Requirement 1.3)
  return {
    isValid: true,
    sanitizedTenantId: trimmedTenantId
  };
}

/**
 * Generates a schema name for a given tenant ID
 */
export function generateSchemaName(
  tenantId: string,
  config: TenantConfig = DEFAULT_TENANT_CONFIG
): string {
  return `${config.schemaPrefix}${tenantId}`;
}

/**
 * Extracts tenant ID from schema name
 */
export function extractTenantIdFromSchema(
  schemaName: string,
  config: TenantConfig = DEFAULT_TENANT_CONFIG
): string | null {
  if (!schemaName.startsWith(config.schemaPrefix)) {
    return null;
  }
  return schemaName.substring(config.schemaPrefix.length);
}

/**
 * Validates schema name format
 */
export function validateSchemaName(
  schemaName: string,
  config: TenantConfig = DEFAULT_TENANT_CONFIG
): boolean {
  if (!schemaName.startsWith(config.schemaPrefix)) {
    return false;
  }
  
  const tenantId = extractTenantIdFromSchema(schemaName, config);
  if (!tenantId) {
    return false;
  }
  
  const validation = validateTenantId(tenantId, config);
  return validation.isValid;
}

/**
 * Creates a tenant context from a validated tenant ID
 */
export function createTenantContext(
  tenantId: string,
  config: TenantConfig = DEFAULT_TENANT_CONFIG
): TenantContext {
  return {
    tenantId,
    schemaName: generateSchemaName(tenantId, config),
    isValidated: true,
    createdAt: new Date()
  };
}

/**
 * Sanitizes tenant ID by removing potentially dangerous characters
 */
export function sanitizeTenantId(tenantId: string): string {
  return tenantId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, ''); // Remove any characters not in allowed set
}

/**
 * Checks if a tenant ID is safe for database operations
 */
export function isSafeTenantId(tenantId: string): boolean {
  // Additional safety checks beyond basic validation
  const dangerous = [
    'information_schema',
    'pg_catalog',
    'pg_toast',
    'public',
    'postgres',
    'template0',
    'template1'
  ];
  
  const lowerTenantId = tenantId.toLowerCase();
  return !dangerous.includes(lowerTenantId) && 
         !lowerTenantId.startsWith('pg_') &&
         !lowerTenantId.startsWith('information_');
}

/**
 * Enhanced cache statistics for performance monitoring
 */
export interface CacheStatistics {
  totalEntries: number;
  hitCount: number;
  missCount: number;
  evictionCount: number;
  hitRate: number;
  averageAge: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
}

/**
 * In-memory cache for schema validation results with performance monitoring
 */
class SchemaValidationCacheImpl {
  private cache = new Map<string, SchemaValidationCache>();
  private maxSize = 1000;
  private hitCount = 0;
  private missCount = 0;
  private evictionCount = 0;

  get(tenantId: string): SchemaValidationCache | null {
    const cached = this.cache.get(tenantId);
    if (!cached) {
      this.missCount++;
      return null;
    }

    // Check if cache entry is still valid
    const now = new Date();
    const age = now.getTime() - cached.lastChecked.getTime();
    if (age > cached.ttl) {
      this.cache.delete(tenantId);
      this.missCount++;
      return null;
    }

    this.hitCount++;
    return cached;
  }

  set(tenantId: string, exists: boolean, ttl: number = DEFAULT_TENANT_CONFIG.validationCacheTtl): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(tenantId)) {
      this.evictOldest();
    }

    const cacheEntry: SchemaValidationCache = {
      tenantId,
      exists,
      lastChecked: new Date(),
      ttl
    };

    this.cache.set(tenantId, cacheEntry);
  }

  delete(tenantId: string): void {
    this.cache.delete(tenantId);
  }

  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
    this.evictionCount = 0;
  }

  /**
   * Gets cache statistics for performance monitoring
   */
  getStatistics(): CacheStatistics {
    const entries = Array.from(this.cache.values());
    const now = new Date();
    
    let totalAge = 0;
    let oldestEntry: Date | null = null;
    let newestEntry: Date | null = null;

    for (const entry of entries) {
      const age = now.getTime() - entry.lastChecked.getTime();
      totalAge += age;

      if (!oldestEntry || entry.lastChecked < oldestEntry) {
        oldestEntry = entry.lastChecked;
      }
      if (!newestEntry || entry.lastChecked > newestEntry) {
        newestEntry = entry.lastChecked;
      }
    }

    const totalRequests = this.hitCount + this.missCount;

    return {
      totalEntries: this.cache.size,
      hitCount: this.hitCount,
      missCount: this.missCount,
      evictionCount: this.evictionCount,
      hitRate: totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0,
      averageAge: entries.length > 0 ? totalAge / entries.length : 0,
      oldestEntry,
      newestEntry
    };
  }

  /**
   * Gets current cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Gets maximum cache size
   */
  maxCacheSize(): number {
    return this.maxSize;
  }

  /**
   * Updates maximum cache size
   */
  setMaxSize(newMaxSize: number): void {
    this.maxSize = newMaxSize;
    
    // Evict entries if current size exceeds new max
    while (this.cache.size > this.maxSize) {
      this.evictOldest();
    }
  }

  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.lastChecked.getTime() < oldestTime) {
        oldestTime = entry.lastChecked.getTime();
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.evictionCount++;
    }
  }

  // Clean up expired entries
  cleanup(): void {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [key, entry] of this.cache) {
      const age = now.getTime() - entry.lastChecked.getTime();
      if (age > entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.evictionCount += cleanedCount;
    }
  }
}

// Global cache instance
export const schemaValidationCache = new SchemaValidationCacheImpl();

// Clean up expired cache entries every 2 minutes
setInterval(() => {
  schemaValidationCache.cleanup();
}, 2 * 60 * 1000);

/**
 * Helper function to get cached schema existence result
 */
export function getCachedSchemaExistence(tenantId: string): SchemaExistenceResult | null {
  const cached = schemaValidationCache.get(tenantId);
  if (!cached) {
    return null;
  }

  return {
    exists: cached.exists,
    schemaName: generateSchemaName(tenantId),
    fromCache: true
  };
}

/**
 * Helper function to cache schema existence result
 */
export function cacheSchemaExistence(
  tenantId: string, 
  exists: boolean, 
  ttl?: number
): void {
  schemaValidationCache.set(tenantId, exists, ttl);
}

/**
 * Validates tenant header from HTTP request
 */
export function validateTenantHeader(
  headerValue: string | string[] | undefined
): TenantValidationResult {
  // Handle array of header values (should not happen with tenant header)
  if (Array.isArray(headerValue)) {
    return {
      isValid: false,
      error: 'Invalid tenant format'
    };
  }

  return validateTenantId(headerValue);
}

/**
 * Gets cache statistics for performance monitoring
 */
export function getCacheStatistics(): CacheStatistics {
  return schemaValidationCache.getStatistics();
}

/**
 * Gets current cache utilization
 */
export function getCacheUtilization(): {
  currentSize: number;
  maxSize: number;
  utilizationPercentage: number;
} {
  const currentSize = schemaValidationCache.size();
  const maxSize = schemaValidationCache.maxCacheSize();
  
  return {
    currentSize,
    maxSize,
    utilizationPercentage: maxSize > 0 ? (currentSize / maxSize) * 100 : 0
  };
}

/**
 * Updates cache configuration for performance tuning
 */
export function updateCacheConfig(maxSize?: number): void {
  if (maxSize !== undefined) {
    schemaValidationCache.setMaxSize(maxSize);
  }
}

/**
 * Forces cache cleanup for performance optimization
 */
export function forceCacheCleanup(): {
  entriesBeforeCleanup: number;
  entriesAfterCleanup: number;
  entriesRemoved: number;
} {
  const entriesBefore = schemaValidationCache.size();
  schemaValidationCache.cleanup();
  const entriesAfter = schemaValidationCache.size();
  
  return {
    entriesBeforeCleanup: entriesBefore,
    entriesAfterCleanup: entriesAfter,
    entriesRemoved: entriesBefore - entriesAfter
  };
}