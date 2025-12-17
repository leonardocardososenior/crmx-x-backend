import { supabaseAdmin } from '../supabaseClient';
import { TenantAwareSupabaseClient } from '../utils/tenantAwareSupabaseClient';
import { logger } from '../utils/logger';
import { 
  validateProposalCreationWorkflow,
  validateProposalUpdateWorkflow,
  validateProposalItemWorkflow,
  validateCascadeDeletion,
  ValidationResult
} from '../validation/businessProposalValidation';
import { 
  BusinessProposalDB,
  BusinessProposalItemDB,
  businessProposalDbToApi,
  businessProposalItemDbToApi,
  BusinessProposalStatuses
} from '../types';

/**
 * Integration service for business proposal operations
 * Handles complete CRUD workflows with comprehensive validation
 */

export interface IntegrationResult<T = any> {
  success: boolean;
  data?: T;
  errors: string[];
  warnings: string[];
  operationId?: string;
}

/**
 * Complete business proposal creation workflow with validation
 */
export async function integratedProposalCreation(
  proposalData: any, 
  tenantClient?: TenantAwareSupabaseClient,
  requestId?: string
): Promise<IntegrationResult> {
  const operationId = requestId || `create_${Date.now()}`;
  
  logger.proposalOperation('INTEGRATION_CREATE_START', undefined, proposalData.responsibleId, {
    operationId,
    businessId: proposalData.businessId,
    itemCount: proposalData.items?.length || 0
  });

  try {
    // 1. Comprehensive validation
    const validation = await validateProposalCreationWorkflow(proposalData);
    if (!validation.isValid) {
      logger.proposalError('INTEGRATION_CREATE_VALIDATION_FAILED', new Error('Validation failed'), undefined, proposalData.responsibleId);
      return {
        success: false,
        errors: validation.errors,
        warnings: validation.warnings,
        operationId
      };
    }

    // 2. Begin transaction-like operation
    let createdProposal: BusinessProposalDB | null = null;
    let createdItems: BusinessProposalItemDB[] = [];

    try {
      // Use tenant-aware client if provided, otherwise fall back to supabaseAdmin
      const client = tenantClient ? tenantClient.getClient() : supabaseAdmin;
      
      // Create proposal
      const { data: proposal, error: proposalError } = await client
        .from('business_proposal')
        .insert({
          business_id: proposalData.businessId,
          responsible_id: proposalData.responsibleId,
          title: proposalData.title,
          status: proposalData.status || BusinessProposalStatuses.DRAFT,
          date: proposalData.date,
          value: proposalData.value,
          content: proposalData.content,
          theme_color: proposalData.themeColor,
          terms_and_conditions: proposalData.termsAndConditions,
          show_unit_prices: proposalData.showUnitPrices
        })
        .select()
        .single();

      if (proposalError) {
        throw new Error(`Proposal creation failed: ${proposalError.message}`);
      }

      createdProposal = proposal as BusinessProposalDB;

      // Create items
      if (proposalData.items && proposalData.items.length > 0) {
        const itemsToInsert = proposalData.items.map((item: any) => {
          const total = (item.quantity * item.unitPrice) - (item.discount || 0);
          return {
            proposal_id: createdProposal!.id,
            item_id: item.itemId,
            name: item.name,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            discount: item.discount || 0,
            total: total
          };
        });

        const { data: items, error: itemsError } = await client
          .from('business_proposal_item')
          .insert(itemsToInsert)
          .select();

        if (itemsError) {
          // Rollback proposal creation
          await client
            .from('business_proposal')
            .delete()
            .eq('id', createdProposal.id);
          
          throw new Error(`Items creation failed: ${itemsError.message}`);
        }

        createdItems = items as BusinessProposalItemDB[];
      }

      // 3. Convert to API format
      const apiProposal = businessProposalDbToApi(createdProposal);

      logger.proposalOperation('INTEGRATION_CREATE_SUCCESS', createdProposal.id, proposalData.responsibleId, {
        operationId,
        itemCount: createdItems.length,
        totalValue: apiProposal.value
      });

      return {
        success: true,
        data: apiProposal,
        errors: [],
        warnings: validation.warnings,
        operationId
      };

    } catch (error) {
      // Cleanup on failure
      if (createdProposal) {
        try {
          const client = tenantClient ? tenantClient.getClient() : supabaseAdmin;
          await client
            .from('business_proposal')
            .delete()
            .eq('id', createdProposal.id);
        } catch (cleanupError) {
          logger.error('INTEGRATION', 'Failed to cleanup after creation error', cleanupError as Error);
        }
      }
      throw error;
    }

  } catch (error) {
    logger.proposalError('INTEGRATION_CREATE_ERROR', error as Error, undefined, proposalData.responsibleId);
    return {
      success: false,
      errors: [`Integration error: ${(error as Error).message}`],
      warnings: [],
      operationId
    };
  }
}

