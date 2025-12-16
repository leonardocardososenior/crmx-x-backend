import { Request, Response } from 'express';
import { supabaseAdmin } from '../supabaseClient';
import { RevenuePerYearParamsSchema, DashboardQueryParamsSchema, MonthlyRevenueResponseType, MoreSalesByResponsibleResponseType, SalesFunnelResponseType, TotalRevenueResponseType, ActiveAccountsResponseType } from '../schemas/dashboardSchemas';
import { BusinessStages, AccountStatuses } from '../types';
import { 
  handleValidationError, 
  handleDatabaseError, 
  handleInternalError
} from '../utils/controllerHelpers';
import { getLanguageFromRequest, createLocalizedMonthlyResponse } from '../utils/translations';
import { createClosingDateFilter } from '../utils/dateFilters';

/**
 * Get revenue per year aggregated by month
 * GET /api/dashboard/revenue-per-year/:year
 */
export async function getRevenuePerYear(req: Request, res: Response): Promise<void> {
  try {
    // Validate year parameter using Zod schema
    const validationResult = RevenuePerYearParamsSchema.safeParse(req.params);
    
    if (!validationResult.success) {
      handleValidationError(validationResult, res, req);
      return;
    }

    const { year } = validationResult.data;

    // Execute revenue aggregation query
    // Filter by stage = 'Closed Won' and year from created_at
    // Group by month and calculate sum of values
    const { data: monthlyRevenue, error } = await supabaseAdmin
      .from('business')
      .select('value, created_at')
      .eq('stage', BusinessStages.CLOSED_WON)
      .gte('created_at', `${year}-01-01T00:00:00.000Z`)
      .lt('created_at', `${year + 1}-01-01T00:00:00.000Z`);

    if (error) {
      handleDatabaseError('SELECT', 'business', error, res, req);
      return;
    }

    // Process the data to aggregate by month
    const monthlyData: Array<{ month: number; revenue: number }> = [];
    const monthlyTotals: Record<number, number> = {};

    // Initialize all months with zero
    for (let month = 1; month <= 12; month++) {
      monthlyTotals[month] = 0;
    }

    // Aggregate revenue by month
    if (monthlyRevenue && monthlyRevenue.length > 0) {
      monthlyRevenue.forEach((business) => {
        if (business.created_at) {
          const createdDate = new Date(business.created_at);
          const month = createdDate.getUTCMonth() + 1; // getUTCMonth() returns 0-11, we need 1-12
          monthlyTotals[month] += business.value || 0;
        }
      });
    }

    // Convert to array format for localization function, excluding months with zero revenue
    for (let month = 1; month <= 12; month++) {
      if (monthlyTotals[month] > 0) {
        monthlyData.push({
          month,
          revenue: monthlyTotals[month]
        });
      }
    }

    // Get language from request and format response with localized month names
    const language = getLanguageFromRequest(req);
    const localizedResponse = createLocalizedMonthlyResponse(monthlyData, language);

    // Return formatted response
    res.status(200).json(localizedResponse);

  } catch (error) {
    handleInternalError('fetching revenue per year', error, res, req);
  }
}

/**
 * Get sales performance by responsible users
 * GET /api/dashboard/more-sales-by-responsible?period=THIS_MONTH|THIS_YEAR|LAST_QUARTER
 */
export async function getMoreSalesByResponsible(req: Request, res: Response): Promise<void> {
  try {
    // Validate period parameter using Zod schema
    const validationResult = DashboardQueryParamsSchema.safeParse(req.query);
    
    if (!validationResult.success) {
      handleValidationError(validationResult, res, req);
      return;
    }

    const { period } = validationResult.data;
    const dateFilter = createClosingDateFilter(period);

    // Execute aggregation query to join users and business tables
    // Filter by CLOSED_WON stage, period, and aggregate sales values
    // Order results by sale value in ascending order
    const { data: businessData, error } = await supabaseAdmin
      .from('business')
      .select(`
        value,
        responsible_id,
        closing_date,
        users!inner(id, name)
      `)
      .eq('stage', BusinessStages.CLOSED_WON)
      .not('responsible_id', 'is', null)
      .not('closing_date', 'is', null)
      .gte('closing_date', dateFilter.gte)
      .lte('closing_date', dateFilter.lte);

    if (error) {
      handleDatabaseError('SELECT', 'business with users', error, res, req);
      return;
    }

    // Process the data to aggregate sales values by responsible user
    const userSalesMap = new Map<string, { id: string; name: string; totalValue: number }>();

    if (businessData && businessData.length > 0) {
      businessData.forEach((business: any) => {
        const userId = business.responsible_id;
        const userName = business.users?.name;
        
        if (userId && userName) {
          if (!userSalesMap.has(userId)) {
            userSalesMap.set(userId, {
              id: userId,
              name: userName,
              totalValue: 0
            });
          }

          const currentUser = userSalesMap.get(userId)!;
          currentUser.totalValue += business.value || 0;
        }
      });
    }

    // Convert to array and sort by sale value in ascending order
    const sortedResults = Array.from(userSalesMap.values())
      .filter(user => user.totalValue > 0) // Only include users with sales
      .sort((a, b) => a.totalValue - b.totalValue)
      .map(user => ({
        responsibleId: user.id,
        responsibleName: user.name,
        saleValue: user.totalValue
      }));

    // Return formatted response
    res.status(200).json(sortedResults);

  } catch (error) {
    handleInternalError('fetching more sales by responsible', error, res, req);
  }
}

