import { Request, Response } from 'express';
import { supabaseAdmin } from '../supabaseClient';
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
    // Get language from request
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
      
      if (errorCode === 'invalid_type' && errorMessage.includes('Required')) {
        errorType = 'required';
      } else if (errorMessage.includes('email')) {
        errorType = 'email';
      } else if (errorMessage.includes('uuid')) {
        errorType = 'uuid';
      } else if (errorMessage.includes('min')) {
        errorType = 'min';
      } else if (errorMessage.includes('max')) {
        errorType = 'max';
      }
      
      message = createValidationMessage(field, errorType, language, {
        minimum: firstError.minimum,
        maximum: firstError.maximum
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
  const language = req ? getLanguageFromRequest(req) : 'pt-BR';
  const message = getNotFoundMessage(entityName, language);
  
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
  logger.dbError(operation, tableName, error as Error);
  
  const language = req ? getLanguageFromRequest(req) : 'pt-BR';
  const t = getTranslations(language);
  
  // Handle foreign key constraint violations
  if (error.code === '23503') {
    let message = getRelationshipErrorMessage(error.details || '', language);
    
    res.status(400).json({
      message,
      status: 400
    } as ErrorResponse);
    return;
  }
  
  // Handle constraint violations for deletion
  if (error.code === '23503' && operation === 'DELETE') {
    res.status(409).json({
      message: t.errors.constraints.cannot_delete_with_relations,
      status: 409
    } as ErrorResponse);
    return;
  }
  
  // Handle unique constraint violations
  if (error.code === '23505') {
    res.status(400).json({
      message: t.errors.constraints.duplicate_record,
      status: 400
    } as ErrorResponse);
    return;
  }
  
  // Handle check constraint violations
  if (error.code === '23514') {
    res.status(400).json({
      message: t.errors.constraints.data_constraint_violation,
      status: 400
    } as ErrorResponse);
    return;
  }
  
  // Generic database error
  res.status(500).json({
    message: t.errors.server.internal_error,
    status: 500
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
  logger.error('CONTROLLER', `Error in ${operation}`, error as Error);
  
  const language = req ? getLanguageFromRequest(req) : 'pt-BR';
  const t = getTranslations(language);
  
  const message = error instanceof Error ? error.message : t.errors.server.internal_error;
  
  res.status(500).json({
    message,
    status: 500
  } as ErrorResponse);
}

/**
 * Handle filter parsing errors
 */
export function handleFilterError(filterError: any, res: Response, req?: Request): void {
  const language = req ? getLanguageFromRequest(req) : 'pt-BR';
  const t = getTranslations(language);
  
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
 * Check if entity exists in database
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