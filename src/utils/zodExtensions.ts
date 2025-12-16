import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

// Extend Zod with OpenAPI functionality
// This must be called before any schemas are created
extendZodWithOpenApi(z);

// Re-export z for consistency
export { z };