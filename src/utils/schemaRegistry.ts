import { z } from './zodExtensions';
import { registry } from '../config/openapi';
import { convertZodToOpenAPI, createPaginatedResponseSchema, createErrorResponseSchema, createValidationErrorResponseSchema } from './zodToOpenAPI';

// Import all existing Zod schemas
import {
  CreateAccountSchema,
  UpdateAccountSchema,
  QueryParamsSchema,
  AccountIdParamSchema,
  CreateUserSchema,
  UpdateUserSchema,
  UserIdParamSchema,
  UserQueryParamsSchema,
  CreateBusinessSchema,
  UpdateBusinessSchema,
  BusinessIdParamSchema,
  BusinessQueryParamsSchema,
  AccountStatusSchema,
  AccountTypeSchema,
  UserRoleSchema,
  BusinessStageSchema,
  CurrencySchema
} from '../schemas/accountSchemas';

import {
  CreateBusinessProposalSchema,
  UpdateBusinessProposalSchema,
  CreateBusinessProposalItemSchema,
  UpdateBusinessProposalItemSchema,
  BusinessProposalQueryParamsSchema,
  BusinessProposalItemQueryParamsSchema,
  BusinessProposalIdParamSchema,
  BusinessProposalItemIdParamSchema,
  ProposalIdParamSchema,
  BusinessProposalStatusSchema
} from '../schemas/businessProposalSchemas';

import {
  CreateItemSchema,
  UpdateItemSchema,
  ItemQueryParamsSchema,
  ItemIdParamSchema,
  ItemTypeSchema
} from '../schemas/itemSchemas';

import {
  DashboardQueryParamsSchema,
  RevenuePerPeriodQueryParamsSchema,
  MonthlyRevenueResponseSchema,
  MoreSalesByResponsibleResponseSchema,
  SalesFunnelResponseSchema,
  TotalRevenueResponseSchema,
  ActiveAccountsResponseSchema,
  NewBusinessResponseSchema,
  SupportedLocaleSchema
} from '../schemas/dashboardSchemas';

import {
  CreateAccountTimelineSchema,
  UpdateAccountTimelineSchema,
  AccountTimelineQueryParamsSchema,
  AccountTimelineIdParamSchema,
  TimelineTypeSchema
} from '../schemas/accountTimelineSchemas';

/**
 * Schema Registry for all entities
 * Registers all existing Zod schemas and creates mapping between entity names and their schemas
 * Generates OpenAPI component schemas for all entities
 */
export class SchemaRegistry {
  private static instance: SchemaRegistry;
  private schemasRegistered = false;

  private constructor() {}

  public static getInstance(): SchemaRegistry {
    if (!SchemaRegistry.instance) {
      SchemaRegistry.instance = new SchemaRegistry();
    }
    return SchemaRegistry.instance;
  }

  /**
   * Register all entity schemas with the OpenAPI registry
   * This method should be called once during application startup
   */
  public registerEntitySchemas(): void {
    if (this.schemasRegistered) {
      return; // Avoid duplicate registration
    }

    // Register enum schemas first (they are referenced by other schemas)
    this.registerEnumSchemas();

    // Register entity schemas
    this.registerUserSchemas();
    this.registerAccountSchemas();
    this.registerBusinessSchemas();
    this.registerItemSchemas();
    this.registerAccountTimelineSchemas();
    this.registerBusinessProposalSchemas();
    this.registerDashboardSchemas();

    // Register common response schemas
    this.registerCommonResponseSchemas();

    this.schemasRegistered = true;
  }

