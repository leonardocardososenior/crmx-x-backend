import { Request, Response } from 'express';
import { supabaseAdmin } from '../supabaseClient';
import { 
  CreateBusinessSchema, 
  UpdateBusinessSchema, 
  BusinessQueryParamsSchema, 
  BusinessIdParamSchema,
  CreateBusinessInput,
  UpdateBusinessInput,
  BusinessQueryParamsInput 
} from '../schemas/accountSchemas';
import { BusinessDB, businessDbToApi, businessApiToDb, Currencies } from '../types';
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
 * Create a new business
 * POST /api/business
 */
export async function createBusiness(req: Request, res: Response): Promise<void> {
  try {
    // Validate request body using Zod schema
    const validationResult = CreateBusinessSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      handleValidationError(validationResult, res, req);
      return;
    }

    const businessData: CreateBusinessInput = validationResult.data;

    // Convert API data (camelCase) to database format (snake_case) and add defaults
    const dbBusinessData = businessApiToDb(businessData);
    const businessToInsert = {
      ...dbBusinessData,
      currency: businessData.currency || Currencies.BRL
    };

    // Insert business into database
    const { data: createdBusiness, error } = await supabaseAdmin
      .from('business')
      .insert(businessToInsert)
      .select()
      .single();

    if (error) {
      handleDatabaseError('INSERT', 'business', error, res, req);
      return;
    }

    // Convert database result (snake_case) to API format (camelCase) and return
    const apiBusiness = businessDbToApi(createdBusiness as BusinessDB);
    res.status(201).json(apiBusiness);

  } catch (error) {
    handleInternalError('creating business', error, res, req);
  }
}

/**
 * Get business with filtering and pagination
 * GET /api/business
 */
export async function getBusiness(req: Request, res: Response): Promise<void> {
  try {
    // Validate query parameters using Zod schema
    const validationResult = BusinessQueryParamsSchema.safeParse(req.query);
    
    if (!validationResult.success) {
      handleValidationError(validationResult, res, req);
      return;
    }

    const queryParams: BusinessQueryParamsInput = validationResult.data;

    // Set default pagination values
    const page = queryParams.page || 1;
    const size = queryParams.size || 10;

    // Build base query
    let query = supabaseAdmin.from('business').select('*', { count: 'exact' });

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
    const { data: business, error, count } = await query;

    if (error) {
      handleDatabaseError('SELECT', 'business', error, res, req);
      return;
    }

    // Convert database results (snake_case) to API format (camelCase)
    const apiBusiness = (business as BusinessDB[]).map(businessDbToApi);
    
    // Return paginated response
    const response = createPaginatedResponse(apiBusiness, count || 0, page, size);
    res.status(200).json(response);

  } catch (error) {
    handleInternalError('fetching business', error, res, req);
  }
}

/**
 * Get a single business by ID
 * GET /api/business/:id
 */
export async function getBusinessById(req: Request, res: Response): Promise<void> {
  try {
    // Validate route parameters
    const paramValidation = BusinessIdParamSchema.safeParse(req.params);
    
    if (!paramValidation.success) {
      handleValidationError(paramValidation, res);
      return;
    }

    const { id } = paramValidation.data;

    // Fetch business from database
    const { data: business, error } = await supabaseAdmin
      .from('business')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !business) {
      handleNotFound('Business', res, req);
      return;
    }

    // Convert database result (snake_case) to API format (camelCase) and return
    const apiBusiness = businessDbToApi(business as BusinessDB);
    res.status(200).json(apiBusiness);

  } catch (error) {
    handleInternalError('fetching business', error, res, req);
  }
}
/**
 * Update an existing business
 * PUT /api/business/:id
 */
export async function updateBusiness(req: Request, res: Response): Promise<void> {
  try {
    // Validate route parameters
    const paramValidation = BusinessIdParamSchema.safeParse(req.params);
    
    if (!paramValidation.success) {
      handleValidationError(paramValidation, res);
      return;
    }

    const { id } = paramValidation.data;

    // Validate request body using Zod schema
    const validationResult = UpdateBusinessSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      handleValidationError(validationResult, res, req);
      return;
    }

    const updateData: UpdateBusinessInput = validationResult.data;

    // Check if business exists first
    const exists = await checkEntityExists('business', id);
    if (!exists) {
      handleNotFound('Business', res, req);
      return;
    }

    // Convert API data (camelCase) to database format (snake_case)
    const dbUpdateData = businessApiToDb(updateData);

    // Update business in database
    const { data: updatedBusiness, error } = await supabaseAdmin
      .from('business')
      .update(dbUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      handleDatabaseError('UPDATE', 'business', error, res, req);
      return;
    }

    // Convert database result (snake_case) to API format (camelCase) and return
    const apiBusiness = businessDbToApi(updatedBusiness as BusinessDB);
    res.status(200).json(apiBusiness);

  } catch (error) {
    handleInternalError('updating business', error, res, req);
  }
}
/**
 * Delete a business
 * DELETE /api/business/:id
 */
export async function deleteBusiness(req: Request, res: Response): Promise<void> {
  try {
    // Validate route parameters
    const paramValidation = BusinessIdParamSchema.safeParse(req.params);
    
    if (!paramValidation.success) {
      handleValidationError(paramValidation, res);
      return;
    }

    const { id } = paramValidation.data;

    // Check if business exists first
    const exists = await checkEntityExists('business', id);
    if (!exists) {
      handleNotFound('Business', res, req);
      return;
    }

    // Delete business from database
    const { error } = await supabaseAdmin
      .from('business')
      .delete()
      .eq('id', id);

    if (error) {
      handleDatabaseError('DELETE', 'business', error, res, req);
      return;
    }

    // Return success confirmation
    const language = getLanguageFromRequest(req);
    const message = getSuccessMessage('deleted', 'business', language);
    
    res.status(200).json({
      message,
      id: id
    });

  } catch (error) {
    handleInternalError('deleting business', error, res, req);
  }
}