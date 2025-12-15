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
import { Account, AccountDB, PaginatedResponse, ErrorResponse, accountDbToApi, accountApiToDb, AccountStatuses, AccountTypes, UserRoles } from '../types';

/**
 * Create a new account
 * POST /api/accounts
 */
export async function createAccount(req: Request, res: Response): Promise<void> {
  try {
    // Validate request body using Zod schema
    const validationResult = CreateAccountSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid account data provided',
        details: validationResult.error.errors
      } as ErrorResponse);
      return;
    }

    const accountData: CreateAccountInput = validationResult.data;

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
      console.error('Database error creating account:', error);
      
      // Handle foreign key constraint violation (invalid owner_id)
      if (error.code === '23503' && error.details?.includes('owner_id')) {
        res.status(400).json({
          error: 'Foreign Key Violation',
          message: 'Invalid owner_id: referenced profile does not exist',
          details: error
        } as ErrorResponse);
        return;
      }

      res.status(500).json({
        error: 'Database Error',
        message: 'Failed to create account',
        details: error
      } as ErrorResponse);
      return;
    }

    // Convert database result (snake_case) to API format (camelCase) and return
    const apiAccount = accountDbToApi(createdAccount as AccountDB);
    res.status(201).json(apiAccount);

  } catch (error) {
    console.error('Error in createAccount:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while creating the account'
    } as ErrorResponse);
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
    
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid query parameters provided',
        details: validationResult.error.errors
      } as ErrorResponse);
      return;
    }

    const queryParams: QueryParamsInput = validationResult.data;

    // Set default pagination values
    const page = queryParams.page || 1;
    const limit = queryParams.limit || 10;
    const offset = (page - 1) * limit;

    // Build query
    let query = supabaseAdmin.from('account').select('*', { count: 'exact' });

    // Apply search filter (name or segment)
    if (queryParams.search) {
      query = query.or(`name.ilike.%${queryParams.search}%,segment.ilike.%${queryParams.search}%`);
    }

    // Apply status filter
    if (queryParams.status) {
      query = query.eq('status', queryParams.status);
    }

    // Apply type filter
    if (queryParams.type) {
      query = query.eq('type', queryParams.type);
    }

    // Apply ownerId filter
    if (queryParams.ownerId) {
      query = query.eq('owner_id', queryParams.ownerId);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Order by created_at descending
    query = query.order('created_at', { ascending: false });

    // Execute query
    const { data: accounts, error, count } = await query;

    if (error) {
      console.error('Database error fetching accounts:', error);
      res.status(500).json({
        error: 'Database Error',
        message: 'Failed to fetch accounts',
        details: error
      } as ErrorResponse);
      return;
    }

    // Calculate pagination metadata
    const totalElements = count || 0;
    const totalPages = Math.ceil(totalElements / limit);

    // Convert database results (snake_case) to API format (camelCase)
    const apiAccounts = (accounts as AccountDB[]).map(accountDbToApi);
    
    // Return paginated response
    const response: PaginatedResponse<Account> = {
      contents: apiAccounts,
      totalElements,
      totalPages
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error in getAccounts:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while fetching accounts'
    } as ErrorResponse);
  }
}
/**
 * Update an existing account
 * PATCH /api/accounts/:id
 */
export async function updateAccount(req: Request, res: Response): Promise<void> {
  try {
    // Validate route parameters
    const paramValidation = AccountIdParamSchema.safeParse(req.params);
    
    if (!paramValidation.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid account ID provided',
        details: paramValidation.error.errors
      } as ErrorResponse);
      return;
    }

    const { id } = paramValidation.data;

    // Validate request body using Zod schema
    const validationResult = UpdateAccountSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid account update data provided',
        details: validationResult.error.errors
      } as ErrorResponse);
      return;
    }

    const updateData: UpdateAccountInput = validationResult.data;

    // Check if account exists first
    const { data: existingAccount, error: fetchError } = await supabaseAdmin
      .from('account')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingAccount) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Account not found'
      } as ErrorResponse);
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
      console.error('Database error updating account:', error);
      
      // Handle foreign key constraint violation (invalid owner_id)
      if (error.code === '23503' && error.details?.includes('owner_id')) {
        res.status(400).json({
          error: 'Foreign Key Violation',
          message: 'Invalid owner_id: referenced profile does not exist',
          details: error
        } as ErrorResponse);
        return;
      }

      res.status(500).json({
        error: 'Database Error',
        message: 'Failed to update account',
        details: error
      } as ErrorResponse);
      return;
    }

    // Convert database result (snake_case) to API format (camelCase) and return
    const apiAccount = accountDbToApi(updatedAccount as AccountDB);
    res.status(200).json(apiAccount);

  } catch (error) {
    console.error('Error in updateAccount:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while updating the account'
    } as ErrorResponse);
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
    
    if (!paramValidation.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid account ID provided',
        details: paramValidation.error.errors
      } as ErrorResponse);
      return;
    }

    const { id } = paramValidation.data;

    // Check if account exists first
    const { data: existingAccount, error: fetchError } = await supabaseAdmin
      .from('account')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingAccount) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Account not found'
      } as ErrorResponse);
      return;
    }

    // Delete account from database
    // Note: Cascading operations for related deal will be handled by database constraints
    const { error } = await supabaseAdmin
      .from('account')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Database error deleting account:', error);
      
      // Handle foreign key constraint violation (related deals exist)
      if (error.code === '23503') {
        res.status(409).json({
          error: 'Constraint Violation',
          message: 'Cannot delete account: related deal exist. Please delete related deal first or handle cascading operations.',
          details: error
        } as ErrorResponse);
        return;
      }

      res.status(500).json({
        error: 'Database Error',
        message: 'Failed to delete account',
        details: error
      } as ErrorResponse);
      return;
    }

    // Return success confirmation
    res.status(200).json({
      message: 'Account deleted successfully',
      id: id
    });

  } catch (error) {
    console.error('Error in deleteAccount:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while deleting the account'
    } as ErrorResponse);
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
    
    if (!paramValidation.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid account ID provided',
        details: paramValidation.error.errors
      } as ErrorResponse);
      return;
    }

    const { id } = paramValidation.data;

    // Fetch account from database
    const { data: account, error } = await supabaseAdmin
      .from('account')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !account) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Account not found'
      } as ErrorResponse);
      return;
    }

    // Convert database result (snake_case) to API format (camelCase) and return
    const apiAccount = accountDbToApi(account as AccountDB);
    res.status(200).json(apiAccount);

  } catch (error) {
    console.error('Error in getAccountById:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while fetching the account'
    } as ErrorResponse);
  }
}