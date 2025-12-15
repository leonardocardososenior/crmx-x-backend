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
    const language = getLanguageFromRequest(req);
    const firstError = error.errors[0];
    let message = getTranslations(language).errors.validation.invalid_data;
    
    if (firstError) {
      const field = firstError.path.join('.');
      const errorCode = firstError.code;
      const errorMessage = firstError.message;
      
      let errorType = 'invalid_data';
      
      if (errorCode === 'invalid_type' && errorMessage.includes('Required')) {
        errorType = 'required';
      } else if (errorMessage.includes('email')) {
        errorType = 'email';
      } else if (errorMessage.includes('uuid')) {
        errorType = 'uuid';
      }
      
      message = createValidationMessage(field, errorType, language);
    }
    
    const errorResponse: ErrorResponse = {
      message,
      status: 400
    };
    res.status(400).json(errorResponse);
    return;
  }

  // Supabase/Database errors
  if (error.code) {
    const language = getLanguageFromRequest(req);
    const t = getTranslations(language);
    let statusCode = 500;
    let message = t.errors.server.internal_error;

    switch (error.code) {
      case '23503': // Foreign key violation
        statusCode = 400;
        message = getRelationshipErrorMessage(error.details || '', language);
        break;
      case '23505': // Unique constraint violation
        statusCode = 400;
        message = t.errors.constraints.duplicate_record;
        break;
      case '23514': // Check constraint violation
        statusCode = 400;
        message = t.errors.constraints.data_constraint_violation;
        break;
      default:
        statusCode = 500;
        message = t.errors.server.internal_error;
        break;
    }

    const errorResponse: ErrorResponse = {
      message,
      status: statusCode
    };
    res.status(statusCode).json(errorResponse);
    return;
  }

  // Authentication API errors (from fetch failures)
  if (error.name === 'FetchError' || error.code === 'ECONNREFUSED') {
    const language = getLanguageFromRequest(req);
    const t = getTranslations(language);
    
    const errorResponse: ErrorResponse = {
      message: t.errors.server.service_unavailable,
      status: 502
    };
    res.status(502).json(errorResponse);
    return;
  }

  // HTTP errors (from external API calls)
  if (error.status && error.statusText) {
    const language = getLanguageFromRequest(req);
    const t = getTranslations(language);
    
    const errorResponse: ErrorResponse = {
      message: t.errors.server.external_service_error,
      status: 502
    };
    res.status(502).json(errorResponse);
    return;
  }

  // Generic server errors
  const language = getLanguageFromRequest(req);
  const t = getTranslations(language);
  const message = error instanceof Error ? error.message : t.errors.server.internal_error;
  
  const errorResponse: ErrorResponse = {
    message,
    status: 500
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