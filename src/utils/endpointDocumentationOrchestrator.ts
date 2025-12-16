import { entityDocumentation } from './entityDocumentation';
import { specialEndpointsDocumentation } from './specialEndpointsDocumentation';
import { schemaRegistry } from './schemaRegistry';
import { queryParameterIntegration } from './queryParameterIntegration';
import { comprehensiveQueryDocumentation } from './comprehensiveQueryDocumentation';
import { generateOpenAPISpec } from '../config/openapi';

/**
 * Endpoint Documentation Orchestrator
 * Coordinates the documentation of all API endpoints
 * Combines CRUD operations, dashboard endpoints, and special routes
 * Generates complete OpenAPI specification
 */

export interface DocumentationSummary {
  totalEndpoints: number;
  crudEndpoints: number;
  dashboardEndpoints: number;
  specialEndpoints: number;
  entities: Array<{
    name: string;
    tag: string;
    routeCount: number;
  }>;
  dashboardOperations: Array<{
    operationId: string;
    path: string;
    method: string;
  }>;
  specialOperations: Array<{
    operationId: string;
    path: string;
    method: string;
  }>;
}

/**
 * Endpoint Documentation Orchestrator class
 * Provides methods to coordinate all endpoint documentation
 */
export class EndpointDocumentationOrchestrator {
  private static instance: EndpointDocumentationOrchestrator;
  private documentationGenerated = false;

  private constructor() {}

  public static getInstance(): EndpointDocumentationOrchestrator {
    if (!EndpointDocumentationOrchestrator.instance) {
      EndpointDocumentationOrchestrator.instance = new EndpointDocumentationOrchestrator();
    }
    return EndpointDocumentationOrchestrator.instance;
  }

  /**
   * Generate complete endpoint documentation
   * Registers all schemas and endpoints with OpenAPI registry
   */
  public generateCompleteDocumentation(): void {
    if (this.documentationGenerated) {
      return; // Avoid duplicate generation
    }

    console.log('🚀 Starting endpoint documentation generation...');

    // Step 1: Register all entity schemas
    console.log('📋 Registering entity schemas...');
    schemaRegistry.registerEntitySchemas();

    // Step 2: Register all CRUD operations for entities
    console.log('🔧 Documenting CRUD operations...');
    entityDocumentation.registerAllEntityOperations();

    // Step 3: Register dashboard and special endpoints
    console.log('📊 Documenting dashboard and special endpoints...');
    specialEndpointsDocumentation.registerAllSpecialEndpoints();

    // Step 4: Enhance all endpoints with comprehensive query parameter documentation
    console.log('🔍 Enhancing endpoints with query parameter documentation...');
    queryParameterIntegration.registerAllEnhancedRoutes();

    this.documentationGenerated = true;
    console.log('✅ Endpoint documentation generation completed!');
  }

  /**
   * Generate documentation for specific components only
   * @param components - Array of components to generate ('schemas', 'crud', 'dashboard', 'special', 'queryParams')
   */
  public generatePartialDocumentation(components: Array<'schemas' | 'crud' | 'dashboard' | 'special' | 'queryParams'>): void {
    console.log(`🚀 Starting partial documentation generation for: ${components.join(', ')}`);

    if (components.includes('schemas')) {
      console.log('📋 Registering entity schemas...');
      schemaRegistry.registerEntitySchemas();
    }

    if (components.includes('crud')) {
      console.log('🔧 Documenting CRUD operations...');
      entityDocumentation.registerAllEntityOperations();
    }

    if (components.includes('dashboard')) {
      console.log('📊 Documenting dashboard endpoints...');
      specialEndpointsDocumentation.registerDashboardEndpoints();
    }

    if (components.includes('special')) {
      console.log('🔗 Documenting special endpoints...');
      specialEndpointsDocumentation.registerSpecialEndpoints();
    }

    if (components.includes('queryParams')) {
      console.log('🔍 Enhancing endpoints with query parameter documentation...');
      queryParameterIntegration.registerAllEnhancedRoutes();
    }

    console.log('✅ Partial documentation generation completed!');
  }

