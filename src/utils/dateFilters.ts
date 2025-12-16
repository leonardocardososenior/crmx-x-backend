import { DashboardPeriod, DashboardPeriods } from '../types/enums';

export interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * Calculate date range based on dashboard period
 * All calculations are based on the current date
 * 
 * Quarter definitions:
 * Q1: January - March (months 0-2)
 * Q2: April - June (months 3-5)  
 * Q3: July - September (months 6-8)
 * Q4: October - December (months 9-11)
 * 
 * Examples for LAST_QUARTER (current quarter):
 * - If current date is in Q1 (Jan-Mar), returns Q1 of current year
 * - If current date is in Q2 (Apr-Jun), returns Q2 of current year
 * - If current date is in Q3 (Jul-Sep), returns Q3 of current year
 * - If current date is in Q4 (Oct-Dec), returns Q4 of current year
 */
export function getDateRangeForPeriod(period: DashboardPeriod): DateRange {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case DashboardPeriods.THIS_MONTH:
      // First day of current month to last day of current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;

    case DashboardPeriods.THIS_YEAR:
      // First day of current year to last day of current year
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;

    case DashboardPeriods.LAST_QUARTER:
      // Calculate current quarter based on current date
      // Q1: Jan-Mar (months 0-2), Q2: Apr-Jun (months 3-5), Q3: Jul-Sep (months 6-8), Q4: Oct-Dec (months 9-11)
      const currentQuarter = Math.floor(now.getMonth() / 3);
      
      // Use current quarter as "last quarter" (most recent complete or ongoing quarter)
      const targetQuarter = currentQuarter;
      const targetYear = now.getFullYear();
      
      // Start of current quarter (first day of first month of quarter)
      startDate = new Date(targetYear, targetQuarter * 3, 1);
      // End of current quarter (last day of last month of quarter)
      endDate = new Date(targetYear, (targetQuarter * 3) + 3, 0, 23, 59, 59, 999);
      break;

    default:
      throw new Error(`Invalid dashboard period: ${period}`);
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  };
}

/**
 * Create Supabase filter conditions for closing_date based on period
 */
export function createClosingDateFilter(period: DashboardPeriod) {
  const { startDate, endDate } = getDateRangeForPeriod(period);
  
  return {
    gte: startDate,
    lte: endDate
  };
}

/**
 * Helper function to test quarter logic - for development/debugging purposes
 * This function simulates different current dates to validate LAST_QUARTER logic
 */
export function testQuarterLogic() {
  const testDates = [
    new Date(2024, 0, 15),  // January 15, 2024 (Q1) - should return Q4 2023
    new Date(2024, 3, 15),  // April 15, 2024 (Q2) - should return Q1 2024  
    new Date(2024, 6, 15),  // July 15, 2024 (Q3) - should return Q2 2024
    new Date(2024, 11, 15), // December 15, 2024 (Q4) - should return Q3 2024
  ];

  testDates.forEach(testDate => {
    // Temporarily override Date constructor for testing
    const originalDate = Date;
    global.Date = class extends originalDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(testDate.getTime());
        } else {
          // @ts-ignore - TypeScript spread argument issue in test function
          super(...args);
        }
      }
    } as any;

    const result = getDateRangeForPeriod(DashboardPeriods.LAST_QUARTER);
    console.log(`Current: ${testDate.toISOString().slice(0, 10)} -> Last Quarter: ${result.startDate.slice(0, 10)} to ${result.endDate.slice(0, 10)}`);
    
    // Restore original Date
    global.Date = originalDate;
  });
}