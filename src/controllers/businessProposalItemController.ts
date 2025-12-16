import { Request, Response } from 'express';
import { supabaseAdmin } from '../supabaseClient';
import { 
  CreateBusinessProposalItemSchema, 
  UpdateBusinessProposalItemSchema, 
  BusinessProposalItemQueryParamsSchema, 
  BusinessProposalItemIdParamSchema,
  CreateBusinessProposalItemInput,
  UpdateBusinessProposalItemInput,
  BusinessProposalItemQueryParamsInput 
} from '../schemas/businessProposalSchemas';
import { 
  BusinessProposalItemDB,
  businessProposalItemDbToApi, 
  businessProposalItemApiToDb
} from '../types';
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
import { logger } from '../utils/logger';

/**
 * Create a new business proposal item
 * POST /api/business-proposal-items
 */
export async function createBusinessProposalItem(req: Request, res: Response): Promise<void> {
  const requestId = (req as any).requestId;
  const startTime = Date.now();
  
  try {
    logger.proposalItemOperation('CREATE_START', undefined, req.body?.proposal?.id, {
      requestId,
      itemId: req.body?.item?.id
    });

    // Validate request body using Zod schema
    const validationResult = CreateBusinessProposalItemSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      logger.proposalItemError('CREATE_VALIDATION_FAILED', new Error('Validation failed'), undefined, req.body?.proposal?.id);
      handleValidationError(validationResult, res, req);
      return;
    }

    const itemData: CreateBusinessProposalItemInput = validationResult.data;

    // Check if business proposal exists
    const proposalExists = await checkEntityExists('business_proposal', itemData.proposal.id);
    if (!proposalExists) {
      logger.proposalItemError('CREATE_PROPOSAL_NOT_FOUND', new Error('Proposal not found'), undefined, itemData.proposal.id);
      handleNotFound('Proposal', res, req);
      return;
    }

    // Check if item exists
    const itemExists = await checkEntityExists('item', itemData.item.id);
    if (!itemExists) {
      logger.proposalItemError('CREATE_ITEM_NOT_FOUND', new Error('Item not found'), undefined, itemData.proposal.id);
      handleNotFound('Item', res, req);
      return;
    }

    // Convert API data (camelCase) to database format (snake_case) and calculate total
    const dbItemData = businessProposalItemApiToDb(itemData);
    const total = (itemData.quantity * itemData.unitPrice) - (itemData.discount || 0);
    
    // Validate calculation
    if (total < 0) {
      logger.proposalItemError('CREATE_NEGATIVE_TOTAL', new Error(`Negative total calculated: ${total}`), undefined, itemData.proposal.id);
      const language = getLanguageFromRequest(req);
      const errorMessages = {
        'pt-BR': 'O desconto não pode ser maior que o valor total do item',
        'en-US': 'Discount cannot be greater than the total item value',
        'es-CO': 'El descuento no puede ser mayor que el valor total del artículo'
      };
      
      res.status(400).json({
        message: errorMessages[language] || errorMessages['pt-BR'],
        status: 400,
        requestId: (req as any).requestId
      });
      return;
    }
    
    if (itemData.quantity <= 0) {
      logger.proposalItemError('CREATE_INVALID_QUANTITY', new Error(`Invalid quantity: ${itemData.quantity}`), undefined, itemData.proposal.id);
      const language = getLanguageFromRequest(req);
      const errorMessages = {
        'pt-BR': 'A quantidade deve ser maior que zero',
        'en-US': 'Quantity must be greater than zero',
        'es-CO': 'La cantidad debe ser mayor que cero'
      };
      
      res.status(400).json({
        message: errorMessages[language] || errorMessages['pt-BR'],
        status: 400,
        requestId: (req as any).requestId
      });
      return;
    }
    
    if (itemData.unitPrice < 0) {
      logger.proposalItemError('CREATE_NEGATIVE_PRICE', new Error(`Negative unit price: ${itemData.unitPrice}`), undefined, itemData.proposal.id);
      const language = getLanguageFromRequest(req);
      const errorMessages = {
        'pt-BR': 'O preço unitário não pode ser negativo',
        'en-US': 'Unit price cannot be negative',
        'es-CO': 'El precio unitario no puede ser negativo'
      };
      
      res.status(400).json({
        message: errorMessages[language] || errorMessages['pt-BR'],
        status: 400,
        requestId: (req as any).requestId
      });
      return;
    }
    
    const itemToInsert = {
      ...dbItemData,
      total: total
    };

    // Insert business proposal item into database
    const { data: createdItem, error } = await supabaseAdmin
      .from('business_proposal_item')
      .insert(itemToInsert)
      .select()
      .single();

    if (error) {
      logger.proposalItemError('CREATE_DB_ERROR', error as Error, undefined, itemData.proposal.id);
      handleDatabaseError('INSERT', 'business_proposal_item', error, res, req);
      return;
    }

    // Convert database result (snake_case) to API format (camelCase) and return
    const apiItem = businessProposalItemDbToApi(createdItem as BusinessProposalItemDB);
    
    const duration = Date.now() - startTime;
    logger.proposalItemOperation('CREATE_SUCCESS', createdItem.id, itemData.proposal.id, {
      requestId,
      duration,
      total: apiItem.total
    });
    
    res.status(201).json(apiItem);

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.proposalItemError('CREATE_INTERNAL_ERROR', error as Error, undefined, req.body?.proposal?.id);
    logger.error('CONTROLLER', `Business proposal item creation failed after ${duration}ms`, error as Error, {
      requestId,
      duration,
      proposalId: req.body?.proposal?.id,
      itemId: req.body?.item?.id
    });
    handleInternalError('creating business proposal item', error, res, req);
  }
}