  /**
   * Get comprehensive documentation summary
   * @returns Summary of all documented endpoints
   */
  public getDocumentationSummary(): DocumentationSummary {
    const crudSummary = entityDocumentation.getDocumentationSummary();
    const specialSummary = specialEndpointsDocumentation.getSpecialEndpointsSummary();

    return {
      totalEndpoints: crudSummary.totalRoutes + specialSummary.totalEndpoints,
      crudEndpoints: crudSummary.totalRoutes,
      dashboardEndpoints: specialSummary.dashboardEndpoints,
      specialEndpoints: specialSummary.specialEndpoints,
      entities: crudSummary.entities.map(entity => ({
        name: entity.name,
        tag: entity.tag,
        routeCount: entity.routeCount
      })),
      dashboardOperations: specialSummary.endpoints
        .filter(e => e.category === 'dashboard')
        .map(e => ({
          operationId: e.operationId,
          path: e.path,
          method: e.method
        })),
      specialOperations: specialSummary.endpoints
        .filter(e => e.category === 'special')
        .map(e => ({
          operationId: e.operationId,
          path: e.path,
          method: e.method
        }))
    };
  }

  /**
   * Get enhanced documentation summary including query parameter information
   * @returns Enhanced summary with query parameter details
   */
  public getEnhancedDocumentationSummary(): DocumentationSummary & {
    queryParameters: {
      totalParameters: number;
      paginationParameters: number;
      filteringParameters: number;
      entitySpecificParameters: number;
      endpointsWithPagination: number;
      endpointsWithFiltering: number;
    };
  } {
    const baseSummary = this.getDocumentationSummary();
    const queryParamSummary = queryParameterIntegration.getEnhancedEndpointsSummary();

    return {
      ...baseSummary,
      queryParameters: {
        totalParameters: queryParamSummary.parameterCounts.total,
        paginationParameters: queryParamSummary.parameterCounts.pagination,
        filteringParameters: queryParamSummary.parameterCounts.filtering,
        entitySpecificParameters: queryParamSummary.parameterCounts.entitySpecific,
        endpointsWithPagination: queryParamSummary.endpointsWithPagination,
        endpointsWithFiltering: queryParamSummary.endpointsWithFiltering
      }
    };
  }

  /**
   * Generate and return the complete OpenAPI specification
   * @returns Complete OpenAPI specification object
   */
  public generateOpenAPISpecification(): any {
    // Ensure all documentation is generated
    this.generateCompleteDocumentation();

    // Generate the OpenAPI specification
    const spec = generateOpenAPISpec();

    console.log('📄 OpenAPI specification generated successfully!');
    return spec;
  }

  /**
   * Validate the generated documentation
   * @returns Validation results
   */
  public validateDocumentation(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    summary: DocumentationSummary;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check if schemas are registered
      if (!schemaRegistry.areSchemasRegistered()) {
        errors.push('Entity schemas are not registered');
      }

      // Generate summary to validate structure
      const summary = this.getDocumentationSummary();

      // Validate minimum expected endpoints
      if (summary.crudEndpoints < 35) { // 7 entities × 5 operations each
        warnings.push(`Expected at least 35 CRUD endpoints, found ${summary.crudEndpoints}`);
      }

      if (summary.dashboardEndpoints < 6) { // 6 dashboard endpoints
        warnings.push(`Expected at least 6 dashboard endpoints, found ${summary.dashboardEndpoints}`);
      }

      // Validate entity coverage
      const expectedEntities = ['User', 'Account', 'Business', 'Item', 'AccountTimeline', 'BusinessProposal', 'BusinessProposalItem'];
      const documentedEntities = summary.entities.map(e => e.name);
      const missingEntities = expectedEntities.filter(e => !documentedEntities.includes(e));

      if (missingEntities.length > 0) {
        errors.push(`Missing documentation for entities: ${missingEntities.join(', ')}`);
      }

      // Try to generate OpenAPI spec to validate structure
      try {
        const spec = this.generateOpenAPISpecification();
        if (!spec.paths || Object.keys(spec.paths).length === 0) {
          errors.push('Generated OpenAPI specification has no paths');
        }
        if (!spec.components || !spec.components.schemas || Object.keys(spec.components.schemas).length === 0) {
          errors.push('Generated OpenAPI specification has no schemas');
        }
      } catch (specError) {
        errors.push(`Failed to generate OpenAPI specification: ${specError}`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        summary
      };

    } catch (error) {
      errors.push(`Validation failed: ${error}`);
      return {
        isValid: false,
        errors,
        warnings,
        summary: {
          totalEndpoints: 0,
          crudEndpoints: 0,
          dashboardEndpoints: 0,
          specialEndpoints: 0,
          entities: [],
          dashboardOperations: [],
          specialOperations: []
        }
      };
    }
  }

