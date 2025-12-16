import { routeDocumentationExtractor, RouteInfo } from './routeDocumentationExtractor';

/**
 * Entity Documentation Generator
 * Generates documentation for User, Account, Business, Item, AccountTimeline, 
 * BusinessProposal, BusinessProposalItem endpoints
 * Includes request/response schemas, parameters, and operation summaries
 * Groups endpoints by entity tags for better organization
 */

export interface EntityConfig {
  name: string;
  basePath: string;
  tag: string;
  description: string;
}

/**
 * Entity Documentation class
 * Provides methods to document CRUD operations for all entities
 */
export class EntityDocumentation {
  private static instance: EntityDocumentation;

  private constructor() {}

  public static getInstance(): EntityDocumentation {
    if (!EntityDocumentation.instance) {
      EntityDocumentation.instance = new EntityDocumentation();
    }
    return EntityDocumentation.instance;
  }

  /**
   * Get configuration for all entities in the system
   * @returns Array of entity configurations
   */
  public getEntityConfigurations(): EntityConfig[] {
    return [
      {
        name: 'User',
        basePath: '/api/users',
        tag: 'Users',
        description: 'User management operations'
      },
      {
        name: 'Account',
        basePath: '/api/accounts',
        tag: 'Accounts',
        description: 'Account management operations'
      },
      {
        name: 'Business',
        basePath: '/api/business',
        tag: 'Business',
        description: 'Business opportunity management operations'
      },
      {
        name: 'Item',
        basePath: '/api/items',
        tag: 'Items',
        description: 'Item catalog management operations'
      },
      {
        name: 'AccountTimeline',
        basePath: '/api/account-timeline',
        tag: 'Account Timeline',
        description: 'Account timeline and interaction history operations'
      },
      {
        name: 'BusinessProposal',
        basePath: '/api/business-proposals',
        tag: 'Business Proposals',
        description: 'Business proposal management operations'
      },
      {
        name: 'BusinessProposalItem',
        basePath: '/api/business-proposal-items',
        tag: 'Business Proposal Items',
        description: 'Business proposal item management operations'
      }
    ];
  }

  /**
   * Document all CRUD operations for all entities
   * @returns Array of all route information objects
   */
  public documentAllCRUDOperations(): RouteInfo[] {
    const allRoutes: RouteInfo[] = [];
    const entityConfigs = this.getEntityConfigurations();

    entityConfigs.forEach(config => {
      const entityRoutes = this.documentEntityCRUDOperations(config);
      allRoutes.push(...entityRoutes);
    });

    return allRoutes;
  }

  /**
   * Document CRUD operations for a specific entity
   * @param config - Entity configuration
   * @returns Array of route information objects for the entity
   */
  public documentEntityCRUDOperations(config: EntityConfig): RouteInfo[] {
    return routeDocumentationExtractor.extractCRUDRoutes(
      config.basePath,
      config.name,
      config.tag
    );
  }

  /**
   * Document User entity CRUD operations
   * @returns Array of User route information objects
   */
  public documentUserOperations(): RouteInfo[] {
    const config = this.getEntityConfigurations().find(c => c.name === 'User')!;
    const routes = this.documentEntityCRUDOperations(config);

    // Customize User-specific routes if needed
    routes.forEach(route => {
      if (route.operationId === 'getUsers') {
        // Add User-specific query parameters
        route.parameters.push({
          name: 'role',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['ADMIN', 'MANAGER', 'SALES_REP']
          },
          description: 'Filter users by role',
          example: 'SALES_REP'
        });
      }
    });

