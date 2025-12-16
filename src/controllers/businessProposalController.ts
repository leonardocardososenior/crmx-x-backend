import { Request, Response } from 'express';
import { supabaseAdmin } from '../supabaseClient';
import { 
  CreateBusinessProposalSchema, 
  UpdateBusinessProposalSchema, 
  BusinessProposalQueryParamsSchema, 
  BusinessProposalIdParamSchema,
  CreateBusinessProposalInput,
  UpdateBusinessProposalInput,
  BusinessProposalQueryParamsInput 
} from '../schemas/businessProposalSchemas';
import { 
  BusinessProposalDB, 
  BusinessProposalItemDB,
  businessProposalDbToApi, 
  businessProposalApiToDb,
  businessProposalItemDbToApi,
  businessProposalItemApiToDb,
  BusinessProposalStatuses 
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
 * Create a new business proposal
 * POST /api/business-proposals
 */
export async function createBusinessProposal(req: Request, res: Response): Promise<void> {
  const requestId = (req as any).requestId;
  const startTime = Date.now();
  
  try {
    // Log the operation start
    logger.proposalOperation('CREATE_START', undefined, req.body?.responsibleId, {
      requestId,
      businessId: req.body?.businessId,
      itemCount: req.body?.items?.length || 0
    });

    // Validate request body using Zod schema
    const validationResult = CreateBusinessProposalSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      logger.proposalError('CREATE_VALIDATION_FAILED', new Error('Validation failed'), undefined, req.body?.responsibleId);
      handleValidationError(validationResult, res, req);
      return;
    }

    const proposalData: CreateBusinessProposalInput = validationResult.data;

    // Check if business exists
    const businessExists = await checkEntityExists('business', proposalData.businessId);
    if (!businessExists) {
      logger.proposalError('CREATE_BUSINESS_NOT_FOUND', new Error('Business not found'), undefined, proposalData.responsibleId);
      handleNotFound('Business', res, req);
      return;
    }

    // Check if responsible user exists
    const userExists = await checkEntityExists('users', proposalData.responsibleId);
    if (!userExists) {
      logger.proposalError('CREATE_USER_NOT_FOUND', new Error('User not found'), undefined, proposalData.responsibleId);
      handleNotFound('User', res, req);
      return;
    }

    // Validate that all items exist
    for (const item of proposalData.items) {
      const itemExists = await checkEntityExists('item', item.itemId);
      if (!itemExists) {
        logger.proposalError('CREATE_ITEM_NOT_FOUND', new Error(`Item not found: ${item.itemId}`), undefined, proposalData.responsibleId);
        handleNotFound('Item', res, req);
        return;
      }
    }

    // Convert API data (camelCase) to database format (snake_case) and add defaults
    const dbProposalData = businessProposalApiToDb(proposalData);
    const proposalToInsert = {
      ...dbProposalData,
      status: proposalData.status || BusinessProposalStatuses.DRAFT
    };

    // Insert business proposal into database
    const { data: createdProposal, error: proposalError } = await supabaseAdmin
      .from('business_proposal')
      .insert(proposalToInsert)
      .select()
      .single();

    if (proposalError) {
      logger.proposalError('CREATE_PROPOSAL_DB_ERROR', proposalError as Error, undefined, proposalData.responsibleId);
      handleDatabaseError('INSERT', 'business_proposal', proposalError, res, req);
      return;
    }

    // Insert proposal items
    const itemsToInsert = proposalData.items.map(item => {
      const dbItem = businessProposalItemApiToDb(item);
      const calculatedTotal = (item.quantity * item.unitPrice) - (item.discount || 0);
      
      // Validate calculation
      if (calculatedTotal < 0) {
        logger.proposalError('CREATE_NEGATIVE_TOTAL', new Error(`Negative total calculated: ${calculatedTotal}`), createdProposal.id, proposalData.responsibleId);
        throw new Error('calculation');
      }
      
      return {
        ...dbItem,
        proposal_id: createdProposal.id,
        total: calculatedTotal
      };
    });

    const { data: createdItems, error: itemsError } = await supabaseAdmin
      .from('business_proposal_item')
      .insert(itemsToInsert)
      .select();

    if (itemsError) {
      // Rollback proposal creation if items insertion fails
      logger.proposalError('CREATE_ITEMS_DB_ERROR', itemsError as Error, createdProposal.id, proposalData.responsibleId);
      
      try {
        await supabaseAdmin
          .from('business_proposal')
          .delete()
          .eq('id', createdProposal.id);
        logger.proposalOperation('CREATE_ROLLBACK_SUCCESS', createdProposal.id, proposalData.responsibleId);
      } catch (rollbackError) {
        logger.proposalError('CREATE_ROLLBACK_FAILED', rollbackError as Error, createdProposal.id, proposalData.responsibleId);
      }
      
      handleDatabaseError('INSERT', 'business_proposal_item', itemsError, res, req);
      return;
    }

    // Convert database result (snake_case) to API format (camelCase) and return
    const apiProposal = businessProposalDbToApi(createdProposal as BusinessProposalDB);
    apiProposal.items = (createdItems as BusinessProposalItemDB[]).map(businessProposalItemDbToApi);
    
    const duration = Date.now() - startTime;
    logger.proposalOperation('CREATE_SUCCESS', createdProposal.id, proposalData.responsibleId, {
      requestId,
      duration,
      itemCount: createdItems?.length || 0,
      totalValue: apiProposal.value
    });
    
    res.status(201).json(apiProposal);

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.proposalError('CREATE_INTERNAL_ERROR', error as Error, undefined, req.body?.responsibleId);
    logger.error('CONTROLLER', `Business proposal creation failed after ${duration}ms`, error as Error, {
      requestId,
      duration,
      businessId: req.body?.businessId,
      responsibleId: req.body?.responsibleId
    });
    handleInternalError('creating business proposal', error, res, req);
  }
}

