import { z } from 'zod';
import { SupportedLocales, isValidSupportedLocale } from '../types';

// Supported locale validation schema
export const SupportedLocaleSchema = z.string().refine(isValidSupportedLocale, {
  message: `Locale must be one of: ${Object.values(SupportedLocales).join(', ')}`
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

// Type exports for TypeScript usage
export type RevenuePerYearParamsInput = z.infer<typeof RevenuePerYearParamsSchema>;
export type MonthlyRevenueResponseType = z.infer<typeof MonthlyRevenueResponseSchema>;
export type MoreSalesByResponsibleResponseType = z.infer<typeof MoreSalesByResponsibleResponseSchema>;
export type SupportedLocaleType = z.infer<typeof SupportedLocaleSchema>;