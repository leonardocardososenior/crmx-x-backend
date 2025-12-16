/**
 * Filtering and Search Parameter Documentation
 * Comprehensive documentation system for all filtering and search capabilities
 * Extracts and documents query parameters from existing controllers and schemas
 */

import { ENTITY_FIELDS } from './filterParser';
import { OpenAPIParameter } from './queryParameterDocumentation';
import { 
  AccountStatuses, 
  AccountTypes, 
  BusinessStages,
  Currencies,
  ItemTypes,
  TimelineTypes,
  UserRoles,
  BusinessProposalStatuses
} from '../types';

/**
 * Interface for filter documentation
 */
export interface FilterDocumentation {
  field: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'uuid';
  format?: string;
  enum?: string[];
  operators: string[];
  examples: Array<{
    description: string;
    filter: string;
    explanation: string;
  }>;
  relationshipPath?: string;
}

/**
 * Interface for search parameter documentation
 */
export interface SearchParameterDocumentation {
  parameter: string;
  description: string;
  searchFields: string[];
  examples: Array<{
    description: string;
    value: string;
    explanation: string;
  }>;
}

/**
 * Filtering Documentation class
 * Provides comprehensive documentation for all filtering and search capabilities
 */
export class FilteringDocumentation {
  private static instance: FilteringDocumentation;

  private constructor() {}

  public static getInstance(): FilteringDocumentation {
    if (!FilteringDocumentation.instance) {
      FilteringDocumentation.instance = new FilteringDocumentation();
    }
    return FilteringDocumentation.instance;
  }

