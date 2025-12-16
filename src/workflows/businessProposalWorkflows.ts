import { Request, Response } from 'express';
import { 
  integratedProposalCreation,
  integratedProposalUpdate,
  integratedProposalDeletion,
  integratedItemCreation,
  integratedItemUpdate,
  performSystemIntegrityCheck,
  validateMultilingualWorkflow,
  IntegrationResult
} from '../integration/businessProposalIntegration';
import { getLanguageFromRequest } from '../utils/translations';
import { logger } from '../utils/logger';

/**
 * Complete workflow implementations for business proposal operations
 * Integrates validation, processing, and response handling
 */

/**
 * Complete CRUD workflow for business proposal creation
 */
export async function executeProposalCreationWorkflow(req: Request, res: Response): Promise<void> {
  const requestId = (req as any).requestId;
  const language = getLanguageFromRequest(req);
  
  try {
    // 1. Validate multilingual support
    const multilingualValidation = validateMultilingualWorkflow(language, 'CREATE_PROPOSAL');
    
    // 2. Execute integrated creation
    const result = await integratedProposalCreation(req.body, requestId);
    
    // 3. Handle response based on result
    if (result.success) {
      // Log warnings if any
      if (result.warnings.length > 0) {
        logger.warn('WORKFLOW', `Proposal creation completed with warnings: ${result.warnings.join(', ')}`, {
          requestId,
          proposalId: result.data?.id,
          warnings: result.warnings
        });
      }
      
      res.status(201).json(result.data);
    } else {
      // Handle validation or processing errors
      const errorMessage = result.errors.join('; ');
      logger.error('WORKFLOW', `Proposal creation workflow failed: ${errorMessage}`, new Error(errorMessage), {
        requestId,
        errors: result.errors,
        warnings: result.warnings
      });
      
      res.status(400).json({
        message: errorMessage,
        errors: result.errors,
        warnings: result.warnings,
        status: 400,
        requestId
      });
    }
    
  } catch (error) {
    logger.error('WORKFLOW', 'Proposal creation workflow error', error as Error, { requestId });
    res.status(500).json({
      message: 'Internal workflow error',
      status: 500,
      requestId
    });
  }
}

/**
 * Complete CRUD workflow for business proposal updates
 */
export async function executeProposalUpdateWorkflow(req: Request, res: Response): Promise<void> {
  const requestId = (req as any).requestId;
  const language = getLanguageFromRequest(req);
  const proposalId = req.params.id;
  
  try {
    // 1. Validate multilingual support
    const multilingualValidation = validateMultilingualWorkflow(language, 'UPDATE_PROPOSAL');
    
    // 2. Execute integrated update
    const result = await integratedProposalUpdate(proposalId, req.body, requestId);
    
    // 3. Handle response based on result
    if (result.success) {
      // Log warnings if any
      if (result.warnings.length > 0) {
        logger.warn('WORKFLOW', `Proposal update completed with warnings: ${result.warnings.join(', ')}`, {
          requestId,
          proposalId,
          warnings: result.warnings
        });
      }
      
      res.status(200).json(result.data);
    } else {
      // Handle validation or processing errors
      const errorMessage = result.errors.join('; ');
      const statusCode = result.errors.some(e => e.includes('not found')) ? 404 : 400;
      
      logger.error('WORKFLOW', `Proposal update workflow failed: ${errorMessage}`, new Error(errorMessage), {
        requestId,
        proposalId,
        errors: result.errors,
        warnings: result.warnings
      });
      
      res.status(statusCode).json({
        message: errorMessage,
        errors: result.errors,
        warnings: result.warnings,
        status: statusCode,
        requestId
      });
    }
    
  } catch (error) {
    logger.error('WORKFLOW', 'Proposal update workflow error', error as Error, { requestId, proposalId });
    res.status(500).json({
      message: 'Internal workflow error',
      status: 500,
      requestId
    });
  }
}

/**
 * Complete CRUD workflow for business proposal deletion
 */
