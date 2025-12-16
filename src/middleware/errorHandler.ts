import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ErrorResponse } from '../types';
import { 
  getLanguageFromRequest, 
  getTranslations, 
  createValidationMessage,
  getRelationshipErrorMessage
} from '../utils/translations';

// Generate unique request ID for tracking
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Request ID middleware - adds unique ID to each request
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  // Add request ID and start time to request object for use in other middleware/controllers
  (req as any).requestId = requestId;
  (req as any).startTime = startTime;
  
  // Add request ID to response headers for client tracking
  res.setHeader('X-Request-ID', requestId);
  
  // Log request start
  console.log(`[${requestId}] ${req.method} ${req.url} - Request started`);
  
  // Override res.end to log response completion
  const originalEnd = res.end.bind(res);
  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    // Log response completion with performance metrics
    console.log(`[${requestId}] ${req.method} ${req.url} - ${statusCode} (${duration}ms)`);
    
    // Log slow requests as warnings
    if (duration > 3000) {
      console.warn(`[${requestId}] SLOW REQUEST: ${req.method} ${req.url} took ${duration}ms`);
    }
    
    // Call original end method with proper arguments
    return originalEnd(chunk, encoding, cb);
  };
  
  next();
}

// Global error handling middleware
export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = (req as any).requestId || generateRequestId();
  const language = getLanguageFromRequest(req);
  const t = getTranslations(language);
  
  // Enhanced logging with request context
  console.error(`[${requestId}] Error occurred:`, {
    error: error.message || error,
    stack: error.stack,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Zod validation errors
  if (error instanceof ZodError) {
    const firstError = error.issues[0];
    let message = t.errors.validation.invalid_data;
    
    if (firstError) {
      const field = firstError.path.join('.');
      const errorCode = firstError.code;
      const errorMessage = firstError.message;
      
      let errorType = 'invalid_data';
      let params: Record<string, any> = {};
      
      if (errorCode === 'invalid_type' && errorMessage.includes('Required')) {
        errorType = 'required';
      } else if (errorMessage.includes('email')) {
        errorType = 'email';
      } else if (errorMessage.includes('uuid')) {
        errorType = 'uuid';
      } else if (errorCode === 'too_small') {
        errorType = 'min';
        params.minimum = firstError.minimum;
      } else if (errorCode === 'too_big') {
        errorType = 'max';
        params.maximum = firstError.maximum;
      }
      
      message = createValidationMessage(field, errorType, language, params);
    }
    
    console.warn(`[${requestId}] Validation error: ${message}`);
    
    const errorResponse: ErrorResponse = {
      message,
      status: 400,
      requestId
    };
    res.status(400).json(errorResponse);
    return;
  }

  // Supabase/Database errors
  if (error.code) {
    let statusCode = 500;
    let message = t.errors.server.internal_error;

    switch (error.code) {
      case '23503': // Foreign key violation
        statusCode = 400;
        message = getRelationshipErrorMessage(error.details || error.detail || '', language);
        console.warn(`[${requestId}] Foreign key violation: ${error.details || error.detail}`);
        break;
      case '23505': // Unique constraint violation
        statusCode = 409;
        message = t.errors.constraints.duplicate_record;
        console.warn(`[${requestId}] Unique constraint violation: ${error.details || error.detail}`);
        break;
      case '23514': // Check constraint violation
        statusCode = 400;
        message = t.errors.constraints.data_constraint_violation;
        console.warn(`[${requestId}] Check constraint violation: ${error.details || error.detail}`);
        break;
      case '42P01': // Undefined table
        statusCode = 500;
        message = t.errors.server.internal_error;
        console.error(`[${requestId}] Database table not found: ${error.message}`);
        break;
      case '42703': // Undefined column
        statusCode = 500;
        message = t.errors.server.internal_error;
        console.error(`[${requestId}] Database column not found: ${error.message}`);
        break;
      case '08006': // Connection failure
        statusCode = 503;
        message = t.errors.server.service_unavailable;
        console.error(`[${requestId}] Database connection failure: ${error.message}`);
        break;
      case 'PGRST116': // PostgREST row not found
        statusCode = 404;
        message = t.errors.not_found.route;
        console.warn(`[${requestId}] Resource not found: ${error.message}`);
        break;
      default:
        statusCode = 500;
        message = t.errors.server.internal_error;
        console.error(`[${requestId}] Unhandled database error (${error.code}): ${error.message}`);
        break;
    }

    const errorResponse: ErrorResponse = {
      message,
      status: statusCode,
      requestId
    };
    res.status(statusCode).json(errorResponse);
    return;
  }

  // Authentication API errors (from fetch failures)
  if (error.name === 'FetchError' || error.code === 'ECONNREFUSED') {
    console.error(`[${requestId}] External service connection error: ${error.message}`);
    
    const errorResponse: ErrorResponse = {
      message: t.errors.server.service_unavailable,
      status: 502,
      requestId
    };
    res.status(502).json(errorResponse);
    return;
  }

  // HTTP errors (from external API calls)
  if (error.status && error.statusText) {
    console.error(`[${requestId}] External API error: ${error.status} ${error.statusText}`);
    
    const errorResponse: ErrorResponse = {
      message: t.errors.server.external_service_error,
      status: 502,
      requestId
    };
    res.status(502).json(errorResponse);
    return;
  }

  // Timeout errors
  if (error.code === 'ETIMEDOUT' || error.name === 'TimeoutError') {
    console.error(`[${requestId}] Request timeout: ${error.message}`);
    
    const errorResponse: ErrorResponse = {
      message: t.errors.server.service_unavailable,
      status: 504,
      requestId
    };
    res.status(504).json(errorResponse);
    return;
  }

  // Rate limiting errors
  if (error.status === 429) {
    console.warn(`[${requestId}] Rate limit exceeded: ${error.message}`);
    
    const errorResponse: ErrorResponse = {
      message: 'Too many requests. Please try again later.',
      status: 429,
      requestId
    };
    res.status(429).json(errorResponse);
    return;
  }

  // Generic server errors
  const message = error instanceof Error ? error.message : t.errors.server.internal_error;
  console.error(`[${requestId}] Unhandled error: ${message}`);
  
  const errorResponse: ErrorResponse = {
    message: t.errors.server.internal_error,
    status: 500,
    requestId
  };
  
  res.status(500).json(errorResponse);
}

// 404 handler for undefined routes
export function notFoundHandler(req: Request, res: Response): void {
  const language = getLanguageFromRequest(req);
  const t = getTranslations(language);
  
  const errorResponse: ErrorResponse = {
    message: `${t.errors.not_found.route}: ${req.method} ${req.path}`,
    status: 404
  };
  
  res.status(404).json(errorResponse);
}

// Async error wrapper to catch async errors in route handlers
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}