  /**
   * Document all available filter operators and their usage
   * @returns Array of operator documentation
   */
  public documentFilterOperators(): Array<{
    operator: string;
    description: string;
    applicableTypes: string[];
    examples: Array<{
      description: string;
      filter: string;
      explanation: string;
    }>;
  }> {
    return [
      {
        operator: '=',
        description: 'Equality comparison - exact match',
        applicableTypes: ['string', 'number', 'boolean', 'date', 'enum', 'uuid'],
        examples: [
          {
            description: 'Filter active accounts',
            filter: 'status = "ACTIVE"',
            explanation: 'Find accounts with status exactly equal to ACTIVE'
          },
          {
            description: 'Filter by specific value',
            filter: 'value = 10000',
            explanation: 'Find business opportunities with value exactly 10000'
          },
          {
            description: 'Filter by UUID',
            filter: 'responsible.id = "123e4567-e89b-12d3-a456-426614174000"',
            explanation: 'Find records assigned to specific user by ID'
          }
        ]
      },
      {
        operator: '!=',
        description: 'Inequality comparison - not equal',
        applicableTypes: ['string', 'number', 'boolean', 'date', 'enum', 'uuid'],
        examples: [
          {
            description: 'Exclude competitors',
            filter: 'type != "Competitor"',
            explanation: 'Find accounts that are not competitors'
          },
          {
            description: 'Exclude closed lost deals',
            filter: 'stage != "Closed Lost"',
            explanation: 'Find business opportunities that are not closed lost'
          }
        ]
      },
      {
        operator: '>',
        description: 'Greater than comparison',
        applicableTypes: ['number', 'date'],
        examples: [
          {
            description: 'High-value opportunities',
            filter: 'value > 50000',
            explanation: 'Find opportunities worth more than $50,000'
          },
          {
            description: 'Recent records',
            filter: 'createdAt > "2024-01-01T00:00:00.000Z"',
            explanation: 'Find records created after January 1, 2024'
          }
        ]
      },
      {
        operator: '<',
        description: 'Less than comparison',
        applicableTypes: ['number', 'date'],
        examples: [
          {
            description: 'Low-probability deals',
            filter: 'probability < 25',
            explanation: 'Find deals with less than 25% probability'
          },
          {
            description: 'Closing soon',
            filter: 'closingDate < "2024-03-31T23:59:59.999Z"',
            explanation: 'Find opportunities closing before end of Q1'
          }
        ]
      },
      {
        operator: '>=',
        description: 'Greater than or equal comparison',
        applicableTypes: ['number', 'date'],
        examples: [
          {
            description: 'Medium to high value',
            filter: 'value >= 25000',
            explanation: 'Find opportunities worth $25,000 or more'
          },
          {
            description: 'From specific date',
            filter: 'lastInteraction >= "2024-01-01T00:00:00.000Z"',
            explanation: 'Find accounts with interactions since January 1, 2024'
          }
        ]
      },
      {
        operator: '<=',
        description: 'Less than or equal comparison',
        applicableTypes: ['number', 'date'],
        examples: [
          {
            description: 'Budget-friendly items',
            filter: 'price <= 1000',
            explanation: 'Find items priced at $1,000 or less'
          },
          {
            description: 'Until specific date',
            filter: 'closingDate <= "2024-12-31T23:59:59.999Z"',
            explanation: 'Find opportunities closing by end of 2024'
          }
        ]
      },
      {
        operator: 'LIKE',
        description: 'Pattern matching with wildcards (case-sensitive)',
        applicableTypes: ['string'],
        examples: [
          {
            description: 'Name contains pattern',
            filter: 'name LIKE "%Corp%"',
            explanation: 'Find accounts with "Corp" anywhere in the name'
          },
          {
            description: 'Starts with pattern',
            filter: 'title LIKE "Software%"',
            explanation: 'Find opportunities with titles starting with "Software"'
          },
          {
            description: 'Ends with pattern',
            filter: 'email LIKE "%@company.com"',
            explanation: 'Find accounts with company.com email addresses'
          }
        ]
      },
      {
        operator: 'ILIKE',
        description: 'Pattern matching with wildcards (case-insensitive)',
        applicableTypes: ['string'],
        examples: [
          {
            description: 'Case-insensitive search',
            filter: 'name ILIKE "%TECH%"',
            explanation: 'Find accounts with "tech", "Tech", or "TECH" in name'
          },
          {
            description: 'Flexible email search',
            filter: 'email ILIKE "%GMAIL%"',
            explanation: 'Find any Gmail addresses regardless of case'
          }
        ]
      },
      {
        operator: 'IN',
        description: 'Value exists in a list of options',
        applicableTypes: ['string', 'number', 'enum', 'uuid'],
        examples: [
          {
            description: 'Multiple stages',
            filter: 'stage IN ("Proposal", "Negotiation", "Closed Won")',
            explanation: 'Find opportunities in proposal, negotiation, or closed won stages'
          },
          {
            description: 'Multiple currencies',
            filter: 'currency IN ("BRL", "USD")',
            explanation: 'Find opportunities in Brazilian Real or US Dollar'
          },
          {
            description: 'Multiple responsible users',
            filter: 'responsible.id IN ("uuid1", "uuid2", "uuid3")',
            explanation: 'Find records assigned to specific users'
          }
        ]
      },
      {
        operator: 'NOT IN',
        description: 'Value does not exist in a list of options',
        applicableTypes: ['string', 'number', 'enum', 'uuid'],
        examples: [
          {
            description: 'Exclude closed stages',
            filter: 'stage NOT IN ("Closed Won", "Closed Lost")',
            explanation: 'Find opportunities that are not closed'
          },
          {
            description: 'Exclude specific types',
            filter: 'type NOT IN ("Competitor", "Partner")',
            explanation: 'Find accounts that are not competitors or partners'
          }
        ]
      }
    ];
  }

