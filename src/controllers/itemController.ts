import { Request, Response } from 'express';
import { supabaseAdmin } from '../supabaseClient';
import { TenantRequest } from '../types/tenant';
import { getTenantAdminClient } from '../utils/tenantClientHelper';
import { 
  CreateItemSchema, 
  UpdateItemSchema, 
  ItemQueryParamsSchema, 
  ItemIdParamSchema,
  CreateItemInput,
  UpdateItemInput,
  ItemQueryParamsInput 
} from '../schemas/itemSchemas';
import { Item, ItemDB, itemDbToApi, itemApiToDb } from '../types';
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
 * Create a new item
 * POST /api/items
 */
export async function createItem(req: TenantRequest, res: Response): Promise<void> {
  try {
    // Validate request body using Zod schema
    const validationResult = CreateItemSchema.safeParse(req.body);
    
    if (handleValidationError(validationResult, res, req)) {
      return;
    }

    const itemData = validationResult.data!;

    // Convert API data (camelCase) to database format (snake_case)
    const dbItemData = itemApiToDb(itemData);

    // Get tenant-aware admin client
    const tenantClient = getTenantAdminClient(req);

    // Insert item into database
    const { data: createdItem, error } = await tenantClient
      .getClient()
      .from('item')
      .insert(dbItemData)
      .select()
      .single();

    if (error) {
      handleDatabaseError('INSERT', 'item', error, res, req);
      return;
    }

    // Convert database result (snake_case) to API format (camelCase) and return
    const apiItem = itemDbToApi(createdItem as ItemDB);
    res.status(201).json(apiItem);

  } catch (error) {
    handleInternalError('creating item', error, res, req);
  }
}

/**
 * Get items with filtering and pagination
 * GET /api/items
 */
export async function getItems(req: TenantRequest, res: Response): Promise<void> {
  try {
    // Validate query parameters using Zod schema
    const validationResult = ItemQueryParamsSchema.safeParse(req.query);
    
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
    let query = tenantClient.getClient().from('item').select('*', { count: 'exact' });

    // Apply search filter if provided
    if (queryParams.search) {
      query = query.or(`name.ilike.%${queryParams.search}%,description.ilike.%${queryParams.search}%`);
    }

    // Apply type filter if provided
    if (queryParams.type) {
      query = query.eq('type', queryParams.type);
    }

    // Apply price range filters if provided
    if (queryParams.minPrice !== undefined) {
      query = query.gte('price', queryParams.minPrice);
    }
    if (queryParams.maxPrice !== undefined) {
      query = query.lte('price', queryParams.maxPrice);
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
        
        const parsedFilter = parseFilter(decodedFilter, 'item');
        logger.filterParsing(decodedFilter, true);
        query = applyFiltersToQuery(query, parsedFilter, 'item');
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
    const { data: items, error, count } = await query;

    if (error) {
      handleDatabaseError('SELECT', 'item', error, res, req);
      return;
    }

    // Convert database results (snake_case) to API format (camelCase)
    const apiItems = (items as ItemDB[]).map(itemDbToApi);
    
    // Return paginated response
    const response = createPaginatedResponse(apiItems, count || 0, page, size);
    res.status(200).json(response);

  } catch (error) {
    handleInternalError('fetching items', error, res, req);
  }
}

/**
 * Get a single item by ID
 * GET /api/items/:id
 */
export async function getItemById(req: TenantRequest, res: Response): Promise<void> {
  try {
    // Validate route parameters
    const paramValidation = ItemIdParamSchema.safeParse(req.params);
    
    if (handleValidationError(paramValidation, res)) {
      return;
    }

    const { id } = paramValidation.data!;

    // Get tenant-aware admin client
    const tenantClient = getTenantAdminClient(req);

    // Fetch item from database
    const { data: item, error } = await tenantClient
      .getClient()
      .from('item')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !item) {
      handleNotFound('Item', res, req);
      return;
    }

    // Convert database result (snake_case) to API format (camelCase) and return
    const apiItem = itemDbToApi(item as ItemDB);
    res.status(200).json(apiItem);

  } catch (error) {
    handleInternalError('fetching item', error, res, req);
  }
}

/**
 * Update an existing item
 * PUT /api/items/:id
 */
export async function updateItem(req: TenantRequest, res: Response): Promise<void> {
  try {
    // Validate route parameters
    const paramValidation = ItemIdParamSchema.safeParse(req.params);
    
    if (handleValidationError(paramValidation, res)) {
      return;
    }

    const { id } = paramValidation.data!;

    // Validate request body using Zod schema
    const validationResult = UpdateItemSchema.safeParse(req.body);
    
    if (handleValidationError(validationResult, res, req)) {
      return;
    }

    const updateData = validationResult.data!;

    // Check if item exists first
    const exists = await checkEntityExistsInTenant(req, 'item', id);
    if (!exists) {
      handleNotFound('Item', res, req);
      return;
    }

    // Convert API data (camelCase) to database format (snake_case)
    const dbUpdateData = itemApiToDb(updateData);

    // Get tenant-aware admin client
    const tenantClient = getTenantAdminClient(req);

    // Update item in database
    const { data: updatedItem, error } = await tenantClient
      .getClient()
      .from('item')
      .update(dbUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      handleDatabaseError('UPDATE', 'item', error, res, req);
      return;
    }

    // Convert database result (snake_case) to API format (camelCase) and return
    const apiItem = itemDbToApi(updatedItem as ItemDB);
    res.status(200).json(apiItem);

  } catch (error) {
    handleInternalError('updating item', error, res, req);
  }
}

/**
 * Delete an item
 * DELETE /api/items/:id
 */
export async function deleteItem(req: TenantRequest, res: Response): Promise<void> {
  try {
    // Validate route parameters
    const paramValidation = ItemIdParamSchema.safeParse(req.params);
    
    if (handleValidationError(paramValidation, res)) {
      return;
    }

    const { id } = paramValidation.data!;

    // Check if item exists first
    const exists = await checkEntityExistsInTenant(req, 'item', id);
    if (!exists) {
      handleNotFound('Item', res, req);
      return;
    }

    // Get tenant-aware admin client
    const tenantClient = getTenantAdminClient(req);

    // Delete item from database
    // Note: Cascading operations for related business will be handled by database constraints
    const { error } = await tenantClient
      .getClient()
      .from('item')
      .delete()
      .eq('id', id);

    if (error) {
      handleDatabaseError('DELETE', 'item', error, res, req);
      return;
    }

    // Return success confirmation
    const language = getLanguageFromRequest(req);
    const message = getSuccessMessage('deleted', 'item', language);
    
    res.status(200).json({
      message,
      id: id
    });

  } catch (error) {
    handleInternalError('deleting item', error, res, req);
  }
}