    return routes;
  }

  /**
   * Document Account entity CRUD operations
   * @returns Array of Account route information objects
   */
  public documentAccountOperations(): RouteInfo[] {
    const config = this.getEntityConfigurations().find(c => c.name === 'Account')!;
    const routes = this.documentEntityCRUDOperations(config);

    // Customize Account-specific routes if needed
    routes.forEach(route => {
      if (route.operationId === 'getAccounts') {
        // Add Account-specific query parameters
        route.parameters.push(
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE', 'PROSPECT']
            },
            description: 'Filter accounts by status',
            example: 'ACTIVE'
          },
          {
            name: 'type',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['Client', 'Prospect', 'Partner', 'Competitor']
            },
            description: 'Filter accounts by type',
            example: 'Client'
          },
          {
            name: 'segment',
            in: 'query',
            required: false,
            schema: {
              type: 'string'
            },
            description: 'Filter accounts by segment',
            example: 'Technology'
          }
        );
      }
    });

    return routes;
  }

  /**
   * Document Business entity CRUD operations
   * @returns Array of Business route information objects
   */
  public documentBusinessOperations(): RouteInfo[] {
    const config = this.getEntityConfigurations().find(c => c.name === 'Business')!;
    const routes = this.documentEntityCRUDOperations(config);

    // Customize Business-specific routes if needed
    routes.forEach(route => {
      if (route.operationId === 'getBusiness') {
        // Add Business-specific query parameters
        route.parameters.push(
          {
            name: 'stage',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']
            },
            description: 'Filter business opportunities by stage',
            example: 'Proposal'
          },
          {
            name: 'minValue',
            in: 'query',
            required: false,
            schema: {
              type: 'number',
              minimum: 0
            },
            description: 'Filter business opportunities with value greater than or equal to this amount',
            example: 10000
          },
          {
            name: 'maxValue',
            in: 'query',
            required: false,
            schema: {
              type: 'number',
              minimum: 0
            },
            description: 'Filter business opportunities with value less than or equal to this amount',
            example: 100000
          },
          {
            name: 'currency',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['BRL', 'USD', 'EUR']
            },
            description: 'Filter business opportunities by currency',
            example: 'BRL'
          }
        );
      }
    });

    return routes;
  }

  /**
   * Document Item entity CRUD operations
   * @returns Array of Item route information objects
   */
  public documentItemOperations(): RouteInfo[] {
    const config = this.getEntityConfigurations().find(c => c.name === 'Item')!;
    const routes = this.documentEntityCRUDOperations(config);

    // Customize Item-specific routes if needed
    routes.forEach(route => {
      if (route.operationId === 'getItems') {
        // Add Item-specific query parameters
        route.parameters.push(
          {
            name: 'search',
            in: 'query',
            required: false,
            schema: {
              type: 'string'
            },
            description: 'Search items by name or description',
            example: 'software'
          },
          {
            name: 'type',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['PRODUCT', 'SERVICE']
            },
            description: 'Filter items by type',
            example: 'PRODUCT'
          },
          {
            name: 'minPrice',
            in: 'query',
            required: false,
            schema: {
              type: 'number',
              minimum: 0
            },
            description: 'Filter items with price greater than or equal to this amount',
            example: 100
          },
          {
            name: 'maxPrice',
            in: 'query',
            required: false,
            schema: {
              type: 'number',
              minimum: 0
            },
            description: 'Filter items with price less than or equal to this amount',
            example: 500
          }
        );
      }
    });

    return routes;
  }

  /**
   * Document AccountTimeline entity CRUD operations
   * @returns Array of AccountTimeline route information objects
   */
  public documentAccountTimelineOperations(): RouteInfo[] {
    const config = this.getEntityConfigurations().find(c => c.name === 'AccountTimeline')!;
    const routes = this.documentEntityCRUDOperations(config);

    // Customize AccountTimeline-specific routes if needed
    routes.forEach(route => {
      if (route.operationId === 'getAccountTimelines') {
        // Add AccountTimeline-specific query parameters
        route.parameters.push(
          {
            name: 'accountId',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              format: 'uuid'
            },
            description: 'Filter timeline entries by account ID',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          {
            name: 'type',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK']
            },
            description: 'Filter timeline entries by type',
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
        );
      }
    });

    return routes;
  }

  /**
   * Document BusinessProposal entity CRUD operations
   * @returns Array of BusinessProposal route information objects
   */
  public documentBusinessProposalOperations(): RouteInfo[] {
    const config = this.getEntityConfigurations().find(c => c.name === 'BusinessProposal')!;
    const routes = this.documentEntityCRUDOperations(config);

    // Customize BusinessProposal-specific routes if needed
    routes.forEach(route => {
      if (route.operationId === 'getBusinessProposals') {
        // Add BusinessProposal-specific query parameters
        route.parameters.push(
          {
            name: 'search',
            in: 'query',
            required: false,
            schema: {
              type: 'string'
            },
            description: 'Search proposals by title or content',
            example: 'software'
          },
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['Rascunho', 'Em Revisão', 'Enviado', 'Aceito', 'Rejeitado']
            },
            description: 'Filter proposals by status',
            example: 'Enviado'
          },
          {
            name: 'businessId',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              format: 'uuid'
            },
            description: 'Filter proposals by business opportunity ID',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          {
            name: 'dateFrom',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              format: 'date'
            },
            description: 'Filter proposals from this date',
            example: '2024-01-01'
          },
          {
            name: 'dateTo',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              format: 'date'
            },
            description: 'Filter proposals until this date',
            example: '2024-01-31'
          },
          {
            name: 'minValue',
            in: 'query',
            required: false,
            schema: {
              type: 'number',
              minimum: 0
            },
            description: 'Filter proposals with value greater than or equal to this amount',
            example: 10000
          },
          {
            name: 'maxValue',
            in: 'query',
            required: false,
            schema: {
              type: 'number',
              minimum: 0
            },
            description: 'Filter proposals with value less than or equal to this amount',
            example: 100000
          }
        );
      }
    });

    return routes;
  }

  /**
   * Document BusinessProposalItem entity CRUD operations
   * @returns Array of BusinessProposalItem route information objects
   */
  public documentBusinessProposalItemOperations(): RouteInfo[] {
    const config = this.getEntityConfigurations().find(c => c.name === 'BusinessProposalItem')!;
    const routes = this.documentEntityCRUDOperations(config);

    // Customize BusinessProposalItem-specific routes if needed
    routes.forEach(route => {
      if (route.operationId === 'getBusinessProposalItems') {
        // Add BusinessProposalItem-specific query parameters
        route.parameters.push(
          {
            name: 'proposalId',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              format: 'uuid'
            },
            description: 'Filter items by proposal ID',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          {
            name: 'search',
            in: 'query',
            required: false,
            schema: {
              type: 'string'
            },
            description: 'Search items by name',
            example: 'license'
          },
          {
            name: 'minQuantity',
            in: 'query',
            required: false,
            schema: {
              type: 'number',
              minimum: 1
            },
            description: 'Filter items with quantity greater than or equal to this amount',
            example: 1
          },
          {
            name: 'maxQuantity',
            in: 'query',
            required: false,
            schema: {
              type: 'number',
              minimum: 1
            },
            description: 'Filter items with quantity less than or equal to this amount',
            example: 100
          }
        );
      }
    });

    return routes;
  }

  /**
   * Register all entity CRUD operations with the OpenAPI registry
   */
  public registerAllEntityOperations(): void {
    const allRoutes = this.documentAllCRUDOperations();
    routeDocumentationExtractor.registerRoutes(allRoutes);
  }

  /**
   * Register specific entity operations with the OpenAPI registry
   * @param entityName - Name of the entity to register
   */
  public registerEntityOperations(entityName: string): void {
    let routes: RouteInfo[] = [];

    switch (entityName) {
      case 'User':
        routes = this.documentUserOperations();
        break;
      case 'Account':
        routes = this.documentAccountOperations();
        break;
      case 'Business':
        routes = this.documentBusinessOperations();
        break;
      case 'Item':
        routes = this.documentItemOperations();
        break;
      case 'AccountTimeline':
        routes = this.documentAccountTimelineOperations();
        break;
      case 'BusinessProposal':
        routes = this.documentBusinessProposalOperations();
        break;
      case 'BusinessProposalItem':
        routes = this.documentBusinessProposalItemOperations();
        break;
      default:
        throw new Error(`Unknown entity: ${entityName}`);
    }

    routeDocumentationExtractor.registerRoutes(routes);
  }

  /**
   * Get summary of all documented entities
   * @returns Summary information about documented entities
   */
  public getDocumentationSummary(): {
    totalEntities: number;
    totalRoutes: number;
    entities: Array<{
      name: string;
      tag: string;
      routeCount: number;
      operations: string[];
    }>;
  } {
    const entityConfigs = this.getEntityConfigurations();
    const entities = entityConfigs.map(config => {
      const routes = this.documentEntityCRUDOperations(config);
      return {
        name: config.name,
        tag: config.tag,
        routeCount: routes.length,
        operations: routes.map(r => `${r.method.toUpperCase()} ${r.path}`)
      };
    });

    return {
      totalEntities: entityConfigs.length,
      totalRoutes: entities.reduce((sum, entity) => sum + entity.routeCount, 0),
      entities
    };
  }
}

// Export singleton instance
export const entityDocumentation = EntityDocumentation.getInstance();