/**
 * Get business proposal items with filtering and pagination
 * GET /api/business-proposal-items
 */
export async function getBusinessProposalItems(req: Request, res: Response): Promise<void> {
  const requestId = (req as any).requestId;
  const startTime = Date.now();
  
  try {
    logger.proposalItemOperation('LIST_START', undefined, undefined, { 
      requestId,
      queryParams: Object.keys(req.query).length 
    });

    // Validate query parameters using Zod schema
    const validationResult = BusinessProposalItemQueryParamsSchema.safeParse(req.query);
    
    if (!validationResult.success) {
      logger.proposalItemError('LIST_VALIDATION_FAILED', new Error('Query validation failed'), undefined, undefined);
      handleValidationError(validationResult, res, req);
      return;
    }

    const queryParams: BusinessProposalItemQueryParamsInput = validationResult.data;

    // Set default pagination values
    const page = queryParams.page || 1;
    const size = queryParams.size || 10;

    // Build base query
    let query = supabaseAdmin
      .from('business_proposal_item')
      .select('*', { count: 'exact' });

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
        const parsedFilter = parseFilter(decodedFilter, 'business_proposal_item');
        query = applyFiltersToQuery(query, parsedFilter, 'business_proposal_item');
      } catch (filterError) {
        handleFilterError(filterError, res, req);
        return;
      }
    }

    // Apply specific filters
    if (queryParams.proposalId) {
      query = query.eq('proposal_id', queryParams.proposalId);
    }
    
    if (queryParams.itemId) {
      query = query.eq('item_id', queryParams.itemId);
    }
    
    if (queryParams.minQuantity !== undefined) {
      query = query.gte('quantity', queryParams.minQuantity);
    }
    
    if (queryParams.maxQuantity !== undefined) {
      query = query.lte('quantity', queryParams.maxQuantity);
    }
    
    if (queryParams.minUnitPrice !== undefined) {
      query = query.gte('unit_price', queryParams.minUnitPrice);
    }
    
    if (queryParams.maxUnitPrice !== undefined) {
      query = query.lte('unit_price', queryParams.maxUnitPrice);
    }

    // Apply search if provided
    if (queryParams.search) {
      query = query.ilike('name', `%${queryParams.search}%`);
    }

    // Apply pagination
    query = buildPaginatedQuery(query, page, size);

    // Order by created_at ascending (items in order they were added)
    query = query.order('created_at', { ascending: true });

    // Execute query
    const { data: items, error, count } = await query;

    if (error) {
      handleDatabaseError('SELECT', 'business_proposal_item', error, res, req);
      return;
    }

    // Convert database results (snake_case) to API format (camelCase)
    const apiItems = (items as BusinessProposalItemDB[]).map(businessProposalItemDbToApi);
    
    // Return paginated response
    const response = createPaginatedResponse(apiItems, count || 0, page, size);
    
    const duration = Date.now() - startTime;
    logger.proposalItemOperation('LIST_SUCCESS', undefined, undefined, {
      requestId,
      duration,
      resultCount: apiItems.length,
      totalCount: count || 0,
      page,
      size
    });
    
    res.status(200).json(response);

  } catch (error) {
    handleInternalError('fetching business proposal items', error, res, req);
  }
}

