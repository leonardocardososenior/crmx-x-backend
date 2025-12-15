import { Request, Response } from 'express';
import { supabaseAdmin } from '../supabaseClient';
import { 
  CreateAccountSchema, 
  UpdateAccountSchema, 
  QueryParamsSchema, 
  AccountIdParamSchema,
  CreateAccountInput,
  UpdateAccountInput,
  QueryParamsInput 
} from '../schemas/accountSchemas';
import { Account, AccountDB, accountDbToApi, accountApiToDb, AccountStatuses, AccountTypes } from '../types';
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
  checkEntityExists
} from '../utils/controllerHelpers';
import { getLanguageFromRequest, getSuccessMessage } from '../utils/translations';

/**
 * Create a new account
 * POST /api/accounts
 */
export async function createAccount(req: Request, res: Response): Promise<void> {
  try {
    // Validate request body using Zod schema
    const validationResult = CreateAccountSchema.safeParse(req.body);
    
    if (handleValidationError(validationResult, res, req)) {
      return;
    }

    const accountData = validationResult.data!;

    // Convert API data (camelCase) to database format (snake_case) and add defaults
    const dbAccountData = accountApiToDb(accountData);
    const accountToInsert = {
      ...dbAccountData,
      status: accountData.status || AccountStatuses.ACTIVE,
      type: accountData.type || AccountTypes.LEAD,
      pipeline: accountData.pipeline || 'Standard',
      last_interaction: new Date().toISOString()
    };

    // Insert account into database
    const { data: createdAccount, error } = await supabaseAdmin
      .from('account')
      .insert(accountToInsert)
      .select()
      .single();

    if (error) {
      handleDatabaseError('INSERT', 'account', error, res, req);
      return;
    }

    // Convert database result (snake_case) to API format (camelCase) and return
    const apiAccount = accountDbToApi(createdAccount as AccountDB);
    res.status(201).json(apiAccount);

  } catch (error) {
    handleInternalError('creating account', error, res, req);
  }
}

/**
 * Get accounts with filtering and pagination
 * GET /api/accounts
 */
export async function getAccounts(req: Request, res: Response): Promise<void> {
  try {
    // Validate query parameters using Zod schema
    const validationResult = QueryParamsSchema.safeParse(req.query);
    
    if (handleValidationError(validationResult, res, req)) {
      return;
    }

    const queryParams = validationResult.data!;

    // Set default pagination values
    const page = queryParams.page || 1;
    const size = queryParams.size || 10;

    // Build base query
    let query = supabaseAdmin.from('account').select('*', { count: 'exact' });

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
        
        const parsedFilter = parseFilter(decodedFilter);
        logger.filterParsing(decodedFilter, true);
        query = applyFiltersToQuery(query, parsedFilter);
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

    // Order by created_at descending
    query = query.order('created_at', { ascending: false });

    // Execute query
    const { data: accounts, error, count } = await query;

    if (error) {
      handleDatabaseError('SELECT', 'account', error, res, req);
      return;
    }

    // Convert database results (snake_case) to API format (camelCase)
    const apiAccounts = (accounts as AccountDB[]).map(accountDbToApi);
    
    // Return paginated response
    const response = createPaginatedResponse(apiAccounts, count || 0, page, size);
    res.status(200).json(response);

  } catch (error) {
    handleInternalError('fetching accounts', error, res, req);
  }
}

/**
 * Get a single account by ID
 * GET /api/accounts/:id
 */
export async function getAccountById(req: Request, res: Response): Promise<void> {
  try {
    // Validate route parameters
    const paramValidation = AccountIdParamSchema.safeParse(req.params);
    
    if (handleValidationError(paramValidation, res)) {
      return;
    }

    const { id } = paramValidation.data!;

    // Fetch account from database
    const { data: account, error } = await supabaseAdmin
      .from('account')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !account) {
      handleNotFound('Account', res, req);
      return;
    }

    // Convert database result (snake_case) to API format (camelCase) and return
    const apiAccount = accountDbToApi(account as AccountDB);
    res.status(200).json(apiAccount);

  } catch (error) {
    handleInternalError('fetching account', error, res, req);
  }
}

/**
 * Update an existing account
 * PUT /api/accounts/:id
 */
export async function updateAccount(req: Request, res: Response): Promise<void> {
  try {
    // Validate route parameters
    const paramValidation = AccountIdParamSchema.safeParse(req.params);
    
    if (handleValidationError(paramValidation, res)) {
      return;
    }

    const { id } = paramValidation.data!;

    // Validate request body using Zod schema
    const validationResult = UpdateAccountSchema.safeParse(req.body);
    
    if (handleValidationError(validationResult, res, req)) {
      return;
    }

    const updateData = validationResult.data!;

    // Check if account exists first
    const exists = await checkEntityExists('account', id);
    if (!exists) {
      handleNotFound('Account', res, req);
      return;
    }

    // Convert API data (camelCase) to database format (snake_case) and add timestamp
    const dbUpdateData = accountApiToDb(updateData);
    const accountUpdateData = {
      ...dbUpdateData,
      last_interaction: new Date().toISOString()
    };

    // Update account in database
    const { data: updatedAccount, error } = await supabaseAdmin
      .from('account')
      .update(accountUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      handleDatabaseError('UPDATE', 'account', error, res, req);
      return;
    }

    // Convert database result (snake_case) to API format (camelCase) and return
    const apiAccount = accountDbToApi(updatedAccount as AccountDB);
    res.status(200).json(apiAccount);

  } catch (error) {
    handleInternalError('updating account', error, res, req);
  }
}

/**
 * Delete an account
 * DELETE /api/accounts/:id
 */
export async function deleteAccount(req: Request, res: Response): Promise<void> {
  try {
    // Validate route parameters
    const paramValidation = AccountIdParamSchema.safeParse(req.params);
    
    if (handleValidationError(paramValidation, res)) {
      return;
    }

    const { id } = paramValidation.data!;

    // Check if account exists first
    const exists = await checkEntityExists('account', id);
    if (!exists) {
      handleNotFound('Account', res, req);
      return;
    }

    // Delete account from database
    // Note: Cascading operations for related business will be handled by database constraints
    const { error } = await supabaseAdmin
      .from('account')
      .delete()
      .eq('id', id);

    if (error) {
      handleDatabaseError('DELETE', 'account', error, res, req);
      return;
    }

    // Return success confirmation
    const language = getLanguageFromRequest(req);
    const message = getSuccessMessage('deleted', 'account', language);
    
    res.status(200).json({
      message,
      id: id
    });

  } catch (error) {
    handleInternalError('deleting account', error, res, req);
  }
}