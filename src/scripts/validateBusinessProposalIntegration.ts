#!/usr/bin/env ts-node

/**
 * Comprehensive validation script for business proposal integration
 * Tests complete CRUD workflows, relationships, multilingual support, and edge cases
 */

import { supabaseAdmin } from '../supabaseClient';
import { logger } from '../utils/logger';
import { 
  validateProposalCreationWorkflow,
  validateProposalUpdateWorkflow,
  validateProposalItemWorkflow,
  validateCascadeDeletion,
  validateSystemIntegrity
} from '../validation/businessProposalValidation';
import { 
  integratedProposalCreation,
  integratedProposalUpdate,
  integratedProposalDeletion,
  integratedItemCreation,
  integratedItemUpdate,
  performSystemIntegrityCheck
} from '../integration/businessProposalIntegration';
import { BusinessProposalStatuses } from '../types';

interface ValidationReport {
  testName: string;
  status: 'PASSED' | 'FAILED' | 'WARNING';
  message: string;
  details?: any;
  duration?: number;
}

class BusinessProposalIntegrationValidator {
  private reports: ValidationReport[] = [];
  private testData: any = {};

  private addReport(testName: string, status: 'PASSED' | 'FAILED' | 'WARNING', message: string, details?: any, duration?: number): void {
    this.reports.push({
      testName,
      status,
      message,
      details,
      duration
    });
    
    const logMessage = `${testName}: ${status} - ${message}`;
    if (status === 'PASSED') {
      logger.info('VALIDATION', logMessage, details);
    } else if (status === 'WARNING') {
      logger.warn('VALIDATION', logMessage, details);
    } else {
      logger.error('VALIDATION', logMessage, new Error(message), details);
    }
  }

  private async createTestData(): Promise<void> {
    try {
      logger.info('VALIDATION', 'Creating test data for validation');

      // Create test user
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          name: 'Validation Test User',
          email: 'validation@test.com',
          role: 'SALES_REP'
        })
        .select()
        .single();

      if (userError) throw userError;
      this.testData.userId = user.id;

      // Create test account
      const { data: account, error: accountError } = await supabaseAdmin
        .from('account')
        .insert({
          name: 'Validation Test Account',
          segment: 'Technology',
          responsible_id: this.testData.userId,
          status: 'ACTIVE',
          type: 'Client',
          pipeline: 'Main',
          last_interaction: new Date().toISOString()
        })
        .select()
        .single();

      if (accountError) throw accountError;
      this.testData.accountId = account.id;

      // Create test business
      const { data: business, error: businessError } = await supabaseAdmin
        .from('business')
        .insert({
          title: 'Validation Test Business',
          account_id: this.testData.accountId,
          value: 10000,
          currency: 'BRL',
          stage: 'Proposal',
          probability: 75,
          owner_id: this.testData.userId
        })
        .select()
        .single();

      if (businessError) throw businessError;
      this.testData.businessId = business.id;

      // Create test item
      const { data: item, error: itemError } = await supabaseAdmin
        .from('item')
        .insert({
          name: 'Validation Test Item',
          type: 'PRODUCT',
          price: 250,
          sku_code: 'VAL-001',
          description: 'Test item for validation'
        })
        .select()
        .single();

      if (itemError) throw itemError;
      this.testData.itemId = item.id;