/**
 * Get a single business proposal item by ID
 * GET /api/business-proposal-items/:id
 */
export async function getBusinessProposalItemById(req: Request, res: Response): Promise<void> {
  try {
    // Validate route parameters
    const paramValidation = BusinessProposalItemIdParamSchema.safeParse(req.params);
    
    if (!paramValidation.success) {
      handleValidationError(paramValidation, res);
      return;
    }

    const { id } = paramValidation.data;

    // Fetch business proposal item from database
    const { data: item, error } = await supabaseAdmin
      .from('business_proposal_item')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !item) {
      handleNotFound('ProposalItem', res, req);
      return;
    }

    // Convert database result (snake_case) to API format (camelCase) and return
    const apiItem = businessProposalItemDbToApi(item as BusinessProposalItemDB);
    
    res.status(200).json(apiItem);

  } catch (error) {
    handleInternalError('fetching business proposal item', error, res, req);
  }
}

/**
 * Update an existing business proposal item with recalculation
 * PUT /api/business-proposal-items/:id
 */
export async function updateBusinessProposalItem(req: Request, res: Response): Promise<void> {
  const requestId = (req as any).requestId;
  const startTime = Date.now();
  
  try {
    // Validate route parameters
    const paramValidation = BusinessProposalItemIdParamSchema.safeParse(req.params);
    
    if (!paramValidation.success) {
      handleValidationError(paramValidation, res);
      return;
    }

    const { id } = paramValidation.data;

    logger.proposalItemOperation('UPDATE_START', id, undefined, { requestId });

    // Validate request body using Zod schema
    const validationResult = UpdateBusinessProposalItemSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      handleValidationError(validationResult, res, req);
      return;
    }

    const updateData: UpdateBusinessProposalItemInput = validationResult.data;

    // Check if business proposal item exists first
    const { data: existingItem, error: existsError } = await supabaseAdmin
      .from('business_proposal_item')
      .select('*')
      .eq('id', id)
      .single();

    if (existsError || !existingItem) {
      logger.proposalItemError('UPDATE_NOT_FOUND', new Error('Proposal item not found'), id);
      handleNotFound('ProposalItem', res, req);
      return;
    }

    const currentItem = existingItem as BusinessProposalItemDB;

    // Check if item exists (if being updated)
    if (updateData.item) {
      const itemExists = await checkEntityExists('item', updateData.item.id);
      if (!itemExists) {
        handleNotFound('Item', res, req);
        return;
      }
    }

    // Convert API data (camelCase) to database format (snake_case)
    const dbUpdateData = businessProposalItemApiToDb(updateData);

    // Recalculate total if quantity, unitPrice, or discount are being updated
    const newQuantity = updateData.quantity !== undefined ? updateData.quantity : currentItem.quantity;
    const newUnitPrice = updateData.unitPrice !== undefined ? updateData.unitPrice : currentItem.unit_price;
    const newDiscount = updateData.discount !== undefined ? (updateData.discount || 0) : (currentItem.discount || 0);
    
    // Always recalculate total to ensure consistency
    const newTotal = (newQuantity * newUnitPrice) - newDiscount;
    
    // Validate calculation
    if (newTotal < 0) {
      logger.proposalItemError('UPDATE_NEGATIVE_TOTAL', new Error(`Negative total calculated: ${newTotal}`), id, currentItem.proposal_id);
      const language = getLanguageFromRequest(req);
      const errorMessages = {
        'pt-BR': 'O desconto não pode ser maior que o valor total do item',
        'en-US': 'Discount cannot be greater than the total item value',
        'es-CO': 'El descuento no puede ser mayor que el valor total del artículo'
      };
      
      res.status(400).json({
        message: errorMessages[language] || errorMessages['pt-BR'],
        status: 400,
        requestId: (req as any).requestId
      });
      return;
    }
    
    dbUpdateData.total = newTotal;

    // Update business proposal item in database
    const { data: updatedItem, error } = await supabaseAdmin
      .from('business_proposal_item')
      .update(dbUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.proposalItemError('UPDATE_DB_ERROR', error as Error, id, currentItem.proposal_id);
      handleDatabaseError('UPDATE', 'business_proposal_item', error, res, req);
      return;
    }

    // Convert database result (snake_case) to API format (camelCase) and return
    const apiItem = businessProposalItemDbToApi(updatedItem as BusinessProposalItemDB);
    
    const duration = Date.now() - startTime;
    logger.proposalItemOperation('UPDATE_SUCCESS', id, currentItem.proposal_id, {
      requestId,
      duration,
      fieldsUpdated: Object.keys(updateData).length,
      newTotal: apiItem.total
    });
    
    res.status(200).json(apiItem);

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.proposalItemError('UPDATE_INTERNAL_ERROR', error as Error, req.params?.id);
    logger.error('CONTROLLER', `Business proposal item update failed after ${duration}ms`, error as Error, {
      requestId,
      duration,
      itemId: req.params?.id
    });
    handleInternalError('updating business proposal item', error, res, req);
  }
}

