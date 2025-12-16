import { supabaseAdmin } from '../supabaseClient';
import { BusinessProposalStatuses } from '../types';
import { logger } from '../utils/logger';

/**
 * Comprehensive validation for business proposal CRUD operations
 * Validates complete workflows, relationships, and edge cases
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate complete business proposal creation workflow
 */
export async function validateProposalCreationWorkflow(proposalData: any): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  try {
    // 1. Validate required fields
    const requiredFields = ['businessId', 'responsibleId', 'title', 'date', 'value', 'items'];
    for (const field of requiredFields) {
      if (!proposalData[field]) {
        result.errors.push(`Missing required field: ${field}`);
        result.isValid = false;
      }
    }

    // 2. Validate business exists and is accessible
    if (proposalData.businessId) {
      const { data: business, error } = await supabaseAdmin
        .from('business')
        .select('id, title, stage')
        .eq('id', proposalData.businessId)
        .single();

      if (error || !business) {
        result.errors.push(`Business with ID ${proposalData.businessId} not found`);
        result.isValid = false;
      } else if (business.stage === 'Closed Won' || business.stage === 'Closed Lost') {
        result.warnings.push(`Creating proposal for closed business: ${business.title}`);
      }
    }

    // 3. Validate responsible user exists and has appropriate role
    if (proposalData.responsibleId) {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, name, role')
        .eq('id', proposalData.responsibleId)
        .single();

      if (error || !user) {
        result.errors.push(`User with ID ${proposalData.responsibleId} not found`);
        result.isValid = false;
      } else if (user.role !== 'SALES_REP' && user.role !== 'MANAGER' && user.role !== 'ADMIN') {
        result.warnings.push(`User ${user.name} may not have appropriate role for proposals`);
      }
    }

    // 4. Validate items array and calculations
    if (proposalData.items && Array.isArray(proposalData.items)) {
      if (proposalData.items.length === 0) {
        result.errors.push('At least one item is required');
        result.isValid = false;
      }

      let totalCalculatedValue = 0;
      for (let i = 0; i < proposalData.items.length; i++) {
        const item = proposalData.items[i];
        
        // Validate item exists
        if (item.itemId) {
          const { data: catalogItem, error } = await supabaseAdmin
            .from('item')
            .select('id, name, price')
            .eq('id', item.itemId)
            .single();

          if (error || !catalogItem) {
            result.errors.push(`Item with ID ${item.itemId} not found`);
            result.isValid = false;
          }
        }

        // Validate calculations
        if (item.quantity && item.unitPrice) {
          const calculatedTotal = (item.quantity * item.unitPrice) - (item.discount || 0);
          if (calculatedTotal < 0) {
            result.errors.push(`Item ${i + 1}: Discount cannot exceed total value`);
            result.isValid = false;
          }
          totalCalculatedValue += calculatedTotal;
        }
      }

      // Validate proposal total matches item totals
      if (proposalData.value && Math.abs(proposalData.value - totalCalculatedValue) > 0.01) {
        result.warnings.push(`Proposal value (${proposalData.value}) doesn't match calculated total (${totalCalculatedValue})`);
      }
    }

    // 5. Validate status
    if (proposalData.status && !Object.values(BusinessProposalStatuses).includes(proposalData.status)) {
      result.errors.push(`Invalid status: ${proposalData.status}`);
      result.isValid = false;
    }

    // 6. Validate date format and logic
    if (proposalData.date) {
      const proposalDate = new Date(proposalData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (isNaN(proposalDate.getTime())) {
        result.errors.push('Invalid date format');
        result.isValid = false;
      } else if (proposalDate < today) {
        result.warnings.push('Proposal date is in the past');
      }
    }

    // 7. Validate theme color format
    if (proposalData.themeColor && !/^#[0-9A-Fa-f]{6}$/.test(proposalData.themeColor)) {
      result.errors.push('Invalid theme color format (must be hex color)');
      result.isValid = false;
    }

  } catch (error) {
    logger.error('VALIDATION', 'Error during proposal creation validation', error as Error);
    result.errors.push('Internal validation error');
    result.isValid = false;
  }

  return result;
}

/**
 * Validate complete business proposal update workflow
 */
export async function validateProposalUpdateWorkflow(proposalId: string, updateData: any): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  try {
    // 1. Validate proposal exists
    const { data: existingProposal, error: proposalError } = await supabaseAdmin
      .from('business_proposal')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (proposalError || !existingProposal) {
      result.errors.push(`Proposal with ID ${proposalId} not found`);
      result.isValid = false;
      return result;
    }

    // 2. Validate status transitions
    if (updateData.status && updateData.status !== existingProposal.status) {
      const validTransitions: Record<string, string[]> = {
        [BusinessProposalStatuses.DRAFT]: [BusinessProposalStatuses.IN_REVIEW, BusinessProposalStatuses.SENT],
        [BusinessProposalStatuses.IN_REVIEW]: [BusinessProposalStatuses.DRAFT, BusinessProposalStatuses.SENT],
        [BusinessProposalStatuses.SENT]: [BusinessProposalStatuses.ACCEPTED, BusinessProposalStatuses.REJECTED],
        [BusinessProposalStatuses.ACCEPTED]: [], // Final state
        [BusinessProposalStatuses.REJECTED]: [BusinessProposalStatuses.DRAFT] // Can restart
      };

      const allowedTransitions = validTransitions[existingProposal.status] || [];
      if (!allowedTransitions.includes(updateData.status)) {
        result.warnings.push(`Status transition from ${existingProposal.status} to ${updateData.status} may not be appropriate`);
      }
    }

    // 3. Validate business relationship (if being updated)
    if (updateData.businessId && updateData.businessId !== existingProposal.business_id) {
      const { data: business, error } = await supabaseAdmin
        .from('business')
        .select('id, title')
        .eq('id', updateData.businessId)
        .single();

      if (error || !business) {
        result.errors.push(`Business with ID ${updateData.businessId} not found`);
        result.isValid = false;
      }
    }

    // 4. Validate responsible user (if being updated)
    if (updateData.responsibleId && updateData.responsibleId !== existingProposal.responsible_id) {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, name, role')
        .eq('id', updateData.responsibleId)
        .single();

      if (error || !user) {
        result.errors.push(`User with ID ${updateData.responsibleId} not found`);
        result.isValid = false;
      }
    }

    // 5. Validate value changes
    if (updateData.value !== undefined && updateData.value !== existingProposal.value) {
      // Get current items total
      const { data: items } = await supabaseAdmin
        .from('business_proposal_item')
        .select('total')
        .eq('proposal_id', proposalId);

      if (items && items.length > 0) {
        const itemsTotal = items.reduce((sum, item) => sum + item.total, 0);
        if (Math.abs(updateData.value - itemsTotal) > 0.01) {
          result.warnings.push(`Updated value (${updateData.value}) doesn't match current items total (${itemsTotal})`);
        }
      }
    }

  } catch (error) {
    logger.error('VALIDATION', 'Error during proposal update validation', error as Error);
    result.errors.push('Internal validation error');
    result.isValid = false;
  }

  return result;
}

