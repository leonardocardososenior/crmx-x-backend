import { Request, Response } from 'express';
import { supabaseAdmin } from '../supabaseClient';
import { TenantRequest } from '../types/tenant';
import { getTenantAdminClient } from '../utils/tenantClientHelper';
import { DashboardQueryParamsSchema, RevenuePerPeriodQueryParamsSchema, MonthlyRevenueResponseType, MoreSalesByResponsibleResponseType, SalesFunnelResponseType, TotalRevenueResponseType, ActiveAccountsResponseType, NewBusinessResponseType } from '../schemas/dashboardSchemas';
import { BusinessStages, AccountStatuses } from '../types';
import { 
  handleValidationError, 
  handleDatabaseError, 
  handleInternalError
} from '../utils/controllerHelpers';
import { getLanguageFromRequest, createLocalizedMonthlyResponse } from '../utils/translations';
import { createClosingDateFilter, calculatePeriodRange, getDateRangeForPeriod } from '../utils/dateFilters';

/**
 * Get revenue per period aggregated by month
 * GET /api/dashboard/revenue-per-period?period=THIS_MONTH|THIS_YEAR|LAST_QUARTER
 */
export async function getRevenuePerPeriod(req: TenantRequest, res: Response): Promise<void> {
  try {
    // Validate period parameter using Zod schema
    const validationResult = RevenuePerPeriodQueryParamsSchema.safeParse(req.query);
    
    if (!validationResult.success) {
      handleValidationError(validationResult, res, req);
      return;
    }

    const { period } = validationResult.data;
    const dateFilter = getDateRangeForPeriod(period);

    // Get tenant-aware admin client
    const tenantClient = getTenantAdminClient(req);

    // Execute revenue aggregation query
    // Filter by stage = 'Closed Won' and period from closing_date
    // Group by month and calculate sum of values
    const { data: monthlyRevenue, error } = await tenantClient
      .getClient()
      .from('business')
      .select('value, closing_date')
      .eq('stage', BusinessStages.CLOSED_WON)
      .not('closing_date', 'is', null)
      .gte('closing_date', dateFilter.startDate)
      .lte('closing_date', dateFilter.endDate);

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
        if (business.closing_date) {
          const closingDate = new Date(business.closing_date);
          const month = closingDate.getUTCMonth() + 1; // getUTCMonth() returns 0-11, we need 1-12
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
export async function getMoreSalesByResponsible(req: TenantRequest, res: Response): Promise<void> {
  try {
    // Validate period parameter using Zod schema
    const validationResult = DashboardQueryParamsSchema.safeParse(req.query);
    
    if (!validationResult.success) {
      handleValidationError(validationResult, res, req);
      return;
    }

    const { period } = validationResult.data;
    const dateFilter = createClosingDateFilter(period);

    // Get tenant-aware admin client
    const tenantClient = getTenantAdminClient(req);

    // Execute aggregation query to join users and business tables
    // Filter by CLOSED_WON stage, period, and aggregate sales values
    // Order results by sale value in ascending order
    const { data: businessData, error } = await tenantClient
      .getClient()
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

    // Process the data to aggregate sales values and count deals by responsible user
    const userSalesMap = new Map<string, { id: string; name: string; totalValue: number; dealsCount: number }>();

    if (businessData && businessData.length > 0) {
      businessData.forEach((business: any) => {
        const userId = business.responsible_id;
        const userName = business.users?.name;
        
        if (userId && userName) {
          if (!userSalesMap.has(userId)) {
            userSalesMap.set(userId, {
              id: userId,
              name: userName,
              totalValue: 0,
              dealsCount: 0
            });
          }

          const currentUser = userSalesMap.get(userId)!;
          currentUser.totalValue += business.value || 0;
          currentUser.dealsCount += 1; // Count each closed deal
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
        saleValue: user.totalValue,
        closedDealsCount: user.dealsCount
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
export async function getSalesFunnel(req: TenantRequest, res: Response): Promise<void> {
  try {
    // Validate period parameter using Zod schema
    const validationResult = DashboardQueryParamsSchema.safeParse(req.query);
    
    if (!validationResult.success) {
      handleValidationError(validationResult, res, req);
      return;
    }

    const { period } = validationResult.data;
    const dateFilter = createClosingDateFilter(period);

    // Get tenant-aware admin client
    const tenantClient = getTenantAdminClient(req);

    // Execute database query to count business records by stage
    // Filter out CLOSED_LOST stage records and filter by period
    const { data: businessData, error } = await tenantClient
      .getClient()
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
export async function getTotalRevenue(req: TenantRequest, res: Response): Promise<void> {
  try {
    // Validate period parameter using Zod schema
    const validationResult = DashboardQueryParamsSchema.safeParse(req.query);
    
    if (!validationResult.success) {
      handleValidationError(validationResult, res, req);
      return;
    }

    const { period } = validationResult.data;
    const dateFilter = createClosingDateFilter(period);

    // Get tenant-aware admin client
    const tenantClient = getTenantAdminClient(req);

    // Execute database query to sum business values where stage = CLOSED_WON and within period
    const { data: businessData, error } = await tenantClient
      .getClient()
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
export async function getActiveAccounts(req: TenantRequest, res: Response): Promise<void> {
  try {
    // Get tenant-aware admin client
    const tenantClient = getTenantAdminClient(req);

    // Execute database query to count accounts where status = ACTIVE
    const { data: accountData, error } = await tenantClient
      .getClient()
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

/**
 * Get count of new businesses created in a specific period
 * GET /api/dashboard/new-business?period=THIS_MONTH|THIS_YEAR|LAST_QUARTER
 */
export async function getNewBusiness(req: TenantRequest, res: Response): Promise<void> {
  try {
    // Validate period parameter using DashboardPeriod enum
    const validationResult = DashboardQueryParamsSchema.safeParse(req.query);
    
    if (!validationResult.success) {
      handleValidationError(validationResult, res, req);
      return;
    }

    const { period } = validationResult.data;

    // Calculate date range using period calculation utilities
    const { start, end } = calculatePeriodRange(period);

    // Get tenant-aware admin client
    const tenantClient = getTenantAdminClient(req);

    // Implement database query to count businesses where created_at is within period
    const { data: businessData, error } = await tenantClient
      .getClient()
      .from('business')
      .select('id, created_at')
      .not('created_at', 'is', null)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (error) {
      handleDatabaseError('SELECT', 'business', error, res, req);
      return;
    }

    // Handle empty results by returning zero count
    const count = businessData ? businessData.length : 0;

    // Return formatted response
    const response: NewBusinessResponseType = { count };
    res.status(200).json(response);

  } catch (error) {
    handleInternalError('fetching new business count', error, res, req);
  }
}