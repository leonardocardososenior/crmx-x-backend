import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncBusinessProposalHandler } from '../middleware/businessProposalErrorHandler';
import {
  executeSystemIntegrityWorkflow,
  executeMultilingualValidationWorkflow,
  executeDataFormatValidationWorkflow,
  executeRelationshipValidationWorkflow
} from '../workflows/businessProposalWorkflows';

const router = Router();

// Apply authentication middleware
router.use(requireAuth);

// System integrity validation endpoint
// GET /api/validation/system-integrity - Validate complete system integrity
router.get('/system-integrity', asyncBusinessProposalHandler(executeSystemIntegrityWorkflow));

// Multilingual support validation endpoint
// GET /api/validation/multilingual - Validate multilingual support
router.get('/multilingual', executeMultilingualValidationWorkflow);

// Data format conversion validation endpoint
// GET /api/validation/data-format - Validate data format conversions
router.get('/data-format', asyncBusinessProposalHandler(executeDataFormatValidationWorkflow));

// Relationship validation endpoint
// GET /api/validation/relationships - Validate database relationships
router.get('/relationships', asyncBusinessProposalHandler(executeRelationshipValidationWorkflow));

export default router;