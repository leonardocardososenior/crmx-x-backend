import { z } from '../utils/zodExtensions';
import { BusinessProposalStatuses, isValidBusinessProposalStatus } from '../types';

// Business Proposal Status validation schema
export const BusinessProposalStatusSchema = z.string().refine(isValidBusinessProposalStatus, {
  message: `Status must be one of: ${Object.values(BusinessProposalStatuses).join(', ')}`
});

// UUID validation schema
const UUIDSchema = z.string().uuid();

// Reference object schema
const ReferenceSchema = z.object({
  id: UUIDSchema
});

// Date validation schema (ISO 8601 format)
const DateSchema = z.string().datetime({ message: 'Date must be in ISO 8601 format' });

// Date validation schema for YYYY-MM-DD format
const DateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

// Positive number validation schema
const PositiveNumberSchema = z.number().positive('Value must be positive');

// Non-negative number validation schema
const NonNegativeNumberSchema = z.number().min(0, 'Value must be non-negative');

// Create BusinessProposalItem Schema - for standalone item creation
export const CreateBusinessProposalItemSchema = z.object({
  proposal: ReferenceSchema,
  item: ReferenceSchema,
  name: z.string().min(1, 'Name is required'),
  quantity: PositiveNumberSchema,
  unitPrice: PositiveNumberSchema,
  discount: NonNegativeNumberSchema.optional()
}).refine(data => {
  // Ensure discount doesn't exceed the total value (quantity * unitPrice)
  if (data.discount !== undefined) {
    const totalValue = data.quantity * data.unitPrice;
    return data.discount <= totalValue;
  }
  return true;
}, {
  message: 'Discount cannot exceed total value (quantity × unitPrice)',
  path: ['discount']
});

// Update BusinessProposalItem Schema - for updating individual items
export const UpdateBusinessProposalItemSchema = z.object({
  proposal: ReferenceSchema.optional(),
  item: ReferenceSchema.optional(),
  name: z.string().min(1, 'Name cannot be empty').optional(),
  quantity: PositiveNumberSchema.optional(),
  unitPrice: PositiveNumberSchema.optional(),
  discount: NonNegativeNumberSchema.optional().or(z.null())
}).refine(data => {
  // Ensure discount doesn't exceed the total value when both quantity and unitPrice are provided
  if (data.discount !== undefined && data.discount !== null && data.quantity !== undefined && data.unitPrice !== undefined) {
    const totalValue = data.quantity * data.unitPrice;
    return data.discount <= totalValue;
  }
  return true;
}, {
  message: 'Discount cannot exceed total value (quantity × unitPrice)',
  path: ['discount']
});

// Create BusinessProposal Schema - for POST /api/business-proposals (camelCase)
export const CreateBusinessProposalSchema = z.object({
  business: ReferenceSchema,
  responsible: ReferenceSchema,
  title: z.string().min(1, 'Title is required'),
  status: BusinessProposalStatusSchema.optional(),
  date: DateOnlySchema,
  value: PositiveNumberSchema,
  content: z.string().optional(),
  themeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Theme color must be a valid hex color').optional(),
  termsAndConditions: z.string().optional(),
  showUnitPrices: z.boolean().optional()
});

// Update BusinessProposal Schema - for PUT /api/business-proposals/:id (all fields optional, camelCase)
export const UpdateBusinessProposalSchema = z.object({
  business: ReferenceSchema.optional(),
  responsible: ReferenceSchema.optional(),
  title: z.string().min(1, 'Title cannot be empty').optional(),
  status: BusinessProposalStatusSchema.optional(),
  date: DateOnlySchema.optional(),
  value: PositiveNumberSchema.optional(),
  content: z.string().optional().or(z.null()),
  themeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Theme color must be a valid hex color').optional().or(z.null()),
  termsAndConditions: z.string().optional().or(z.null()),
  showUnitPrices: z.boolean().optional().or(z.null())
});