      this.addReport('Test Data Creation', 'PASSED', 'All test data created successfully');

    } catch (error) {
      this.addReport('Test Data Creation', 'FAILED', `Failed to create test data: ${(error as Error).message}`);
      throw error;
    }
  }

  private async cleanupTestData(): Promise<void> {
    try {
      logger.info('VALIDATION', 'Cleaning up test data');

      // Clean up in reverse order of dependencies
      if (this.testData.proposalId) {
        await supabaseAdmin.from('business_proposal').delete().eq('id', this.testData.proposalId);
      }
      if (this.testData.businessId) {
        await supabaseAdmin.from('business').delete().eq('id', this.testData.businessId);
      }
      if (this.testData.accountId) {
        await supabaseAdmin.from('account').delete().eq('id', this.testData.accountId);
      }
      if (this.testData.itemId) {
        await supabaseAdmin.from('item').delete().eq('id', this.testData.itemId);
      }
      if (this.testData.userId) {
        await supabaseAdmin.from('users').delete().eq('id', this.testData.userId);
      }

      this.addReport('Test Data Cleanup', 'PASSED', 'All test data cleaned up successfully');

    } catch (error) {
      this.addReport('Test Data Cleanup', 'WARNING', `Cleanup warning: ${(error as Error).message}`);
    }
  }

  private async testProposalCreationWorkflow(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const proposalData = {
        businessId: this.testData.businessId,
        responsibleId: this.testData.userId,
        title: 'Validation Test Proposal',
        status: BusinessProposalStatuses.DRAFT,
        date: '2024-02-15',
        value: 750,
        content: 'Test proposal for validation',
        items: [
          {
            itemId: this.testData.itemId,
            name: 'Test Item 1',
            quantity: 2,
            unitPrice: 250,
            discount: 50
          },
          {
            itemId: this.testData.itemId,
            name: 'Test Item 2',
            quantity: 1,
            unitPrice: 300,
            discount: 0
          }
        ],
        themeColor: '#4CAF50',
        termsAndConditions: 'Standard validation terms',
        showUnitPrices: true
      };

      // Test validation
      const validation = await validateProposalCreationWorkflow(proposalData);
      if (!validation.isValid) {
        this.addReport('Proposal Creation Validation', 'FAILED', `Validation failed: ${validation.errors.join(', ')}`);
        return;
      }

      // Test integrated creation
      const result = await integratedProposalCreation(proposalData, 'validation-test');
      if (!result.success) {
        this.addReport('Proposal Creation Integration', 'FAILED', `Integration failed: ${result.errors.join(', ')}`);
        return;
      }

      this.testData.proposalId = result.data.id;
      const duration = Date.now() - startTime;

      // Verify creation
      const { data: createdProposal } = await supabaseAdmin
        .from('business_proposal')
        .select('*, business_proposal_item(*)')
        .eq('id', this.testData.proposalId)
        .single();

      if (!createdProposal) {
        this.addReport('Proposal Creation Verification', 'FAILED', 'Created proposal not found in database');
        return;
      }

      // Verify calculations
      const items = (createdProposal as any).business_proposal_item || [];
      const expectedTotal1 = (2 * 250) - 50; // 450
      const expectedTotal2 = (1 * 300) - 0;  // 300
      
      if (items[0]?.total !== expectedTotal1 || items[1]?.total !== expectedTotal2) {
        this.addReport('Proposal Item Calculations', 'FAILED', 'Item total calculations are incorrect');
        return;
      }

      this.addReport('Proposal Creation Workflow', 'PASSED', 'Complete workflow executed successfully', {
        proposalId: this.testData.proposalId,
        itemCount: items.length,
        totalValue: createdProposal.value
      }, duration);

    } catch (error) {
      const duration = Date.now() - startTime;
      this.addReport('Proposal Creation Workflow', 'FAILED', `Workflow failed: ${(error as Error).message}`, undefined, duration);
    }
  }

  private async testProposalUpdateWorkflow(): Promise<void> {
    const startTime = Date.now();
    
    try {
      if (!this.testData.proposalId) {
        this.addReport('Proposal Update Workflow', 'FAILED', 'No proposal ID available for update test');
        return;
      }

      const updateData = {
        title: 'Updated Validation Test Proposal',
        status: BusinessProposalStatuses.IN_REVIEW,
        value: 900,
        content: 'Updated content for validation'
      };

      // Test validation
      const validation = await validateProposalUpdateWorkflow(this.testData.proposalId, updateData);
      if (!validation.isValid) {
        this.addReport('Proposal Update Validation', 'FAILED', `Validation failed: ${validation.errors.join(', ')}`);
        return;
      }

      // Test integrated update
      const result = await integratedProposalUpdate(this.testData.proposalId, updateData, 'validation-update-test');
      if (!result.success) {
        this.addReport('Proposal Update Integration', 'FAILED', `Integration failed: ${result.errors.join(', ')}`);
        return;
      }

      const duration = Date.now() - startTime;

      // Verify update
      const { data: updatedProposal } = await supabaseAdmin
        .from('business_proposal')
        .select('*')
        .eq('id', this.testData.proposalId)
        .single();

      if (!updatedProposal || updatedProposal.title !== updateData.title) {
        this.addReport('Proposal Update Verification', 'FAILED', 'Updated proposal data is incorrect');
        return;
      }

      this.addReport('Proposal Update Workflow', 'PASSED', 'Update workflow executed successfully', {
        proposalId: this.testData.proposalId,
        updatedFields: Object.keys(updateData).length
      }, duration);

    } catch (error) {
      const duration = Date.now() - startTime;
      this.addReport('Proposal Update Workflow', 'FAILED', `Workflow failed: ${(error as Error).message}`, undefined, duration);
    }
  }

  private async testProposalItemWorkflow(): Promise<void> {
    const startTime = Date.now();
    
    try {
      if (!this.testData.proposalId) {
        this.addReport('Proposal Item Workflow', 'FAILED', 'No proposal ID available for item test');
        return;
      }

      const itemData = {
        itemId: this.testData.itemId,
        name: 'Additional Validation Item',
        quantity: 3,
        unitPrice: 150,
        discount: 75
      };

      // Test item creation validation
      const validation = await validateProposalItemWorkflow(this.testData.proposalId, itemData, 'create');
      if (!validation.isValid) {
        this.addReport('Proposal Item Creation Validation', 'FAILED', `Validation failed: ${validation.errors.join(', ')}`);
        return;
      }

      // Test integrated item creation
      const result = await integratedItemCreation(this.testData.proposalId, itemData, 'validation-item-test');
      if (!result.success) {
        this.addReport('Proposal Item Creation Integration', 'FAILED', `Integration failed: ${result.errors.join(', ')}`);
        return;
      }

      const createdItemId = result.data.id;
      const expectedTotal = (3 * 150) - 75; // 375

      if (result.data.total !== expectedTotal) {
        this.addReport('Proposal Item Calculation', 'FAILED', `Incorrect total calculation: expected ${expectedTotal}, got ${result.data.total}`);
        return;
      }

      // Test item update
      const updateData = {
        quantity: 4,
        unitPrice: 200,
        discount: 100
      };

      const updateResult = await integratedItemUpdate(createdItemId, updateData, 'validation-item-update-test');
      if (!updateResult.success) {
        this.addReport('Proposal Item Update Integration', 'FAILED', `Update integration failed: ${updateResult.errors.join(', ')}`);
        return;
      }

      const expectedUpdatedTotal = (4 * 200) - 100; // 700
      if (updateResult.data.total !== expectedUpdatedTotal) {
        this.addReport('Proposal Item Update Calculation', 'FAILED', `Incorrect updated total: expected ${expectedUpdatedTotal}, got ${updateResult.data.total}`);
        return;
      }

      const duration = Date.now() - startTime;
      this.addReport('Proposal Item Workflow', 'PASSED', 'Item workflow executed successfully', {
        itemId: createdItemId,
        originalTotal: expectedTotal,
        updatedTotal: expectedUpdatedTotal
      }, duration);

    } catch (error) {
      const duration = Date.now() - startTime;
      this.addReport('Proposal Item Workflow', 'FAILED', `Workflow failed: ${(error as Error).message}`, undefined, duration);
    }
  }

  private async testCascadeDeletion(): Promise<void> {
    const startTime = Date.now();
    
    try {
      if (!this.testData.proposalId) {
        this.addReport('Cascade Deletion Test', 'FAILED', 'No proposal ID available for deletion test');
        return;
      }

      // Get item count before deletion
      const { count: itemCount } = await supabaseAdmin
        .from('business_proposal_item')
        .select('*', { count: 'exact', head: true })
        .eq('proposal_id', this.testData.proposalId);

      // Test deletion validation
      const validation = await validateCascadeDeletion(this.testData.proposalId);
      if (!validation.isValid) {
        this.addReport('Cascade Deletion Validation', 'FAILED', `Validation failed: ${validation.errors.join(', ')}`);
        return;
      }

      // Test integrated deletion
      const result = await integratedProposalDeletion(this.testData.proposalId, 'validation-delete-test');
      if (!result.success) {
        this.addReport('Cascade Deletion Integration', 'FAILED', `Integration failed: ${result.errors.join(', ')}`);
        return;
      }

      // Verify proposal is deleted
      const { data: deletedProposal } = await supabaseAdmin
        .from('business_proposal')
        .select('*')
        .eq('id', this.testData.proposalId)
        .single();

      if (deletedProposal) {
        this.addReport('Cascade Deletion Verification', 'FAILED', 'Proposal was not deleted');
        return;
      }

      // Verify items are cascade deleted
      const { count: remainingItems } = await supabaseAdmin
        .from('business_proposal_item')
        .select('*', { count: 'exact', head: true })
        .eq('proposal_id', this.testData.proposalId);

      if (remainingItems && remainingItems > 0) {
        this.addReport('Cascade Deletion Items', 'FAILED', 'Items were not cascade deleted');
        return;
      }

      const duration = Date.now() - startTime;
      this.testData.proposalId = null; // Mark as deleted

      this.addReport('Cascade Deletion Test', 'PASSED', 'Cascade deletion executed successfully', {
        itemsDeleted: itemCount || 0
      }, duration);

    } catch (error) {
      const duration = Date.now() - startTime;
      this.addReport('Cascade Deletion Test', 'FAILED', `Test failed: ${(error as Error).message}`, undefined, duration);
    }
  }

  private async testSystemIntegrity(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const result = await performSystemIntegrityCheck();
      const duration = Date.now() - startTime;

      if (result.success) {
        this.addReport('System Integrity Check', 'PASSED', 'System integrity validated successfully', {
          warnings: result.warnings.length
        }, duration);
      } else {
        this.addReport('System Integrity Check', 'WARNING', `Integrity issues found: ${result.errors.join(', ')}`, {
          errors: result.errors.length,
          warnings: result.warnings.length
        }, duration);
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      this.addReport('System Integrity Check', 'FAILED', `Check failed: ${(error as Error).message}`, undefined, duration);
    }
  }

  private async testMultilingualSupport(): Promise<void> {
    try {
      const languages = ['pt-BR', 'en-US', 'es-CO', 'fr-FR'];
      const results = [];

      for (const language of languages) {
        const { validateMultilingualSupport } = await import('../validation/businessProposalValidation');
        const validation = validateMultilingualSupport(language);
        results.push({
          language,
          supported: validation.warnings.length === 0,
          warnings: validation.warnings
        });
      }

      const supportedCount = results.filter(r => r.supported).length;
      const expectedSupported = 3; // pt-BR, en-US, es-CO

      if (supportedCount >= expectedSupported) {
        this.addReport('Multilingual Support Test', 'PASSED', `${supportedCount}/${languages.length} languages supported`, {
          results
        });
      } else {
        this.addReport('Multilingual Support Test', 'WARNING', `Only ${supportedCount}/${languages.length} languages fully supported`, {
          results
        });
      }

    } catch (error) {
      this.addReport('Multilingual Support Test', 'FAILED', `Test failed: ${(error as Error).message}`);
    }
  }

  private async testDataFormatConversion(): Promise<void> {
    try {
      const { businessProposalApiToDb, businessProposalDbToApi } = await import('../types');

      // Test camelCase to snake_case conversion
      const apiData = {
        businessId: 'test-business-id',
        responsibleId: 'test-user-id',
        title: 'Test Proposal',
        themeColor: '#FF5733',
        termsAndConditions: 'Test terms',
        showUnitPrices: true
      };

      const dbData = businessProposalApiToDb(apiData);
      
      // Verify conversion
      const expectedDbFields = ['business_id', 'responsible_id', 'title', 'theme_color', 'terms_and_conditions', 'show_unit_prices'];
      const actualDbFields = Object.keys(dbData);
      
      const hasAllFields = expectedDbFields.every(field => actualDbFields.includes(field));
      
      if (!hasAllFields) {
        this.addReport('Data Format Conversion', 'FAILED', 'camelCase to snake_case conversion failed');
        return;
      }

      // Test snake_case to camelCase conversion
      const mockDbProposal = {
        id: 'test-id',
        business_id: 'test-business-id',
        responsible_id: 'test-user-id',
        title: 'Test Proposal',
        status: 'Rascunho',
        date: '2024-01-15',
        value: 1000,
        content: null,
        theme_color: '#FF5733',
        terms_and_conditions: 'Test terms',
        show_unit_prices: true,
        created_at: new Date().toISOString()
      };

      const apiProposal = businessProposalDbToApi(mockDbProposal);
      
      // Verify conversion
      const expectedApiFields = ['id', 'business', 'responsible', 'title', 'status', 'date', 'value', 'themeColor', 'termsAndConditions', 'showUnitPrices', 'createdAt'];
      const actualApiFields = Object.keys(apiProposal);
      
      const hasAllApiFields = expectedApiFields.every(field => actualApiFields.includes(field));
      
      if (!hasAllApiFields) {
        this.addReport('Data Format Conversion', 'FAILED', 'snake_case to camelCase conversion failed');
        return;
      }

      // Test ISO 8601 timestamp format
      const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      const isValidTimestamp = timestampRegex.test(apiProposal.createdAt);

      if (!isValidTimestamp) {
        this.addReport('Data Format Conversion', 'FAILED', 'ISO 8601 timestamp format validation failed');
        return;
      }

      this.addReport('Data Format Conversion', 'PASSED', 'All data format conversions working correctly', {
        camelToSnake: hasAllFields,
        snakeToCamel: hasAllApiFields,
        iso8601: isValidTimestamp
      });

    } catch (error) {
      this.addReport('Data Format Conversion', 'FAILED', `Test failed: ${(error as Error).message}`);
    }
  }

  public async runValidation(): Promise<void> {
    const overallStartTime = Date.now();
    
    logger.info('VALIDATION', 'Starting comprehensive business proposal integration validation');

    try {
      // Setup
      await this.createTestData();

      // Run all validation tests
      await this.testProposalCreationWorkflow();
      await this.testProposalUpdateWorkflow();
      await this.testProposalItemWorkflow();
      await this.testCascadeDeletion();
      await this.testSystemIntegrity();
      await this.testMultilingualSupport();
      await this.testDataFormatConversion();

      // Cleanup
      await this.cleanupTestData();

    } catch (error) {
      logger.error('VALIDATION', 'Validation setup failed', error as Error);
      this.addReport('Validation Setup', 'FAILED', `Setup failed: ${(error as Error).message}`);
    }

    // Generate final report
    const overallDuration = Date.now() - overallStartTime;
    this.generateFinalReport(overallDuration);
  }

  private generateFinalReport(totalDuration: number): void {
    const passed = this.reports.filter(r => r.status === 'PASSED').length;
    const failed = this.reports.filter(r => r.status === 'FAILED').length;
    const warnings = this.reports.filter(r => r.status === 'WARNING').length;
    const total = this.reports.length;

    console.log('\n' + '='.repeat(80));
    console.log('BUSINESS PROPOSAL INTEGRATION VALIDATION REPORT');
    console.log('='.repeat(80));
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Warnings: ${warnings}`);
    console.log(`Success Rate: ${Math.round((passed / total) * 100)}%`);
    console.log('='.repeat(80));

    this.reports.forEach(report => {
      const statusIcon = report.status === 'PASSED' ? '✅' : report.status === 'WARNING' ? '⚠️' : '❌';
      const duration = report.duration ? ` (${report.duration}ms)` : '';
      console.log(`${statusIcon} ${report.testName}: ${report.message}${duration}`);
      
      if (report.details) {
        console.log(`   Details: ${JSON.stringify(report.details, null, 2)}`);
      }
    });

    console.log('='.repeat(80));

    if (failed > 0) {
      logger.error('VALIDATION', `Validation completed with ${failed} failures`);
      process.exit(1);
    } else {
      logger.info('VALIDATION', `Validation completed successfully with ${warnings} warnings`);
      process.exit(0);
    }
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const validator = new BusinessProposalIntegrationValidator();
  validator.runValidation().catch(error => {
    console.error('Validation script failed:', error);
    process.exit(1);
  });
}

export { BusinessProposalIntegrationValidator };