  /**
   * Document logical operators for combining filters
   * @returns Array of logical operator documentation
   */
  public documentLogicalOperators(): Array<{
    operator: string;
    description: string;
    examples: Array<{
      description: string;
      filter: string;
      explanation: string;
    }>;
  }> {
    return [
      {
        operator: 'AND',
        description: 'Logical AND - all conditions must be true',
        examples: [
          {
            description: 'Active client accounts',
            filter: 'status = "ACTIVE" AND type = "Client"',
            explanation: 'Find accounts that are both active AND classified as clients'
          },
          {
            description: 'High-value BRL opportunities',
            filter: 'currency = "BRL" AND value >= 50000 AND stage = "Negotiation"',
            explanation: 'Find BRL opportunities worth 50k+ in negotiation stage'
          },
          {
            description: 'Recent technology accounts',
            filter: 'segment = "Technology" AND lastInteraction >= "2024-01-01T00:00:00.000Z"',
            explanation: 'Find technology accounts with recent interactions'
          }
        ]
      },
      {
        operator: 'OR',
        description: 'Logical OR - at least one condition must be true',
        examples: [
          {
            description: 'Active or pending accounts',
            filter: 'status = "ACTIVE" OR status = "PENDING"',
            explanation: 'Find accounts that are either active OR pending'
          },
          {
            description: 'High-value or high-probability deals',
            filter: 'value >= 100000 OR probability >= 90',
            explanation: 'Find deals that are either high-value OR high-probability'
          },
          {
            description: 'Multiple contact methods',
            filter: 'email LIKE "%@%" OR phone LIKE "+%"',
            explanation: 'Find accounts with either email OR phone contact info'
          }
        ]
      },
      {
        operator: '()',
        description: 'Parentheses for grouping conditions and controlling precedence',
        examples: [
          {
            description: 'Complex account filtering',
            filter: '(status = "ACTIVE" OR status = "PENDING") AND type = "Client"',
            explanation: 'Find client accounts that are either active or pending'
          },
          {
            description: 'Value or probability with stage constraint',
            filter: '(value >= 50000 OR probability >= 75) AND stage != "Closed Lost"',
            explanation: 'Find high-value or high-probability deals that are not lost'
          },
          {
            description: 'Multiple segments with type constraint',
            filter: '(segment = "Technology" OR segment = "Finance") AND type != "Competitor"',
            explanation: 'Find tech or finance accounts that are not competitors'
          }
        ]
      }
    ];
  }