  /**
   * Register enum schemas
   */
  private registerEnumSchemas(): void {
    convertZodToOpenAPI(AccountStatusSchema, 'AccountStatus', {
      description: 'Account status values'
    });

    convertZodToOpenAPI(AccountTypeSchema, 'AccountType', {
      description: 'Account type values'
    });

    convertZodToOpenAPI(UserRoleSchema, 'UserRole', {
      description: 'User role values'
    });

    convertZodToOpenAPI(BusinessStageSchema, 'BusinessStage', {
      description: 'Business stage values'
    });

    convertZodToOpenAPI(CurrencySchema, 'Currency', {
      description: 'Currency values'
    });

    convertZodToOpenAPI(ItemTypeSchema, 'ItemType', {
      description: 'Item type values'
    });

    convertZodToOpenAPI(TimelineTypeSchema, 'TimelineType', {
      description: 'Timeline type values'
    });

    convertZodToOpenAPI(BusinessProposalStatusSchema, 'BusinessProposalStatus', {
      description: 'Business proposal status values'
    });

    convertZodToOpenAPI(SupportedLocaleSchema, 'SupportedLocale', {
      description: 'Supported locale values'
    });
  }

  /**
   * Register User-related schemas
   */
  private registerUserSchemas(): void {
    // User entity schemas
    convertZodToOpenAPI(CreateUserSchema, 'CreateUserRequest', {
      description: 'Schema for creating a new user',
      example: {
        name: 'John Doe',
        username: 'johndoe',
        email: 'john.doe@example.com',
        role: 'SALES_REP',
        manager: { id: '123e4567-e89b-12d3-a456-426614174000' }
      }
    });

    convertZodToOpenAPI(UpdateUserSchema, 'UpdateUserRequest', {
      description: 'Schema for updating an existing user',
      example: {
        name: 'John Smith',
        role: 'MANAGER'
      }
    });

    convertZodToOpenAPI(UserQueryParamsSchema, 'UserQueryParams', {
      description: 'Query parameters for filtering and paginating users',
      example: {
        filter: 'role = "SALES_REP"',
        page: 1,
        size: 20
      }
    });

    convertZodToOpenAPI(UserIdParamSchema, 'UserIdParam', {
      description: 'Path parameter containing user ID',
      example: { id: '123e4567-e89b-12d3-a456-426614174000' }
    });

    // User response schema (for API responses)
    const UserResponseSchema = z.object({
      id: z.string().uuid(),
      name: z.string(),
      username: z.string(),
      role: UserRoleSchema,
      manager: z.object({ id: z.string().uuid() }).optional(),
      email: z.string().email(),
      createdAt: z.string().datetime()
    });

    convertZodToOpenAPI(UserResponseSchema, 'User', {
      description: 'User entity response',
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        username: 'johndoe',
        role: 'SALES_REP',
        manager: { id: '456e7890-e89b-12d3-a456-426614174000' },
        email: 'john.doe@example.com',
        createdAt: '2024-01-15T10:30:00.000Z'
      }
    });