/**
 * Delete a business proposal item
 * DELETE /api/business-proposal-items/:id
 */
export async function deleteBusinessProposalItem(req: Request, res: Response): Promise<void> {
  const requestId = (req as any).requestId;
  const startTime = Date.now();
  
  try {
    // Validate route parameters
    const paramValidation = BusinessProposalItemIdParamSchema.safeParse(req.params);
    
    if (!paramValidation.success) {
      handleValidationError(paramValidation, res);
      return;
    }

    const { id } = paramValidation.data;

    logger.proposalItemOperation('DELETE_START', id, undefined, { requestId });

    // Check if business proposal item exists first and get proposal_id for logging
    const { data: existingItem, error: checkError } = await supabaseAdmin
      .from('business_proposal_item')
      .select('id, proposal_id')
      .eq('id', id)
      .single();

    if (checkError || !existingItem) {
      logger.proposalItemError('DELETE_NOT_FOUND', new Error('Proposal item not found'), id);
      handleNotFound('ProposalItem', res, req);
      return;
    }

    const proposalId = (existingItem as any).proposal_id;

    // Delete business proposal item from database
    const { error } = await supabaseAdmin
      .from('business_proposal_item')
      .delete()
      .eq('id', id);

    if (error) {
      logger.proposalItemError('DELETE_DB_ERROR', error as Error, id, proposalId);
      handleDatabaseError('DELETE', 'business_proposal_item', error, res, req);
      return;
    }

    // Return success confirmation
    const language = getLanguageFromRequest(req);
    const message = getSuccessMessage('deleted', 'proposalItem', language);
    
    const duration = Date.now() - startTime;
    logger.proposalItemOperation('DELETE_SUCCESS', id, proposalId, {
      requestId,
      duration
    });
    
    res.status(200).json({
      message,
      id: id
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.proposalItemError('DELETE_INTERNAL_ERROR', error as Error, req.params?.id);
    logger.error('CONTROLLER', `Business proposal item deletion failed after ${duration}ms`, error as Error, {
      requestId,
      duration,
      itemId: req.params?.id
    });
    handleInternalError('deleting business proposal item', error, res, req);
  }
}