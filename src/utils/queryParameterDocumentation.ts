/**
 * Query Parameter Documentation Generator
 * Comprehensive documentation system for pagination, filtering, and search parameters
 * Generates OpenAPI parameter definitions with types, formats, and examples
 */

import { z } from './zodExtensions';
import { registry } from '../config/openapi';
import { convertZodToOpenAPI } from './zodToOpenAPI';
import { logger } from './logger';

/**
 * Interface for OpenAPI parameter definition
 */
export interface OpenAPIParameter {
  name: string;
  in: 'query' | 'path' | 'header';
  description: string;
  required: boolean;
  schema: {
    type: string;
    format?: string;
    minimum?: number;
    maximum?: number;
    default?: any;
    enum?: string[];
    items?: any;
  };
  example?: any;
  examples?: Record<string, { value: any; summary?: string; description?: string }>;
}

/**
 * Query Parameter Documentation class
 * Provides comprehensive documentation for all query parameters used across the API
 */
export class QueryParameterDocumentation {
  private static instance: QueryParameterDocumentation;

  private constructor() {}

  public static getInstance(): QueryParameterDocumentation {
    if (!QueryParameterDocumentation.instance) {
      QueryParameterDocumentation.instance = new QueryParameterDocumentation();
    }
    return QueryParameterDocumentation.instance;
  }

