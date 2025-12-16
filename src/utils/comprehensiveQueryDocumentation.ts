/**
 * Comprehensive Query Parameter Documentation
 * Complete documentation system that combines pagination, filtering, and search parameters
 * Provides unified documentation for all query parameter capabilities
 */

import { queryParameterDocumentation } from './queryParameterDocumentation';
import { filteringDocumentation } from './filteringDocumentation';
import { queryParameterIntegration } from './queryParameterIntegration';

/**
 * Comprehensive Query Documentation class
 * Provides unified access to all query parameter documentation
 */
export class ComprehensiveQueryDocumentation {
  private static instance: ComprehensiveQueryDocumentation;

  private constructor() {}

  public static getInstance(): ComprehensiveQueryDocumentation {
    if (!ComprehensiveQueryDocumentation.instance) {
      ComprehensiveQueryDocumentation.instance = new ComprehensiveQueryDocumentation();
    }
    return ComprehensiveQueryDocumentation.instance;
  }

  /**
   * Generate complete query parameter documentation for API reference
   * @returns Complete documentation object
   */
  public generateCompleteDocumentation(): {
    overview: string;
    pagination: {
      description: string;
      parameters: any[];
      examples: any[];
      bestPractices: string[];
    };
    filtering: {
      description: string;
      operators: any[];
      logicalOperators: any[];
      entityFields: Record<string, any>;
      examples: any[];
      syntax: any;
      bestPractices: any[];
      commonMistakes: any[];
      performanceTips: any[];
    };
    searching: {
      description: string;
      parameters: Record<string, any>;
      examples: any[];
    };
    entitySpecific: {
      description: string;
      parameters: Record<string, any>;
    };
    integration: {
      description: string;
      examples: any[];
    };
  } {
    // Get pagination documentation
    const paginationDocs = queryParameterIntegration.generatePaginationDocumentation();
    
    // Get filtering documentation
    const filteringDocs = queryParameterIntegration.generateFilteringDocumentation();
    const operators = filteringDocumentation.documentFilterOperators();
    const logicalOperators = filteringDocumentation.documentLogicalOperators();
    const advancedSyntax = filteringDocumentation.documentAdvancedFilteringSyntax();
    
    // Get search documentation
    const searchParams = filteringDocumentation.documentSearchParameters();
    
    // Get entity-specific parameters
    const entityParams = queryParameterDocumentation.documentEntitySpecificParameters();

    return {
      overview: `The CRM System API provides comprehensive query parameter support for pagination, 
                 filtering, and searching across all list endpoints. This enables clients to retrieve 
                 exactly the data they need with optimal performance and user experience.`,
      
      pagination: {
        description: paginationDocs.overview,
        parameters: paginationDocs.parameters,
        examples: paginationDocs.examples,
        bestPractices: paginationDocs.bestPractices
      },
      
      filtering: {
        description: filteringDocs.overview,
        operators,
        logicalOperators,
        entityFields: filteringDocs.entityFields,
        examples: filteringDocs.examples,
        syntax: advancedSyntax.syntaxRules,
        bestPractices: advancedSyntax.bestPractices,
        commonMistakes: advancedSyntax.commonMistakes,
        performanceTips: advancedSyntax.performanceTips
      },
      
      searching: {
        description: `Text search capabilities are available on specific entities that support 
                     full-text search across multiple fields. Search parameters provide a 
                     user-friendly way to find records without complex filter syntax.`,
        parameters: searchParams,
        examples: Object.values(searchParams).flat().map(param => param.examples).flat()
      },
      
      entitySpecific: {
        description: `Each entity type supports specific query parameters tailored to its data model. 
                     These parameters provide convenient shortcuts for common filtering scenarios 
                     without requiring complex filter syntax.`,
        parameters: entityParams
      },
      
      integration: {
        description: `Query parameters can be combined for powerful data retrieval. Pagination works 
                     with all filtering and search parameters, allowing for efficient navigation 
                     through filtered result sets.`,
        examples: [
          {
            description: 'Paginated filtered results',
            url: '/api/accounts?filter=status="ACTIVE"&page=1&size=20',
            explanation: 'Get first page of active accounts with 20 items per page'
          },
          {
            description: 'Search with pagination',
            url: '/api/items?search=software&type=Product&page=2&size=10',
            explanation: 'Search for software products, get second page with 10 items'
          },
          {
            description: 'Complex filtering with pagination',
            url: '/api/business?filter=(value>=50000 OR probability>=90) AND stage!="Closed Lost"&page=1&size=25',
            explanation: 'High-value or high-probability open opportunities, 25 per page'
          },
          {
            description: 'Entity-specific parameters with filtering',
            url: '/api/dashboard/revenue-per-period?period=THIS_YEAR',
            explanation: 'Dashboard endpoint with period parameter'
          }
        ]
      }
    };
  }

  /**
   * Generate OpenAPI documentation for all query parameters
   * @returns OpenAPI parameter definitions
   */
  public generateOpenAPIDocumentation(): {
    commonParameters: any[];
    entitySpecificParameters: Record<string, any[]>;
    examples: Record<string, any>;
  } {
    const paginationParams = queryParameterDocumentation.documentPaginationParameters();
    const filteringParams = filteringDocumentation.generateFilteringOpenAPIParameters();
    const entityParams = queryParameterDocumentation.documentEntitySpecificParameters();

    // Generate comprehensive examples for each entity
    const examples: Record<string, any> = {};
    const entityExamples = filteringDocumentation.generateEntityFilteringExamples();
    
    Object.entries(entityExamples).forEach(([entity, exampleList]) => {
      examples[entity] = {
        simple: {
          value: exampleList[0].filter,
          summary: exampleList[0].description,
          description: exampleList[0].explanation
        },
        complex: {
          value: exampleList[exampleList.length - 1].filter,
          summary: exampleList[exampleList.length - 1].description,
          description: exampleList[exampleList.length - 1].explanation
        }
      };
    });

    return {
      commonParameters: [...paginationParams, ...filteringParams],
      entitySpecificParameters: entityParams,
      examples
    };
  }