/**
 * Get business proposals with filtering and pagination
 * GET /api/business-proposals
 */
export async function getBusinessProposals(req: Request, res: Response): Promise<void> {
  const requestId = (req as any).requestId;
  const startTime = Date.now();
  
  try {
    logger.proposalOperation('LIST_START', undefined, undefined, { 
      requestId,
      queryParams: Object.keys(req.query).length 
    });

    // Validate query parameters using Zod schema
    const validationResult = BusinessProposalQueryParamsSchema.safeParse(req.query);
    
    if (!validationResult.success) {
      logger.proposalError('LIST_VALIDATION_FAILED', new Error('Query validation failed'), undefined, undefined);
      handleValidationError(validationResult, res, req);
      return;
    }

    const queryParams: BusinessProposalQueryParamsInput = validationResult.data;

    // Set default pagination values
    const page = queryParams.page || 1;
    const size = queryParams.size || 10;

    // Build base query
    let query = supabaseAdmin.from('business_proposal').select('*', { count: 'exact' });

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
        const parsedFilter = parseFilter(decodedFilter, 'business_proposal');
        query = applyFiltersToQuery(query, parsedFilter, 'business_proposal');
      } catch (filterError) {
        handleFilterError(filterError, res, req);
        return;
      }
    }

    // Apply specific filters
    if (queryParams.status) {
      query = query.eq('status', queryParams.status);
    }
    
    if (queryParams.businessId) {
      query = query.eq('business_id', queryParams.businessId);
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
    
    if (queryParams.minValue !== undefined) {
      query = query.gte('value', queryParams.minValue);
    }
    
    if (queryParams.maxValue !== undefined) {
      query = query.lte('value', queryParams.maxValue);
    }

    // Apply search if provided
    if (queryParams.search) {
      query = query.or(`title.ilike.%${queryParams.search}%,content.ilike.%${queryParams.search}%`);
    }

    // Apply pagination
    query = buildPaginatedQuery(query, page, size);

    // Order by created_at descending
    query = query.order('created_at', { ascending: false });

    // Execute query
    const { data: proposals, error, count } = await query;

    if (error) {
      handleDatabaseError('SELECT', 'business_proposal', error, res, req);
      return;
    }

    // Convert database results (snake_case) to API format (camelCase)
    const apiProposals = (proposals as BusinessProposalDB[]).map(businessProposalDbToApi);
    
    // Return paginated response
    const response = createPaginatedResponse(apiProposals, count || 0, page, size);
    
    const duration = Date.now() - startTime;
    logger.proposalOperation('LIST_SUCCESS', undefined, undefined, {
      requestId,
      duration,
      resultCount: apiProposals.length,
      totalCount: count || 0,
      page,
      size
    });
    
    res.status(200).json(response);

  } catch (error) {
    handleInternalError('fetching business proposals', error, res, req);
  }
}