  /**
   * Reset documentation state (useful for testing)
   */
  public resetDocumentation(): void {
    this.documentationGenerated = false;
    schemaRegistry.resetRegistration();
    console.log('🔄 Documentation state reset');
  }

  /**
   * Get detailed documentation statistics
   * @returns Detailed statistics about the documentation
   */
  public getDetailedStatistics(): {
    schemas: {
      total: number;
      entities: number;
      enums: number;
      requests: number;
      responses: number;
    };
    endpoints: {
      total: number;
      byMethod: Record<string, number>;
      byTag: Record<string, number>;
      withAuth: number;
      withPagination: number;
    };
    parameters: {
      total: number;
      path: number;
      query: number;
      common: number;
      entitySpecific: number;
    };
  } {
    const summary = this.getDocumentationSummary();
    const crudSummary = entityDocumentation.getDocumentationSummary();

    // Calculate method distribution (5 methods per entity: POST, GET, GET/:id, PUT/:id, DELETE/:id)
    // Plus dashboard endpoints (all GET) and special endpoints
    const methodCounts = {
      GET: (crudSummary.totalEntities * 2) + summary.dashboardEndpoints + summary.specialEndpoints, // List + Get by ID + Dashboard + Special
      POST: crudSummary.totalEntities, // Create operations
      PUT: crudSummary.totalEntities,  // Update operations
      DELETE: crudSummary.totalEntities // Delete operations
    };

    // Calculate tag distribution
    const tagCounts: Record<string, number> = {};
    crudSummary.entities.forEach(entity => {
      tagCounts[entity.tag] = entity.routeCount;
    });
    tagCounts['Dashboard'] = summary.dashboardEndpoints;

    return {
      schemas: {
        total: 50, // Estimated based on entities, requests, responses, enums
        entities: 7,
        enums: 9,
        requests: 14, // Create + Update schemas for 7 entities
        responses: 20 // Entity + Paginated responses + Dashboard responses
      },
      endpoints: {
        total: summary.totalEndpoints,
        byMethod: methodCounts,
        byTag: tagCounts,
        withAuth: summary.totalEndpoints, // All endpoints require authentication
        withPagination: crudSummary.totalEntities + 1 // All list endpoints + account timeline nested
      },
      parameters: {
        total: 50, // Estimated total parameters across all endpoints
        path: 10, // ID parameters for CRUD operations + year parameter
        query: 40, // Pagination, filtering, and entity-specific parameters
        common: 3, // page, size, filter
        entitySpecific: 37 // Various entity-specific query parameters
      }
    };
  }

  /**
   * Export documentation summary to JSON
   * @returns JSON string of documentation summary
   */
  public exportSummaryToJSON(): string {
    const summary = this.getDocumentationSummary();
    const statistics = this.getDetailedStatistics();
    const validation = this.validateDocumentation();

    const exportData = {
      timestamp: new Date().toISOString(),
      summary,
      statistics,
      validation: {
        isValid: validation.isValid,
        errorCount: validation.errors.length,
        warningCount: validation.warnings.length
      }
    };

    return JSON.stringify(exportData, null, 2);
  }
}

// Export singleton instance
export const endpointDocumentationOrchestrator = EndpointDocumentationOrchestrator.getInstance();