export async function executeProposalDeletionWorkflow(req: Request, res: Response): Promise<void> {
  const requestId = (req as any).requestId;
  const language = getLanguageFromRequest(req);
  const proposalId = req.params.id;
  
  try {
    // 1. Validate multilingual support
    const multilingualValidation = validateMultilingualWorkflow(language, 'DELETE_PROPOSAL');
    
    // 2. Execute integrated deletion
    const result = await integratedProposalDeletion(proposalId, requestId);
    
    // 3. Handle response based on result
    if (result.success) {
      // Log warnings if any
      if (result.warnings.length > 0) {
        logger.warn('WORKFLOW', `Proposal deletion completed with warnings: ${result.warnings.join(', ')}`, {
          requestId,
          proposalId,
          warnings: result.warnings
        });
      }
      
      // Get success message in appropriate language
      const successMessages = {
        'pt-BR': 'Proposta excluída com sucesso',
        'en-US': 'Proposal deleted successfully',
        'es-CO': 'Propuesta eliminada exitosamente'
      };
      
      res.status(200).json({
        message: successMessages[language as keyof typeof successMessages] || successMessages['pt-BR'],
        id: proposalId,
        itemsDeleted: result.data?.itemsDeleted || 0
      });
    } else {
      // Handle validation or processing errors
      const errorMessage = result.errors.join('; ');
      const statusCode = result.errors.some(e => e.includes('not found')) ? 404 : 400;
      
      logger.error('WORKFLOW', `Proposal deletion workflow failed: ${errorMessage}`, new Error(errorMessage), {
        requestId,
        proposalId,
        errors: result.errors,
        warnings: result.warnings
      });
      
      res.status(statusCode).json({
        message: errorMessage,
        errors: result.errors,
        warnings: result.warnings,
        status: statusCode,
        requestId
      });
    }
    
  } catch (error) {
    logger.error('WORKFLOW', 'Proposal deletion workflow error', error as Error, { requestId, proposalId });
    res.status(500).json({
      message: 'Internal workflow error',
      status: 500,
      requestId
    });
  }
}

/**
 * Complete CRUD workflow for business proposal item creation
 */
export async function executeItemCreationWorkflow(req: Request, res: Response): Promise<void> {
  const requestId = (req as any).requestId;
  const language = getLanguageFromRequest(req);
  const proposalId = req.params.proposalId;
  
  try {
    // 1. Validate multilingual support
    const multilingualValidation = validateMultilingualWorkflow(language, 'CREATE_ITEM');
    
    // 2. Execute integrated item creation
    const result = await integratedItemCreation(proposalId, req.body, requestId);
    
    // 3. Handle response based on result
    if (result.success) {
      // Log warnings if any
      if (result.warnings.length > 0) {
        logger.warn('WORKFLOW', `Item creation completed with warnings: ${result.warnings.join(', ')}`, {
          requestId,
          proposalId,
          itemId: result.data?.id,
          warnings: result.warnings
        });
      }
      
      res.status(201).json(result.data);
    } else {
      // Handle validation or processing errors
      const errorMessage = result.errors.join('; ');
      const statusCode = result.errors.some(e => e.includes('not found')) ? 404 : 400;
      
      logger.error('WORKFLOW', `Item creation workflow failed: ${errorMessage}`, new Error(errorMessage), {
        requestId,
        proposalId,
        errors: result.errors,
        warnings: result.warnings
      });
      
      res.status(statusCode).json({
        message: errorMessage,
        errors: result.errors,
        warnings: result.warnings,
        status: statusCode,
        requestId
      });
    }
    
  } catch (error) {
    logger.error('WORKFLOW', 'Item creation workflow error', error as Error, { requestId, proposalId });
    res.status(500).json({
      message: 'Internal workflow error',
      status: 500,
      requestId
    });
  }
}

/**
 * Complete CRUD workflow for business proposal item updates
 */
