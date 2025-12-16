import { z } from './zodExtensions';
import { registry } from '../config/openapi';

/**
 * Utility functions to convert Zod schemas to OpenAPI format
 * Handles complex types: objects, arrays, enums, unions, optional fields
 * Preserves validation rules and constraints from Zod schemas
 */

export interface OpenAPISchemaOptions {
  title?: string;
  description?: string;
  example?: any;
}

/**
 * Convert a Zod schema to OpenAPI format and register it
 * @param schema - The Zod schema to convert
 * @param name - The name to register the schema under
 * @param options - Additional OpenAPI options
 * @returns The registered schema reference
 */
export function convertZodToOpenAPI<T extends z.ZodTypeAny>(
  schema: T,
  name: string,
  options: OpenAPISchemaOptions = {}
): { $ref: string } {
  // Create an OpenAPI-extended schema with metadata
  const openApiSchema = schema.openapi(name, {
    description: options.description,
    example: options.example
  });

  // Register the schema with the OpenAPI registry
  registry.register(name, openApiSchema);

  return { $ref: `#/components/schemas/${name}` };
}

/**
 * Convert a Zod schema to inline OpenAPI format (without registration)
 * Useful for request/response schemas that don't need to be reused
 * @param schema - The Zod schema to convert
 * @param options - Additional OpenAPI options
 * @returns The OpenAPI schema object
 */
export function convertZodToInlineOpenAPI<T extends z.ZodTypeAny>(
  schema: T,
  options: OpenAPISchemaOptions = {}
): any {
  // Create an OpenAPI-extended schema without ref (inline)
  const openApiSchema = schema.openapi({
    description: options.description,
    example: options.example
  });

  return (openApiSchema._def as any).openapi;
}

/**
 * Helper function to create paginated response schema
 * @param itemSchema - The schema for individual items
 * @param itemName - The name of the item type
 * @returns OpenAPI schema for paginated response
 */
export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(
  itemSchema: T,
  itemName: string
): z.ZodObject<{
  contents: z.ZodArray<T>;
  totalElements: z.ZodNumber;
  totalPages: z.ZodNumber;
}> {
  return z.object({
    contents: z.array(itemSchema).openapi({
      description: `Array of ${itemName} items`
    }),
    totalElements: z.number().int().min(0).openapi({
      description: 'Total number of elements across all pages',
      example: 150
    }),
    totalPages: z.number().int().min(0).openapi({
      description: 'Total number of pages',
      example: 8
    })
  }).openapi({
    description: `Paginated response containing ${itemName} items`
  });
}

/**
 * Helper function to create error response schema
 * @param message - Default error message
 * @param status - HTTP status code
 * @returns OpenAPI schema for error response
 */
export function createErrorResponseSchema(message: string, status: number) {
  return z.object({
    message: z.string().openapi({
      description: 'Error message',
      example: message
    }),
    status: z.number().int().openapi({
      description: 'HTTP status code',
      example: status
    }),
    requestId: z.string().uuid().optional().openapi({
      description: 'Unique request identifier for debugging',
      example: '123e4567-e89b-12d3-a456-426614174000'
    })
  }).openapi({
    description: `Error response with status ${status}`
  });
}

/**
 * Helper function to create validation error response schema
 * @returns OpenAPI schema for validation error response
 */
export function createValidationErrorResponseSchema() {
  return z.object({
    message: z.string().openapi({
      description: 'Error message',
      example: 'Validation failed'
    }),
    status: z.number().int().openapi({
      description: 'HTTP status code',
      example: 400
    }),
    errors: z.array(z.object({
      field: z.string().openapi({
        description: 'Field name that failed validation',
        example: 'name'
      }),
      message: z.string().openapi({
        description: 'Validation error message for the field',
        example: 'Name is required'
      })
    })).openapi({
      description: 'Array of field-specific validation errors'
    }),
    requestId: z.string().uuid().optional().openapi({
      description: 'Unique request identifier for debugging',
      example: '123e4567-e89b-12d3-a456-426614174000'
    })
  }).openapi({
    description: 'Validation error response with field-specific messages'
  });
}

/**
 * Helper function to enhance enum schemas with OpenAPI metadata
 * @param enumObject - The enum object (e.g., UserRoles, AccountStatuses)
 * @param description - Description for the enum
 * @returns Enhanced Zod enum schema with OpenAPI metadata
 */
export function createEnumSchema<T extends Record<string, string>>(
  enumObject: T,
  description: string
): z.ZodEnum<any> {
  const values = Object.values(enumObject) as any;
  return z.enum(values).openapi({
    description,
    enum: values
  });
}

/**
 * Helper function to create UUID parameter schema
 * @param description - Description for the UUID parameter
 * @returns UUID schema with OpenAPI metadata
 */
export function createUUIDSchema(description: string = 'UUID identifier') {
  return z.string().uuid().openapi({
    description,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000'
  });
}

/**
 * Helper function to create reference object schema
 * @param entityName - Name of the referenced entity
 * @returns Reference object schema with OpenAPI metadata
 */
export function createReferenceSchema(entityName: string) {
  return z.object({
    id: createUUIDSchema(`${entityName} identifier`)
  }).openapi({
    description: `Reference to a ${entityName} entity`,
    example: { id: '123e4567-e89b-12d3-a456-426614174000' }
  });
}

/**
 * Helper function to create date schema with OpenAPI metadata
 * @param description - Description for the date field
 * @param format - Date format ('date' for YYYY-MM-DD, 'date-time' for ISO 8601)
 * @returns Date schema with OpenAPI metadata
 */
export function createDateSchema(description: string, format: 'date' | 'date-time' = 'date-time') {
  const baseSchema = format === 'date' 
    ? z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `Date must be in YYYY-MM-DD format`)
    : z.string().datetime({ message: 'Date must be in ISO 8601 format' });

  return baseSchema.openapi({
    description,
    format,
    example: format === 'date' ? '2024-01-15' : '2024-01-15T10:30:00.000Z'
  });
}

/**
 * Helper function to create email schema with OpenAPI metadata
 * @param required - Whether the email is required
 * @returns Email schema with OpenAPI metadata
 */
export function createEmailSchema(required: boolean = true) {
  const baseSchema = z.string().email('Valid email is required');
  const schema = required ? baseSchema : baseSchema.optional().or(z.null());
  
  return schema.openapi({
    description: required ? 'Email address' : 'Email address (optional)',
    format: 'email',
    example: 'user@example.com'
  });
}

/**
 * Helper function to create phone schema with OpenAPI metadata
 * @param required - Whether the phone is required
 * @returns Phone schema with OpenAPI metadata
 */
export function createPhoneSchema(required: boolean = false) {
  const baseSchema = z.string().min(1);
  const schema = required ? baseSchema : baseSchema.optional().or(z.null());
  
  return schema.openapi({
    description: required ? 'Phone number' : 'Phone number (optional)',
    example: '+55 11 99999-9999'
  });
}

/**
 * Helper function to create URL schema with OpenAPI metadata
 * @param description - Description for the URL field
 * @param required - Whether the URL is required
 * @returns URL schema with OpenAPI metadata
 */
export function createUrlSchema(description: string, required: boolean = false) {
  const baseSchema = z.string().url();
  const schema = required ? baseSchema : baseSchema.optional().or(z.literal('')).or(z.null());
  
  return schema.openapi({
    description,
    format: 'uri',
    example: 'https://example.com'
  });
}