/**
 * Get sales funnel distribution by stage
 * GET /api/dashboard/sales-funnel?period=THIS_MONTH|THIS_YEAR|LAST_QUARTER
 */
export async function getSalesFunnel(req: Request, res: Response): Promise<void> {
  try {
    // Validate period parameter using Zod schema
    const validationResult = DashboardQueryParamsSchema.safeParse(req.query);
    
    if (!validationResult.success) {
      handleValidationError(validationResult, res, req);
      return;
    }

    const { period } = validationResult.data;
    const dateFilter = createClosingDateFilter(period);

    // Execute database query to count business records by stage
    // Filter out CLOSED_LOST stage records and filter by period
    const { data: businessData, error } = await supabaseAdmin
      .from('business')
      .select('stage, closing_date')
      .neq('stage', BusinessStages.CLOSED_LOST)
      .not('closing_date', 'is', null)
      .gte('closing_date', dateFilter.gte)
      .lte('closing_date', dateFilter.lte);

    if (error) {
      handleDatabaseError('SELECT', 'business', error, res, req);
      return;
    }

    // Process the data to aggregate counts by stage
    const stageCounts: Record<string, number> = {};

    if (businessData && businessData.length > 0) {
      businessData.forEach((business) => {
        const stage = business.stage;
        if (stage) {
          stageCounts[stage] = (stageCounts[stage] || 0) + 1;
        }
      });
    }

    // Return formatted response (only stages with counts > 0 are included)
    res.status(200).json(stageCounts);

  } catch (error) {
    handleInternalError('fetching sales funnel', error, res, req);
  }
}

/**
 * Get total revenue from all closed-won business deals
 * GET /api/dashboard/total-revenue?period=THIS_MONTH|THIS_YEAR|LAST_QUARTER
 */
export async function getTotalRevenue(req: Request, res: Response): Promise<void> {
  try {
    // Validate period parameter using Zod schema
    const validationResult = DashboardQueryParamsSchema.safeParse(req.query);
    
    if (!validationResult.success) {
      handleValidationError(validationResult, res, req);
      return;
    }

    const { period } = validationResult.data;
    const dateFilter = createClosingDateFilter(period);

    // Execute database query to sum business values where stage = CLOSED_WON and within period
    const { data: businessData, error } = await supabaseAdmin
      .from('business')
      .select('value, closing_date')
      .eq('stage', BusinessStages.CLOSED_WON)
      .not('closing_date', 'is', null)
      .gte('closing_date', dateFilter.gte)
      .lte('closing_date', dateFilter.lte);

    if (error) {
      handleDatabaseError('SELECT', 'business', error, res, req);
      return;
    }

    // Calculate total revenue, handling empty results by returning zero
    let total = 0;
    if (businessData && businessData.length > 0) {
      total = businessData.reduce((sum, business) => {
        return sum + (business.value || 0);
      }, 0);
    }

    // Return formatted response
    const response: TotalRevenueResponseType = { total };
    res.status(200).json(response);

  } catch (error) {
    handleInternalError('fetching total revenue', error, res, req);
  }
}

/**
 * Get total count of active accounts
 * GET /api/dashboard/active-accounts
 */
export async function getActiveAccounts(req: Request, res: Response): Promise<void> {
  try {
    // Execute database query to count accounts where status = ACTIVE
    const { data: accountData, error } = await supabaseAdmin
      .from('account')
      .select('id')
      .eq('status', AccountStatuses.ACTIVE);

    if (error) {
      handleDatabaseError('SELECT', 'account', error, res, req);
      return;
    }

    // Calculate total count, handling empty results by returning zero
    const total = accountData ? accountData.length : 0;

    // Return formatted response
    const response: ActiveAccountsResponseType = { total };
    res.status(200).json(response);

  } catch (error) {
    handleInternalError('fetching active accounts', error, res, req);
  }
}