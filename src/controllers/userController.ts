import { Request, Response } from 'express';
import { supabaseAdmin } from '../supabaseClient';
import { 
  CreateUserSchema, 
  UpdateUserSchema, 
  UserQueryParamsSchema, 
  UserIdParamSchema,
  CreateUserInput,
  UpdateUserInput,
  UserQueryParamsInput 
} from '../schemas/accountSchemas';
import { UserDB, userDbToApi, userApiToDb, UserRoles } from '../types';
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
 * Create a new user
 * POST /api/users
 */
export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    // Validate request body using Zod schema
    const validationResult = CreateUserSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      handleValidationError(validationResult, res, req);
      return;
    }

    const userData: CreateUserInput = validationResult.data;

    // Convert API data (camelCase) to database format (snake_case) and add defaults
    const dbUserData = userApiToDb(userData);
    const userToInsert = {
      ...dbUserData,
      role: userData.role || UserRoles.SALES_REP
    };

    // Insert user into database
    const { data: createdUser, error } = await supabaseAdmin
      .from('users')
      .insert(userToInsert)
      .select()
      .single();

    if (error) {
      handleDatabaseError('INSERT', 'users', error, res, req);
      return;
    }

    // Convert database result (snake_case) to API format (camelCase) and return
    const apiUser = userDbToApi(createdUser as UserDB);
    res.status(201).json(apiUser);

  } catch (error) {
    handleInternalError('creating user', error, res, req);
  }
}

/**
 * Get users with filtering and pagination
 * GET /api/users
 */
export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    // Validate query parameters using Zod schema
    const validationResult = UserQueryParamsSchema.safeParse(req.query);
    
    if (!validationResult.success) {
      handleValidationError(validationResult, res, req);
      return;
    }

    const queryParams: UserQueryParamsInput = validationResult.data;

    // Set default pagination values
    const page = queryParams.page || 1;
    const size = queryParams.size || 10;

    // Build base query
    let query = supabaseAdmin.from('users').select('*', { count: 'exact' });

    // Apply dynamic filter if provided
    if (queryParams.filter) {
      try {
        // Safely decode URL-encoded filter string
        let decodedFilter = queryParams.filter;
        
        try {
          const firstDecode = decodeURIComponent(queryParams.filter);
          if (firstDecode.includes('%')) {
            try {
              decodedFilter = decodeURIComponent(firstDecode);
            } catch {
              decodedFilter = firstDecode;
            }
          } else {
            decodedFilter = firstDecode;
          }
        } catch (decodeError) {
          // If decoding fails, use the original string
          decodedFilter = queryParams.filter;
        }
        
        const { parseFilter, applyFiltersToQuery } = await import('../utils/filterParser');
        const parsedFilter = parseFilter(decodedFilter);
        query = applyFiltersToQuery(query, parsedFilter);
      } catch (filterError) {
        handleFilterError(filterError, res, req);
        return;
      }
    }

    // Apply pagination
    query = buildPaginatedQuery(query, page, size);

    // Order by created_at descending
    query = query.order('created_at', { ascending: false });

    // Execute query
    const { data: users, error, count } = await query;

    if (error) {
      handleDatabaseError('SELECT', 'users', error, res, req);
      return;
    }

    // Convert database results (snake_case) to API format (camelCase)
    const apiUsers = (users as UserDB[]).map(userDbToApi);
    
    // Return paginated response
    const response = createPaginatedResponse(apiUsers, count || 0, page, size);
    res.status(200).json(response);

  } catch (error) {
    handleInternalError('fetching users', error, res, req);
  }
}

/**
 * Get a single user by ID
 * GET /api/users/:id
 */
export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    // Validate route parameters
    const paramValidation = UserIdParamSchema.safeParse(req.params);
    
    if (!paramValidation.success) {
      handleValidationError(paramValidation, res);
      return;
    }

    const { id } = paramValidation.data;

    // Fetch user from database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !user) {
      handleNotFound('User', res, req);
      return;
    }

    // Convert database result (snake_case) to API format (camelCase) and return
    const apiUser = userDbToApi(user as UserDB);
    res.status(200).json(apiUser);

  } catch (error) {
    handleInternalError('fetching user', error, res, req);
  }
}

/**
 * Update an existing user
 * PUT /api/users/:id
 */
export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    // Validate route parameters
    const paramValidation = UserIdParamSchema.safeParse(req.params);
    
    if (!paramValidation.success) {
      handleValidationError(paramValidation, res);
      return;
    }

    const { id } = paramValidation.data;

    // Validate request body using Zod schema
    const validationResult = UpdateUserSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      handleValidationError(validationResult, res, req);
      return;
    }

    const updateData: UpdateUserInput = validationResult.data;

    // Check if user exists first
    const exists = await checkEntityExists('users', id);
    if (!exists) {
      handleNotFound('User', res, req);
      return;
    }

    // Convert API data (camelCase) to database format (snake_case)
    const dbUpdateData = userApiToDb(updateData);

    // Update user in database
    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(dbUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      handleDatabaseError('UPDATE', 'users', error, res, req);
      return;
    }

    // Convert database result (snake_case) to API format (camelCase) and return
    const apiUser = userDbToApi(updatedUser as UserDB);
    res.status(200).json(apiUser);

  } catch (error) {
    handleInternalError('updating user', error, res, req);
  }
}

/**
 * Delete a user
 * DELETE /api/users/:id
 */
export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    // Validate route parameters
    const paramValidation = UserIdParamSchema.safeParse(req.params);
    
    if (!paramValidation.success) {
      handleValidationError(paramValidation, res);
      return;
    }

    const { id } = paramValidation.data;

    // Check if user exists first
    const exists = await checkEntityExists('users', id);
    if (!exists) {
      handleNotFound('User', res, req);
      return;
    }

    // Delete user from database
    // Note: Cascading operations for related accounts and business will be handled by database constraints
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      handleDatabaseError('DELETE', 'users', error, res, req);
      return;
    }

    // Return success confirmation
    const language = getLanguageFromRequest(req);
    const message = getSuccessMessage('deleted', 'user', language);
    
    res.status(200).json({
      message,
      id: id
    });

  } catch (error) {
    handleInternalError('deleting user', error, res, req);
  }
}