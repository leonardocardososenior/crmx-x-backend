import { z } from 'zod';
import { AccountStatuses, AccountTypes, UserRoles, BusinessStages, Currencies, isValidAccountStatus, isValidAccountType, isValidUserRole, isValidBusinessStage, isValidCurrency } from '../types';

// User Role validation schema
export const UserRoleSchema = z.string().refine(isValidUserRole, {
  message: `Role must be one of: ${Object.values(UserRoles).join(', ')}`
});

// Business Stage validation schema
export const BusinessStageSchema = z.string().refine(isValidBusinessStage, {
  message: `Stage must be one of: ${Object.values(BusinessStages).join(', ')}`
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

// Reference object schema
const ReferenceSchema = z.object({
  id: UUIDSchema
});

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
  responsible: ReferenceSchema,
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

// Update Account Schema - for PUT /api/accounts/:id (all fields optional, camelCase)
export const UpdateAccountSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  segment: z.string().min(1, 'Segment cannot be empty').optional(),
  responsible: ReferenceSchema.optional(),
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
  // Dynamic filter parameter (SQL-like syntax)
  filter: z.string().optional(),
  
  // Pagination parameters
  page: z.string().regex(/^\d+$/).transform(Number).refine(val => val > 0, {
    message: 'Page must be a positive integer'
  }).optional(),
  size: z.string().regex(/^\d+$/).transform(Number).refine(val => val > 0 && val <= 100, {
    message: 'Size must be a positive integer between 1 and 100'
  }).optional()
});

// Account ID parameter schema for route parameters
export const AccountIdParamSchema = z.object({
  id: UUIDSchema
});

// Create User Schema - for POST /api/users (camelCase)
export const CreateUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  role: UserRoleSchema.optional(),
  manager: ReferenceSchema.optional()
});

// Update User Schema - for PUT /api/users/:id (all fields optional, camelCase)
export const UpdateUserSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  email: z.string().email('Valid email is required').optional(),
  role: UserRoleSchema.optional(),
  manager: ReferenceSchema.optional()
});

// User ID parameter schema for route parameters
export const UserIdParamSchema = z.object({
  id: UUIDSchema
});

// User Query Parameters Schema - for GET /api/users filtering and pagination (camelCase)
export const UserQueryParamsSchema = z.object({
  // Dynamic filter parameter (SQL-like syntax)
  filter: z.string().optional(),
  
  // Pagination parameters
  page: z.string().regex(/^\d+$/).transform(Number).refine(val => val > 0, {
    message: 'Page must be a positive integer'
  }).optional(),
  size: z.string().regex(/^\d+$/).transform(Number).refine(val => val > 0 && val <= 100, {
    message: 'Size must be a positive integer between 1 and 100'
  }).optional()
});

// Create Business Schema - for POST /api/business (camelCase)
export const CreateBusinessSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  account: ReferenceSchema,
  value: z.number().positive('Value must be positive'),
  currency: CurrencySchema.optional(),
  stage: BusinessStageSchema,
  probability: z.number().min(0).max(100, 'Probability must be between 0 and 100').optional(),
  responsible: ReferenceSchema.optional(),
  closingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Closing date must be in YYYY-MM-DD format').optional()
});

// Update Business Schema - for PUT /api/business/:id (all fields optional, camelCase)
export const UpdateBusinessSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').optional(),
  account: ReferenceSchema.optional(),
  value: z.number().positive('Value must be positive').optional(),
  currency: CurrencySchema.optional(),
  stage: BusinessStageSchema.optional(),
  probability: z.number().min(0).max(100, 'Probability must be between 0 and 100').optional(),
  responsible: ReferenceSchema.optional(),
  closingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Closing date must be in YYYY-MM-DD format').optional().or(z.null())
});

// Business ID parameter schema for route parameters
export const BusinessIdParamSchema = z.object({
  id: UUIDSchema
});

// Business Query Parameters Schema - for GET /api/business filtering and pagination (camelCase)
export const BusinessQueryParamsSchema = z.object({
  // Dynamic filter parameter (SQL-like syntax)
  filter: z.string().optional(),
  
  // Pagination parameters
  page: z.string().regex(/^\d+$/).transform(Number).refine(val => val > 0, {
    message: 'Page must be a positive integer'
  }).optional(),
  size: z.string().regex(/^\d+$/).transform(Number).refine(val => val > 0 && val <= 100, {
    message: 'Size must be a positive integer between 1 and 100'
  }).optional()
});

// Type exports for TypeScript usage
export type CreateAccountInput = z.infer<typeof CreateAccountSchema>;
export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>;
export type QueryParamsInput = z.infer<typeof QueryParamsSchema>;
export type AccountIdParam = z.infer<typeof AccountIdParamSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UserIdParam = z.infer<typeof UserIdParamSchema>;
export type UserQueryParamsInput = z.infer<typeof UserQueryParamsSchema>;
export type CreateBusinessInput = z.infer<typeof CreateBusinessSchema>;
export type UpdateBusinessInput = z.infer<typeof UpdateBusinessSchema>;
export type BusinessIdParam = z.infer<typeof BusinessIdParamSchema>;
export type BusinessQueryParamsInput = z.infer<typeof BusinessQueryParamsSchema>;
export type AccountStatus = z.infer<typeof AccountStatusSchema>;
export type AccountType = z.infer<typeof AccountTypeSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type BusinessStage = z.infer<typeof BusinessStageSchema>;
export type Currency = z.infer<typeof CurrencySchema>;