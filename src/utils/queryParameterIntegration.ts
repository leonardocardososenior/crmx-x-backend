/**
 * Query Parameter Integration
 * Integrates query parameter documentation with existing endpoint documentation
 * Updates route documentation with comprehensive parameter information
 */

import { queryParameterDocumentation, OpenAPIParameter } from './queryParameterDocumentation';
import { filteringDocumentation } from './filteringDocumentation';
import { routeDocumentationExtractor, RouteInfo } from './routeDocumentationExtractor';
import { specialEndpointsDocumentation } from './specialEndpointsDocumentation';

/**
 * Query Parameter Integration class
 * Enhances existing route documentation with comprehensive query parameter information
 */
export class QueryParameterIntegration {
  private static instance: QueryParameterIntegration;

  private constructor() {}

  public static getInstance(): QueryParameterIntegration {
    if (!QueryParameterIntegration.instance) {
      QueryParameterIntegration.instance = new QueryParameterIntegration();
    }
    return QueryParameterIntegration.instance;
  }

  /**
   * Enhance all CRUD routes with comprehensive query parameter documentation
   * @returns Array of enhanced route information objects
   */
  public enhanceAllCRUDRoutes(): RouteInfo[] {
    // Get base CRUD routes from existing documentation using the available method
    const baseRoutes = [
      ...routeDocumentationExtractor.extractCRUDRoutes('/api/users', 'User', 'Users'),
      ...routeDocumentationExtractor.extractCRUDRoutes('/api/accounts', 'Account', 'Accounts'),
      ...routeDocumentationExtractor.extractCRUDRoutes('/api/business', 'Business', 'Business'),
      ...routeDocumentationExtractor.extractCRUDRoutes('/api/items', 'Item', 'Items'),
      ...routeDocumentationExtractor.extractCRUDRoutes('/api/account-timeline', 'AccountTimeline', 'Account Timeline'),
      ...routeDocumentationExtractor.extractCRUDRoutes('/api/business-proposals', 'BusinessProposal', 'Business Proposals'),
      ...routeDocumentationExtractor.extractCRUDRoutes('/api/business-proposal-items', 'BusinessProposalItem', 'Business Proposal Items')
    ];

    // Enhance each route with appropriate query parameters
    return baseRoutes.map(route => this.enhanceRouteWithQueryParameters(route));
  }

  /**
   * Enhance dashboard routes with comprehensive query parameter documentation
   * @returns Array of enhanced dashboard route information objects
   */
  public enhanceDashboardRoutes(): RouteInfo[] {
    // Get base dashboard routes
    const baseRoutes = specialEndpointsDocumentation.documentDashboardEndpoints();

    // Enhance each dashboard route with appropriate query parameters
    return baseRoutes.map(route => this.enhanceDashboardRouteWithQueryParameters(route));
  }

  /**
   * Enhance a single route with appropriate query parameters
   * @param route - The base route information
   * @returns Enhanced route with query parameters
   */
  private enhanceRouteWithQueryParameters(route: RouteInfo): RouteInfo {
    const enhancedRoute = { ...route };

    // Only enhance GET routes (list endpoints) with query parameters
    if (route.method.toLowerCase() !== 'get' || route.path.includes('/:id')) {
      return enhancedRoute;
    }

    // Get comprehensive parameter documentation for this endpoint
    const paramDocs = queryParameterDocumentation.getEndpointParameterDocumentation(route.path);

    // For CRUD endpoints, only use filter, page, size parameters
    enhancedRoute.parameters = [
      ...this.convertToRouteParameters(paramDocs.filtering),
      ...this.convertToRouteParameters(paramDocs.pagination)
    ];

    // Add example URLs to the route description
    const exampleUrls = paramDocs.examples
      .map(ex => `- **${ex.description}**: \`${ex.url}\` - ${ex.explanation}`)
      .join('\n');

    if (exampleUrls) {
      enhancedRoute.description = `${enhancedRoute.description}\n\n**Example URLs:**\n${exampleUrls}`;
    }

    return enhancedRoute;
  }