    // Paginated user response
    const PaginatedUserResponseSchema = createPaginatedResponseSchema(UserResponseSchema, 'User');
    convertZodToOpenAPI(PaginatedUserResponseSchema, 'PaginatedUserResponse', {
      description: 'Paginated response containing users'
    });
  }

  /**
   * Register Account-related schemas
   */
  private registerAccountSchemas(): void {
    // Account entity schemas
    convertZodToOpenAPI(CreateAccountSchema, 'CreateAccountRequest', {
      description: 'Schema for creating a new account',
      example: {
        name: 'Acme Corporation',
        segment: 'Technology',
        responsible: { id: '123e4567-e89b-12d3-a456-426614174000' },
        email: 'contact@acme.com',
        phone: '+55 11 99999-9999'
      }
    });

    convertZodToOpenAPI(UpdateAccountSchema, 'UpdateAccountRequest', {
      description: 'Schema for updating an existing account',
      example: {
        name: 'Acme Corp',
        status: 'ACTIVE',
        type: 'Client'
      }
    });

    convertZodToOpenAPI(QueryParamsSchema, 'AccountQueryParams', {
      description: 'Query parameters for filtering and paginating accounts',
      example: {
        filter: 'status = "ACTIVE" AND type = "Client"',
        page: 1,
        size: 20
      }
    });

    convertZodToOpenAPI(AccountIdParamSchema, 'AccountIdParam', {
      description: 'Path parameter containing account ID',
      example: { id: '123e4567-e89b-12d3-a456-426614174000' }
    });

    // Account response schema
    const AccountResponseSchema = z.object({
      id: z.string().uuid(),
      name: z.string(),
      segment: z.string(),
      responsible: z.object({ id: z.string().uuid() }),
      status: AccountStatusSchema,
      type: AccountTypeSchema,
      pipeline: z.string(),
      lastInteraction: z.string().datetime(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      cnpj: z.string().optional(),
      instagram: z.string().url().optional(),
      linkedin: z.string().url().optional(),
      whatsapp: z.string().optional(),
      createdAt: z.string().datetime()
    });

    convertZodToOpenAPI(AccountResponseSchema, 'Account', {
      description: 'Account entity response',
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Acme Corporation',
        segment: 'Technology',
        responsible: { id: '456e7890-e89b-12d3-a456-426614174000' },
        status: 'ACTIVE',
        type: 'Client',
        pipeline: 'Sales Pipeline',
        lastInteraction: '2024-01-15T10:30:00.000Z',
        email: 'contact@acme.com',
        phone: '+55 11 99999-9999',
        createdAt: '2024-01-10T08:00:00.000Z'
      }
    });

    // Paginated account response
    const PaginatedAccountResponseSchema = createPaginatedResponseSchema(AccountResponseSchema, 'Account');
    convertZodToOpenAPI(PaginatedAccountResponseSchema, 'PaginatedAccountResponse', {
      description: 'Paginated response containing accounts'
    });
  }

  /**
   * Register Business-related schemas
   */
  private registerBusinessSchemas(): void {
    // Business entity schemas
    convertZodToOpenAPI(CreateBusinessSchema, 'CreateBusinessRequest', {
      description: 'Schema for creating a new business opportunity',
      example: {
        title: 'Software Implementation Project',
        account: { id: '123e4567-e89b-12d3-a456-426614174000' },
        value: 50000.00,
        currency: 'BRL',
        stage: 'Proposal',
        probability: 75,
        responsible: { id: '456e7890-e89b-12d3-a456-426614174000' },
        closingDate: '2024-03-15'
      }
    });

    convertZodToOpenAPI(UpdateBusinessSchema, 'UpdateBusinessRequest', {
      description: 'Schema for updating an existing business opportunity',
      example: {
        stage: 'Negotiation',
        probability: 85,
        value: 55000.00
      }
    });

    convertZodToOpenAPI(BusinessQueryParamsSchema, 'BusinessQueryParams', {
      description: 'Query parameters for filtering and paginating business opportunities',
      example: {
        filter: 'stage = "Proposal" AND value > 10000',
        page: 1,
        size: 20
      }
    });

    convertZodToOpenAPI(BusinessIdParamSchema, 'BusinessIdParam', {
      description: 'Path parameter containing business ID',
      example: { id: '123e4567-e89b-12d3-a456-426614174000' }
    });

    // Business response schema
    const BusinessResponseSchema = z.object({
      id: z.string().uuid(),
      title: z.string(),
      account: z.object({ id: z.string().uuid() }),
      value: z.number().positive(),
      currency: CurrencySchema,
      stage: BusinessStageSchema,
      probability: z.number().min(0).max(100).optional(),
      responsible: z.object({ id: z.string().uuid() }).optional(),
      closingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      createdAt: z.string().datetime()
    });

    convertZodToOpenAPI(BusinessResponseSchema, 'Business', {
      description: 'Business opportunity entity response',
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Software Implementation Project',
        account: { id: '456e7890-e89b-12d3-a456-426614174000' },
        value: 50000.00,
        currency: 'BRL',
        stage: 'Proposal',
        probability: 75,
        responsible: { id: '789e0123-e89b-12d3-a456-426614174000' },
        closingDate: '2024-03-15',
        createdAt: '2024-01-10T08:00:00.000Z'
      }
    });

    // Paginated business response
    const PaginatedBusinessResponseSchema = createPaginatedResponseSchema(BusinessResponseSchema, 'Business');
    convertZodToOpenAPI(PaginatedBusinessResponseSchema, 'PaginatedBusinessResponse', {
      description: 'Paginated response containing business opportunities'
    });
  }

  /**
   * Register Item-related schemas
   */
  private registerItemSchemas(): void {
    // Item entity schemas
    convertZodToOpenAPI(CreateItemSchema, 'CreateItemRequest', {
      description: 'Schema for creating a new item',
      example: {
        name: 'Software License',
        type: 'PRODUCT',
        price: 299.99,
        skuCode: 'SW-LIC-001',
        description: 'Annual software license'
      }
    });

    convertZodToOpenAPI(UpdateItemSchema, 'UpdateItemRequest', {
      description: 'Schema for updating an existing item',
      example: {
        price: 349.99,
        description: 'Annual software license with premium support'
      }
    });

    convertZodToOpenAPI(ItemQueryParamsSchema, 'ItemQueryParams', {
      description: 'Query parameters for filtering and paginating items',
      example: {
        search: 'software',
        type: 'PRODUCT',
        minPrice: 100,
        maxPrice: 500,
        page: 1,
        size: 20
      }
    });

    convertZodToOpenAPI(ItemIdParamSchema, 'ItemIdParam', {
      description: 'Path parameter containing item ID',
      example: { id: '123e4567-e89b-12d3-a456-426614174000' }
    });

    // Item response schema
    const ItemResponseSchema = z.object({
      id: z.string().uuid(),
      name: z.string(),
      type: ItemTypeSchema,
      price: z.number().positive(),
      skuCode: z.string().optional(),
      description: z.string().optional(),
      createdAt: z.string().datetime()
    });

    convertZodToOpenAPI(ItemResponseSchema, 'Item', {
      description: 'Item entity response',
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Software License',
        type: 'PRODUCT',
        price: 299.99,
        skuCode: 'SW-LIC-001',
        description: 'Annual software license',
        createdAt: '2024-01-10T08:00:00.000Z'
      }
    });

    // Paginated item response
    const PaginatedItemResponseSchema = createPaginatedResponseSchema(ItemResponseSchema, 'Item');
    convertZodToOpenAPI(PaginatedItemResponseSchema, 'PaginatedItemResponse', {
      description: 'Paginated response containing items'
    });
  }

  /**
   * Register AccountTimeline-related schemas
   */
  private registerAccountTimelineSchemas(): void {
    // AccountTimeline entity schemas
    convertZodToOpenAPI(CreateAccountTimelineSchema, 'CreateAccountTimelineRequest', {
      description: 'Schema for creating a new account timeline entry',
      example: {
        account: { id: '123e4567-e89b-12d3-a456-426614174000' },
        type: 'CALL',
        title: 'Follow-up call',
        description: 'Discussed project requirements and timeline',
        date: '2024-01-15T10:30:00.000Z',
        responsible: { id: '456e7890-e89b-12d3-a456-426614174000' }
      }
    });

    convertZodToOpenAPI(UpdateAccountTimelineSchema, 'UpdateAccountTimelineRequest', {
      description: 'Schema for updating an existing account timeline entry',
      example: {
        title: 'Follow-up call - Updated',
        description: 'Discussed project requirements, timeline, and budget'
      }
    });

    convertZodToOpenAPI(AccountTimelineQueryParamsSchema, 'AccountTimelineQueryParams', {
      description: 'Query parameters for filtering and paginating account timeline entries',
      example: {
        accountId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'CALL',
        dateFrom: '2024-01-01T00:00:00.000Z',
        dateTo: '2024-01-31T23:59:59.999Z',
        page: 1,
        size: 20
      }
    });

    convertZodToOpenAPI(AccountTimelineIdParamSchema, 'AccountTimelineIdParam', {
      description: 'Path parameter containing account timeline ID',
      example: { id: '123e4567-e89b-12d3-a456-426614174000' }
    });

    // AccountTimeline response schema
    const AccountTimelineResponseSchema = z.object({
      id: z.string().uuid(),
      account: z.object({ id: z.string().uuid() }),
      type: TimelineTypeSchema,
      title: z.string(),
      description: z.string().optional(),
      date: z.string().datetime(),
      responsible: z.object({ id: z.string().uuid() }),
      createdAt: z.string().datetime()
    });

    convertZodToOpenAPI(AccountTimelineResponseSchema, 'AccountTimeline', {
      description: 'Account timeline entry response',
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        account: { id: '456e7890-e89b-12d3-a456-426614174000' },
        type: 'CALL',
        title: 'Follow-up call',
        description: 'Discussed project requirements and timeline',
        date: '2024-01-15T10:30:00.000Z',
        responsible: { id: '789e0123-e89b-12d3-a456-426614174000' },
        createdAt: '2024-01-15T10:35:00.000Z'
      }
    });

    // Paginated account timeline response
    const PaginatedAccountTimelineResponseSchema = createPaginatedResponseSchema(AccountTimelineResponseSchema, 'AccountTimeline');
    convertZodToOpenAPI(PaginatedAccountTimelineResponseSchema, 'PaginatedAccountTimelineResponse', {
      description: 'Paginated response containing account timeline entries'
    });
  }

  /**
   * Register BusinessProposal-related schemas
   */
  private registerBusinessProposalSchemas(): void {
    // BusinessProposal entity schemas
    convertZodToOpenAPI(CreateBusinessProposalSchema, 'CreateBusinessProposalRequest', {
      description: 'Schema for creating a new business proposal',
      example: {
        business: { id: '123e4567-e89b-12d3-a456-426614174000' },
        responsible: { id: '456e7890-e89b-12d3-a456-426614174000' },
        title: 'Software Implementation Proposal',
        status: 'Rascunho',
        date: '2024-01-15',
        value: 50000.00,
        content: 'Detailed proposal content...',
        themeColor: '#007bff',
        termsAndConditions: 'Standard terms and conditions...',
        showUnitPrices: true
      }
    });

    convertZodToOpenAPI(UpdateBusinessProposalSchema, 'UpdateBusinessProposalRequest', {
      description: 'Schema for updating an existing business proposal',
      example: {
        status: 'Em Revisão',
        value: 55000.00,
        content: 'Updated proposal content...'
      }
    });

    convertZodToOpenAPI(CreateBusinessProposalItemSchema, 'CreateBusinessProposalItemRequest', {
      description: 'Schema for creating a new business proposal item',
      example: {
        proposal: { id: '123e4567-e89b-12d3-a456-426614174000' },
        item: { id: '456e7890-e89b-12d3-a456-426614174000' },
        name: 'Software License',
        quantity: 10,
        unitPrice: 299.99,
        discount: 500.00
      }
    });

    convertZodToOpenAPI(UpdateBusinessProposalItemSchema, 'UpdateBusinessProposalItemRequest', {
      description: 'Schema for updating an existing business proposal item',
      example: {
        quantity: 12,
        unitPrice: 279.99,
        discount: 600.00
      }
    });

    convertZodToOpenAPI(BusinessProposalQueryParamsSchema, 'BusinessProposalQueryParams', {
      description: 'Query parameters for filtering and paginating business proposals',
      example: {
        search: 'software',
        status: 'Enviado',
        businessId: '123e4567-e89b-12d3-a456-426614174000',
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
        minValue: 10000,
        maxValue: 100000,
        page: 1,
        size: 20
      }
    });

    convertZodToOpenAPI(BusinessProposalItemQueryParamsSchema, 'BusinessProposalItemQueryParams', {
      description: 'Query parameters for filtering and paginating business proposal items',
      example: {
        proposalId: '123e4567-e89b-12d3-a456-426614174000',
        search: 'license',
        minQuantity: 1,
        maxQuantity: 100,
        page: 1,
        size: 20
      }
    });

    convertZodToOpenAPI(BusinessProposalIdParamSchema, 'BusinessProposalIdParam', {
      description: 'Path parameter containing business proposal ID',
      example: { id: '123e4567-e89b-12d3-a456-426614174000' }
    });

    convertZodToOpenAPI(BusinessProposalItemIdParamSchema, 'BusinessProposalItemIdParam', {
      description: 'Path parameter containing business proposal item ID',
      example: { id: '123e4567-e89b-12d3-a456-426614174000' }
    });

    convertZodToOpenAPI(ProposalIdParamSchema, 'ProposalIdParam', {
      description: 'Path parameter containing proposal ID for nested routes',
      example: { proposalId: '123e4567-e89b-12d3-a456-426614174000' }
    });

    // BusinessProposal response schema
    const BusinessProposalResponseSchema = z.object({
      id: z.string().uuid(),
      business: z.object({ id: z.string().uuid() }),
      responsible: z.object({ id: z.string().uuid() }),
      title: z.string(),
      status: BusinessProposalStatusSchema,
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      value: z.number().positive(),
      content: z.string().optional(),
      themeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      termsAndConditions: z.string().optional(),
      showUnitPrices: z.boolean().optional(),
      createdAt: z.string().datetime()
    });

    convertZodToOpenAPI(BusinessProposalResponseSchema, 'BusinessProposal', {
      description: 'Business proposal entity response',
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        business: { id: '456e7890-e89b-12d3-a456-426614174000' },
        responsible: { id: '789e0123-e89b-12d3-a456-426614174000' },
        title: 'Software Implementation Proposal',
        status: 'Enviado',
        date: '2024-01-15',
        value: 50000.00,
        content: 'Detailed proposal content...',
        themeColor: '#007bff',
        termsAndConditions: 'Standard terms and conditions...',
        showUnitPrices: true,
        createdAt: '2024-01-10T08:00:00.000Z'
      }
    });

    // BusinessProposalItem response schema
    const BusinessProposalItemResponseSchema = z.object({
      id: z.string().uuid(),
      proposal: z.object({ id: z.string().uuid() }),
      item: z.object({ id: z.string().uuid() }),
      name: z.string(),
      quantity: z.number().positive(),
      unitPrice: z.number().positive(),
      discount: z.number().min(0).optional(),
      total: z.number().min(0),
      createdAt: z.string().datetime()
    });

    convertZodToOpenAPI(BusinessProposalItemResponseSchema, 'BusinessProposalItem', {
      description: 'Business proposal item entity response',
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        proposal: { id: '456e7890-e89b-12d3-a456-426614174000' },
        item: { id: '789e0123-e89b-12d3-a456-426614174000' },
        name: 'Software License',
        quantity: 10,
        unitPrice: 299.99,
        discount: 500.00,
        total: 2499.90,
        createdAt: '2024-01-10T08:00:00.000Z'
      }
    });

    // Paginated responses
    const PaginatedBusinessProposalResponseSchema = createPaginatedResponseSchema(BusinessProposalResponseSchema, 'BusinessProposal');
    convertZodToOpenAPI(PaginatedBusinessProposalResponseSchema, 'PaginatedBusinessProposalResponse', {
      description: 'Paginated response containing business proposals'
    });

    const PaginatedBusinessProposalItemResponseSchema = createPaginatedResponseSchema(BusinessProposalItemResponseSchema, 'BusinessProposalItem');
    convertZodToOpenAPI(PaginatedBusinessProposalItemResponseSchema, 'PaginatedBusinessProposalItemResponse', {
      description: 'Paginated response containing business proposal items'
    });
  }

  /**
   * Register Dashboard-related schemas
   */
  private registerDashboardSchemas(): void {
    // Dashboard parameter schemas
    convertZodToOpenAPI(DashboardQueryParamsSchema, 'DashboardQueryParams', {
      description: 'Query parameters for dashboard endpoints',
      example: { period: 'THIS_MONTH' }
    });

    convertZodToOpenAPI(RevenuePerPeriodQueryParamsSchema, 'RevenuePerPeriodQueryParams', {
      description: 'Query parameters for revenue per period endpoint (period is optional, defaults to THIS_YEAR)',
      example: { period: 'THIS_YEAR' }
    });

    // Dashboard response schemas
    convertZodToOpenAPI(MonthlyRevenueResponseSchema, 'MonthlyRevenueResponse', {
      description: 'Monthly revenue data response',
      example: {
        'Janeiro': 45000.00,
        'Fevereiro': 52000.00,
        'Março': 48000.00
      }
    });

    convertZodToOpenAPI(MoreSalesByResponsibleResponseSchema, 'MoreSalesByResponsibleResponse', {
      description: 'Sales data grouped by responsible person',
      example: [
        {
          responsibleId: '123e4567-e89b-12d3-a456-426614174000',
          responsibleName: 'John Doe',
          saleValue: 125000.00,
          closedDealsCount: 8
        },
        {
          responsibleId: '456e7890-e89b-12d3-a456-426614174000',
          responsibleName: 'Jane Smith',
          saleValue: 98000.00,
          closedDealsCount: 6
        }
      ]
    });

    convertZodToOpenAPI(SalesFunnelResponseSchema, 'SalesFunnelResponse', {
      description: 'Sales funnel data by stage',
      example: {
        'Prospecting': 25,
        'Qualification': 18,
        'Proposal': 12,
        'Negotiation': 8,
        'Closed Won': 15,
        'Closed Lost': 5
      }
    });

    convertZodToOpenAPI(TotalRevenueResponseSchema, 'TotalRevenueResponse', {
      description: 'Total revenue response',
      example: { total: 245000.00 }
    });

    convertZodToOpenAPI(ActiveAccountsResponseSchema, 'ActiveAccountsResponse', {
      description: 'Active accounts count response',
      example: { total: 156 }
    });

    convertZodToOpenAPI(NewBusinessResponseSchema, 'NewBusinessResponse', {
      description: 'New business count response',
      example: { count: 23 }
    });
  }

  /**
   * Register common response schemas (errors, etc.)
   */
  private registerCommonResponseSchemas(): void {
    // Error response schemas
    const ErrorResponseSchema = createErrorResponseSchema('Internal server error', 500);
    convertZodToOpenAPI(ErrorResponseSchema, 'ErrorResponse', {
      description: 'Standard error response'
    });

    const ValidationErrorResponseSchema = createValidationErrorResponseSchema();
    convertZodToOpenAPI(ValidationErrorResponseSchema, 'ValidationErrorResponse', {
      description: 'Validation error response with field-specific messages'
    });

    const NotFoundErrorResponseSchema = createErrorResponseSchema('Resource not found', 404);
    convertZodToOpenAPI(NotFoundErrorResponseSchema, 'NotFoundErrorResponse', {
      description: 'Resource not found error response'
    });

    const UnauthorizedErrorResponseSchema = createErrorResponseSchema('Unauthorized', 401);
    convertZodToOpenAPI(UnauthorizedErrorResponseSchema, 'UnauthorizedErrorResponse', {
      description: 'Unauthorized error response'
    });
  }

  /**
   * Get all registered OpenAPI schemas
   * @returns Record of schema names to OpenAPI schema objects
   */
  public getOpenAPISchemas(): Record<string, any> {
    if (!this.schemasRegistered) {
      this.registerEntitySchemas();
    }
    
    // Import the full config and generate the spec
    const { generateOpenAPISpec } = require('../config/openapi');
    const spec = generateOpenAPISpec();
    
    return spec.components?.schemas || {};
  }

  /**
   * Check if schemas have been registered
   * @returns True if schemas are registered, false otherwise
   */
  public areSchemasRegistered(): boolean {
    return this.schemasRegistered;
  }

  /**
   * Reset registration state (useful for testing)
   */
  public resetRegistration(): void {
    this.schemasRegistered = false;
  }
}

// Export singleton instance
export const schemaRegistry = SchemaRegistry.getInstance();