/**
 * Get a single business proposal by ID with items
 * GET /api/business-proposals/:id
 */
export async function getBusinessProposalById(req: Request, res: Response): Promise<void> {
  const requestId = (req as any).requestId;
  const startTime = Date.now();
  
  try {
    // Validate route parameters
    const paramValidation = BusinessProposalIdParamSchema.safeParse(req.params);
    
    if (!paramValidation.success) {
      handleValidationError(paramValidation, res);
      return;
    }

    const { id } = paramValidation.data;

    logger.proposalOperation('GET_BY_ID_START', id, undefined, { requestId });

    // Fetch business proposal from database
    const { data: proposal, error: proposalError } = await supabaseAdmin
      .from('business_proposal')
      .select('*')
      .eq('id', id)
      .single();

    if (proposalError || !proposal) {
      logger.proposalError('GET_BY_ID_NOT_FOUND', new Error('Proposal not found'), id);
      handleNotFound('Proposal', res, req);
      return;
    }

    // Fetch proposal items
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('business_proposal_item')
      .select('*')
      .eq('proposal_id', id)
      .order('created_at', { ascending: true });

    if (itemsError) {
      handleDatabaseError('SELECT', 'business_proposal_item', itemsError, res, req);
      return;
    }

    // Convert database result (snake_case) to API format (camelCase) and return
    const apiProposal = businessProposalDbToApi(proposal as BusinessProposalDB);
    apiProposal.items = (items as BusinessProposalItemDB[] || []).map(businessProposalItemDbToApi);
    
    const duration = Date.now() - startTime;
    logger.proposalOperation('GET_BY_ID_SUCCESS', id, (proposal as any).responsible_id, {
      requestId,
      duration,
      itemCount: apiProposal.items.length
    });
    
    res.status(200).json(apiProposal);

  } catch (error) {
    handleInternalError('fetching business proposal', error, res, req);
  }
}

/**
 * Update an existing business proposal
 * PUT /api/business-proposals/:id
 */
