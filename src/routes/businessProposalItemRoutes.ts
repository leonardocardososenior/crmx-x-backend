import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncBusinessProposalHandler } from '../middleware/businessProposalErrorHandler';
import {
  getBusinessProposalItemById,
  updateBusinessProposalItem,
  deleteBusinessProposalItem
} from '../controllers/businessProposalItemController';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Business Proposal Item routes (for direct item operations) with enhanced error handling
// GET /api/business-proposal-items/:id - Get single business proposal item by ID
router.get('/:id', asyncBusinessProposalHandler(getBusinessProposalItemById));

// PUT /api/business-proposal-items/:id - Update existing business proposal item
router.put('/:id', asyncBusinessProposalHandler(updateBusinessProposalItem));

// DELETE /api/business-proposal-items/:id - Delete business proposal item
router.delete('/:id', asyncBusinessProposalHandler(deleteBusinessProposalItem));

export default router;