  /**
   * Document entity-specific filterable fields
   * @returns Record of entity field documentation
   */
  public documentEntityFilterableFields(): Record<string, FilterDocumentation[]> {
    return {
      account: [
        {
          field: 'id',
          description: 'Unique account identifier',
          type: 'uuid',
          format: 'uuid',
          operators: ['=', '!=', 'IN', 'NOT IN'],
          examples: [
            {
              description: 'Specific account',
              filter: 'id = "123e4567-e89b-12d3-a456-426614174000"',
              explanation: 'Find the account with this specific ID'
            },
            {
              description: 'Multiple accounts',
              filter: 'id IN ("uuid1", "uuid2", "uuid3")',
              explanation: 'Find accounts with these specific IDs'
            }
          ]
        },
        {
          field: 'name',
          description: 'Account name or company name',
          type: 'string',
          operators: ['=', '!=', 'LIKE', 'ILIKE'],
          examples: [
            {
              description: 'Exact name match',
              filter: 'name = "Acme Corporation"',
              explanation: 'Find account with exact name "Acme Corporation"'
            },
            {
              description: 'Name contains pattern',
              filter: 'name LIKE "%Corp%"',
              explanation: 'Find accounts with "Corp" in the name'
            },
            {
              description: 'Case-insensitive search',
              filter: 'name ILIKE "%tech%"',
              explanation: 'Find accounts with "tech" in name (any case)'
            }
          ]
        },
        {
          field: 'segment',
          description: 'Business segment or industry',
          type: 'string',
          operators: ['=', '!=', 'LIKE', 'ILIKE', 'IN', 'NOT IN'],
          examples: [
            {
              description: 'Technology segment',
              filter: 'segment = "Technology"',
              explanation: 'Find accounts in the technology segment'
            },
            {
              description: 'Multiple segments',
              filter: 'segment IN ("Technology", "Finance", "Healthcare")',
              explanation: 'Find accounts in tech, finance, or healthcare'
            }
          ]
        },
        {
          field: 'status',
          description: 'Account status',
          type: 'enum',
          enum: Object.values(AccountStatuses),
          operators: ['=', '!=', 'IN', 'NOT IN'],
          examples: [
            {
              description: 'Active accounts',
              filter: 'status = "ACTIVE"',
              explanation: 'Find accounts with active status'
            },
            {
              description: 'Non-suspended accounts',
              filter: 'status NOT IN ("SUSPENDED", "INACTIVE")',
              explanation: 'Find accounts that are not suspended or inactive'
            }
          ]
        },
        {
          field: 'type',
          description: 'Account type or classification',
          type: 'enum',
          enum: Object.values(AccountTypes),
          operators: ['=', '!=', 'IN', 'NOT IN'],
          examples: [
            {
              description: 'Client accounts',
              filter: 'type = "Client"',
              explanation: 'Find accounts classified as clients'
            },
            {
              description: 'Prospects and leads',
              filter: 'type IN ("Prospect", "Lead")',
              explanation: 'Find potential customer accounts'
            }
          ]
        },
        {
          field: 'responsible.id',
          description: 'ID of the responsible user',
          type: 'uuid',
          format: 'uuid',
          operators: ['=', '!=', 'IN', 'NOT IN'],
          relationshipPath: 'users!responsible_id',
          examples: [
            {
              description: 'Accounts by responsible user',
              filter: 'responsible.id = "123e4567-e89b-12d3-a456-426614174000"',
              explanation: 'Find accounts assigned to specific user'
            },
            {
              description: 'Multiple responsible users',
              filter: 'responsible.id IN ("uuid1", "uuid2")',
              explanation: 'Find accounts assigned to specific users'
            }
          ]
        },
        {
          field: 'lastInteraction',
          description: 'Date of last interaction with account',
          type: 'date',
          format: 'date-time',
          operators: ['=', '!=', '>', '<', '>=', '<='],
          examples: [
            {
              description: 'Recent interactions',
              filter: 'lastInteraction >= "2024-01-01T00:00:00.000Z"',
              explanation: 'Find accounts with interactions since January 1, 2024'
            },
            {
              description: 'Stale accounts',
              filter: 'lastInteraction < "2023-12-01T00:00:00.000Z"',
              explanation: 'Find accounts with no recent interactions'
            }
          ]
        }
      ],
      business: [
        {
          field: 'id',
          description: 'Unique business opportunity identifier',
          type: 'uuid',
          format: 'uuid',
          operators: ['=', '!=', 'IN', 'NOT IN'],
          examples: [
            {
              description: 'Specific opportunity',
              filter: 'id = "123e4567-e89b-12d3-a456-426614174000"',
              explanation: 'Find the opportunity with this specific ID'
            }
          ]
        },
        {
          field: 'title',
          description: 'Business opportunity title or name',
          type: 'string',
          operators: ['=', '!=', 'LIKE', 'ILIKE'],
          examples: [
            {
              description: 'Software opportunities',
              filter: 'title LIKE "%Software%"',
              explanation: 'Find opportunities with "Software" in the title'
            },
            {
              description: 'Case-insensitive search',
              filter: 'title ILIKE "%consulting%"',
              explanation: 'Find consulting opportunities (any case)'
            }
          ]
        },
        {
          field: 'value',
          description: 'Monetary value of the opportunity',
          type: 'number',
          operators: ['=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT IN'],
          examples: [
            {
              description: 'High-value opportunities',
              filter: 'value >= 50000',
              explanation: 'Find opportunities worth $50,000 or more'
            },
            {
              description: 'Value range',
              filter: 'value >= 10000 AND value <= 100000',
              explanation: 'Find opportunities between $10k and $100k'
            }
          ]
        },
        {
          field: 'currency',
          description: 'Currency of the opportunity value',
          type: 'enum',
          enum: Object.values(Currencies),
          operators: ['=', '!=', 'IN', 'NOT IN'],
          examples: [
            {
              description: 'BRL opportunities',
              filter: 'currency = "BRL"',
              explanation: 'Find opportunities in Brazilian Real'
            },
            {
              description: 'International currencies',
              filter: 'currency IN ("USD", "EUR")',
              explanation: 'Find opportunities in USD or EUR'
            }
          ]
        },
        {
          field: 'stage',
          description: 'Current stage of the business opportunity',
          type: 'enum',
          enum: Object.values(BusinessStages),
          operators: ['=', '!=', 'IN', 'NOT IN'],
          examples: [
            {
              description: 'Active opportunities',
              filter: 'stage IN ("Proposal", "Negotiation")',
              explanation: 'Find opportunities in proposal or negotiation'
            },
            {
              description: 'Open opportunities',
              filter: 'stage NOT IN ("Closed Won", "Closed Lost")',
              explanation: 'Find opportunities that are not closed'
            }
          ]
        },
        {
          field: 'probability',
          description: 'Probability of closing (0-100)',
          type: 'number',
          operators: ['=', '!=', '>', '<', '>=', '<='],
          examples: [
            {
              description: 'High-probability deals',
              filter: 'probability >= 75',
              explanation: 'Find deals with 75% or higher probability'
            },
            {
              description: 'Low-probability deals',
              filter: 'probability < 25',
              explanation: 'Find deals with less than 25% probability'
            }
          ]
        },
        {
          field: 'closingDate',
          description: 'Expected closing date',
          type: 'date',
          format: 'date',
          operators: ['=', '!=', '>', '<', '>=', '<='],
          examples: [
            {
              description: 'Closing this quarter',
              filter: 'closingDate <= "2024-03-31"',
              explanation: 'Find opportunities closing by end of Q1'
            },
            {
              description: 'Future opportunities',
              filter: 'closingDate > "2024-06-30"',
              explanation: 'Find opportunities closing after Q2'
            }
          ]
        },
        {
          field: 'account.id',
          description: 'ID of the associated account',
          type: 'uuid',
          format: 'uuid',
          operators: ['=', '!=', 'IN', 'NOT IN'],
          relationshipPath: 'account!account_id',
          examples: [
            {
              description: 'Opportunities for specific account',
              filter: 'account.id = "123e4567-e89b-12d3-a456-426614174000"',
              explanation: 'Find opportunities for specific account'
            }
          ]
        },
        {
          field: 'responsible.id',
          description: 'ID of the responsible user',
          type: 'uuid',
          format: 'uuid',
          operators: ['=', '!=', 'IN', 'NOT IN'],
          relationshipPath: 'users!responsible_id',
          examples: [
            {
              description: 'Opportunities by responsible user',
              filter: 'responsible.id = "123e4567-e89b-12d3-a456-426614174000"',
              explanation: 'Find opportunities assigned to specific user'
            }
          ]
        }
      ],
      item: [
        {
          field: 'id',
          description: 'Unique item identifier',
          type: 'uuid',
          format: 'uuid',
          operators: ['=', '!=', 'IN', 'NOT IN'],
          examples: [
            {
              description: 'Specific item',
              filter: 'id = "123e4567-e89b-12d3-a456-426614174000"',
              explanation: 'Find the item with this specific ID'
            }
          ]
        },
        {
          field: 'name',
          description: 'Item name or title',
          type: 'string',
          operators: ['=', '!=', 'LIKE', 'ILIKE'],
          examples: [
            {
              description: 'Software items',
              filter: 'name LIKE "%Software%"',
              explanation: 'Find items with "Software" in the name'
            },
            {
              description: 'Case-insensitive search',
              filter: 'name ILIKE "%service%"',
              explanation: 'Find service items (any case)'
            }
          ]
        },
        {
          field: 'type',
          description: 'Item type or category',
          type: 'enum',
          enum: Object.values(ItemTypes),
          operators: ['=', '!=', 'IN', 'NOT IN'],
          examples: [
            {
              description: 'Product items',
              filter: 'type = "Product"',
              explanation: 'Find items classified as products'
            },
            {
              description: 'Services and subscriptions',
              filter: 'type IN ("Service", "Subscription")',
              explanation: 'Find service or subscription items'
            }
          ]
        },
        {
          field: 'price',
          description: 'Item price',
          type: 'number',
          operators: ['=', '!=', '>', '<', '>=', '<='],
          examples: [
            {
              description: 'Budget-friendly items',
              filter: 'price <= 1000',
              explanation: 'Find items priced at $1,000 or less'
            },
            {
              description: 'Price range',
              filter: 'price >= 100 AND price <= 500',
              explanation: 'Find items between $100 and $500'
            }
          ]
        },
        {
          field: 'description',
          description: 'Item description',
          type: 'string',
          operators: ['LIKE', 'ILIKE'],
          examples: [
            {
              description: 'Consulting services',
              filter: 'description LIKE "%consulting%"',
              explanation: 'Find items with "consulting" in description'
            }
          ]
        }
      ]
    };
  }