/**
 * Complete business proposal update workflow with validation
 */
export async function integratedProposalUpdate(
  proposalId: string, 
  updateData: any, 
  tenantClient?: TenantAwareSupabaseClient,
  requestId?: string
): Promise<IntegrationResult> {
  const operationId = requestId || `update_${Date.now()}`;
  
  logger.proposalOperation('INTEGRATION_UPDATE_START', proposalId, updateData.responsibleId, { operationId });

  try {
    // 1. Validate update operation
    const validation = await validateProposalUpdateWorkflow(proposalId, updateData);
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
        warnings: validation.warnings,
        operationId
      };
    }

    // 2. Perform update
    const client = tenantClient ? tenantClient.getClient() : supabaseAdmin;
    
    const dbUpdateData: any = {};
    if (updateData.businessId !== undefined) dbUpdateData.business_id = updateData.businessId;
    if (updateData.responsibleId !== undefined) dbUpdateData.responsible_id = updateData.responsibleId;
    if (updateData.title !== undefined) dbUpdateData.title = updateData.title;
    if (updateData.status !== undefined) dbUpdateData.status = updateData.status;
    if (updateData.date !== undefined) dbUpdateData.date = updateData.date;
    if (updateData.value !== undefined) dbUpdateData.value = updateData.value;
    if (updateData.content !== undefined) dbUpdateData.content = updateData.content;
    if (updateData.themeColor !== undefined) dbUpdateData.theme_color = updateData.themeColor;
    if (updateData.termsAndConditions !== undefined) dbUpdateData.terms_and_conditions = updateData.termsAndConditions;
    if (updateData.showUnitPrices !== undefined) dbUpdateData.show_unit_prices = updateData.showUnitPrices;

    const { data: updatedProposal, error: updateError } = await client
      .from('business_proposal')
      .update(dbUpdateData)
      .eq('id', proposalId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Update failed: ${updateError.message}`);
    }

    // 3. Fetch updated items
    const { data: items } = await client
      .from('business_proposal_item')
      .select('*')
      .eq('proposal_id', proposalId)
      .order('created_at', { ascending: true });

    // 4. Convert to API format
    const apiProposal = businessProposalDbToApi(updatedProposal as BusinessProposalDB);

    logger.proposalOperation('INTEGRATION_UPDATE_SUCCESS', proposalId, updateData.responsibleId, {
      operationId,
      fieldsUpdated: Object.keys(updateData).length
    });

    return {
      success: true,
      data: apiProposal,
      errors: [],
      warnings: validation.warnings,
      operationId
    };

  } catch (error) {
    logger.proposalError('INTEGRATION_UPDATE_ERROR', error as Error, proposalId, updateData.responsibleId);
    return {
      success: false,
      errors: [`Integration error: ${(error as Error).message}`],
      warnings: [],
      operationId
    };
  }
}

/**
 * Complete business proposal deletion workflow with cascade validation
 */
export async function integratedProposalDeletion(
  proposalId: string, 
  tenantClient?: TenantAwareSupabaseClient,
  requestId?: string
): Promise<IntegrationResult> {
  const operationId = requestId || `delete_${Date.now()}`;
  
  logger.proposalOperation('INTEGRATION_DELETE_START', proposalId, undefined, { operationId });

  try {
    // 1. Validate deletion operation
    const validation = await validateCascadeDeletion(proposalId);
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
        warnings: validation.warnings,
        operationId
      };
    }

    // 2. Get item count for logging
    const client = tenantClient ? tenantClient.getClient() : supabaseAdmin;
    
    const { count: itemCount } = await client
      .from('business_proposal_item')
      .select('*', { count: 'exact', head: true })
      .eq('proposal_id', proposalId);

    // 3. Perform deletion (cascade will handle items)
    const { error: deleteError } = await client
      .from('business_proposal')
      .delete()
      .eq('id', proposalId);

    if (deleteError) {
      throw new Error(`Deletion failed: ${deleteError.message}`);
    }

    logger.proposalOperation('INTEGRATION_DELETE_SUCCESS', proposalId, undefined, {
      operationId,
      itemsDeleted: itemCount || 0
    });

    return {
      success: true,
      data: { id: proposalId, itemsDeleted: itemCount || 0 },
      errors: [],
      warnings: validation.warnings,
      operationId
    };

  } catch (error) {
    logger.proposalError('INTEGRATION_DELETE_ERROR', error as Error, proposalId);
    return {
      success: false,
      errors: [`Integration error: ${(error as Error).message}`],
      warnings: [],
      operationId
    };
  }
}

/**
 * Complete business proposal item creation workflow
 */
export async function integratedItemCreation(
  proposalId: string, 
  itemData: any, 
  tenantClient?: TenantAwareSupabaseClient,
  requestId?: string
): Promise<IntegrationResult> {
  const operationId = requestId || `create_item_${Date.now()}`;
  
  logger.proposalItemOperation('INTEGRATION_ITEM_CREATE_START', undefined, proposalId, { operationId });

  try {
    // 1. Validate item creation
    const validation = await validateProposalItemWorkflow(proposalId, itemData, 'create');
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
        warnings: validation.warnings,
        operationId
      };
    }

    // 2. Calculate total
    const total = (itemData.quantity * itemData.unitPrice) - (itemData.discount || 0);

    // 3. Create item
    const client = tenantClient ? tenantClient.getClient() : supabaseAdmin;
    
    const { data: createdItem, error: createError } = await client
      .from('business_proposal_item')
      .insert({
        proposal_id: proposalId,
        item_id: itemData.itemId,
        name: itemData.name,
        quantity: itemData.quantity,
        unit_price: itemData.unitPrice,
        discount: itemData.discount || 0,
        total: total
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Item creation failed: ${createError.message}`);
    }

    // 4. Convert to API format
    const apiItem = businessProposalItemDbToApi(createdItem as BusinessProposalItemDB);

    logger.proposalItemOperation('INTEGRATION_ITEM_CREATE_SUCCESS', createdItem.id, proposalId, {
      operationId,
      total: total
    });

    return {
      success: true,
      data: apiItem,
      errors: [],
      warnings: validation.warnings,
      operationId
    };

  } catch (error) {
    logger.proposalItemError('INTEGRATION_ITEM_CREATE_ERROR', error as Error, undefined, proposalId);
    return {
      success: false,
      errors: [`Integration error: ${(error as Error).message}`],
      warnings: [],
      operationId
    };
  }
}

