import { z } from 'zod';
import { AccountStatuses, AccountTypes, UserRoles, DealStages, Currencies, isValidAccountStatus, isValidAccountType, isValidUserRole, isValidDealStage, isValidCurrency } from '../types';

// User Role validation schema
export const UserRoleSchema = z.string().refine(isValidUserRole, {
  message: `Role must be one of: ${Object.values(UserRoles).join(', ')}`
});

// Deal Stage validation schema
export const DealStageSchema = z.string().refine(isValidDealStage, {
  message: `Stage must be one of: ${Object.values(DealStages).join(', ')}`
});

// Currency validation schema
export const CurrencySchema = z.string().refine(isValidCurrency, {
  message: `Currency must be one of: ${Object.values(Currencies).join(', ')}`
});

// String schemas with validation using centralized enums
export const AccountStatusSchema = z.string().refine(isValidAccountStatus, {
  message: `Status must be one of: ${Object.values(AccountStatuses).join(', ')}`
});

export const AccountTypeSchema = z.string().refine(isValidAccountType, {
  message: `Type must be one of: ${Object.values(AccountTypes).join(', ')}`
});

// UUID validation schema
const UUIDSchema = z.string().uuid();

// Email validation schema
const EmailSchema = z.string().email().optional().or(z.null());

// Phone validation schema (optional, basic format)
const PhoneSchema = z.string().min(1).optional().or(z.null());

// CNPJ validation schema (optional, basic format)
const CNPJSchema = z.string().min(1).optional().or(z.null());

// Social media URL validation schemas (optional)
const SocialMediaSchema = z.string().url().optional().or(z.literal('')).or(z.null());

// Create Account Schema - for POST /api/accounts (camelCase)
export const CreateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  segment: z.string().min(1, 'Segment is required'),
  ownerId: UUIDSchema,
  status: AccountStatusSchema.optional(),
  type: AccountTypeSchema.optional(),
  pipeline: z.string().optional(),
  email: EmailSchema,
  phone: PhoneSchema,
  cnpj: CNPJSchema,
  instagram: SocialMediaSchema,
  linkedin: SocialMediaSchema,
  whatsapp: PhoneSchema
});

// Update Account Schema - for PATCH /api/accounts/:id (all fields optional, camelCase)
export const UpdateAccountSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  segment: z.string().min(1, 'Segment cannot be empty').optional(),
  ownerId: UUIDSchema.optional(),
  status: AccountStatusSchema.optional(),
  type: AccountTypeSchema.optional(),
  pipeline: z.string().optional(),
  email: EmailSchema,
  phone: PhoneSchema,
  cnpj: CNPJSchema,
  instagram: SocialMediaSchema,
  linkedin: SocialMediaSchema,
  whatsapp: PhoneSchema
});

// Query Parameters Schema - for GET /api/accounts filtering and pagination (camelCase)
export const QueryParamsSchema = z.object({
  // Search parameters
  search: z.string().optional(),
  
  // Filter parameters
  status: AccountStatusSchema.optional(),
  type: AccountTypeSchema.optional(),
  ownerId: UUIDSchema.optional(),
  
  // Pagination parameters
  page: z.string().regex(/^\d+$/).transform(Number).refine(val => val > 0, {
    message: 'Page must be a positive integer'
  }).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).refine(val => val > 0 && val <= 100, {
    message: 'Limit must be a positive integer between 1 and 100'
  }).optional()
});

// Account ID parameter schema for route parameters
export const AccountIdParamSchema = z.object({
  id: UUIDSchema
});

// Create Profile Schema - for profile creation (camelCase)
export const CreateProfileSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1, 'Name is required'),
  role: UserRoleSchema.optional(),
  managerId: UUIDSchema.optional(),
  email: z.string().email('Valid email is required')
});

// Create Deal Schema - for POST /api/deals (camelCase)
export const CreateDealSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  accountId: UUIDSchema,
  value: z.number().positive('Value must be positive'),
  currency: CurrencySchema.optional(),
  stage: DealStageSchema,
  probability: z.number().min(0).max(100, 'Probability must be between 0 and 100').optional(),
  ownerId: UUIDSchema.optional(),
  closingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Closing date must be in YYYY-MM-DD format').optional()
});

// Update Deal Schema - for PATCH /api/deals/:id (all fields optional, camelCase)
export const UpdateDealSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').optional(),
  accountId: UUIDSchema.optional(),
  value: z.number().positive('Value must be positive').optional(),
  currency: CurrencySchema.optional(),
  stage: DealStageSchema.optional(),
  probability: z.number().min(0).max(100, 'Probability must be between 0 and 100').optional(),
  ownerId: UUIDSchema.optional(),
  closingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Closing date must be in YYYY-MM-DD format').optional().or(z.null())
});

// Deal ID parameter schema for route parameters
export const DealIdParamSchema = z.object({
  id: UUIDSchema
});

// Type exports for TypeScript usage
export type CreateAccountInput = z.infer<typeof CreateAccountSchema>;
export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>;
export type QueryParamsInput = z.infer<typeof QueryParamsSchema>;
export type AccountIdParam = z.infer<typeof AccountIdParamSchema>;
export type CreateProfileInput = z.infer<typeof CreateProfileSchema>;
export type CreateDealInput = z.infer<typeof CreateDealSchema>;
export type UpdateDealInput = z.infer<typeof UpdateDealSchema>;
export type DealIdParam = z.infer<typeof DealIdParamSchema>;
export type AccountStatus = z.infer<typeof AccountStatusSchema>;
export type AccountType = z.infer<typeof AccountTypeSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type DealStage = z.infer<typeof DealStageSchema>;
export type Currency = z.infer<typeof CurrencySchema>;