  /**
   * Document search parameters for entities that support text search
   * @returns Record of entity search parameter documentation
   */
  public documentSearchParameters(): Record<string, SearchParameterDocumentation[]> {
    return {
      item: [
        {
          parameter: 'search',
          description: 'Search items by name or description using full-text search',
          searchFields: ['name', 'description'],
          examples: [
            {
              description: 'Search by name',
              value: 'software',
              explanation: 'Find items with "software" in the name'
            },
            {
              description: 'Search by description',
              value: 'consulting',
              explanation: 'Find items with "consulting" in the description'
            },
            {
              description: 'Multi-word search',
              value: 'web development',
              explanation: 'Find items related to web development'
            }
          ]
        }
      ],
      businessProposal: [
        {
          parameter: 'search',
          description: 'Search business proposals by title or content',
          searchFields: ['title', 'content'],
          examples: [
            {
              description: 'Search by title',
              value: 'software development',
              explanation: 'Find proposals with "software development" in title'
            },
            {
              description: 'Search by content',
              value: 'implementation',
              explanation: 'Find proposals mentioning implementation'
            }
          ]
        }
      ]
    };
  }

  /**
   * Generate comprehensive filtering examples for each entity
   * @returns Record of entity filtering examples
   */
  public generateEntityFilteringExamples(): Record<string, Array<{
    category: string;
    description: string;
    filter: string;
    explanation: string;
    useCase: string;
  }>> {
    return {
      account: [
        {
          category: 'Status Filtering',
          description: 'Active client accounts',
          filter: 'status = "ACTIVE" AND type = "Client"',
          explanation: 'Find accounts that are both active and classified as clients',
          useCase: 'Sales team wants to focus on active client relationships'
        },
        {
          category: 'Segment Filtering',
          description: 'Technology prospects',
          filter: 'segment = "Technology" AND type = "Prospect"',
          explanation: 'Find prospect accounts in the technology segment',
          useCase: 'Marketing team targeting technology prospects'
        },
        {
          category: 'Activity Filtering',
          description: 'Stale accounts needing attention',
          filter: 'lastInteraction < "2023-12-01T00:00:00.000Z" AND status = "ACTIVE"',
          explanation: 'Find active accounts with no recent interactions',
          useCase: 'Account managers identifying accounts needing follow-up'
        },
        {
          category: 'Pattern Matching',
          description: 'Corporate accounts',
          filter: 'name LIKE "%Corp%" OR name LIKE "%Corporation%" OR name LIKE "%Inc%"',
          explanation: 'Find accounts with corporate naming patterns',
          useCase: 'Identifying enterprise-level accounts'
        },
        {
          category: 'Relationship Filtering',
          description: 'Accounts by responsible user',
          filter: 'responsible.id = "123e4567-e89b-12d3-a456-426614174000"',
          explanation: 'Find accounts assigned to specific sales representative',
          useCase: 'Manager reviewing specific rep\'s account portfolio'
        }
      ],
      business: [
        {
          category: 'Value Filtering',
          description: 'High-value opportunities',
          filter: 'value >= 50000 AND stage IN ("Proposal", "Negotiation")',
          explanation: 'Find opportunities worth $50k+ in active stages',
          useCase: 'Sales director focusing on major deals'
        },
        {
          category: 'Currency Filtering',
          description: 'BRL opportunities with high probability',
          filter: 'currency = "BRL" AND probability >= 75',
          explanation: 'Find Brazilian Real opportunities with high close probability',
          useCase: 'Regional manager tracking likely BRL closures'
        },
        {
          category: 'Timeline Filtering',
          description: 'Opportunities closing this quarter',
          filter: 'closingDate >= "2024-01-01" AND closingDate <= "2024-03-31" AND stage != "Closed Lost"',
          explanation: 'Find opportunities expected to close in Q1 that are not lost',
          useCase: 'Sales forecasting for quarterly planning'
        },
        {
          category: 'Stage Filtering',
          description: 'Open opportunities',
          filter: 'stage NOT IN ("Closed Won", "Closed Lost")',
          explanation: 'Find opportunities that are still active',
          useCase: 'Pipeline review excluding closed deals'
        },
        {
          category: 'Complex Filtering',
          description: 'Priority opportunities',
          filter: '(value >= 100000 OR probability >= 90) AND stage IN ("Proposal", "Negotiation")',
          explanation: 'Find high-value or high-probability opportunities in active stages',
          useCase: 'Sales team prioritizing efforts on best opportunities'
        }
      ],
      item: [
        {
          category: 'Type Filtering',
          description: 'Software products',
          filter: 'type = "Product" AND name LIKE "%Software%"',
          explanation: 'Find product items with "Software" in the name',
          useCase: 'Product manager reviewing software offerings'
        },
        {
          category: 'Price Filtering',
          description: 'Mid-range services',
          filter: 'type = "Service" AND price >= 500 AND price <= 2000',
          explanation: 'Find services priced between $500 and $2000',
          useCase: 'Sales rep looking for mid-range service options'
        },
        {
          category: 'Search Filtering',
          description: 'Consulting services',
          filter: 'type = "Service" AND (name LIKE "%Consulting%" OR description LIKE "%consulting%")',
          explanation: 'Find consulting services by name or description',
          useCase: 'Client looking for consulting expertise'
        },
        {
          category: 'Category Filtering',
          description: 'Subscription offerings',
          filter: 'type = "Subscription" AND price <= 100',
          explanation: 'Find affordable subscription items',
          useCase: 'Small business looking for cost-effective subscriptions'
        }
      ]
    };
  }

