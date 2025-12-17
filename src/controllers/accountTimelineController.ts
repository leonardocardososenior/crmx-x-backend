import { Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../supabaseClient';
import { TenantRequest } from '../types/tenant';
import { getTenantAdminClient } from '../utils/tenantClientHelper';
import { 
  CreateAccountTimelineSchema, 
  UpdateAccountTimelineSchema, 
  AccountTimelineQueryParamsSchema, 
  AccountTimelineIdParamSchema,
  CreateAccountTimelineInput,
  UpdateAccountTimelineInput,
  AccountTimelineQueryParamsInput 
} from '../schemas/accountTimelineSchemas';
import { AccountTimeline, AccountTimelineDB, accountTimelineDbToApi, accountTimelineApiToDb } from '../types';
import { parseFilter, applyFiltersToQuery } from '../utils/filterParser';
import { logger } from '../utils/logger';
import { 
  handleValidationError, 
  handleNotFound, 
  handleDatabaseError, 
  handleInternalError,
  handleFilterError,
  buildPaginatedQuery,
  createPaginatedResponse,
  checkEntityExistsInTenant
} from '../utils/controllerHelpers';
import { getLanguageFromRequest, getSuccessMessage } from '../utils/translations';

/**
 * Create a new account timeline record
 * POST /api/account-timeline
 */
export async function createAccountTimeline(req: TenantRequest, res: Response): Promise<void> {
  try {
    // Validate request body using Zod schema
    const validationResult = CreateAccountTimelineSchema.safeParse(req.body);
    
    if (handleValidationError(validationResult, res, req)) {
      return;
    }

    const timelineData = validationResult.data!;

    // Check if referenced account exists
    const accountExists = await checkEntityExistsInTenant(req, 'account', timelineData.account.id);
    if (!accountExists) {
      res.status(400).json({
        message: 'Referenced account does not exist',
        field: 'account'
      });
      return;
    }

    // Check if referenced user exists
    const userExists = await checkEntityExistsInTenant(req, 'users', timelineData.responsible.id);
    if (!userExists) {
      res.status(400).json({
        message: 'Referenced user does not exist',
        field: 'responsible'
      });
      return;
    }

    // Convert API data (camelCase) to database format (snake_case)
    const dbTimelineData = accountTimelineApiToDb(timelineData);

    // Get tenant-aware admin client
    const tenantClient = getTenantAdminClient(req);

    // Insert timeline record into database
    const { data: createdTimeline, error } = await tenantClient
      .getClient()
      .from('account_timeline')
      .insert(dbTimelineData)
      .select()
      .single();

    if (error) {
      handleDatabaseError('INSERT', 'account_timeline', error, res, req);
      return;
    }

    // Convert database result (snake_case) to API format (camelCase) and return
    const apiTimeline = accountTimelineDbToApi(createdTimeline as AccountTimelineDB);
    res.status(201).json(apiTimeline);

  } catch (error) {
    handleInternalError('creating account timeline', error, res, req);
  }
}

/**
 * Get account timeline records with filtering and pagination
 * GET /api/account-timeline
 */
export async function getAccountTimelines(req: TenantRequest, res: Response): Promise<void> {
  try {
    // Validate query parameters using Zod schema
    const validationResult = AccountTimelineQueryParamsSchema.safeParse(req.query);
    
    if (handleValidationError(validationResult, res, req)) {
      return;
    }

    const queryParams = validationResult.data!;

    // Set default pagination values
    const page = queryParams.page || 1;
    const size = queryParams.size || 10;

    // Get tenant-aware admin client
    const tenantClient = getTenantAdminClient(req);

    // Build base query
    let query = tenantClient.getClient().from('account_timeline').select('*', { count: 'exact' });

    // Apply specific filters
    if (queryParams.accountId) {
      query = query.eq('account_id', queryParams.accountId);
    }

    if (queryParams.type) {
      query = query.eq('type', queryParams.type);
    }

    if (queryParams.responsibleId) {
      query = query.eq('responsible_id', queryParams.responsibleId);
    }

    if (queryParams.dateFrom) {
      query = query.gte('date', queryParams.dateFrom);
    }

    if (queryParams.dateTo) {
      query = query.lte('date', queryParams.dateTo);
    }

    try {
      // Apply dynamic filter if provided
      if (queryParams.filter) {
        // Safely decode URL-encoded filter string
        let decodedFilter = queryParams.filter;
        
        // Try multiple decoding attempts for different encoding levels
        try {
          // First attempt - single decode
          const firstDecode = decodeURIComponent(queryParams.filter);
          
          // Check if it still contains encoded characters
          if (firstDecode.includes('%')) {
            try {
              // Second attempt - double decode
              decodedFilter = decodeURIComponent(firstDecode);
            } catch {
              decodedFilter = firstDecode;
            }
          } else {
            decodedFilter = firstDecode;
          }
        } catch (decodeError) {
          // If all decoding fails, use the original string
          logger.warn('CONTROLLER', 'Failed to decode filter, using original', { 
            filter: queryParams.filter,
            error: (decodeError as Error).message
          });
        }
        
        logger.debug('CONTROLLER', 'Processing filter', { 
          original: queryParams.filter, 
          decoded: decodedFilter 
        });
        
        const parsedFilter = parseFilter(decodedFilter, 'account_timeline');
        logger.filterParsing(decodedFilter, true);
        query = applyFiltersToQuery(query, parsedFilter, 'account_timeline');
      }
    } catch (filterError) {
      let decodedFilter = '';
      if (queryParams.filter) {
        try {
          decodedFilter = decodeURIComponent(queryParams.filter);
        } catch {
          decodedFilter = queryParams.filter;
        }
      }
      logger.filterParsing(decodedFilter, false, filterError as Error);
      handleFilterError(filterError, res, req);
      return;
    }

    // Apply pagination
    query = buildPaginatedQuery(query, page, size);

    // Order by date descending (most recent first)
    query = query.order('date', { ascending: false });

    // Execute query
    const { data: timelines, error, count } = await query;

    if (error) {
      handleDatabaseError('SELECT', 'account_timeline', error, res, req);
      return;
    }

    // Convert database results (snake_case) to API format (camelCase)
    const apiTimelines = (timelines as AccountTimelineDB[]).map(accountTimelineDbToApi);
    
    // Return paginated response
    const response = createPaginatedResponse(apiTimelines, count || 0, page, size);
    res.status(200).json(response);

  } catch (error) {
    handleInternalError('fetching account timelines', error, res, req);
  }
}

/**
 * Get a single account timeline record by ID
 * GET /api/account-timeline/:id
 */
export async function getAccountTimelineById(req: TenantRequest, res: Response): Promise<void> {
  try {
    // Validate route parameters
    const paramValidation = AccountTimelineIdParamSchema.safeParse(req.params);
    
    if (handleValidationError(paramValidation, res)) {
      return;
    }

    const { id } = paramValidation.data!;

    // Get tenant-aware admin client
    const tenantClient = getTenantAdminClient(req);

    // Fetch timeline record from database
    const { data: timeline, error } = await tenantClient
      .getClient()
      .from('account_timeline')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !timeline) {
      handleNotFound('Timeline record', res, req);
      return;
    }

    // Convert database result (snake_case) to API format (camelCase) and return
    const apiTimeline = accountTimelineDbToApi(timeline as AccountTimelineDB);
    res.status(200).json(apiTimeline);

  } catch (error) {
    handleInternalError('fetching account timeline', error, res, req);
  }
}