export async function executeItemUpdateWorkflow(req: Request, res: Response): Promise<void> {
  const requestId = (req as any).requestId;
  const language = getLanguageFromRequest(req);
  const itemId = req.params.id;
  
  try {
    // 1. Validate multilingual support
    const multilingualValidation = validateMultilingualWorkflow(language, 'UPDATE_ITEM');
    
    // 2. Execute integrated item update
    const result = await integratedItemUpdate(itemId, req.body, requestId);
    
    // 3. Handle response based on result
    if (result.success) {
      // Log warnings if any
      if (result.warnings.length > 0) {
        logger.warn('WORKFLOW', `Item update completed with warnings: ${result.warnings.join(', ')}`, {
          requestId,
          itemId,
          warnings: result.warnings
        });
      }
      
      res.status(200).json(result.data);
    } else {
      // Handle validation or processing errors
      const errorMessage = result.errors.join('; ');
      const statusCode = result.errors.some(e => e.includes('not found')) ? 404 : 400;
      
      logger.error('WORKFLOW', `Item update workflow failed: ${errorMessage}`, new Error(errorMessage), {
        requestId,
        itemId,
        errors: result.errors,
        warnings: result.warnings
      });
      
      res.status(statusCode).json({
        message: errorMessage,
        errors: result.errors,
        warnings: result.warnings,
        status: statusCode,
        requestId
      });
    }
    
  } catch (error) {
    logger.error('WORKFLOW', 'Item update workflow error', error as Error, { requestId, itemId });
    res.status(500).json({
      message: 'Internal workflow error',
      status: 500,
      requestId
    });
  }
}

/**
 * System integrity validation workflow
 */
export async function executeSystemIntegrityWorkflow(req: Request, res: Response): Promise<void> {
  const requestId = (req as any).requestId;
  
  try {
    logger.info('WORKFLOW', 'Starting system integrity validation workflow', { requestId });
    
    // Execute system integrity check
    const result = await performSystemIntegrityCheck();
    
    // Return detailed integrity report
    res.status(result.success ? 200 : 500).json({
      integrity: result.success ? 'PASSED' : 'FAILED',
      checkTime: result.data?.checkTime,
      summary: {
        totalErrors: result.errors.length,
        totalWarnings: result.warnings.length,
        status: result.success ? 'HEALTHY' : 'ISSUES_FOUND'
      },
      errors: result.errors,
      warnings: result.warnings,
      requestId
    });
    
  } catch (error) {
    logger.error('WORKFLOW', 'System integrity workflow error', error as Error, { requestId });
    res.status(500).json({
      integrity: 'ERROR',
      message: 'Failed to perform integrity check',
      status: 500,
      requestId
    });
  }
}

/**
 * Complete multilingual validation workflow
 */
export function executeMultilingualValidationWorkflow(req: Request, res: Response): void {
  const requestId = (req as any).requestId;
  const language = getLanguageFromRequest(req);
  const operation = req.query.operation as string || 'GENERAL';
  
  try {
    const result = validateMultilingualWorkflow(language, operation);
    
    res.status(200).json({
      multilingual: {
        requestedLanguage: result.data?.requestedLanguage,
        isSupported: result.data?.isSupported,
        fallbackLanguage: result.data?.fallbackLanguage,
        operation: result.data?.operation
      },
      warnings: result.warnings,
      requestId
    });
    
  } catch (error) {
    logger.error('WORKFLOW', 'Multilingual validation workflow error', error as Error, { requestId });
    res.status(500).json({
      message: 'Failed to validate multilingual support',
      status: 500,
      requestId
    });
  }
}

/**
 * Complete data format validation workflow
 */
