import { Request, Response } from 'express';
import { supabaseAdmin } from '../supabaseClient';
import { RevenuePerYearParamsSchema, MonthlyRevenueResponseType, MoreSalesByResponsibleResponseType } from '../schemas/dashboardSchemas';
import { BusinessStages } from '../types';
import { 
  handleValidationError, 
  handleDatabaseError, 
  handleInternalError
} from '../utils/controllerHelpers';
import { getLanguageFromRequest, createLocalizedMonthlyResponse } from '../utils/translations';

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
    // Filter by stage = 'Closed Won' and year from closing_date
    // Group by month and calculate sum of values
    const { data: monthlyRevenue, error } = await supabaseAdmin
      .from('business')
      .select('value, closing_date')
      .eq('stage', BusinessStages.CLOSED_WON)
      .gte('closing_date', `${year}-01-01`)
      .lt('closing_date', `${year + 1}-01-01`);

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
 * GET /api/dashboard/more-sales-by-responsible
 */
export async function getMoreSalesByResponsible(req: Request, res: Response): Promise<void> {
  try {
    // Execute aggregation query to join users and business tables
    // Filter by CLOSED_WON stage and aggregate sales values
    // Order results by sale value in ascending order
    const { data: businessData, error } = await supabaseAdmin
      .from('business')
      .select(`
        value,
        responsible_id,
        users!inner(id, name)
      `)
      .eq('stage', BusinessStages.CLOSED_WON)
      .not('responsible_id', 'is', null);

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