/**
 * Update an existing account timeline record
 * PUT /api/account-timeline/:id
 */
export async function updateAccountTimeline(req: TenantRequest, res: Response): Promise<void> {
  try {
    // Validate route parameters
    const paramValidation = AccountTimelineIdParamSchema.safeParse(req.params);
    
    if (handleValidationError(paramValidation, res)) {
      return;
    }

    const { id } = paramValidation.data!;

    // Validate request body using Zod schema
    const validationResult = UpdateAccountTimelineSchema.safeParse(req.body);
    
    if (handleValidationError(validationResult, res, req)) {
      return;
    }

    const updateData = validationResult.data!;

    // Check if timeline record exists first
    const exists = await checkEntityExistsInTenant(req, 'account_timeline', id);
    if (!exists) {
      handleNotFound('Timeline record', res, req);
      return;
    }

    // Check foreign key constraints if they are being updated
    if (updateData.account) {
      const accountExists = await checkEntityExistsInTenant(req, 'account', updateData.account.id);
      if (!accountExists) {
        res.status(400).json({
          message: 'Referenced account does not exist',
          field: 'account'
        });
        return;
      }
    }

    if (updateData.responsible) {
      const userExists = await checkEntityExistsInTenant(req, 'users', updateData.responsible.id);
      if (!userExists) {
        res.status(400).json({
          message: 'Referenced user does not exist',
          field: 'responsible'
        });
        return;
      }
    }

    // Convert API data (camelCase) to database format (snake_case)
    const dbUpdateData = accountTimelineApiToDb(updateData);

    // Get tenant-aware admin client
    const tenantClient = getTenantAdminClient(req);

    // Update timeline record in database
    const { data: updatedTimeline, error } = await tenantClient
      .getClient()
      .from('account_timeline')
      .update(dbUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      handleDatabaseError('UPDATE', 'account_timeline', error, res, req);
      return;
    }

    // Convert database result (snake_case) to API format (camelCase) and return
    const apiTimeline = accountTimelineDbToApi(updatedTimeline as AccountTimelineDB);
    res.status(200).json(apiTimeline);

  } catch (error) {
    handleInternalError('updating account timeline', error, res, req);
  }
}