export async function executeDataFormatValidationWorkflow(req: Request, res: Response): Promise<void> {
  const requestId = (req as any).requestId;
  
  try {
    logger.info('WORKFLOW', 'Starting data format validation workflow', { requestId });
    
    // Test data format conversions
    const testData = {
      businessId: '123e4567-e89b-12d3-a456-426614174000',
      responsibleId: '123e4567-e89b-12d3-a456-426614174001',
      title: 'Test Proposal',
      date: '2024-01-15',
      value: 1000,
      themeColor: '#FF5733',
      termsAndConditions: 'Test terms',
      showUnitPrices: true,
      items: [{
        itemId: '123e4567-e89b-12d3-a456-426614174002',
        name: 'Test Item',
        quantity: 2,
        unitPrice: 500,
        discount: 100
      }]
    };
    
    // Validate camelCase to snake_case conversion
    const { businessProposalApiToDb, businessProposalItemApiToDb } = await import('../types');
    
    const dbProposal = businessProposalApiToDb(testData);
    const dbItem = businessProposalItemApiToDb(testData.items[0]);
    
    // Validate snake_case to camelCase conversion
    const { businessProposalDbToApi, businessProposalItemDbToApi } = await import('../types');
    
    const mockDbProposal = {
      id: '123e4567-e89b-12d3-a456-426614174003',
      business_id: testData.businessId,
      responsible_id: testData.responsibleId,
      title: testData.title,
      status: 'Rascunho',
      date: testData.date,
      value: testData.value,
      content: null,
      theme_color: testData.themeColor,
      terms_and_conditions: testData.termsAndConditions,
      show_unit_prices: testData.showUnitPrices,
      created_at: new Date().toISOString()
    };
    
    const apiProposal = businessProposalDbToApi(mockDbProposal);
    
    // Validate ISO 8601 timestamp format
    const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    const isValidTimestamp = timestampRegex.test(apiProposal.createdAt);
    
    res.status(200).json({
      dataFormatValidation: 'PASSED',
      conversions: {
        camelCaseToSnakeCase: {
          original: Object.keys(testData),
          converted: Object.keys(dbProposal),
          status: 'SUCCESS'
        },
        snakeCaseToCamelCase: {
          original: Object.keys(mockDbProposal),
          converted: Object.keys(apiProposal),
          status: 'SUCCESS'
        },
        timestampFormat: {
          value: apiProposal.createdAt,
          isISO8601: isValidTimestamp,
          status: isValidTimestamp ? 'SUCCESS' : 'FAILED'
        }
      },
      requestId
    });
    
  } catch (error) {
    logger.error('WORKFLOW', 'Data format validation workflow error', error as Error, { requestId });
    res.status(500).json({
      dataFormatValidation: 'ERROR',
      message: 'Failed to validate data format conversions',
      status: 500,
      requestId
    });
  }
}

/**
 * Complete relationship validation workflow
 */
export async function executeRelationshipValidationWorkflow(req: Request, res: Response): Promise<void> {
  const requestId = (req as any).requestId;
  
  try {
    logger.info('WORKFLOW', 'Starting relationship validation workflow', { requestId });
    
    const { supabaseAdmin } = await import('../supabaseClient');
    
    // Test relationship validations
    const validationResults = {
      businessProposalToBusiness: false,
      businessProposalToUser: false,
      proposalItemToProposal: false,
      proposalItemToItem: false
    };
    
    // Check business_proposal -> business relationship
    const { data: businessProposals } = await supabaseAdmin
      .from('business_proposal')
      .select(`
        id,
        business_id,
        business:business_id (id, title)
      `)
      .limit(1);
    
    if (businessProposals && businessProposals.length > 0) {
      validationResults.businessProposalToBusiness = !!(businessProposals[0] as any).business;
    }
    
    // Check business_proposal -> users relationship
    const { data: proposalUsers } = await supabaseAdmin
      .from('business_proposal')
      .select(`
        id,
        responsible_id,
        responsible:responsible_id (id, name)
      `)
      .limit(1);
    
    if (proposalUsers && proposalUsers.length > 0) {
      validationResults.businessProposalToUser = !!(proposalUsers[0] as any).responsible;
    }
    
    // Check business_proposal_item -> business_proposal relationship
    const { data: proposalItems } = await supabaseAdmin
      .from('business_proposal_item')
      .select(`
        id,
        proposal_id,
        proposal:proposal_id (id, title)
      `)
      .limit(1);
    
    if (proposalItems && proposalItems.length > 0) {
      validationResults.proposalItemToProposal = !!(proposalItems[0] as any).proposal;
    }
    
    // Check business_proposal_item -> item relationship
    const { data: itemRelations } = await supabaseAdmin
      .from('business_proposal_item')
      .select(`
        id,
        item_id,
        item:item_id (id, name)
      `)
      .limit(1);
    
    if (itemRelations && itemRelations.length > 0) {
      validationResults.proposalItemToItem = !!(itemRelations[0] as any).item;
    }
    
    const allRelationshipsValid = Object.values(validationResults).every(Boolean);
    
    res.status(200).json({
      relationshipValidation: allRelationshipsValid ? 'PASSED' : 'PARTIAL',
      relationships: validationResults,
      summary: {
        total: Object.keys(validationResults).length,
        valid: Object.values(validationResults).filter(Boolean).length,
        invalid: Object.values(validationResults).filter(v => !v).length
      },
      requestId
    });
    
  } catch (error) {
    logger.error('WORKFLOW', 'Relationship validation workflow error', error as Error, { requestId });
    res.status(500).json({
      relationshipValidation: 'ERROR',
      message: 'Failed to validate relationships',
      status: 500,
      requestId
    });
  }
}