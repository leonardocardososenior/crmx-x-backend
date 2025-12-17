import { Request, Response } from 'express';
import { supabaseAdmin } from '../supabaseClient';
import { TenantRequest } from '../types/tenant';
import { getTenantAdminClient } from './tenantClientHelper';
import { ErrorResponse, PaginatedResponse } from '../types';
import { logger } from './logger';
import { parseFilter, applyFiltersToQuery } from './filterParser';
import { 
  getLanguageFromRequest, 
  getTranslations, 
  createValidationMessage,
  getRelationshipErrorMessage,
  getNotFoundMessage
} from './translations';

/**
 * Handle Zod validation errors with consistent error response format
 */
export function handleValidationError(validationResult: any, res: Response, req?: Request): boolean {
  if (!validationResult.success) {
    const requestId = req ? (req as any).requestId : undefined;
    const language = req ? getLanguageFromRequest(req) : 'pt-BR';
    
    // Extract the first validation error for a cleaner message
    const firstError = validationResult.error.errors[0];
    let message = getTranslations(language).errors.validation.invalid_data;
    
    if (firstError) {
      const field = firstError.path.join('.');
      const errorCode = firstError.code;
      const errorMessage = firstError.message;
      
      // Determine error type based on Zod error
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
    
    // Log validation error for debugging
    if (requestId) {
      logger.warn('VALIDATION', `Validation failed for request ${requestId}`, {
        field: firstError?.path?.join('.'),
        errorCode: firstError?.code,
        errorMessage: firstError?.message,
        url: req?.url,
        method: req?.method
      });
    }
    
    res.status(400).json({
      message,
      status: 400
    } as ErrorResponse);
    return true;
  }
  return false;
}

/**
 * Handle not found errors with consistent error response format
 */
export function handleNotFound(entityName: string, res: Response, req?: Request): void {
  const requestId = req ? (req as any).requestId : undefined;
  const language = req ? getLanguageFromRequest(req) : 'pt-BR';
  const message = getNotFoundMessage(entityName, language);
  
  // Log not found error for debugging
  if (requestId) {
    logger.warn('NOT_FOUND', `Entity not found for request ${requestId}`, {
      entityName,
      url: req?.url,
      method: req?.method
    });
  }
  
  res.status(404).json({
    message,
    status: 404
  } as ErrorResponse);
}

/**
 * Handle database errors with consistent error response format and logging
 */
export function handleDatabaseError(
  operation: string, 
  tableName: string, 
  error: any, 
  res: Response,
  req?: Request
): void {
  const requestId = req ? (req as any).requestId : undefined;
  const language = req ? getLanguageFromRequest(req) : 'pt-BR';
  const t = getTranslations(language);
  
  // Enhanced logging with request context
  logger.dbError(operation, tableName, error as Error);
  if (requestId) {
    logger.error('DATABASE', `Database error for request ${requestId}`, error as Error, {
      operation,
      tableName,
      errorCode: error.code,
      errorDetails: error.details || error.detail,
      url: req?.url,
      method: req?.method
    });
  }
  
  let statusCode = 500;
  let message = t.errors.server.internal_error;
  
  // Handle specific database error codes
  switch (error.code) {
    case '23503': // Foreign key constraint violation
      statusCode = operation === 'DELETE' ? 409 : 400;
      message = operation === 'DELETE' 
        ? t.errors.constraints.cannot_delete_with_relations
        : getRelationshipErrorMessage(error.details || error.detail || '', language);
      break;
      
    case '23505': // Unique constraint violation
      statusCode = 409;
      message = t.errors.constraints.duplicate_record;
      break;
      
    case '23514': // Check constraint violation
      statusCode = 400;
      message = t.errors.constraints.data_constraint_violation;
      break;
      
    case '42P01': // Undefined table
      statusCode = 500;
      message = t.errors.server.internal_error;
      break;
      
    case '42703': // Undefined column
      statusCode = 500;
      message = t.errors.server.internal_error;
      break;
      
    case '08006': // Connection failure
      statusCode = 503;
      message = t.errors.server.service_unavailable;
      break;
      
    case 'PGRST116': // PostgREST row not found
      statusCode = 404;
      message = t.errors.not_found.route;
      break;
      
    default:
      statusCode = 500;
      message = t.errors.server.internal_error;
      break;
  }
  
  res.status(statusCode).json({
    message,
    status: statusCode
  } as ErrorResponse);
}

/**
 * Handle internal server errors with consistent error response format and logging
 */
export function handleInternalError(
  operation: string, 
  error: any, 
  res: Response,
  req?: Request
): void {
  const requestId = req ? (req as any).requestId : undefined;
  const language = req ? getLanguageFromRequest(req) : 'pt-BR';
  const t = getTranslations(language);
  
  // Enhanced logging with request context
  logger.error('CONTROLLER', `Error in ${operation}`, error as Error);
  if (requestId) {
    logger.error('CONTROLLER', `Internal error for request ${requestId}`, error as Error, {
      operation,
      url: req?.url,
      method: req?.method,
      userAgent: req?.get('User-Agent'),
      ip: req?.ip
    });
  }
  
  // Don't expose internal error details to client
  const message = t.errors.server.internal_error;
  
  res.status(500).json({
    message,
    status: 500
  } as ErrorResponse);
}

/**
 * Handle filter parsing errors
 */
export function handleFilterError(filterError: any, res: Response, req?: Request): void {
  const requestId = req ? (req as any).requestId : undefined;
  const language = req ? getLanguageFromRequest(req) : 'pt-BR';
  const t = getTranslations(language);
  
  // Log filter parsing error for debugging
  if (requestId) {
    logger.warn('FILTER', `Filter parsing error for request ${requestId}`, {
      error: filterError.message || filterError,
      url: req?.url,
      method: req?.method,
      filter: req?.query?.filter
    });
  }
  
  const message = filterError instanceof Error ? filterError.message : t.errors.filter.invalid_syntax;
  
  res.status(400).json({
    message,
    status: 400
  } as ErrorResponse);
}

/**
 * Build paginated query with consistent pagination logic
 */
export function buildPaginatedQuery(query: any, page: number = 1, size: number = 10): any {
  const offset = (page - 1) * size;
  return query.range(offset, offset + size - 1);
}

/**
 * Build search query with OR conditions for multiple fields
 */
export function buildSearchQuery(query: any, searchTerm: string, searchFields: string[]): any {
  if (!searchTerm || searchFields.length === 0) {
    return query;
  }
  
  const searchConditions = searchFields.map(field => `${field}.ilike.%${searchTerm}%`).join(',');
  return query.or(searchConditions);
}

/**
 * Create paginated response with consistent metadata format
 */
export function createPaginatedResponse<T>(
  contents: T[], 
  totalElements: number, 
  page: number, 
  size: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(totalElements / size);
  
  return {
    contents,
    totalElements,
    totalPages
  };
}

/**
 * Check if entity exists in database (legacy version - use checkEntityExistsInTenant for new code)
 * @deprecated Use checkEntityExistsInTenant instead for tenant-aware operations
 */
export async function checkEntityExists(
  tableName: string, 
  id: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from(tableName)
    .select('id')
    .eq('id', id)
    .single();
    
  return !error && !!data;
}

/**
 * Check if entity exists in database within tenant context
 */
export async function checkEntityExistsInTenant(
  req: TenantRequest,
  tableName: string, 
  id: string
): Promise<boolean> {
  const tenantClient = getTenantAdminClient(req);
  
  const { data, error } = await tenantClient
    .getClient()
    .from(tableName)
    .select('id')
    .eq('id', id)
    .single();
    
  return !error && !!data;
}