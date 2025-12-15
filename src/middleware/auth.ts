import { Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch';

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
      console.error('Base URL is required for token validation');
      return false;
    }

    // Remove trailing slash from baseUrl if present
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const fullUrl = `${cleanBaseUrl}/platform/authentication/actions/healthcheck`;

    console.log('🔐 TOKEN VALIDATION REQUEST:');
    console.log('  URL:', fullUrl);
    console.log('  Method: POST');
    console.log('  Token (first 20 chars):', token.substring(0, 20) + '...');
    console.log('  Base URL:', baseUrl);
    console.log('  Clean Base URL:', cleanBaseUrl);

    const requestHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('  Headers:', JSON.stringify(requestHeaders, null, 2));

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: "{}"
    });

    console.log('📡 AUTHENTICATION API RESPONSE:');
    console.log('  Status:', response.status);
    console.log('  Status Text:', response.statusText);
    console.log('  Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

    if (response.status === 200) {
      const responseBody = await response.text();
      console.log('  Response Body:', responseBody);
      console.log('✅ Token validation successful - caching for 15 minutes');
      
      // Cache the token for 15 minutes (900000 ms)
      const expiration = Date.now() + 15 * 60 * 1000;
      tokenCache.set(token, expiration);
      return true;
    }

    if (response.status === 401) {
      const errorData = await response.text();
      console.log('❌ Authentication API returned 401:', errorData);
      return false;
    }

    // For other status codes, log and return false
    const errorBody = await response.text();
    console.error(`❌ Authentication API returned status ${response.status}:`, errorBody);
    return false;

  } catch (error) {
    console.error('💥 Error validating token:', error);
    return false;
  }
}

/**
 * Authentication middleware that validates Bearer tokens
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    console.log('\n🛡️  AUTHENTICATION MIDDLEWARE STARTED');
    console.log('  Request URL:', req.method, req.originalUrl);
    console.log('  Request Headers:', JSON.stringify(req.headers, null, 2));

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log('❌ No Authorization header found');
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authorization header is missing'
      });
      return;
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.log('❌ Authorization header does not start with "Bearer "');
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authorization header must start with "Bearer "'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    if (!token) {
      console.log('❌ Bearer token is empty');
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Bearer token is missing'
      });
      return;
    }

    console.log('✅ Token extracted successfully (first 20 chars):', token.substring(0, 20) + '...');

    // Extract base URL from Authorization-Url header
    const authUrlHeader = req.headers['authorization-url'] as string;
    
    if (!authUrlHeader) {
      console.log('❌ No Authorization-Url header found');
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authorization-Url header is missing'
      });
      return;
    }

    console.log('✅ Authorization-Url header found:', authUrlHeader);

    // Check cache first
    const cachedToken = tokenCache.get(token);
    if (cachedToken && cachedToken.isValid()) {
      console.log('🎯 Token found in cache and is valid - skipping API call');
      next();
      return;
    }

    console.log('🔍 Token not in cache or expired - validating via API');

    // Validate token via external API using the provided base URL
    const isValid = await validateToken(token, authUrlHeader);
    
    if (!isValid) {
      console.log('❌ Token validation failed');
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
      return;
    }

    console.log('✅ Token validation successful - proceeding to next middleware');
    // Token is valid, proceed to next middleware
    next();

  } catch (error) {
    console.error('💥 Authentication middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication validation failed'
    });
  }
}

// Export for testing purposes
export { tokenCache, validateToken };