  /**
   * Enhance a dashboard route with appropriate query parameters
   * @param route - The base dashboard route information
   * @returns Enhanced dashboard route with query parameters (dashboard routes should only have their original parameters)
   */
  private enhanceDashboardRouteWithQueryParameters(route: RouteInfo): RouteInfo {
    const enhancedRoute = { ...route };

    // Dashboard routes should only have their original parameters (period for most, none for active-accounts)
    // Do not add pagination or filtering parameters to dashboard endpoints
    
    return enhancedRoute;
  }

  /**
   * Convert OpenAPI parameters to route parameters format
   * @param parameters - Array of OpenAPI parameters
   * @returns Array of route parameters
   */
  private convertToRouteParameters(parameters: OpenAPIParameter[]): any[] {
    return parameters.map(param => ({
      name: param.name,
      in: param.in,
      description: param.description,
      required: param.required,
      schema: param.schema,
      example: param.example,
      examples: param.examples
    }));
  }

  /**
   * Generate comprehensive pagination documentation
   * @returns Pagination documentation object
   */
  public generatePaginationDocumentation(): {
    overview: string;
    parameters: OpenAPIParameter[];
    responseStructure: {
      description: string;
      properties: Array<{
        name: string;
        type: string;
        description: string;
        example: any;
      }>;
    };
    examples: Array<{
      description: string;
      url: string;
      explanation: string;
      expectedResponse: any;
    }>;
    bestPractices: string[];
  } {
    const paginationParams = queryParameterDocumentation.documentPaginationParameters();
    const exampleUrls = queryParameterDocumentation.generatePaginationExampleUrls();

    return {
      overview: `All list endpoints in the CRM System API support pagination using page-based navigation. 
                 This allows clients to retrieve large datasets in manageable chunks, improving performance 
                 and user experience. The pagination system uses zero-based page numbering starting from 1.`,
      
      parameters: paginationParams,
      
      responseStructure: {
        description: 'All paginated responses follow a consistent structure with metadata about the pagination state',
        properties: [
          {
            name: 'contents',
            type: 'array',
            description: 'Array of items for the current page',
            example: ['... array of items ...']
          },
          {
            name: 'totalElements',
            type: 'integer',
            description: 'Total number of items across all pages',
            example: 156
          },
          {
            name: 'totalPages',
            type: 'integer',
            description: 'Total number of pages based on current page size',
            example: 8
          }
        ]
      },
      
      examples: exampleUrls,
      
      bestPractices: [
        'Use reasonable page sizes (10-50 items) for optimal performance',
        'Always check totalPages to avoid requesting pages beyond the available data',
        'Consider using larger page sizes (up to 100) for bulk data operations',
        'Combine pagination with filtering to reduce the total dataset size',
        'Cache pagination results when possible to improve user experience',
        'Handle edge cases like empty result sets (totalElements = 0)',
        'Use consistent page sizes throughout your application for predictable behavior'
      ]
    };
  }

  /**
   * Generate comprehensive filtering documentation
   * @returns Filtering documentation object
   */
  public generateFilteringDocumentation(): {
    overview: string;
    syntax: {
      description: string;
      operators: Array<{
        operator: string;
        description: string;
        example: string;
      }>;
      logicalOperators: Array<{
        operator: string;
        description: string;
        example: string;
      }>;
    };
    examples: Array<{
      category: string;
      filters: Array<{
        description: string;
        filter: string;
        explanation: string;
      }>;
    }>;
    bestPractices: string[];
    entityFields: Record<string, any>;
    searchParameters: Record<string, any>;
    advancedSyntax: any;
  } {
    const advancedSyntax = filteringDocumentation.documentAdvancedFilteringSyntax();
    const entityFields = filteringDocumentation.documentEntityFilterableFields();
    const searchParameters = filteringDocumentation.documentSearchParameters();
    const entityExamples = filteringDocumentation.generateEntityFilteringExamples();
    
    // Convert entity examples to the expected format
    const examples = Object.entries(entityExamples).map(([entity, examples]) => ({
      category: `${entity.charAt(0).toUpperCase() + entity.slice(1)} Filtering`,
      filters: examples.map(ex => ({
        description: ex.description,
        filter: ex.filter,
        explanation: ex.explanation
      }))
    }));

    return {
      overview: advancedSyntax.overview,
      syntax: {
        description: 'Filter expressions use SQL-like syntax with support for various operators and logical combinations',
        operators: advancedSyntax.syntaxRules.map(rule => ({
          operator: rule.rule,
          description: rule.description,
          example: rule.examples[0]
        })),
        logicalOperators: [
          {
            operator: 'AND',
            description: 'Logical AND - both conditions must be true',
            example: 'status = "ACTIVE" AND type = "Client"'
          },
          {
            operator: 'OR',
            description: 'Logical OR - either condition can be true',
            example: 'stage = "Proposal" OR stage = "Negotiation"'
          },
          {
            operator: '()',
            description: 'Parentheses for grouping conditions',
            example: '(status = "ACTIVE" OR status = "PENDING") AND value > 5000'
          }
        ]
      },
      examples,
      bestPractices: advancedSyntax.bestPractices.map(bp => bp.description),
      entityFields,
      searchParameters,
      advancedSyntax
    };
  }