/**
 * Complete business proposal item update workflow
 */
export async function integratedItemUpdate(
  itemId: string, 
  updateData: any, 
  tenantClient?: TenantAwareSupabaseClient,
  requestId?: string
): Promise<IntegrationResult> {
  const operationId = requestId || `update_item_${Date.now()}`;
  
  logger.proposalItemOperation('INTEGRATION_ITEM_UPDATE_START', itemId, undefined, { operationId });

  try {
    // 1. Get existing item to determine proposal ID
    const client = tenantClient ? tenantClient.getClient() : supabaseAdmin;
    
    const { data: existingItem, error: fetchError } = await client
      .from('business_proposal_item')
      .select('*')
      .eq('id', itemId)
      .single();

    if (fetchError || !existingItem) {
      return {
        success: false,
        errors: ['Item not found'],
        warnings: [],
        operationId
      };
    }

    // 2. Validate update
    const validation = await validateProposalItemWorkflow(existingItem.proposal_id, { ...updateData, id: itemId }, 'update');
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
        warnings: validation.warnings,
        operationId
      };
    }

    // 3. Prepare update data with recalculation
    const dbUpdateData: any = {};
    if (updateData.itemId !== undefined) dbUpdateData.item_id = updateData.itemId;
    if (updateData.name !== undefined) dbUpdateData.name = updateData.name;
    if (updateData.quantity !== undefined) dbUpdateData.quantity = updateData.quantity;
    if (updateData.unitPrice !== undefined) dbUpdateData.unit_price = updateData.unitPrice;
    if (updateData.discount !== undefined) dbUpdateData.discount = updateData.discount;

    // Recalculate total
    const currentItem = existingItem as BusinessProposalItemDB;
    const newQuantity = updateData.quantity !== undefined ? updateData.quantity : currentItem.quantity;
    const newUnitPrice = updateData.unitPrice !== undefined ? updateData.unitPrice : currentItem.unit_price;
    const newDiscount = updateData.discount !== undefined ? (updateData.discount || 0) : (currentItem.discount || 0);
    
    dbUpdateData.total = (newQuantity * newUnitPrice) - newDiscount;

    // 4. Perform update
    const { data: updatedItem, error: updateError } = await client
      .from('business_proposal_item')
      .update(dbUpdateData)
      .eq('id', itemId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Item update failed: ${updateError.message}`);
    }

    // 5. Convert to API format
    const apiItem = businessProposalItemDbToApi(updatedItem as BusinessProposalItemDB);

    logger.proposalItemOperation('INTEGRATION_ITEM_UPDATE_SUCCESS', itemId, existingItem.proposal_id, {
      operationId,
      newTotal: dbUpdateData.total
    });

    return {
      success: true,
      data: apiItem,
      errors: [],
      warnings: validation.warnings,
      operationId
    };

  } catch (error) {
    logger.proposalItemError('INTEGRATION_ITEM_UPDATE_ERROR', error as Error, itemId);
    return {
      success: false,
      errors: [`Integration error: ${(error as Error).message}`],
      warnings: [],
      operationId
    };
  }
}

