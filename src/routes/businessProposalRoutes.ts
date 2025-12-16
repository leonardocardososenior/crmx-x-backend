import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncBusinessProposalHandler } from '../middleware/businessProposalErrorHandler';
import {
  createBusinessProposal,
  getBusinessProposals,
  getBusinessProposalById,
  updateBusinessProposal,
  deleteBusinessProposal
} from '../controllers/businessProposalController';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Business Proposal routes with enhanced error handling
// POST /api/business-proposals - Create new business proposal
router.post('/', asyncBusinessProposalHandler(createBusinessProposal));

// GET /api/business-proposals - Get all business proposals with filtering and pagination
router.get('/', asyncBusinessProposalHandler(getBusinessProposals));

// GET /api/business-proposals/:id - Get single business proposal by ID
router.get('/:id', asyncBusinessProposalHandler(getBusinessProposalById));

// PUT /api/business-proposals/:id - Update existing business proposal
router.put('/:id', asyncBusinessProposalHandler(updateBusinessProposal));

// DELETE /api/business-proposals/:id - Delete business proposal (cascade deletion of items)
router.delete('/:id', asyncBusinessProposalHandler(deleteBusinessProposal));

export default router;