  /**
   * Register all enhanced routes with comprehensive query parameter documentation
   */
  public registerAllEnhancedRoutes(): void {
    // Register enhanced CRUD routes
    const crudRoutes = this.enhanceAllCRUDRoutes();
    routeDocumentationExtractor.registerRoutes(crudRoutes);

    // Register enhanced dashboard routes
    const dashboardRoutes = this.enhanceDashboardRoutes();
    routeDocumentationExtractor.registerRoutes(dashboardRoutes);

    // Register query parameter schemas
    queryParameterDocumentation.registerQueryParameterSchemas();
  }

  /**
   * Get summary of all enhanced endpoints with query parameter counts
   * @returns Summary of enhanced endpoints
   */
  public getEnhancedEndpointsSummary(): {
    totalEndpoints: number;
    endpointsWithPagination: number;
    endpointsWithFiltering: number;
    endpointsWithEntitySpecificParams: number;
    parameterCounts: {
      pagination: number;
      filtering: number;
      entitySpecific: number;
      total: number;
    };
    endpoints: Array<{
      path: string;
      method: string;
      parameterCount: number;
      hasExamples: boolean;
    }>;
  } {
    const crudRoutes = this.enhanceAllCRUDRoutes();
    const dashboardRoutes = this.enhanceDashboardRoutes();
    const allRoutes = [...crudRoutes, ...dashboardRoutes];

    const paginationParams = queryParameterDocumentation.documentPaginationParameters();
    const filteringParams = queryParameterDocumentation.documentCommonFilterParameters();
    const entityParams = queryParameterDocumentation.documentEntitySpecificParameters();
    const entitySpecificCount = Object.values(entityParams).reduce((sum, params) => sum + params.length, 0);

    const endpointsWithPagination = allRoutes.filter(route => 
      route.method.toLowerCase() === 'get' && !route.path.includes('/:id')
    ).length;

    const endpointsWithFiltering = endpointsWithPagination; // Same as pagination

    const endpointsWithEntitySpecific = allRoutes.filter(route => {
      const entityType = this.getEntityTypeFromPath(route.path);
      return entityParams[entityType] && entityParams[entityType].length > 0;
    }).length;

    const endpoints = allRoutes.map(route => ({
      path: route.path,
      method: route.method.toUpperCase(),
      parameterCount: route.parameters.length,
      hasExamples: route.description.includes('Example URLs:')
    }));

    return {
      totalEndpoints: allRoutes.length,
      endpointsWithPagination,
      endpointsWithFiltering,
      endpointsWithEntitySpecificParams: endpointsWithEntitySpecific,
      parameterCounts: {
        pagination: paginationParams.length,
        filtering: filteringParams.length,
        entitySpecific: entitySpecificCount,
        total: paginationParams.length + filteringParams.length + entitySpecificCount
      },
      endpoints
    };
  }

  /**
   * Get entity type from endpoint path
   * @param path - The endpoint path
   * @returns Entity type string
   */
  private getEntityTypeFromPath(path: string): string {
    if (path.includes('/accounts')) return 'accounts';
    if (path.includes('/business')) return 'business';
    if (path.includes('/items')) return 'items';
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/account-timeline')) return 'accountTimeline';
    if (path.includes('/business-proposals')) return 'businessProposals';
    return '';
  }
}

// Export singleton instance
export const queryParameterIntegration = QueryParameterIntegration.getInstance();