/**
 * Validate business proposal item operations
 */
export async function validateProposalItemWorkflow(proposalId: string, itemData: any, operation: 'create' | 'update'): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  try {
    // 1. Validate proposal exists and is editable
    const { data: proposal, error: proposalError } = await supabaseAdmin
      .from('business_proposal')
      .select('id, status, title')
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      result.errors.push(`Proposal with ID ${proposalId} not found`);
      result.isValid = false;
      return result;
    }

    // Warn if modifying accepted/rejected proposals
    if (proposal.status === BusinessProposalStatuses.ACCEPTED || proposal.status === BusinessProposalStatuses.REJECTED) {
      result.warnings.push(`Modifying items in ${proposal.status.toLowerCase()} proposal: ${proposal.title}`);
    }

    // 2. Validate item exists in catalog
    if (itemData.itemId) {
      const { data: catalogItem, error } = await supabaseAdmin
        .from('item')
        .select('id, name, price, type')
        .eq('id', itemData.itemId)
        .single();

      if (error || !catalogItem) {
        result.errors.push(`Catalog item with ID ${itemData.itemId} not found`);
        result.isValid = false;
      } else {
        // Validate price consistency
        if (itemData.unitPrice && Math.abs(itemData.unitPrice - catalogItem.price) > 0.01) {
          result.warnings.push(`Unit price (${itemData.unitPrice}) differs from catalog price (${catalogItem.price})`);
        }
      }
    }

    // 3. Validate calculations
    if (itemData.quantity !== undefined && itemData.unitPrice !== undefined) {
      if (itemData.quantity <= 0) {
        result.errors.push('Quantity must be greater than zero');
        result.isValid = false;
      }

      if (itemData.unitPrice < 0) {
        result.errors.push('Unit price cannot be negative');
        result.isValid = false;
      }

      const discount = itemData.discount || 0;
      if (discount < 0) {
        result.errors.push('Discount cannot be negative');
        result.isValid = false;
      }

      const totalValue = itemData.quantity * itemData.unitPrice;
      if (discount > totalValue) {
        result.errors.push('Discount cannot exceed total value (quantity × unitPrice)');
        result.isValid = false;
      }
    }

    // 4. For updates, validate item exists
    if (operation === 'update' && itemData.id) {
      const { data: existingItem, error } = await supabaseAdmin
        .from('business_proposal_item')
        .select('id, proposal_id')
        .eq('id', itemData.id)
        .single();

      if (error || !existingItem) {
        result.errors.push(`Proposal item with ID ${itemData.id} not found`);
        result.isValid = false;
      } else if (existingItem.proposal_id !== proposalId) {
        result.errors.push('Item does not belong to the specified proposal');
        result.isValid = false;
      }
    }

  } catch (error) {
    logger.error('VALIDATION', 'Error during proposal item validation', error as Error);
    result.errors.push('Internal validation error');
    result.isValid = false;
  }

  return result;
}

/**
 * Validate cascade deletion operations
 */
export async function validateCascadeDeletion(proposalId: string): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  try {
    // 1. Check if proposal exists
    const { data: proposal, error: proposalError } = await supabaseAdmin
      .from('business_proposal')
      .select('id, title, status')
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      result.errors.push(`Proposal with ID ${proposalId} not found`);
      result.isValid = false;
      return result;
    }

    // 2. Warn about deleting accepted proposals
    if (proposal.status === BusinessProposalStatuses.ACCEPTED) {
      result.warnings.push(`Deleting accepted proposal: ${proposal.title}`);
    }

    // 3. Count related items that will be deleted
    const { count: itemCount } = await supabaseAdmin
      .from('business_proposal_item')
      .select('*', { count: 'exact', head: true })
      .eq('proposal_id', proposalId);

    if (itemCount && itemCount > 0) {
      result.warnings.push(`This operation will delete ${itemCount} related items`);
    }

  } catch (error) {
    logger.error('VALIDATION', 'Error during cascade deletion validation', error as Error);
    result.errors.push('Internal validation error');
    result.isValid = false;
  }

  return result;
}

/**
 * Validate multilingual message consistency
 */
export function validateMultilingualSupport(language: string): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  const supportedLanguages = ['pt-BR', 'en-US', 'es-CO'];
  
  if (!supportedLanguages.includes(language)) {
    result.warnings.push(`Language ${language} not fully supported, falling back to pt-BR`);
  }

  return result;
}

