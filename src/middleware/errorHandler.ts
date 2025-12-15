import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ErrorResponse } from '../types';

// Generate unique request ID for tracking
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Request ID middleware - adds unique ID to each request
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = generateRequestId();
  
  // Add request ID to request object for use in other middleware/controllers
  (req as any).requestId = requestId;
  
  // Add request ID to response headers for client tracking
  res.setHeader('X-Request-ID', requestId);
  
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
  
  console.error(`[${requestId}] Error occurred:`, error);

  // Zod validation errors
  if (error instanceof ZodError) {
    const errorResponse: ErrorResponse = {
      error: 'Validation Error',
      message: 'Invalid data provided',
      details: error.errors,
      request_id: requestId
    };
    res.status(400).json(errorResponse);
    return;
  }

  // Supabase/Database errors
  if (error.code) {
    let statusCode = 500;
    let errorType = 'Database Error';
    let message = 'Database operation failed';

    switch (error.code) {
      case '23503': // Foreign key violation
        statusCode = 400;
        errorType = 'Foreign Key Violation';
        message = 'Referenced record does not exist';
        break;
      case '23505': // Unique constraint violation
        statusCode = 409;
        errorType = 'Constraint Violation';
        message = 'Record already exists';
        break;
      case '23514': // Check constraint violation
        statusCode = 400;
        errorType = 'Constraint Violation';
        message = 'Data violates database constraints';
        break;
      case '42P01': // Undefined table
        statusCode = 500;
        errorType = 'Database Configuration Error';
        message = 'Database table not found';
        break;
      case '42703': // Undefined column
        statusCode = 500;
        errorType = 'Database Configuration Error';
        message = 'Database column not found';
        break;
    }

    const errorResponse: ErrorResponse = {
      error: errorType,
      message,
      details: {
        code: error.code,
        details: error.details,
        hint: error.hint
      },
      request_id: requestId
    };
    res.status(statusCode).json(errorResponse);
    return;
  }

  // Authentication API errors (from fetch failures)
  if (error.name === 'FetchError' || error.code === 'ECONNREFUSED') {
    const errorResponse: ErrorResponse = {
      error: 'External API Error',
      message: 'Authentication service unavailable',
      details: {
        service: 'Authentication API',
        error: error.message
      },
      request_id: requestId
    };
    res.status(502).json(errorResponse);
    return;
  }

  // HTTP errors (from external API calls)
  if (error.status && error.statusText) {
    const errorResponse: ErrorResponse = {
      error: 'External API Error',
      message: `External service returned ${error.status}: ${error.statusText}`,
      details: {
        status: error.status,
        statusText: error.statusText
      },
      request_id: requestId
    };
    res.status(502).json(errorResponse);
    return;
  }

  // Generic server errors
  const errorResponse: ErrorResponse = {
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'development' ? {
      message: error.message,
      stack: error.stack
    } : undefined,
    request_id: requestId
  };
  
  res.status(500).json(errorResponse);
}

// 404 handler for undefined routes
export function notFoundHandler(req: Request, res: Response): void {
  const requestId = (req as any).requestId || generateRequestId();
  
  const errorResponse: ErrorResponse = {
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    request_id: requestId
  };
  
  res.status(404).json(errorResponse);
}

// Async error wrapper to catch async errors in route handlers
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}