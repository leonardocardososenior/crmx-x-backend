import { z } from 'zod';
import { SupportedLocales, isValidSupportedLocale, DashboardPeriods, isValidDashboardPeriod } from '../types';

// Supported locale validation schema
export const SupportedLocaleSchema = z.string().refine(isValidSupportedLocale, {
  message: `Locale must be one of: ${Object.values(SupportedLocales).join(', ')}`
});

// Dashboard period validation schema
export const DashboardPeriodSchema = z.string().refine(isValidDashboardPeriod, {
  message: `Period must be one of: ${Object.values(DashboardPeriods).join(', ')}`
});

// Year validation schema - reasonable range for business data
const currentYear = new Date().getFullYear();
const YearSchema = z.number()
  .int('Year must be an integer')
  .min(2000, 'Year must be 2000 or later')
  .max(currentYear + 10, `Year must be ${currentYear + 10} or earlier`);

// Revenue per year route parameters schema
export const RevenuePerYearParamsSchema = z.object({
  year: z.string()
    .regex(/^\d{4}$/, 'Year must be a 4-digit number')
    .transform(Number)
    .pipe(YearSchema)
});

// Dashboard query parameters schema (for period-based queries)
export const DashboardQueryParamsSchema = z.object({
  period: DashboardPeriodSchema
});

// Monthly revenue response schema for validation
export const MonthlyRevenueResponseSchema = z.record(
  z.string().min(1, 'Month name cannot be empty'),
  z.number().min(0, 'Revenue cannot be negative')
);

// More sales by responsible response schema
export const MoreSalesByResponsibleResponseSchema = z.array(
  z.object({
    responsibleId: z.string().min(1, 'Responsible ID cannot be empty'),
    responsibleName: z.string().min(1, 'Responsible name cannot be empty'),
    saleValue: z.number().min(0, 'Sale value cannot be negative')
  })
);

// Sales funnel response schema
export const SalesFunnelResponseSchema = z.record(
  z.string().min(1, 'Stage name cannot be empty'),
  z.number().int().min(0, 'Count cannot be negative')
);

// Total revenue response schema
export const TotalRevenueResponseSchema = z.object({
  total: z.number().min(0, 'Total revenue cannot be negative')
});

// Active accounts response schema
export const ActiveAccountsResponseSchema = z.object({
  total: z.number().int().min(0, 'Total active accounts cannot be negative')
});

// Type exports for TypeScript usage
export type RevenuePerYearParamsInput = z.infer<typeof RevenuePerYearParamsSchema>;
export type DashboardQueryParamsInput = z.infer<typeof DashboardQueryParamsSchema>;
export type MonthlyRevenueResponseType = z.infer<typeof MonthlyRevenueResponseSchema>;
export type MoreSalesByResponsibleResponseType = z.infer<typeof MoreSalesByResponsibleResponseSchema>;
export type SalesFunnelResponseType = z.infer<typeof SalesFunnelResponseSchema>;
export type TotalRevenueResponseType = z.infer<typeof TotalRevenueResponseSchema>;
export type ActiveAccountsResponseType = z.infer<typeof ActiveAccountsResponseSchema>;
export type SupportedLocaleType = z.infer<typeof SupportedLocaleSchema>;