  /**
   * Generate query parameter validation rules
   * @returns Validation rules for all query parameters
   */
  public generateValidationRules(): {
    pagination: {
      page: { type: string; minimum: number; description: string };
      size: { type: string; minimum: number; maximum: number; description: string };
    };
    filtering: {
      filter: { type: string; pattern?: string; description: string };
    };
    entitySpecific: Record<string, Record<string, any>>;
  } {
    return {
      pagination: {
        page: {
          type: 'integer',
          minimum: 1,
          description: 'Page number must be a positive integer starting from 1'
        },
        size: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          description: 'Page size must be between 1 and 100 items'
        }
      },
      filtering: {
        filter: {
          type: 'string',
          description: 'Filter must be a valid SQL-like expression with proper syntax'
        }
      },
      entitySpecific: {
        items: {
          search: {
            type: 'string',
            description: 'Search term for name or description fields'
          },
          minPrice: {
            type: 'number',
            minimum: 0,
            description: 'Minimum price must be non-negative'
          },
          maxPrice: {
            type: 'number',
            minimum: 0,
            description: 'Maximum price must be non-negative'
          }
        },
        dashboard: {
          period: {
            type: 'string',
            enum: ['THIS_MONTH', 'THIS_YEAR', 'LAST_QUARTER'],
            description: 'Period must be one of the allowed values'
          },
          year: {
            type: 'integer',
            minimum: 2000,
            maximum: 2034,
            description: 'Year must be between 2000 and 2034'
          }
        }
      }
    };
  }

  /**
   * Generate usage statistics for query parameters
   * @returns Usage statistics and recommendations
   */
  public generateUsageStatistics(): {
    totalParameters: number;
    parametersByCategory: Record<string, number>;
    mostUsedParameters: Array<{
      name: string;
      category: string;
      usage: string;
      recommendation: string;
    }>;
    performanceImpact: Array<{
      parameter: string;
      impact: 'low' | 'medium' | 'high';
      description: string;
      optimization: string;
    }>;
  } {
    return {
      totalParameters: 41, // Estimated total across all entities and categories
      parametersByCategory: {
        pagination: 2, // page, size
        filtering: 1, // filter
        searching: 2, // search parameters for items and proposals
        entitySpecific: 38 // Various entity-specific parameters
      },
      mostUsedParameters: [
        {
          name: 'page',
          category: 'pagination',
          usage: 'Used in all list endpoints for pagination',
          recommendation: 'Always use with size parameter for consistent results'
        },
        {
          name: 'size',
          category: 'pagination',
          usage: 'Used in all list endpoints to control page size',
          recommendation: 'Use reasonable values (10-50) for optimal performance'
        },
        {
          name: 'filter',
          category: 'filtering',
          usage: 'Used across all entities for complex filtering',
          recommendation: 'Start simple and add complexity gradually'
        },
        {
          name: 'search',
          category: 'searching',
          usage: 'Used in items and proposals for text search',
          recommendation: 'Combine with type filters for better results'
        },
        {
          name: 'period',
          category: 'dashboard',
          usage: 'Used in dashboard endpoints for time-based analytics',
          recommendation: 'Required parameter for most dashboard endpoints'
        }
      ],
      performanceImpact: [
        {
          parameter: 'page',
          impact: 'low',
          description: 'Pagination has minimal performance impact',
          optimization: 'Use reasonable page sizes to balance performance and usability'
        },
        {
          parameter: 'filter',
          impact: 'medium',
          description: 'Complex filters can impact query performance',
          optimization: 'Use indexed fields and avoid complex LIKE patterns'
        },
        {
          parameter: 'search',
          impact: 'medium',
          description: 'Full-text search requires additional processing',
          optimization: 'Combine with other filters to reduce search scope'
        },
        {
          parameter: 'size',
          impact: 'high',
          description: 'Large page sizes can significantly impact performance',
          optimization: 'Limit to maximum of 100 items per page'
        }
      ]
    };
  }

  /**
   * Export complete documentation as JSON
   * @returns JSON string of complete documentation
   */
  public exportCompleteDocumentationJSON(): string {
    const completeDoc = this.generateCompleteDocumentation();
    const openApiDoc = this.generateOpenAPIDocumentation();
    const validationRules = this.generateValidationRules();
    const usageStats = this.generateUsageStatistics();

    const exportData = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      documentation: completeDoc,
      openApiDefinitions: openApiDoc,
      validationRules,
      usageStatistics: usageStats,
      metadata: {
        totalEndpoints: 42, // Estimated total endpoints
        endpointsWithPagination: 14, // List endpoints
        endpointsWithFiltering: 14, // Same as pagination
        endpointsWithSearch: 2, // Items and proposals
        supportedOperators: 10,
        supportedLogicalOperators: 3
      }
    };

    return JSON.stringify(exportData, null, 2);
  }
}

// Export singleton instance
export const comprehensiveQueryDocumentation = ComprehensiveQueryDocumentation.getInstance();