import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getRevenuePerPeriod, getMoreSalesByResponsible, getSalesFunnel, getTotalRevenue, getActiveAccounts, getNewBusiness } from '../controllers/dashboardController';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Dashboard routes
// GET /api/dashboard/revenue-per-period?period=THIS_MONTH|THIS_YEAR|LAST_QUARTER - Get monthly revenue totals for a specific period
router.get('/revenue-per-period', getRevenuePerPeriod);

// GET /api/dashboard/more-sales-by-responsible?period=THIS_MONTH|THIS_YEAR|LAST_QUARTER - Get sales performance by responsible users
router.get('/more-sales-by-responsible', getMoreSalesByResponsible);

// GET /api/dashboard/sales-funnel?period=THIS_MONTH|THIS_YEAR|LAST_QUARTER - Get sales funnel distribution by stage
router.get('/sales-funnel', getSalesFunnel);

// GET /api/dashboard/total-revenue?period=THIS_MONTH|THIS_YEAR|LAST_QUARTER - Get total revenue from all closed-won business deals
router.get('/total-revenue', getTotalRevenue);

// GET /api/dashboard/active-accounts - Get total count of active accounts
router.get('/active-accounts', getActiveAccounts);

// GET /api/dashboard/new-business?period=THIS_MONTH|THIS_YEAR|LAST_QUARTER - Get count of new businesses created in a specific period
router.get('/new-business', getNewBusiness);

export default router;