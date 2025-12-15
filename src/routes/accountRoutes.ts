import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  deleteAccount
} from '../controllers/accountController';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Account routes
// POST /api/accounts - Create new account
router.post('/', createAccount);

// GET /api/accounts - Get all accounts with filtering and pagination
router.get('/', getAccounts);

// GET /api/accounts/:id - Get single account by ID
router.get('/:id', getAccountById);

// PUT /api/accounts/:id - Update existing account
router.put('/:id', updateAccount);

// DELETE /api/accounts/:id - Delete account
router.delete('/:id', deleteAccount);

export default router;