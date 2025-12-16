import { Router } from 'express';
import { registry } from '../config/openapi';

/**
 * Route Documentation Extractor
 * Analyzes existing route files to extract endpoint information
 * Generates path parameters, query parameters, and operation details
 * Maps HTTP methods to OpenAPI operations
 */

export interface RouteInfo {
  path: string;
  method: string;
  operationId: string;
  summary: string;
  description: string;
  tags: string[];
  parameters: ParameterInfo[];
  requestBody?: RequestBodyInfo;
  responses: ResponseInfo[];
  security?: SecurityRequirement[];
}

export interface ParameterInfo {
  name: string;
  in: 'path' | 'query' | 'header';
  required: boolean;
  schema: any;
  description: string;
  example?: any;
}

export interface RequestBodyInfo {
  description: string;
  required: boolean;
  content: {
    [mediaType: string]: {
      schema: any;
      example?: any;
    };
  };
}

export interface ResponseInfo {
  statusCode: string;
  description: string;
  content?: {
    [mediaType: string]: {
      schema: any;
      example?: any;
    };
  };
}

export interface SecurityRequirement {
  [name: string]: string[];
}

/**
 * Route Documentation Extractor class
 * Provides methods to extract and document API endpoints
 */
export class RouteDocumentationExtractor {
  private static instance: RouteDocumentationExtractor;

  private constructor() {}

  public static getInstance(): RouteDocumentationExtractor {
    if (!RouteDocumentationExtractor.instance) {
      RouteDocumentationExtractor.instance = new RouteDocumentationExtractor();
    }
    return RouteDocumentationExtractor.instance;
  }