export async function updateBusinessProposal(req: Request, res: Response): Promise<void> {
  const requestId = (req as any).requestId;
  const startTime = Date.now();
  
  try {
    // Validate route parameters
    const paramValidation = BusinessProposalIdParamSchema.safeParse(req.params);
    
    if (!paramValidation.success) {
      handleValidationError(paramValidation, res);
      return;
    }

    const { id } = paramValidation.data;

    logger.proposalOperation('UPDATE_START', id, req.body?.responsibleId, { requestId });

    // Validate request body using Zod schema
    const validationResult = UpdateBusinessProposalSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      handleValidationError(validationResult, res, req);
      return;
    }

    const updateData: UpdateBusinessProposalInput = validationResult.data;

    // Check if business proposal exists first
    const exists = await checkEntityExists('business_proposal', id);
    if (!exists) {
      logger.proposalError('UPDATE_NOT_FOUND', new Error('Proposal not found'), id, req.body?.responsibleId);
      handleNotFound('Proposal', res, req);
      return;
    }

    // Check if business exists (if being updated)
    if (updateData.businessId) {
      const businessExists = await checkEntityExists('business', updateData.businessId);
      if (!businessExists) {
        handleNotFound('Business', res, req);
        return;
      }
    }

    // Check if responsible user exists (if being updated)
    if (updateData.responsibleId) {
      const userExists = await checkEntityExists('users', updateData.responsibleId);
      if (!userExists) {
        handleNotFound('User', res, req);
        return;
      }
    }

    // Convert API data (camelCase) to database format (snake_case)
    const dbUpdateData = businessProposalApiToDb(updateData);

    // Update business proposal in database
    const { data: updatedProposal, error } = await supabaseAdmin
      .from('business_proposal')
      .update(dbUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      handleDatabaseError('UPDATE', 'business_proposal', error, res, req);
      return;
    }

    // Fetch updated proposal items
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('business_proposal_item')
      .select('*')
      .eq('proposal_id', id)
      .order('created_at', { ascending: true });

    if (itemsError) {
      handleDatabaseError('SELECT', 'business_proposal_item', itemsError, res, req);
      return;
    }

    // Convert database result (snake_case) to API format (camelCase) and return
    const apiProposal = businessProposalDbToApi(updatedProposal as BusinessProposalDB);
    apiProposal.items = (items as BusinessProposalItemDB[] || []).map(businessProposalItemDbToApi);
    
    const duration = Date.now() - startTime;
    logger.proposalOperation('UPDATE_SUCCESS', id, updateData.responsibleId || 'unknown', {
      requestId,
      duration,
      fieldsUpdated: Object.keys(updateData).length
    });
    
    res.status(200).json(apiProposal);

  } catch (error) {
    handleInternalError('updating business proposal', error, res, req);
  }
}

/**
 * Delete a business proposal (cascade deletion of items)
 * DELETE /api/business-proposals/:id
 */
export async function deleteBusinessProposal(req: Request, res: Response): Promise<void> {
  const requestId = (req as any).requestId;
  const startTime = Date.now();
  
  try {
    // Validate route parameters
    const paramValidation = BusinessProposalIdParamSchema.safeParse(req.params);
    
    if (!paramValidation.success) {
      handleValidationError(paramValidation, res);
      return;
    }

    const { id } = paramValidation.data;

    logger.proposalOperation('DELETE_START', id, undefined, { requestId });

    // Check if business proposal exists first
    const { data: existingProposal, error: checkError } = await supabaseAdmin
      .from('business_proposal')
      .select('id, responsible_id')
      .eq('id', id)
      .single();

    if (checkError || !existingProposal) {
      logger.proposalError('DELETE_NOT_FOUND', new Error('Proposal not found'), id);
      handleNotFound('Proposal', res, req);
      return;
    }

    const responsibleId = (existingProposal as any).responsible_id;
    
    // Get item count for logging
    const { count: itemCount } = await supabaseAdmin
      .from('business_proposal_item')
      .select('*', { count: 'exact', head: true })
      .eq('proposal_id', id);

    // Delete business proposal from database (items will be cascade deleted by DB constraint)
    const { error } = await supabaseAdmin
      .from('business_proposal')
      .delete()
      .eq('id', id);

    if (error) {
      logger.proposalError('DELETE_DB_ERROR', error as Error, id, responsibleId);
      
      // Check if it's a constraint violation (related records exist)
      if (error.code === '23503') {
        logger.constraintViolation('FOREIGN_KEY', 'business_proposal', error.details, requestId);
      }
      
      handleDatabaseError('DELETE', 'business_proposal', error, res, req);
      return;
    }

    // Return success confirmation
    const language = getLanguageFromRequest(req);
    const message = getSuccessMessage('deleted', 'proposal', language);
    
    const duration = Date.now() - startTime;
    logger.proposalOperation('DELETE_SUCCESS', id, responsibleId, {
      requestId,
      duration,
      itemsDeleted: itemCount || 0
    });
    
    res.status(200).json({
      message,
      id: id
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.proposalError('DELETE_INTERNAL_ERROR', error as Error, req.params?.id);
    logger.error('CONTROLLER', `Business proposal deletion failed after ${duration}ms`, error as Error, {
      requestId,
      duration,
      proposalId: req.params?.id
    });
    handleInternalError('deleting business proposal', error, res, req);
  }
}