  /**
   * Document standard pagination parameters
   * @returns Array of pagination parameter definitions
   */
  public documentPaginationParameters(): OpenAPIParameter[] {
    return [
      {
        name: 'page',
        in: 'query',
        description: 'Page number for pagination (starts from 1)',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1
        },
        example: 1,
        examples: {
          firstPage: {
            value: 1,
            summary: 'First page',
            description: 'Get the first page of results'
          },
          middlePage: {
            value: 5,
            summary: 'Middle page',
            description: 'Get results from page 5'
          },
          lastPage: {
            value: 10,
            summary: 'Last page',
            description: 'Get the last page of results'
          }
        }
      },
      {
        name: 'size',
        in: 'query',
        description: 'Number of items per page (maximum 100)',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 20
        },
        example: 20,
        examples: {
          small: {
            value: 10,
            summary: 'Small page size',
            description: '10 items per page for detailed viewing'
          },
          default: {
            value: 20,
            summary: 'Default page size',
            description: 'Standard 20 items per page'
          },
          large: {
            value: 50,
            summary: 'Large page size',
            description: '50 items per page for overview'
          },
          maximum: {
            value: 100,
            summary: 'Maximum page size',
            description: 'Maximum allowed 100 items per page'
          }
        }
      },

    ];
  }

  /**
   * Generate example URLs with pagination parameters
   * @returns Array of example URL patterns with descriptions
   */
  public generatePaginationExampleUrls(): Array<{
    description: string;
    url: string;
    explanation: string;
    expectedResponse: {
      totalElements: number;
      totalPages: number;
      currentPage: number;
      itemsInPage: number;
    };
  }> {
    return [
      {
        description: 'First page with default size',
        url: '/api/accounts?page=1&size=20',
        explanation: 'Retrieves the first 20 accounts',
        expectedResponse: {
          totalElements: 156,
          totalPages: 8,
          currentPage: 1,
          itemsInPage: 20
        }
      },
      {
        description: 'Middle page with default size',
        url: '/api/accounts?page=5&size=20',
        explanation: 'Retrieves accounts 81-100 (page 5 of 8)',
        expectedResponse: {
          totalElements: 156,
          totalPages: 8,
          currentPage: 5,
          itemsInPage: 20
        }
      },
      {
        description: 'Last page with remaining items',
        url: '/api/accounts?page=8&size=20',
        explanation: 'Retrieves the last 16 accounts (items 141-156)',
        expectedResponse: {
          totalElements: 156,
          totalPages: 8,
          currentPage: 8,
          itemsInPage: 16
        }
      },
      {
        description: 'Custom page size',
        url: '/api/accounts?page=1&size=50',
        explanation: 'Retrieves first 50 accounts with larger page size',
        expectedResponse: {
          totalElements: 156,
          totalPages: 4,
          currentPage: 1,
          itemsInPage: 50
        }
      },
      {
        description: 'Small page size for detailed view',
        url: '/api/business?page=1&size=5',
        explanation: 'Retrieves first 5 business opportunities for detailed analysis',
        expectedResponse: {
          totalElements: 42,
          totalPages: 9,
          currentPage: 1,
          itemsInPage: 5
        }
      },
      {
        description: 'Maximum page size',
        url: '/api/items?page=1&size=100',
        explanation: 'Retrieves up to 100 items in a single request',
        expectedResponse: {
          totalElements: 250,
          totalPages: 3,
          currentPage: 1,
          itemsInPage: 100
        }
      }
    ];
  }

  /**
   * Document common filtering parameters
   * @returns Array of common filter parameter definitions
   */
  public documentCommonFilterParameters(): OpenAPIParameter[] {
    // Import filtering documentation to get comprehensive examples
    const { filteringDocumentation } = require('./filteringDocumentation');
    const operators = filteringDocumentation.documentFilterOperators();
    
    // Create examples from operator documentation
    const operatorExamples = operators.slice(0, 6).reduce((acc: Record<string, any>, op: any) => {
      const key = op.operator.toLowerCase().replace(/[^a-z]/g, '');
      acc[key] = {
        value: op.examples[0].filter,
        summary: op.description,
        description: op.examples[0].explanation
      };
      return acc;
    }, {});

    return [
      {
        name: 'filter',
        in: 'query',
        description: 'Dynamic filter parameter using SQL-like syntax. Supports operators: =, !=, >, <, >=, <=, LIKE, ILIKE, IN, NOT IN, AND, OR. Use parentheses for complex logical grouping.',
        required: false,
        schema: {
          type: 'string'
        },
        example: 'status = "ACTIVE" AND type = "Client"',
        examples: {
          ...operatorExamples,
          complex: {
            value: '(status = "ACTIVE" OR status = "PENDING") AND value > 5000',
            summary: 'Complex logical grouping',
            description: 'Use parentheses for complex logical expressions'
          },
          relationship: {
            value: 'responsible.id = "123e4567-e89b-12d3-a456-426614174000"',
            summary: 'Relationship filtering',
            description: 'Filter by related entity fields using dot notation'
          }
        }
      }
    ];
  }

  /**
   * Document entity-specific search and filter parameters
   * @returns Record of entity-specific parameter definitions
   */
  public documentEntitySpecificParameters(): Record<string, OpenAPIParameter[]> {
    return {
      accounts: [
        {
          name: 'status',
          in: 'query',
          description: 'Filter accounts by status',
          required: false,
          schema: {
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED']
          },
          example: 'ACTIVE'
        },
        {
          name: 'type',
          in: 'query',
          description: 'Filter accounts by type',
          required: false,
          schema: {
            type: 'string',
            enum: ['Client', 'Prospect', 'Partner', 'Competitor']
          },
          example: 'Client'
        },
        {
          name: 'segment',
          in: 'query',
          description: 'Filter accounts by business segment',
          required: false,
          schema: {
            type: 'string'
          },
          example: 'Technology'
        },
        {
          name: 'responsibleId',
          in: 'query',
          description: 'Filter accounts by responsible user ID',
          required: false,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          example: '123e4567-e89b-12d3-a456-426614174000'
        }
      ],
      business: [
        {
          name: 'stage',
          in: 'query',
          description: 'Filter business opportunities by stage',
          required: false,
          schema: {
            type: 'string',
            enum: ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']
          },
          example: 'Proposal'
        },
        {
          name: 'currency',
          in: 'query',
          description: 'Filter business opportunities by currency',
          required: false,
          schema: {
            type: 'string',
            enum: ['BRL', 'USD', 'EUR']
          },
          example: 'BRL'
        },
        {
          name: 'minValue',
          in: 'query',
          description: 'Filter business opportunities with value greater than or equal to this amount',
          required: false,
          schema: {
            type: 'number',
            minimum: 0
          },
          example: 10000
        },
        {
          name: 'maxValue',
          in: 'query',
          description: 'Filter business opportunities with value less than or equal to this amount',
          required: false,
          schema: {
            type: 'number',
            minimum: 0
          },
          example: 100000
        },
        {
          name: 'responsibleId',
          in: 'query',
          description: 'Filter business opportunities by responsible user ID',
          required: false,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          example: '123e4567-e89b-12d3-a456-426614174000'
        }
      ],
      items: [
        {
          name: 'search',
          in: 'query',
          description: 'Search items by name or description',
          required: false,
          schema: {
            type: 'string'
          },
          example: 'software',
          examples: {
            name: {
              value: 'software',
              summary: 'Search by name',
              description: 'Find items with "software" in the name'
            },
            description: {
              value: 'consulting',
              summary: 'Search by description',
              description: 'Find items with "consulting" in the description'
            }
          }
        },
        {
          name: 'type',
          in: 'query',
          description: 'Filter items by type',
          required: false,
          schema: {
            type: 'string',
            enum: ['Product', 'Service', 'Subscription']
          },
          example: 'Product'
        },
        {
          name: 'minPrice',
          in: 'query',
          description: 'Filter items with price greater than or equal to this amount',
          required: false,
          schema: {
            type: 'number',
            minimum: 0
          },
          example: 100
        },
        {
          name: 'maxPrice',
          in: 'query',
          description: 'Filter items with price less than or equal to this amount',
          required: false,
          schema: {
            type: 'number',
            minimum: 0
          },
          example: 1000
        }
      ],
      dashboard: [
        {
          name: 'period',
          in: 'query',
          description: 'Time period for dashboard analytics',
          required: true,
          schema: {
            type: 'string',
            enum: ['THIS_MONTH', 'THIS_YEAR', 'LAST_QUARTER']
          },
          example: 'THIS_MONTH',
          examples: {
            thisMonth: {
              value: 'THIS_MONTH',
              summary: 'Current month',
              description: 'Data for the current calendar month'
            },
            thisYear: {
              value: 'THIS_YEAR',
              summary: 'Current year',
              description: 'Data for the current calendar year'
            },
            lastQuarter: {
              value: 'LAST_QUARTER',
              summary: 'Previous quarter',
              description: 'Data for the previous business quarter'
            }
          }
        },
        {
          name: 'year',
          in: 'query',
          description: 'Specific year for revenue analytics (deprecated, use period parameter instead)',
          required: false,
          schema: {
            type: 'integer',
            minimum: 2000,
            maximum: 2034
          },
          example: 2024
        }
      ],
      accountTimeline: [
        {
          name: 'accountId',
          in: 'query',
          description: 'Filter timeline entries by account ID',
          required: false,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          example: '123e4567-e89b-12d3-a456-426614174000'
        },
        {
          name: 'type',
          in: 'query',
          description: 'Filter timeline entries by type',
          required: false,
          schema: {
            type: 'string',
            enum: ['CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK']
          },
          example: 'CALL'
        },
        {
          name: 'dateFrom',
          in: 'query',
          description: 'Filter timeline entries from this date (ISO 8601 format)',
          required: false,
          schema: {
            type: 'string',
            format: 'date-time'
          },
          example: '2024-01-01T00:00:00.000Z'
        },
        {
          name: 'dateTo',
          in: 'query',
          description: 'Filter timeline entries until this date (ISO 8601 format)',
          required: false,
          schema: {
            type: 'string',
            format: 'date-time'
          },
          example: '2024-01-31T23:59:59.999Z'
        }
      ],
      businessProposals: [
        {
          name: 'search',
          in: 'query',
          description: 'Search business proposals by title or content',
          required: false,
          schema: {
            type: 'string'
          },
          example: 'software development'
        },
        {
          name: 'status',
          in: 'query',
          description: 'Filter business proposals by status',
          required: false,
          schema: {
            type: 'string',
            enum: ['Rascunho', 'Enviado', 'Aceito', 'Rejeitado']
          },
          example: 'Enviado'
        },
        {
          name: 'minValue',
          in: 'query',
          description: 'Filter proposals with value greater than or equal to this amount',
          required: false,
          schema: {
            type: 'number',
            minimum: 0
          },
          example: 5000
        },
        {
          name: 'maxValue',
          in: 'query',
          description: 'Filter proposals with value less than or equal to this amount',
          required: false,
          schema: {
            type: 'number',
            minimum: 0
          },
          example: 50000
        }
      ]
    };
  }

  /**
   * Register all query parameter schemas with OpenAPI registry
   * Note: Parameters are typically registered as part of the OpenAPI configuration
   * This method documents the parameters for reference but doesn't register them
   * as the registry is primarily for schemas, not parameters
   */
  public registerQueryParameterSchemas(): void {
    // Parameters are documented in the OpenAPI configuration file
    // and applied to endpoints during route documentation
    logger.info('DOCUMENTATION', 'Query parameter schemas documented and ready for use');
    
    const paginationParams = this.documentPaginationParameters();
    const filterParams = this.documentCommonFilterParameters();
    const entityParams = this.documentEntitySpecificParameters();
    
    logger.info('DOCUMENTATION', `Documented ${paginationParams.length} pagination parameters`);
    logger.info('DOCUMENTATION', `Documented ${filterParams.length} filtering parameters`);
    logger.info('DOCUMENTATION', `Documented ${Object.values(entityParams).flat().length} entity-specific parameters`);
  }

  /**
   * Get comprehensive query parameter documentation for a specific endpoint
   * @param endpoint - The endpoint path (e.g., '/api/accounts')
   * @returns Complete parameter documentation for the endpoint
   */
  public getEndpointParameterDocumentation(endpoint: string): {
    pagination: OpenAPIParameter[];
    filtering: OpenAPIParameter[];
    entitySpecific: OpenAPIParameter[];
    examples: Array<{
      description: string;
      url: string;
      explanation: string;
    }>;
  } {
    const pagination = this.documentPaginationParameters();
    const filtering = this.documentCommonFilterParameters();
    const entityParams = this.documentEntitySpecificParameters();

    // Determine entity type from endpoint
    let entityType = '';
    if (endpoint.includes('/accounts')) entityType = 'accounts';
    else if (endpoint.includes('/business')) entityType = 'business';
    else if (endpoint.includes('/items')) entityType = 'items';
    else if (endpoint.includes('/dashboard')) entityType = 'dashboard';
    else if (endpoint.includes('/account-timeline')) entityType = 'accountTimeline';
    else if (endpoint.includes('/business-proposals')) entityType = 'businessProposals';

    const entitySpecific = entityParams[entityType] || [];

    // Generate example URLs for this endpoint
    const examples = this.generateEndpointExamples(endpoint, entityType);

    return {
      pagination,
      filtering,
      entitySpecific,
      examples
    };
  }

  /**
   * Generate example URLs for a specific endpoint
   * @param endpoint - The endpoint path
   * @param entityType - The entity type
   * @returns Array of example URLs with descriptions
   */
  private generateEndpointExamples(endpoint: string, entityType: string): Array<{
    description: string;
    url: string;
    explanation: string;
  }> {
    const baseExamples = [
      {
        description: 'Basic pagination',
        url: `${endpoint}?page=1&size=20`,
        explanation: 'Get first page with 20 items'
      },
      {
        description: 'Custom page size',
        url: `${endpoint}?page=2&size=50`,
        explanation: 'Get second page with 50 items'
      }
    ];

    // Add entity-specific examples
    const entityExamples: Record<string, Array<{ description: string; url: string; explanation: string }>> = {
      accounts: [
        {
          description: 'Filter active clients',
          url: `${endpoint}?filter=status = "ACTIVE" AND type = "Client"`,
          explanation: 'Get only active client accounts'
        },
        {
          description: 'Search by segment with pagination',
          url: `${endpoint}?filter=segment LIKE "%Tech%" AND page=1&size=10`,
          explanation: 'Search technology segment accounts with small page size'
        }
      ],
      business: [
        {
          description: 'High-value opportunities',
          url: `${endpoint}?filter=value >= 50000 AND stage = "Negotiation"`,
          explanation: 'Get high-value opportunities in negotiation stage'
        },
        {
          description: 'BRL opportunities this year',
          url: `${endpoint}?filter=currency = "BRL" AND createdAt >= "2024-01-01"`,
          explanation: 'Get BRL opportunities created this year'
        }
      ],
      items: [
        {
          description: 'Search products by name',
          url: `${endpoint}?search=software&type=Product`,
          explanation: 'Search for software products'
        },
        {
          description: 'Price range filter',
          url: `${endpoint}?minPrice=100&maxPrice=1000&page=1&size=25`,
          explanation: 'Get items in price range $100-$1000'
        }
      ],
      dashboard: [
        {
          description: 'Current month analytics',
          url: `${endpoint}?period=THIS_MONTH`,
          explanation: 'Get analytics data for current month'
        },
        {
          description: 'Yearly revenue data',
          url: `${endpoint.replace('/dashboard/', '/dashboard/revenue-per-period/')}?period=THIS_YEAR`,
          explanation: 'Get monthly revenue breakdown for current year'
        }
      ]
    };

    return [...baseExamples, ...(entityExamples[entityType] || [])];
  }
}

// Export singleton instance
export const queryParameterDocumentation = QueryParameterDocumentation.getInstance();