  /**
   * Extract route information from route definitions
   * @param basePath - Base path for the routes (e.g., '/api/users')
   * @param entityName - Name of the entity (e.g., 'User')
   * @param tag - OpenAPI tag for grouping endpoints
   * @returns Array of route information objects
   */
  public extractCRUDRoutes(basePath: string, entityName: string, tag: string): RouteInfo[] {
    const routes: RouteInfo[] = [];
    const entityLower = entityName.toLowerCase();
    const entityPlural = this.pluralize(entityLower);

    // POST - Create entity
    routes.push({
      path: basePath,
      method: 'post',
      operationId: `create${entityName}`,
      summary: `Create new ${entityLower}`,
      description: `Creates a new ${entityLower} record in the system`,
      tags: [tag],
      parameters: [],
      requestBody: {
        description: `${entityName} data to create`,
        required: true,
        content: {
          'application/json': {
            schema: { $ref: `#/components/schemas/Create${entityName}Request` }
          }
        }
      },
      responses: [
        {
          statusCode: '201',
          description: `${entityName} created successfully`,
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${entityName}` }
            }
          }
        },
        {
          statusCode: '400',
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/responses/ValidationError' }
            }
          }
        },
        {
          statusCode: '401',
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/responses/UnauthorizedError' }
            }
          }
        }
      ],
      security: [{ bearerAuth: [] }]
    });

    // GET - List entities
    routes.push({
      path: basePath,
      method: 'get',
      operationId: `get${entityName}s`,
      summary: `Get all ${entityPlural}`,
      description: `Retrieves a paginated list of ${entityPlural} with optional filtering`,
      tags: [tag],
      parameters: [
        {
          name: 'page',
          in: 'query',
          required: false,
          schema: { $ref: '#/components/parameters/PageParam/schema' },
          description: 'Page number for pagination (starts from 1)',
          example: 1
        },
        {
          name: 'size',
          in: 'query',
          required: false,
          schema: { $ref: '#/components/parameters/SizeParam/schema' },
          description: 'Number of items per page (max 100)',
          example: 20
        },
        {
          name: 'filter',
          in: 'query',
          required: false,
          schema: { $ref: '#/components/parameters/FilterParam/schema' },
          description: 'Dynamic filter parameter using SQL-like syntax',
          example: `name LIKE "%test%" AND status = "ACTIVE"`
        }
      ],
      responses: [
        {
          statusCode: '200',
          description: `Paginated list of ${entityPlural}`,
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/Paginated${entityName}Response` }
            }
          }
        },
        {
          statusCode: '401',
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/responses/UnauthorizedError' }
            }
          }
        }
      ],
      security: [{ bearerAuth: [] }]
    });

    // GET - Get entity by ID
    routes.push({
      path: `${basePath}/{id}`,
      method: 'get',
      operationId: `get${entityName}ById`,
      summary: `Get ${entityLower} by ID`,
      description: `Retrieves a specific ${entityLower} by its unique identifier`,
      tags: [tag],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: `${entityName} unique identifier`,
          example: '123e4567-e89b-12d3-a456-426614174000'
        }
      ],
      responses: [
        {
          statusCode: '200',
          description: `${entityName} found`,
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${entityName}` }
            }
          }
        },
        {
          statusCode: '404',
          description: `${entityName} not found`,
          content: {
            'application/json': {
              schema: { $ref: '#/components/responses/NotFoundError' }
            }
          }
        },
        {
          statusCode: '401',
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/responses/UnauthorizedError' }
            }
          }
        }
      ],
      security: [{ bearerAuth: [] }]
    });

    // PUT - Update entity
    routes.push({
      path: `${basePath}/{id}`,
      method: 'put',
      operationId: `update${entityName}`,
      summary: `Update ${entityLower}`,
      description: `Updates an existing ${entityLower} with new data`,
      tags: [tag],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: `${entityName} unique identifier`,
          example: '123e4567-e89b-12d3-a456-426614174000'
        }
      ],
      requestBody: {
        description: `Updated ${entityLower} data`,
        required: true,
        content: {
          'application/json': {
            schema: { $ref: `#/components/schemas/Update${entityName}Request` }
          }
        }
      },
      responses: [
        {
          statusCode: '200',
          description: `${entityName} updated successfully`,
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${entityName}` }
            }
          }
        },
        {
          statusCode: '400',
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/responses/ValidationError' }
            }
          }
        },
        {
          statusCode: '404',
          description: `${entityName} not found`,
          content: {
            'application/json': {
              schema: { $ref: '#/components/responses/NotFoundError' }
            }
          }
        },
        {
          statusCode: '401',
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/responses/UnauthorizedError' }
            }
          }
        }
      ],
      security: [{ bearerAuth: [] }]
    });

    // DELETE - Delete entity
    routes.push({
      path: `${basePath}/{id}`,
      method: 'delete',
      operationId: `delete${entityName}`,
      summary: `Delete ${entityLower}`,
      description: `Deletes an existing ${entityLower} from the system`,
      tags: [tag],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: `${entityName} unique identifier`,
          example: '123e4567-e89b-12d3-a456-426614174000'
        }
      ],
      responses: [
        {
          statusCode: '204',
          description: `${entityName} deleted successfully`
        },
        {
          statusCode: '404',
          description: `${entityName} not found`,
          content: {
            'application/json': {
              schema: { $ref: '#/components/responses/NotFoundError' }
            }
          }
        },
        {
          statusCode: '401',
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/responses/UnauthorizedError' }
            }
          }
        }
      ],
      security: [{ bearerAuth: [] }]
    });

    return routes;
  }

  /**
   * Extract dashboard route information
   * @returns Array of dashboard route information objects
   */
  public extractDashboardRoutes(): RouteInfo[] {
    const routes: RouteInfo[] = [];

    // Revenue per period endpoint
    routes.push({
      path: '/api/dashboard/revenue-per-period',
      method: 'get',
      operationId: 'getRevenuePerPeriod',
      summary: 'Get monthly revenue totals for a specific period',
      description: 'Retrieves monthly revenue data aggregated by month for the specified period',
      tags: ['Dashboard'],
      parameters: [
        {
          name: 'period',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['THIS_MONTH', 'THIS_YEAR', 'LAST_QUARTER'],
            default: 'THIS_YEAR'
          },
          description: 'Period for revenue data (optional, defaults to THIS_YEAR)',
          example: 'THIS_YEAR'
        }
      ],
      responses: [
        {
          statusCode: '200',
          description: 'Monthly revenue data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MonthlyRevenueResponse' }
            }
          }
        },
        {
          statusCode: '401',
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/responses/UnauthorizedError' }
            }
          }
        }
      ],
      security: [{ bearerAuth: [] }]
    });

    // More sales by responsible endpoint
    routes.push({
      path: '/api/dashboard/more-sales-by-responsible',
      method: 'get',
      operationId: 'getMoreSalesByResponsible',
      summary: 'Get sales performance by responsible users',
      description: 'Retrieves sales performance data grouped by responsible users for the specified period',
      tags: ['Dashboard'],
      parameters: [
        {
          name: 'period',
          in: 'query',
          required: true,
          schema: {
            type: 'string',
            enum: ['THIS_MONTH', 'THIS_YEAR', 'LAST_QUARTER']
          },
          description: 'Time period for sales data',
          example: 'THIS_MONTH'
        }
      ],
      responses: [
        {
          statusCode: '200',
          description: 'Sales performance data by responsible',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MoreSalesByResponsibleResponse' }
            }
          }
        },
        {
          statusCode: '401',
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/responses/UnauthorizedError' }
            }
          }
        }
      ],
      security: [{ bearerAuth: [] }]
    });

    // Sales funnel endpoint
    routes.push({
      path: '/api/dashboard/sales-funnel',
      method: 'get',
      operationId: 'getSalesFunnel',
      summary: 'Get sales funnel distribution by stage',
      description: 'Retrieves sales funnel data showing distribution of opportunities by stage',
      tags: ['Dashboard'],
      parameters: [
        {
          name: 'period',
          in: 'query',
          required: true,
          schema: {
            type: 'string',
            enum: ['THIS_MONTH', 'THIS_YEAR', 'LAST_QUARTER']
          },
          description: 'Time period for funnel data',
          example: 'THIS_MONTH'
        }
      ],
      responses: [
        {
          statusCode: '200',
          description: 'Sales funnel data by stage',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SalesFunnelResponse' }
            }
          }
        },
        {
          statusCode: '401',
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/responses/UnauthorizedError' }
            }
          }
        }
      ],
      security: [{ bearerAuth: [] }]
    });

    // Total revenue endpoint
    routes.push({
      path: '/api/dashboard/total-revenue',
      method: 'get',
      operationId: 'getTotalRevenue',
      summary: 'Get total revenue from closed-won deals',
      description: 'Retrieves total revenue from all closed-won business deals for the specified period',
      tags: ['Dashboard'],
      parameters: [
        {
          name: 'period',
          in: 'query',
          required: true,
          schema: {
            type: 'string',
            enum: ['THIS_MONTH', 'THIS_YEAR', 'LAST_QUARTER']
          },
          description: 'Time period for revenue calculation',
          example: 'THIS_MONTH'
        }
      ],
      responses: [
        {
          statusCode: '200',
          description: 'Total revenue data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TotalRevenueResponse' }
            }
          }
        },
        {
          statusCode: '401',
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/responses/UnauthorizedError' }
            }
          }
        }
      ],
      security: [{ bearerAuth: [] }]
    });

    // Active accounts endpoint
    routes.push({
      path: '/api/dashboard/active-accounts',
      method: 'get',
      operationId: 'getActiveAccounts',
      summary: 'Get total count of active accounts',
      description: 'Retrieves the total number of accounts with active status',
      tags: ['Dashboard'],
      parameters: [],
      responses: [
        {
          statusCode: '200',
          description: 'Active accounts count',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ActiveAccountsResponse' }
            }
          }
        },
        {
          statusCode: '401',
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/responses/UnauthorizedError' }
            }
          }
        }
      ],
      security: [{ bearerAuth: [] }]
    });

    // New business endpoint
    routes.push({
      path: '/api/dashboard/new-business',
      method: 'get',
      operationId: 'getNewBusiness',
      summary: 'Get count of new businesses created',
      description: 'Retrieves the count of new business opportunities created in the specified period',
      tags: ['Dashboard'],
      parameters: [
        {
          name: 'period',
          in: 'query',
          required: true,
          schema: {
            type: 'string',
            enum: ['THIS_MONTH', 'THIS_YEAR', 'LAST_QUARTER']
          },
          description: 'Time period for new business count',
          example: 'THIS_MONTH'
        }
      ],
      responses: [
        {
          statusCode: '200',
          description: 'New business count',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NewBusinessResponse' }
            }
          }
        },
        {
          statusCode: '401',
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/responses/UnauthorizedError' }
            }
          }
        }
      ],
      security: [{ bearerAuth: [] }]
    });

    return routes;
  }

  /**
   * Extract special nested route information
   * @returns Array of special route information objects
   */
  public extractSpecialRoutes(): RouteInfo[] {
    const routes: RouteInfo[] = [];

    // Account timeline nested route
    routes.push({
      path: '/api/accounts/{accountId}/timeline',
      method: 'get',
      operationId: 'getAccountTimelineByAccountId',
      summary: 'Get timeline for specific account',
      description: 'Retrieves timeline entries for a specific account with optional filtering and pagination',
      tags: ['Accounts', 'Account Timeline'],
      parameters: [
        {
          name: 'accountId',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'Account unique identifier',
          example: '123e4567-e89b-12d3-a456-426614174000'
        },
        {
          name: 'page',
          in: 'query',
          required: false,
          schema: { $ref: '#/components/parameters/PageParam/schema' },
          description: 'Page number for pagination (starts from 1)',
          example: 1
        },
        {
          name: 'size',
          in: 'query',
          required: false,
          schema: { $ref: '#/components/parameters/SizeParam/schema' },
          description: 'Number of items per page (max 100)',
          example: 20
        },
        {
          name: 'type',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK']
          },
          description: 'Filter by timeline entry type',
          example: 'CALL'
        },
        {
          name: 'dateFrom',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            format: 'date-time'
          },
          description: 'Filter timeline entries from this date',
          example: '2024-01-01T00:00:00.000Z'
        },
        {
          name: 'dateTo',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            format: 'date-time'
          },
          description: 'Filter timeline entries until this date',
          example: '2024-01-31T23:59:59.999Z'
        }
      ],
      responses: [
        {
          statusCode: '200',
          description: 'Account timeline entries',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PaginatedAccountTimelineResponse' }
            }
          }
        },
        {
          statusCode: '404',
          description: 'Account not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/responses/NotFoundError' }
            }
          }
        },
        {
          statusCode: '401',
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/responses/UnauthorizedError' }
            }
          }
        }
      ],
      security: [{ bearerAuth: [] }]
    });

    return routes;
  }

  /**
   * Register all extracted routes with the OpenAPI registry
   * @param routes - Array of route information objects
   */
  public registerRoutes(routes: RouteInfo[]): void {
    routes.forEach(route => {
      this.registerRoute(route);
    });
  }

  /**
   * Register a single route with the OpenAPI registry
   * @param route - Route information object
   */
  private registerRoute(route: RouteInfo): void {
    const pathItem: any = {};
    
    // Build parameters array
    const parameters: any[] = [];
    route.parameters.forEach(param => {
      parameters.push({
        name: param.name,
        in: param.in,
        required: param.required,
        schema: param.schema,
        description: param.description,
        example: param.example
      });
    });

    // Build responses object
    const responses: any = {};
    route.responses.forEach(response => {
      responses[response.statusCode] = {
        description: response.description,
        ...(response.content && { content: response.content })
      };
    });

    // Build operation object
    const operation: any = {
      operationId: route.operationId,
      summary: route.summary,
      description: route.description,
      tags: route.tags,
      parameters: parameters,
      responses,
      security: route.security
    };

    // Add request body if present
    if (route.requestBody) {
      operation.requestBody = route.requestBody;
    }

    pathItem[route.method] = operation;

    // Register the path with the OpenAPI registry
    registry.registerPath({
      method: route.method as any,
      path: route.path,
      ...operation
    });
  }

  /**
   * Simple pluralization helper
   * @param word - Singular word to pluralize
   * @returns Pluralized word
   */
  private pluralize(word: string): string {
    if (word.endsWith('y')) {
      return word.slice(0, -1) + 'ies';
    }
    if (word.endsWith('s') || word.endsWith('sh') || word.endsWith('ch') || word.endsWith('x') || word.endsWith('z')) {
      return word + 'es';
    }
    return word + 's';
  }
}

// Export singleton instance
export const routeDocumentationExtractor = RouteDocumentationExtractor.getInstance();