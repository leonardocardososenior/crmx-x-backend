import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getRevenuePerYear, getMoreSalesByResponsible } from '../controllers/dashboardController';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Dashboard routes
// GET /api/dashboard/revenue-per-year/:year - Get monthly revenue totals for a specific year
router.get('/revenue-per-year/:year', getRevenuePerYear);

// GET /api/dashboard/more-sales-by-responsible - Get sales performance by responsible users
router.get('/more-sales-by-responsible', getMoreSalesByResponsible);

export default router;