/**
 * Delete an account timeline record
 * DELETE /api/account-timeline/:id
 */
export async function deleteAccountTimeline(req: TenantRequest, res: Response): Promise<void> {
  try {
    // Validate route parameters
    const paramValidation = AccountTimelineIdParamSchema.safeParse(req.params);
    
    if (handleValidationError(paramValidation, res)) {
      return;
    }

    const { id } = paramValidation.data!;

    // Check if timeline record exists first
    const exists = await checkEntityExistsInTenant(req, 'account_timeline', id);
    if (!exists) {
      handleNotFound('Timeline record', res, req);
      return;
    }

    // Get tenant-aware admin client
    const tenantClient = getTenantAdminClient(req);

    // Delete timeline record from database
    const { error } = await tenantClient
      .getClient()
      .from('account_timeline')
      .delete()
      .eq('id', id);

    if (error) {
      handleDatabaseError('DELETE', 'account_timeline', error, res, req);
      return;
    }

    // Return success confirmation
    const language = getLanguageFromRequest(req);
    const message = getSuccessMessage('deleted', 'timeline', language);
    
    res.status(200).json({
      message,
      id: id
    });

  } catch (error) {
    handleInternalError('deleting account timeline', error, res, req);
  }
}

/**
 * Get timeline records for a specific account
 * GET /api/accounts/:accountId/timeline
 */
export async function getAccountTimelineByAccountId(req: TenantRequest, res: Response): Promise<void> {
  try {
    // Validate route parameters (accountId)
    const paramValidation = z.object({
      accountId: z.string().uuid()
    }).safeParse(req.params);
    
    if (handleValidationError(paramValidation, res)) {
      return;
    }

    const { accountId } = paramValidation.data!;

    // Validate query parameters for filtering and pagination
    const queryValidation = AccountTimelineQueryParamsSchema.safeParse(req.query);
    
    if (handleValidationError(queryValidation, res, req)) {
      return;
    }

    const queryParams = queryValidation.data!;

    // Check if account exists
    const accountExists = await checkEntityExistsInTenant(req, 'account', accountId);
    if (!accountExists) {
      handleNotFound('Account', res, req);
      return;
    }

    // Set default pagination values
    const page = queryParams.page || 1;
    const size = queryParams.size || 10;

    // Get tenant-aware admin client
    const tenantClient = getTenantAdminClient(req);

    // Build base query for specific account
    let query = tenantClient
      .getClient()
      .from('account_timeline')
      .select('*', { count: 'exact' })
      .eq('account_id', accountId);

    // Apply additional filters
    if (queryParams.type) {
      query = query.eq('type', queryParams.type);
    }

    if (queryParams.responsibleId) {
      query = query.eq('responsible_id', queryParams.responsibleId);
    }

    if (queryParams.dateFrom) {
      query = query.gte('date', queryParams.dateFrom);
    }

    if (queryParams.dateTo) {
      query = query.lte('date', queryParams.dateTo);
    }

    // Apply pagination
    query = buildPaginatedQuery(query, page, size);

    // Order by date descending (most recent first)
    query = query.order('date', { ascending: false });

    // Execute query
    const { data: timelines, error, count } = await query;

    if (error) {
      handleDatabaseError('SELECT', 'account_timeline', error, res, req);
      return;
    }

    // Convert database results (snake_case) to API format (camelCase)
    const apiTimelines = (timelines as AccountTimelineDB[]).map(accountTimelineDbToApi);
    
    // Return paginated response
    const response = createPaginatedResponse(apiTimelines, count || 0, page, size);
    res.status(200).json(response);

  } catch (error) {
    handleInternalError('fetching account timeline by account ID', error, res, req);
  }
}