// BusinessProposal Query Parameters Schema - for GET /api/business-proposals filtering and pagination (camelCase)
export const BusinessProposalQueryParamsSchema = z.object({
  // Search parameter for title or content
  search: z.string().optional(),
  
  // Status filter parameter
  status: BusinessProposalStatusSchema.optional(),
  
  // Business filter parameter
  businessId: UUIDSchema.optional(),
  
  // Responsible filter parameter
  responsibleId: UUIDSchema.optional(),
  
  // Date range filters
  dateFrom: DateOnlySchema.optional(),
  dateTo: DateOnlySchema.optional(),
  
  // Value range filters
  minValue: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).refine(val => val >= 0, {
    message: 'Minimum value must be a non-negative number'
  }).optional(),
  maxValue: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).refine(val => val >= 0, {
    message: 'Maximum value must be a non-negative number'
  }).optional(),
  
  // Dynamic filter parameter (SQL-like syntax)
  filter: z.string().optional(),
  
  // Pagination parameters
  page: z.string().regex(/^\d+$/).transform(Number).refine(val => val > 0, {
    message: 'Page must be a positive integer'
  }).optional(),
  size: z.string().regex(/^\d+$/).transform(Number).refine(val => val > 0 && val <= 100, {
    message: 'Size must be a positive integer between 1 and 100'
  }).optional()
}).refine(data => {
  // Ensure dateFrom is not greater than dateTo when both are provided
  if (data.dateFrom && data.dateTo) {
    return new Date(data.dateFrom) <= new Date(data.dateTo);
  }
  return true;
}, {
  message: 'Date from cannot be greater than date to',
  path: ['dateFrom']
}).refine(data => {
  // Ensure minValue is not greater than maxValue when both are provided
  if (data.minValue !== undefined && data.maxValue !== undefined) {
    return data.minValue <= data.maxValue;
  }
  return true;
}, {
  message: 'Minimum value cannot be greater than maximum value',
  path: ['minValue']
});

// BusinessProposalItem Query Parameters Schema - for GET /api/business-proposal-items filtering and pagination (camelCase)
export const BusinessProposalItemQueryParamsSchema = z.object({
  // Proposal filter parameter
  proposalId: UUIDSchema.optional(),
  
  // Item filter parameter
  itemId: UUIDSchema.optional(),
  
  // Search parameter for name
  search: z.string().optional(),
  
  // Quantity range filters
  minQuantity: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).refine(val => val >= 0, {
    message: 'Minimum quantity must be a non-negative number'
  }).optional(),
  maxQuantity: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).refine(val => val >= 0, {
    message: 'Maximum quantity must be a non-negative number'
  }).optional(),
  
  // Unit price range filters
  minUnitPrice: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).refine(val => val >= 0, {
    message: 'Minimum unit price must be a non-negative number'
  }).optional(),
  maxUnitPrice: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).refine(val => val >= 0, {
    message: 'Maximum unit price must be a non-negative number'
  }).optional(),
  
  // Dynamic filter parameter (SQL-like syntax)
  filter: z.string().optional(),
  
  // Pagination parameters
  page: z.string().regex(/^\d+$/).transform(Number).refine(val => val > 0, {
    message: 'Page must be a positive integer'
  }).optional(),
  size: z.string().regex(/^\d+$/).transform(Number).refine(val => val > 0 && val <= 100, {
    message: 'Size must be a positive integer between 1 and 100'
  }).optional()
}).refine(data => {
  // Ensure minQuantity is not greater than maxQuantity when both are provided
  if (data.minQuantity !== undefined && data.maxQuantity !== undefined) {
    return data.minQuantity <= data.maxQuantity;
  }
  return true;
}, {
  message: 'Minimum quantity cannot be greater than maximum quantity',
  path: ['minQuantity']
}).refine(data => {
  // Ensure minUnitPrice is not greater than maxUnitPrice when both are provided
  if (data.minUnitPrice !== undefined && data.maxUnitPrice !== undefined) {
    return data.minUnitPrice <= data.maxUnitPrice;
  }
  return true;
}, {
  message: 'Minimum unit price cannot be greater than maximum unit price',
  path: ['minUnitPrice']
});

// BusinessProposal ID parameter schema for route parameters
export const BusinessProposalIdParamSchema = z.object({
  id: UUIDSchema
});

// BusinessProposalItem ID parameter schema for route parameters
export const BusinessProposalItemIdParamSchema = z.object({
  id: UUIDSchema
});

// Proposal ID parameter schema for nested routes (e.g., /api/business-proposals/:proposalId/items)
export const ProposalIdParamSchema = z.object({
  proposalId: UUIDSchema
});

// Type exports for TypeScript usage
export type CreateBusinessProposalInput = z.infer<typeof CreateBusinessProposalSchema>;
export type UpdateBusinessProposalInput = z.infer<typeof UpdateBusinessProposalSchema>;
export type CreateBusinessProposalItemInput = z.infer<typeof CreateBusinessProposalItemSchema>;
export type UpdateBusinessProposalItemInput = z.infer<typeof UpdateBusinessProposalItemSchema>;
export type BusinessProposalQueryParamsInput = z.infer<typeof BusinessProposalQueryParamsSchema>;
export type BusinessProposalItemQueryParamsInput = z.infer<typeof BusinessProposalItemQueryParamsSchema>;
export type BusinessProposalIdParam = z.infer<typeof BusinessProposalIdParamSchema>;
export type BusinessProposalItemIdParam = z.infer<typeof BusinessProposalItemIdParamSchema>;
export type ProposalIdParam = z.infer<typeof ProposalIdParamSchema>;
export type BusinessProposalStatus = z.infer<typeof BusinessProposalStatusSchema>;