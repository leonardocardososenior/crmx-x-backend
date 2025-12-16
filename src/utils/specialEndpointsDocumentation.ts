import { routeDocumentationExtractor, RouteInfo } from './routeDocumentationExtractor';

/**
 * Special Endpoints Documentation Generator
 * Adds documentation for all dashboard analytics endpoints
 * Documents nested routes like account timeline
 * Includes query parameter documentation for filtering and pagination
 */

/**
 * Special Endpoints Documentation class
 * Provides methods to document dashboard and special nested endpoints
 */
export class SpecialEndpointsDocumentation {
  private static instance: SpecialEndpointsDocumentation;

  private constructor() {}

  public static getInstance(): SpecialEndpointsDocumentation {
    if (!SpecialEndpointsDocumentation.instance) {
      SpecialEndpointsDocumentation.instance = new SpecialEndpointsDocumentation();
    }
    return SpecialEndpointsDocumentation.instance;
  }

  /**
   * Document all dashboard analytics endpoints
   * @returns Array of dashboard route information objects
   */
  public documentDashboardEndpoints(): RouteInfo[] {
    return routeDocumentationExtractor.extractDashboardRoutes();
  }

  /**
   * Document special nested routes and custom endpoints
   * @returns Array of special route information objects
   */
  public documentSpecialEndpoints(): RouteInfo[] {
    const routes: RouteInfo[] = [];

    // Get the account timeline nested route
    const specialRoutes = routeDocumentationExtractor.extractSpecialRoutes();
    routes.push(...specialRoutes);

    // Add any additional custom endpoints that don't follow standard CRUD patterns
    const customRoutes = this.documentCustomEndpoints();
    routes.push(...customRoutes);

    return routes;
  }

  /**
   * Document custom endpoints that don't follow standard patterns
   * @returns Array of custom route information objects
   */
  private documentCustomEndpoints(): RouteInfo[] {
    const routes: RouteInfo[] = [];

    // Add any future custom endpoints here
    // For now, the system primarily uses standard CRUD + dashboard patterns

    return routes;
  }

