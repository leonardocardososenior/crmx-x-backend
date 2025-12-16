import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncBusinessProposalHandler } from '../middleware/businessProposalErrorHandler';
import {
  createBusinessProposalItem,
  getBusinessProposalItems,
  getBusinessProposalItemById,
  updateBusinessProposalItem,
  deleteBusinessProposalItem
} from '../controllers/businessProposalItemController';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Business Proposal Item routes (CRUD completo) with enhanced error handling
// POST /api/business-proposal-items - Create new business proposal item
router.post('/', asyncBusinessProposalHandler(createBusinessProposalItem));

// GET /api/business-proposal-items - Get business proposal items with filtering and pagination
router.get('/', asyncBusinessProposalHandler(getBusinessProposalItems));

// GET /api/business-proposal-items/:id - Get single business proposal item by ID
router.get('/:id', asyncBusinessProposalHandler(getBusinessProposalItemById));

// PUT /api/business-proposal-items/:id - Update existing business proposal item
router.put('/:id', asyncBusinessProposalHandler(updateBusinessProposalItem));

// DELETE /api/business-proposal-items/:id - Delete business proposal item
router.delete('/:id', asyncBusinessProposalHandler(deleteBusinessProposalItem));

export default router;