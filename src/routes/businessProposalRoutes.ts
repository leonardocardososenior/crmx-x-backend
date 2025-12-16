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
import {
  createBusinessProposalItem,
  getBusinessProposalItems
} from '../controllers/businessProposalItemController';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Business Proposal routes with enhanced error handling
// POST /api/business-proposals - Create new business proposal
router.post('/', asyncBusinessProposalHandler(createBusinessProposal));

// GET /api/business-proposals - Get all business proposals with filtering and pagination
router.get('/', asyncBusinessProposalHandler(getBusinessProposals));

// GET /api/business-proposals/:id - Get single business proposal by ID with items
router.get('/:id', asyncBusinessProposalHandler(getBusinessProposalById));

// PUT /api/business-proposals/:id - Update existing business proposal
router.put('/:id', asyncBusinessProposalHandler(updateBusinessProposal));

// DELETE /api/business-proposals/:id - Delete business proposal (cascade deletion of items)
router.delete('/:id', asyncBusinessProposalHandler(deleteBusinessProposal));

// Business Proposal Item nested routes
// POST /api/business-proposals/:proposalId/items - Add item to proposal
router.post('/:proposalId/items', asyncBusinessProposalHandler(createBusinessProposalItem));

// GET /api/business-proposals/:proposalId/items - Get items for specific proposal
router.get('/:proposalId/items', asyncBusinessProposalHandler(getBusinessProposalItems));

export default router;