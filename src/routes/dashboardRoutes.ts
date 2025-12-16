import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getRevenuePerYear, getMoreSalesByResponsible, getSalesFunnel, getTotalRevenue, getActiveAccounts } from '../controllers/dashboardController';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Dashboard routes
// GET /api/dashboard/revenue-per-year/:year - Get monthly revenue totals for a specific year
router.get('/revenue-per-year/:year', getRevenuePerYear);

// GET /api/dashboard/more-sales-by-responsible?period=THIS_MONTH|THIS_YEAR|LAST_QUARTER - Get sales performance by responsible users
router.get('/more-sales-by-responsible', getMoreSalesByResponsible);

// GET /api/dashboard/sales-funnel?period=THIS_MONTH|THIS_YEAR|LAST_QUARTER - Get sales funnel distribution by stage
router.get('/sales-funnel', getSalesFunnel);

// GET /api/dashboard/total-revenue?period=THIS_MONTH|THIS_YEAR|LAST_QUARTER - Get total revenue from all closed-won business deals
router.get('/total-revenue', getTotalRevenue);

// GET /api/dashboard/active-accounts - Get total count of active accounts
router.get('/active-accounts', getActiveAccounts);

export default router;