  /**
   * Document enhanced dashboard endpoints with detailed query parameters
   * @returns Array of enhanced dashboard route information objects
   */
  public documentEnhancedDashboardEndpoints(): RouteInfo[] {
    const baseRoutes = this.documentDashboardEndpoints();

    // Enhance dashboard routes with additional query parameters and examples
    baseRoutes.forEach(route => {
      switch (route.operationId) {
        case 'getRevenuePerPeriod':
          // Add locale parameter for month names
          route.parameters.push({
            name: 'locale',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['pt-BR', 'en-US', 'es-ES']
            },
            description: 'Locale for month names in response',
            example: 'pt-BR'
          });
          break;

        case 'getMoreSalesByResponsible':
          // Add sorting and limit parameters
          route.parameters.push(
            {
              name: 'sortBy',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
                enum: ['saleValue', 'closedDealsCount', 'responsibleName']
              },
              description: 'Sort results by field',
              example: 'saleValue'
            },
            {
              name: 'sortOrder',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
                enum: ['asc', 'desc']
              },
              description: 'Sort order',
              example: 'desc'
            },
            {
              name: 'limit',
              in: 'query',
              required: false,
              schema: {
                type: 'integer',
                minimum: 1,
                maximum: 100
              },
              description: 'Limit number of results',
              example: 10
            }
          );
          break;

        case 'getSalesFunnel':
          // Add stage filtering
          route.parameters.push({
            name: 'stages',
            in: 'query',
            required: false,
            schema: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']
              }
            },
            description: 'Filter specific stages (comma-separated)',
            example: ['Prospecting', 'Qualification', 'Proposal']
          });
          break;

        case 'getTotalRevenue':
          // Add currency and breakdown parameters
          route.parameters.push(
            {
              name: 'currency',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
                enum: ['BRL', 'USD', 'EUR']
              },
              description: 'Currency for revenue calculation',
              example: 'BRL'
            },
            {
              name: 'breakdown',
              in: 'query',
              required: false,
              schema: {
                type: 'boolean'
              },
              description: 'Include breakdown by responsible user',
              example: false
            }
          );
          break;

        case 'getActiveAccounts':
          // Add filtering by account type and segment
          route.parameters.push(
            {
              name: 'type',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
                enum: ['Client', 'Prospect', 'Partner', 'Competitor']
              },
              description: 'Filter active accounts by type',
              example: 'Client'
            },
            {
              name: 'segment',
              in: 'query',
              required: false,
              schema: {
                type: 'string'
              },
              description: 'Filter active accounts by segment',
              example: 'Technology'
            }
          );
          break;

        case 'getNewBusiness':
          // Add filtering by stage and responsible
          route.parameters.push(
            {
              name: 'stage',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
                enum: ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']
              },
              description: 'Filter new business by stage',
              example: 'Prospecting'
            },
            {
              name: 'responsibleId',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
                format: 'uuid'
              },
              description: 'Filter new business by responsible user ID',
              example: '123e4567-e89b-12d3-a456-426614174000'
            }
          );
          break;
      }
    });

    return baseRoutes;
  }

  /**
   * Document advanced filtering capabilities for list endpoints
   * @returns Array of filter documentation objects
   */
  public documentAdvancedFiltering(): Array<{
    endpoint: string;
    filterExamples: Array<{
      description: string;
      filter: string;
      explanation: string;
    }>;
  }> {
    return [
      {
        endpoint: '/api/accounts',
        filterExamples: [
          {
            description: 'Active clients in Technology segment',
            filter: 'status = "ACTIVE" AND type = "Client" AND segment = "Technology"',
            explanation: 'Combines multiple conditions with AND operator'
          },
          {
            description: 'Accounts with recent interactions',
            filter: 'lastInteraction >= "2024-01-01T00:00:00.000Z"',
            explanation: 'Date comparison using ISO 8601 format'
          },
          {
            description: 'Accounts by name pattern',
            filter: 'name LIKE "%Corp%" OR name LIKE "%Inc%"',
            explanation: 'Pattern matching with LIKE operator and OR condition'
          }
        ]
      },
      {
        endpoint: '/api/business',
        filterExamples: [
          {
            description: 'High-value opportunities in negotiation',
            filter: 'stage = "Negotiation" AND value >= 50000',
            explanation: 'Combines stage filter with numeric comparison'
          },
          {
            description: 'Opportunities closing this quarter',
            filter: 'closingDate >= "2024-01-01" AND closingDate <= "2024-03-31"',
            explanation: 'Date range filtering for closing dates'
          },
          {
            description: 'BRL opportunities with high probability',
            filter: 'currency = "BRL" AND probability >= 75',
            explanation: 'Currency and probability filtering'
          }
        ]
      },
      {
        endpoint: '/api/business-proposals',
        filterExamples: [
          {
            description: 'Sent proposals with high value',
            filter: 'status = "Enviado" AND value >= 25000',
            explanation: 'Status and value filtering'
          },
          {
            description: 'Recent proposals by title',
            filter: 'title LIKE "%Software%" AND date >= "2024-01-01"',
            explanation: 'Text search combined with date filtering'
          }
        ]
      },
      {
        endpoint: '/api/account-timeline',
        filterExamples: [
          {
            description: 'Recent calls for specific account',
            filter: 'type = "CALL" AND date >= "2024-01-01T00:00:00.000Z"',
            explanation: 'Type and date filtering for timeline entries'
          },
          {
            description: 'Timeline entries by responsible user',
            filter: 'responsible.id = "123e4567-e89b-12d3-a456-426614174000"',
            explanation: 'Filtering by nested object property'
          }
        ]
      }
    ];
  }

  /**
   * Document pagination patterns used across endpoints
   * @returns Pagination documentation object
   */
  public documentPaginationPatterns(): {
    description: string;
    parameters: Array<{
      name: string;
      description: string;
      type: string;
      default: any;
      example: any;
    }>;
    responseStructure: {
      description: string;
      properties: Array<{
        name: string;
        type: string;
        description: string;
      }>;
    };
    examples: Array<{
      scenario: string;
      request: string;
      response: any;
    }>;
  } {
    return {
      description: 'All list endpoints support pagination using page-based navigation',
      parameters: [
        {
          name: 'page',
          description: 'Page number starting from 1',
          type: 'integer',
          default: 1,
          example: 1
        },
        {
          name: 'size',
          description: 'Number of items per page (maximum 100)',
          type: 'integer',
          default: 20,
          example: 20
        }
      ],
      responseStructure: {
        description: 'All paginated responses follow the same structure',
        properties: [
          {
            name: 'contents',
            type: 'array',
            description: 'Array of items for the current page'
          },
          {
            name: 'totalElements',
            type: 'integer',
            description: 'Total number of items across all pages'
          },
          {
            name: 'totalPages',
            type: 'integer',
            description: 'Total number of pages'
          }
        ]
      },
      examples: [
        {
          scenario: 'First page with default size',
          request: 'GET /api/accounts?page=1&size=20',
          response: {
            contents: ['... array of 20 accounts ...'],
            totalElements: 156,
            totalPages: 8
          }
        },
        {
          scenario: 'Last page with remaining items',
          request: 'GET /api/accounts?page=8&size=20',
          response: {
            contents: ['... array of 16 accounts ...'],
            totalElements: 156,
            totalPages: 8
          }
        },
        {
          scenario: 'Custom page size',
          request: 'GET /api/accounts?page=1&size=50',
          response: {
            contents: ['... array of 50 accounts ...'],
            totalElements: 156,
            totalPages: 4
          }
        }
      ]
    };
  }

  /**
   * Register all dashboard and special endpoints with the OpenAPI registry
   */
  public registerAllSpecialEndpoints(): void {
    // Register enhanced dashboard endpoints
    const dashboardRoutes = this.documentEnhancedDashboardEndpoints();
    routeDocumentationExtractor.registerRoutes(dashboardRoutes);

    // Register special nested routes
    const specialRoutes = this.documentSpecialEndpoints();
    routeDocumentationExtractor.registerRoutes(specialRoutes);
  }

  /**
   * Register only dashboard endpoints with the OpenAPI registry
   */
  public registerDashboardEndpoints(): void {
    const dashboardRoutes = this.documentEnhancedDashboardEndpoints();
    routeDocumentationExtractor.registerRoutes(dashboardRoutes);
  }

  /**
   * Register only special nested endpoints with the OpenAPI registry
   */
  public registerSpecialEndpoints(): void {
    const specialRoutes = this.documentSpecialEndpoints();
    routeDocumentationExtractor.registerRoutes(specialRoutes);
  }

  /**
   * Get summary of all documented special endpoints
   * @returns Summary information about special endpoints
   */
  public getSpecialEndpointsSummary(): {
    dashboardEndpoints: number;
    specialEndpoints: number;
    totalEndpoints: number;
    endpoints: Array<{
      path: string;
      method: string;
      operationId: string;
      category: 'dashboard' | 'special';
    }>;
  } {
    const dashboardRoutes = this.documentDashboardEndpoints();
    const specialRoutes = this.documentSpecialEndpoints();

    const endpoints = [
      ...dashboardRoutes.map(r => ({
        path: r.path,
        method: r.method.toUpperCase(),
        operationId: r.operationId,
        category: 'dashboard' as const
      })),
      ...specialRoutes.map(r => ({
        path: r.path,
        method: r.method.toUpperCase(),
        operationId: r.operationId,
        category: 'special' as const
      }))
    ];

    return {
      dashboardEndpoints: dashboardRoutes.length,
      specialEndpoints: specialRoutes.length,
      totalEndpoints: endpoints.length,
      endpoints
    };
  }

  /**
   * Get comprehensive documentation for query parameters
   * @returns Query parameter documentation
   */
  public getQueryParameterDocumentation(): {
    commonParameters: Array<{
      name: string;
      description: string;
      type: string;
      applicableEndpoints: string[];
      examples: string[];
    }>;
    entitySpecificParameters: Array<{
      entity: string;
      parameters: Array<{
        name: string;
        description: string;
        type: string;
        examples: string[];
      }>;
    }>;
  } {
    return {
      commonParameters: [
        {
          name: 'page',
          description: 'Page number for pagination (starts from 1)',
          type: 'integer',
          applicableEndpoints: ['All list endpoints'],
          examples: ['1', '2', '10']
        },
        {
          name: 'size',
          description: 'Number of items per page (maximum 100)',
          type: 'integer',
          applicableEndpoints: ['All list endpoints'],
          examples: ['20', '50', '100']
        },
        {
          name: 'filter',
          description: 'Dynamic filter using SQL-like syntax',
          type: 'string',
          applicableEndpoints: ['All list endpoints'],
          examples: [
            'name LIKE "%test%"',
            'status = "ACTIVE"',
            'value >= 10000 AND currency = "BRL"'
          ]
        }
      ],
      entitySpecificParameters: [
        {
          entity: 'Dashboard',
          parameters: [
            {
              name: 'period',
              description: 'Time period for analytics data',
              type: 'enum',
              examples: ['THIS_MONTH', 'THIS_YEAR', 'LAST_QUARTER']
            },
            {
              name: 'year',
              description: 'Specific year for revenue data',
              type: 'integer',
              examples: ['2024', '2023', '2022']
            }
          ]
        },
        {
          entity: 'Account Timeline',
          parameters: [
            {
              name: 'type',
              description: 'Timeline entry type',
              type: 'enum',
              examples: ['CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK']
            },
            {
              name: 'dateFrom',
              description: 'Filter entries from this date',
              type: 'date-time',
              examples: ['2024-01-01T00:00:00.000Z']
            },
            {
              name: 'dateTo',
              description: 'Filter entries until this date',
              type: 'date-time',
              examples: ['2024-01-31T23:59:59.999Z']
            }
          ]
        }
      ]
    };
  }
}

// Export singleton instance
export const specialEndpointsDocumentation = SpecialEndpointsDocumentation.getInstance();