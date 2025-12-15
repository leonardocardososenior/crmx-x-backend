import { Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch';
import { logger } from '../utils/logger';

// Token cache interface
interface CachedToken {
  expiration: number;
  isValid(): boolean;
}

class CachedTokenImpl implements CachedToken {
  constructor(public expiration: number) {}

  isValid(): boolean {
    return Date.now() < this.expiration;
  }
}

// In-memory token cache with LRU eviction
class TokenCache {
  private cache = new Map<string, CachedToken>();
  private accessOrder = new Map<string, number>();
  private maxSize = 1000; // Maximum cache size
  private accessCounter = 0;

  get(token: string): CachedToken | null {
    const cached = this.cache.get(token);
    if (!cached) {
      return null;
    }

    // Check if token is still valid
    if (!cached.isValid()) {
      this.cache.delete(token);
      this.accessOrder.delete(token);
      return null;
    }

    // Update access order for LRU
    this.accessOrder.set(token, ++this.accessCounter);
    return cached;
  }

  set(token: string, expiration: number): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(token)) {
      this.evictLRU();
    }

    const cachedToken = new CachedTokenImpl(expiration);
    this.cache.set(token, cachedToken);
    this.accessOrder.set(token, ++this.accessCounter);
  }

  private evictLRU(): void {
    let oldestToken = '';
    let oldestAccess = Infinity;

    for (const [token, accessTime] of this.accessOrder) {
      if (accessTime < oldestAccess) {
        oldestAccess = accessTime;
        oldestToken = token;
      }
    }

    if (oldestToken) {
      this.cache.delete(oldestToken);
      this.accessOrder.delete(oldestToken);
    }
  }

  // Clean up expired tokens
  cleanup(): void {
    for (const [token, cached] of this.cache) {
      if (!cached.isValid()) {
        this.cache.delete(token);
        this.accessOrder.delete(token);
      }
    }
  }
}

// Global token cache instance
const tokenCache = new TokenCache();

// Clean up expired tokens every 5 minutes
setInterval(() => {
  tokenCache.cleanup();
}, 5 * 60 * 1000);

/**
 * Validates a token by calling the external authentication API
 */
async function validateToken(token: string, baseUrl: string): Promise<boolean> {
  try {
    if (!baseUrl) {
      logger.error('AUTH', 'Base URL is required for token validation');
      return false;
    }

    // Remove trailing slash from baseUrl if present
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const fullUrl = `${cleanBaseUrl}/platform/authentication/actions/healthcheck`;

    logger.debug('AUTH', 'Validating token with external API', { 
      url: fullUrl,
      tokenPrefix: token.substring(0, 8) + '...'
    });

    const requestHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: "{}"
    });

    if (response.status === 200) {
      logger.debug('AUTH', 'Token validation successful, caching for 15 minutes');
      
      // Cache the token for 15 minutes (900000 ms)
      const expiration = Date.now() + 15 * 60 * 1000;
      tokenCache.set(token, expiration);
      return true;
    }

    if (response.status === 401) {
      logger.warn('AUTH', 'Token validation failed - unauthorized', { status: response.status });
      return false;
    }

    // For other status codes, log and return false
    logger.error('AUTH', 'Token validation failed with unexpected status', undefined, { 
      status: response.status,
      statusText: response.statusText
    });
    return false;

  } catch (error) {
    logger.error('AUTH', 'Error during token validation', error as Error);
    return false;
  }
}

/**
 * Authentication middleware that validates Bearer tokens
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    logger.debug('AUTH', 'Processing authentication request', { 
      method: req.method, 
      path: req.originalUrl 
    });

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      logger.warn('AUTH', 'Missing Authorization header');
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authorization header is missing'
      });
      return;
    }

    if (!authHeader.startsWith('Bearer ')) {
      logger.warn('AUTH', 'Invalid Authorization header format');
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authorization header must start with "Bearer "'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    if (!token) {
      logger.warn('AUTH', 'Empty bearer token');
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Bearer token is missing'
      });
      return;
    }

    // Extract base URL from Authorization-Url header
    const authUrlHeader = req.headers['authorization-url'] as string;
    
    if (!authUrlHeader) {
      logger.warn('AUTH', 'Missing Authorization-Url header');
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authorization-Url header is missing'
      });
      return;
    }

    // Check cache first
    const cachedToken = tokenCache.get(token);
    if (cachedToken && cachedToken.isValid()) {
      logger.debug('AUTH', 'Using cached token validation');
      next();
      return;
    }

    // Validate token via external API using the provided base URL
    const isValid = await validateToken(token, authUrlHeader);
    
    if (!isValid) {
      logger.authAttempt(false, 'Token validation failed');
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
      return;
    }

    logger.authAttempt(true);
    // Token is valid, proceed to next middleware
    next();

  } catch (error) {
    logger.error('AUTH', 'Authentication middleware error', error as Error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication validation failed'
    });
  }
}

// Export for testing purposes
export { tokenCache, validateToken };