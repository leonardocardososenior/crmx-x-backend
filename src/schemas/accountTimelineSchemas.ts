import { z } from 'zod';
import { TimelineTypes, isValidTimelineType } from '../types';

// Timeline Type validation schema
export const TimelineTypeSchema = z.string().refine(isValidTimelineType, {
  message: `Type must be one of: ${Object.values(TimelineTypes).join(', ')}`
});

// UUID validation schema
const UUIDSchema = z.string().uuid();

// Reference object schema
const ReferenceSchema = z.object({
  id: UUIDSchema
});

// Date validation schema (ISO 8601 format)
const DateSchema = z.string().datetime({ message: 'Date must be in ISO 8601 format' });

// Create AccountTimeline Schema - for POST /api/account-timeline (camelCase)
export const CreateAccountTimelineSchema = z.object({
  account: ReferenceSchema,
  type: TimelineTypeSchema,
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  date: DateSchema,
  responsible: ReferenceSchema
});

// Update AccountTimeline Schema - for PUT /api/account-timeline/:id (all fields optional, camelCase)
export const UpdateAccountTimelineSchema = z.object({
  account: ReferenceSchema.optional(),
  type: TimelineTypeSchema.optional(),
  title: z.string().min(1, 'Title cannot be empty').optional(),
  description: z.string().optional().or(z.null()),
  date: DateSchema.optional(),
  responsible: ReferenceSchema.optional()
});

// AccountTimeline Query Parameters Schema - for GET /api/account-timeline filtering and pagination (camelCase)
export const AccountTimelineQueryParamsSchema = z.object({
  // Account filter parameter
  accountId: UUIDSchema.optional(),
  
  // Type filter parameter
  type: TimelineTypeSchema.optional(),
  
  // Date range filters
  dateFrom: DateSchema.optional(),
  dateTo: DateSchema.optional(),
  
  // Responsible filter parameter
  responsibleId: UUIDSchema.optional(),
  
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
});

// AccountTimeline ID parameter schema for route parameters
export const AccountTimelineIdParamSchema = z.object({
  id: UUIDSchema
});

// Type exports for TypeScript usage
export type CreateAccountTimelineInput = z.infer<typeof CreateAccountTimelineSchema>;
export type UpdateAccountTimelineInput = z.infer<typeof UpdateAccountTimelineSchema>;
export type AccountTimelineQueryParamsInput = z.infer<typeof AccountTimelineQueryParamsSchema>;
export type AccountTimelineIdParam = z.infer<typeof AccountTimelineIdParamSchema>;
export type TimelineType = z.infer<typeof TimelineTypeSchema>;