  /**
   * Document advanced filtering syntax and best practices
   * @returns Advanced filtering documentation
   */
  public documentAdvancedFilteringSyntax(): {
    overview: string;
    syntaxRules: Array<{
      rule: string;
      description: string;
      examples: string[];
    }>;
    bestPractices: Array<{
      practice: string;
      description: string;
      example: string;
    }>;
    commonMistakes: Array<{
      mistake: string;
      description: string;
      incorrect: string;
      correct: string;
    }>;
    performanceTips: Array<{
      tip: string;
      description: string;
      example: string;
    }>;
  } {
    return {
      overview: `The CRM System API supports advanced filtering using SQL-like syntax with support for 
                 complex logical expressions, relationship filtering, and pattern matching. Filters are 
                 applied server-side for optimal performance and support both direct field filtering 
                 and relationship-based filtering.`,
      
      syntaxRules: [
        {
          rule: 'String Values',
          description: 'String values must be enclosed in single or double quotes',
          examples: [
            'name = "Acme Corporation"',
            'status = \'ACTIVE\'',
            'segment = "Technology"'
          ]
        },
        {
          rule: 'Numeric Values',
          description: 'Numeric values are used without quotes',
          examples: [
            'value = 10000',
            'probability >= 75',
            'price <= 1000'
          ]
        },
        {
          rule: 'Date Values',
          description: 'Date values must be in ISO 8601 format and quoted',
          examples: [
            'createdAt >= "2024-01-01T00:00:00.000Z"',
            'closingDate = "2024-03-15"',
            'lastInteraction <= "2024-01-31T23:59:59.999Z"'
          ]
        },
        {
          rule: 'Array Values',
          description: 'Array values for IN/NOT IN operators must be in parentheses',
          examples: [
            'stage IN ("Proposal", "Negotiation")',
            'type NOT IN ("Competitor", "Partner")',
            'currency IN ("BRL", "USD", "EUR")'
          ]
        },
        {
          rule: 'Relationship Fields',
          description: 'Relationship fields use dot notation',
          examples: [
            'responsible.id = "uuid"',
            'account.name LIKE "%Corp%"',
            'business.stage = "Proposal"'
          ]
        },
        {
          rule: 'Logical Grouping',
          description: 'Use parentheses to group logical conditions',
          examples: [
            '(status = "ACTIVE" OR status = "PENDING") AND type = "Client"',
            '(value >= 50000 OR probability >= 90) AND stage != "Closed Lost"'
          ]
        }
      ],
      
      bestPractices: [
        {
          practice: 'Use Specific Field Names',
          description: 'Always use the exact field names as defined in the API schema',
          example: 'Use "responsible.id" not "responsibleId" for relationship filtering'
        },
        {
          practice: 'Combine with Pagination',
          description: 'Use filtering with pagination for large result sets',
          example: 'GET /api/accounts?filter=status="ACTIVE"&page=1&size=20'
        },
        {
          practice: 'URL Encode Filters',
          description: 'Always URL-encode filter parameters in HTTP requests',
          example: 'filter=name%20LIKE%20%22%25Corp%25%22 (encoded version of name LIKE "%Corp%")'
        },
        {
          practice: 'Test Simple First',
          description: 'Start with simple filters and gradually add complexity',
          example: 'Start with status="ACTIVE", then add AND type="Client"'
        },
        {
          practice: 'Use Appropriate Operators',
          description: 'Choose the right operator for your data type and use case',
          example: 'Use ILIKE for case-insensitive text search, >= for date ranges'
        }
      ],
      
      commonMistakes: [
        {
          mistake: 'Missing Quotes on Strings',
          description: 'String values must be quoted',
          incorrect: 'status = ACTIVE',
          correct: 'status = "ACTIVE"'
        },
        {
          mistake: 'Wrong Date Format',
          description: 'Dates must be in ISO 8601 format',
          incorrect: 'createdAt >= "01/01/2024"',
          correct: 'createdAt >= "2024-01-01T00:00:00.000Z"'
        },
        {
          mistake: 'Incorrect IN Syntax',
          description: 'IN operator requires parentheses around values',
          incorrect: 'stage IN "Proposal", "Negotiation"',
          correct: 'stage IN ("Proposal", "Negotiation")'
        },
        {
          mistake: 'Missing URL Encoding',
          description: 'Special characters must be URL-encoded',
          incorrect: 'filter=name LIKE "%Corp%"',
          correct: 'filter=name%20LIKE%20%22%25Corp%25%22'
        },
        {
          mistake: 'Invalid Field Names',
          description: 'Field names must match the API schema exactly',
          incorrect: 'responsibleId = "uuid"',
          correct: 'responsible.id = "uuid"'
        }
      ],
      
      performanceTips: [
        {
          tip: 'Index-Friendly Filters',
          description: 'Use equality and range operators on indexed fields for better performance',
          example: 'status = "ACTIVE" (fast) vs name LIKE "%pattern%" (slower)'
        },
        {
          tip: 'Limit Result Sets',
          description: 'Combine filtering with pagination to limit result set size',
          example: 'Use page=1&size=20 with filters to get manageable result sets'
        },
        {
          tip: 'Specific Before General',
          description: 'Put more specific filters first in AND conditions',
          example: 'id = "uuid" AND status = "ACTIVE" (id filter first)'
        },
        {
          tip: 'Avoid Complex LIKE Patterns',
          description: 'Use simple LIKE patterns for better performance',
          example: 'name LIKE "Corp%" (fast) vs name LIKE "%Corp%" (slower)'
        }
      ]
    };
  }

  /**
   * Generate OpenAPI parameter definitions for filtering
   * @returns Array of OpenAPI parameters for filtering
   */
  public generateFilteringOpenAPIParameters(): OpenAPIParameter[] {
    const operators = this.documentFilterOperators();
    const logicalOps = this.documentLogicalOperators();
    
    const operatorExamples = operators.reduce((acc, op) => {
      acc[op.operator.toLowerCase()] = {
        value: op.examples[0].filter,
        summary: op.description,
        description: op.examples[0].explanation
      };
      return acc;
    }, {} as Record<string, any>);

    return [
      {
        name: 'filter',
        in: 'query',
        description: 'Dynamic filter parameter using SQL-like syntax. Supports all comparison and logical operators.',
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
          }
        }
      }
    ];
  }
}

// Export singleton instance
export const filteringDocumentation = FilteringDocumentation.getInstance();