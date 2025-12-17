import { Request, Response } from 'express';
import { supabaseAdmin } from '../supabaseClient';
import { TenantRequest } from '../types/tenant';
import { getTenantAdminClient } from '../utils/tenantClientHelper';
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
  BusinessProposalStatuses,
  SendStatuses 
} from '../types';
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
import { logger } from '../utils/logger';

/**
 * Create a new business proposal
 * POST /api/business-proposals
 */
export async function createBusinessProposal(req: TenantRequest, res: Response): Promise<void> {
  const requestId = (req as any).requestId;
  const startTime = Date.now();
  
  try {
    // Log the operation start
    logger.proposalOperation('CREATE_START', undefined, req.body?.responsible?.id, {
      requestId,
      businessId: req.body?.business?.id
    });

    // Validate request body using Zod schema
    const validationResult = CreateBusinessProposalSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      logger.proposalError('CREATE_VALIDATION_FAILED', new Error('Validation failed'), undefined, req.body?.responsible?.id);
      handleValidationError(validationResult, res, req);
      return;
    }

    const proposalData: CreateBusinessProposalInput = validationResult.data;

    // Check if business exists
    const businessExists = await checkEntityExistsInTenant(req, 'business', proposalData.business.id);
    if (!businessExists) {
      logger.proposalError('CREATE_BUSINESS_NOT_FOUND', new Error('Business not found'), undefined, proposalData.responsible.id);
      handleNotFound('Business', res, req);
      return;
    }

    // Check if responsible user exists
    const userExists = await checkEntityExistsInTenant(req, 'users', proposalData.responsible.id);
    if (!userExists) {
      logger.proposalError('CREATE_USER_NOT_FOUND', new Error('User not found'), undefined, proposalData.responsible.id);
      handleNotFound('User', res, req);
      return;
    }



    // Convert API data (camelCase) to database format (snake_case) and add defaults
    const dbProposalData = businessProposalApiToDb(proposalData);
    const proposalToInsert = {
      ...dbProposalData,
      status: proposalData.status || BusinessProposalStatuses.DRAFT,
      send_status: SendStatuses.PENDING
    };

    // Get tenant-aware admin client
    const tenantClient = getTenantAdminClient(req);

    // Insert business proposal into database
    const { data: createdProposal, error: proposalError } = await tenantClient
      .getClient()
      .from('business_proposal')
      .insert(proposalToInsert)
      .select()
      .single();

    if (proposalError) {
      logger.proposalError('CREATE_PROPOSAL_DB_ERROR', proposalError as Error, undefined, proposalData.responsible.id);
      handleDatabaseError('INSERT', 'business_proposal', proposalError, res, req);
      return;
    }



    // Convert database result (snake_case) to API format (camelCase) and return
    const apiProposal = businessProposalDbToApi(createdProposal as BusinessProposalDB);
    
    const duration = Date.now() - startTime;
    logger.proposalOperation('CREATE_SUCCESS', createdProposal.id, proposalData.responsible.id, {
      requestId,
      duration,
      totalValue: apiProposal.value
    });
    
    res.status(201).json(apiProposal);

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.proposalError('CREATE_INTERNAL_ERROR', error as Error, undefined, req.body?.responsible?.id);
    logger.error('CONTROLLER', `Business proposal creation failed after ${duration}ms`, error as Error, {
      requestId,
      duration,
      businessId: req.body?.business?.id,
      responsibleId: req.body?.responsible?.id
    });
    handleInternalError('creating business proposal', error, res, req);
  }
}

/**
 * Get business proposals with filtering and pagination
 * GET /api/business-proposals
 */
export async function getBusinessProposals(req: TenantRequest, res: Response): Promise<void> {
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

    // Get tenant-aware admin client
    const tenantClient = getTenantAdminClient(req);

    // Build base query
    let query = tenantClient.getClient().from('business_proposal').select('*', { count: 'exact' });

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
export async function getBusinessProposalById(req: TenantRequest, res: Response): Promise<void> {
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

    // Get tenant-aware admin client
    const tenantClient = getTenantAdminClient(req);

    // Fetch business proposal from database
    const { data: proposal, error: proposalError } = await tenantClient
      .getClient()
      .from('business_proposal')
      .select('*')
      .eq('id', id)
      .single();

    if (proposalError || !proposal) {
      logger.proposalError('GET_BY_ID_NOT_FOUND', new Error('Proposal not found'), id);
      handleNotFound('Proposal', res, req);
      return;
    }

    // Convert database result (snake_case) to API format (camelCase) and return
    const apiProposal = businessProposalDbToApi(proposal as BusinessProposalDB);
    
    const duration = Date.now() - startTime;
    logger.proposalOperation('GET_BY_ID_SUCCESS', id, (proposal as any).responsible_id, {
      requestId,
      duration
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
export async function updateBusinessProposal(req: TenantRequest, res: Response): Promise<void> {
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
    const exists = await checkEntityExistsInTenant(req, 'business_proposal', id);
    if (!exists) {
      logger.proposalError('UPDATE_NOT_FOUND', new Error('Proposal not found'), id, req.body?.responsibleId);
      handleNotFound('Proposal', res, req);
      return;
    }

    // Check if business exists (if being updated)
    if (updateData.business) {
      const businessExists = await checkEntityExistsInTenant(req, 'business', updateData.business.id);
      if (!businessExists) {
        handleNotFound('Business', res, req);
        return;
      }
    }

    // Check if responsible user exists (if being updated)
    if (updateData.responsible) {
      const userExists = await checkEntityExistsInTenant(req, 'users', updateData.responsible.id);
      if (!userExists) {
        handleNotFound('User', res, req);
        return;
      }
    }

    // Convert API data (camelCase) to database format (snake_case)
    const dbUpdateData = businessProposalApiToDb(updateData);

    // Get tenant-aware admin client
    const tenantClient = getTenantAdminClient(req);

    // Update business proposal in database
    const { data: updatedProposal, error } = await tenantClient
      .getClient()
      .from('business_proposal')
      .update(dbUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      handleDatabaseError('UPDATE', 'business_proposal', error, res, req);
      return;
    }

    // Convert database result (snake_case) to API format (camelCase) and return
    const apiProposal = businessProposalDbToApi(updatedProposal as BusinessProposalDB);
    
    const duration = Date.now() - startTime;
    logger.proposalOperation('UPDATE_SUCCESS', id, updateData.responsible?.id || 'unknown', {
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
export async function deleteBusinessProposal(req: TenantRequest, res: Response): Promise<void> {
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

    // Get tenant-aware admin client
    const tenantClient = getTenantAdminClient(req);

    // Check if business proposal exists first
    const { data: existingProposal, error: checkError } = await tenantClient
      .getClient()
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
    


    // Delete business proposal from database (items will be cascade deleted by DB constraint)
    const { error } = await tenantClient
      .getClient()
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
      duration
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