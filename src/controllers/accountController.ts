import { Request, Response } from 'express';
import { supabaseAdmin } from '../supabaseClient';
import { TenantRequest } from '../types/tenant';
import { executeInTenantContext, getTenantClient } from '../utils/simpleTenantDatabase';
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
  checkEntityExistsInTenant
} from '../utils/controllerHelpers';
import { getLanguageFromRequest, getSuccessMessage } from '../utils/translations';

/**
 * Create a new account
 * POST /api/accounts
 */
export async function createAccount(req: TenantRequest, res: Response): Promise<void> {
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

    // Execute in tenant context - assumes schema exists
    const { data: createdAccount, error } = await executeInTenantContext(
      req.tenant!.tenantId,
      async (client) => {
        return await client
          .from('account')
          .insert(accountToInsert)
          .select()
          .single();
      }
    );



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
export async function getAccounts(req: TenantRequest, res: Response): Promise<void> {
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

    // Execute in tenant context using direct client configuration
    const result = await executeInTenantContext(
      req.tenant!.tenantId,
      async (client) => {
        console.log(`🔍 [CONTROLLER DEBUG] Using tenant client for schema: crmx_database_${req.tenant!.tenantId}`);
        
        // Build query with pagination
        const query = client
          .from('account')
          .select('*', { count: 'exact' });
        
        // Apply pagination and ordering
        const paginatedQuery = buildPaginatedQuery(query, page, size)
          .order('created_at', { ascending: false });

        // Execute query
        return await paginatedQuery;
      }
    );

    const { data: accounts, error, count } = result;

    if (error) {
      console.error(`🔍 [CONTROLLER DEBUG] Query Error:`, error);
      handleDatabaseError('SELECT', 'account', error, res, req);
      return;
    }

    console.log(`🔍 [CONTROLLER DEBUG] Found ${accounts?.length || 0} accounts, total: ${count || 0}`);

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
export async function getAccountById(req: TenantRequest, res: Response): Promise<void> {
  try {
    // Validate route parameters
    const paramValidation = AccountIdParamSchema.safeParse(req.params);
    
    if (handleValidationError(paramValidation, res)) {
      return;
    }

    const { id } = paramValidation.data!;

    // Execute in tenant context - assumes schema exists
    const { data: account, error } = await executeInTenantContext(
      req.tenant!.tenantId,
      async (client) => {
        return await client
          .from('account')
          .select('*')
          .eq('id', id)
          .single();
      }
    );

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
export async function updateAccount(req: TenantRequest, res: Response): Promise<void> {
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
    const exists = await checkEntityExistsInTenant(req, 'account', id);
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

    // Execute in tenant context - assumes schema exists
    const { data: updatedAccount, error } = await executeInTenantContext(
      req.tenant!.tenantId,
      async (client) => {
        return await client
          .from('account')
          .update(accountUpdateData)
          .eq('id', id)
          .select()
          .single();
      }
    );

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
export async function deleteAccount(req: TenantRequest, res: Response): Promise<void> {
  try {
    // Validate route parameters
    const paramValidation = AccountIdParamSchema.safeParse(req.params);
    
    if (handleValidationError(paramValidation, res)) {
      return;
    }

    const { id } = paramValidation.data!;

    // Check if account exists first
    const exists = await checkEntityExistsInTenant(req, 'account', id);
    if (!exists) {
      handleNotFound('Account', res, req);
      return;
    }

    // Execute in tenant context - assumes schema exists
    const { error } = await executeInTenantContext(
      req.tenant!.tenantId,
      async (client) => {
        return await client
          .from('account')
          .delete()
          .eq('id', id);
      }
    );

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