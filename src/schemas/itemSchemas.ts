import { z } from '../utils/zodExtensions';
import { ItemTypes, isValidItemType } from '../types';

// Item Type validation schema
export const ItemTypeSchema = z.string().refine(isValidItemType, {
  message: `Type must be one of: ${Object.values(ItemTypes).join(', ')}`
});

// UUID validation schema
const UUIDSchema = z.string().uuid();

// Create Item Schema - for POST /api/items (camelCase)
export const CreateItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: ItemTypeSchema,
  price: z.number().positive('Price must be positive'),
  skuCode: z.string().min(1).optional(),
  description: z.string().min(1).optional()
});

// Update Item Schema - for PUT /api/items/:id (all fields optional, camelCase)
export const UpdateItemSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  type: ItemTypeSchema.optional(),
  price: z.number().positive('Price must be positive').optional(),
  skuCode: z.string().min(1).optional().or(z.null()),
  description: z.string().min(1).optional().or(z.null())
});

// Item Query Parameters Schema - for GET /api/items filtering and pagination (camelCase)
export const ItemQueryParamsSchema = z.object({
  // Search parameter for name or description
  search: z.string().optional(),
  
  // Type filter parameter
  type: ItemTypeSchema.optional(),
  
  // Price range filters
  minPrice: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).refine(val => val >= 0, {
    message: 'Minimum price must be a non-negative number'
  }).optional(),
  maxPrice: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).refine(val => val >= 0, {
    message: 'Maximum price must be a non-negative number'
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
  // Ensure minPrice is not greater than maxPrice when both are provided
  if (data.minPrice !== undefined && data.maxPrice !== undefined) {
    return data.minPrice <= data.maxPrice;
  }
  return true;
}, {
  message: 'Minimum price cannot be greater than maximum price',
  path: ['minPrice']
});

// Item ID parameter schema for route parameters
export const ItemIdParamSchema = z.object({
  id: UUIDSchema
});

// Type exports for TypeScript usage
export type CreateItemInput = z.infer<typeof CreateItemSchema>;
export type UpdateItemInput = z.infer<typeof UpdateItemSchema>;
export type ItemQueryParamsInput = z.infer<typeof ItemQueryParamsSchema>;
export type ItemIdParam = z.infer<typeof ItemIdParamSchema>;
export type ItemType = z.infer<typeof ItemTypeSchema>;