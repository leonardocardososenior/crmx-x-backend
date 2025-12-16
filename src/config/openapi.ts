import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';

// OpenAPI configuration with basic info, servers, and security schemes
export const openApiConfig = {
  openapi: '3.0.3',
  info: {
    title: 'CRM System API',
    version: '1.0.0',
    description: 'Sistema de gerenciamento de relacionamento com clientes - API completa para operações CRUD e relatórios de dashboard',
    contact: {
      name: 'CRM System Support',
      email: 'support@crm-system.com'
    },
    license: {
      name: 'ISC',
      url: 'https://opensource.org/licenses/ISC'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Development server'
    },
    {
      url: 'https://api.crm-system.com/api',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token for authentication. Include the token in the Authorization header as: Bearer <token>'
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication information is missing or invalid',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Unauthorized'
                },
                status: {
                  type: 'integer',
                  example: 401
                }
              }
            }
          }
        }
      },
      ValidationError: {
        description: 'Validation error with field-specific messages',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Validation failed'
                },
                status: {
                  type: 'integer',
                  example: 400
                },
                errors: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: {
                        type: 'string',
                        example: 'name'
                      },
                      message: {
                        type: 'string',
                        example: 'Name is required'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Resource not found'
                },
                status: {
                  type: 'integer',
                  example: 404
                }
              }
            }
          }
        }
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Internal server error'
                },
                status: {
                  type: 'integer',
                  example: 500
                }
              }
            }
          }
        }
      }
    },
    parameters: {
      PageParam: {
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
      SizeParam: {
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

      FilterParam: {
        name: 'filter',
        in: 'query',
        description: 'Dynamic filter parameter using SQL-like syntax. Supports operators: =, !=, >, <, >=, <=, LIKE, IN, AND, OR',
        required: false,
        schema: {
          type: 'string'
        },
        example: 'status = "ACTIVE" AND type = "Client"',
        examples: {
          simple: {
            value: 'status = "ACTIVE"',
            summary: 'Simple equality filter',
            description: 'Filter by single field value'
          },
          multiple: {
            value: 'status = "ACTIVE" AND type = "Client"',
            summary: 'Multiple conditions with AND',
            description: 'Combine multiple filters with AND operator'
          },
          pattern: {
            value: 'name LIKE "%Corp%"',
            summary: 'Pattern matching',
            description: 'Use LIKE operator for text pattern matching'
          },
          range: {
            value: 'value >= 10000 AND value <= 50000',
            summary: 'Numeric range',
            description: 'Filter by numeric range using comparison operators'
          },
          date: {
            value: 'createdAt >= "2024-01-01T00:00:00.000Z"',
            summary: 'Date filtering',
            description: 'Filter by date using ISO 8601 format'
          },
          complex: {
            value: '(status = "ACTIVE" OR status = "PENDING") AND value > 5000',
            summary: 'Complex conditions',
            description: 'Use parentheses for complex logical grouping'
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  tags: [
    {
      name: 'Users',
      description: 'User management operations'
    },
    {
      name: 'Accounts',
      description: 'Account management operations'
    },
    {
      name: 'Business',
      description: 'Business opportunity management operations'
    },
    {
      name: 'Items',
      description: 'Item catalog management operations'
    },
    {
      name: 'Account Timeline',
      description: 'Account timeline and interaction history operations'
    },
    {
      name: 'Business Proposals',
      description: 'Business proposal management operations'
    },
    {
      name: 'Business Proposal Items',
      description: 'Business proposal item management operations'
    },
    {
      name: 'Dashboard',
      description: 'Dashboard analytics and reporting endpoints'
    }
  ]
};

// Create OpenAPI registry for schema registration
export const registry = new OpenAPIRegistry();

// Function to generate the complete OpenAPI specification
export function generateOpenAPISpec() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  const generatedSpec = generator.generateDocument(openApiConfig);
  
  // Ensure base config components are properly merged
  if (!generatedSpec.components) {
    generatedSpec.components = {};
  }
  
  // Merge security schemes from base config
  if (openApiConfig.components?.securitySchemes) {
    if (!generatedSpec.components.securitySchemes) {
      generatedSpec.components.securitySchemes = {};
    }
    Object.assign(generatedSpec.components.securitySchemes, openApiConfig.components.securitySchemes);
  }
  
  // Merge responses from base config
  if (openApiConfig.components?.responses) {
    if (!generatedSpec.components.responses) {
      generatedSpec.components.responses = {};
    }
    Object.assign(generatedSpec.components.responses, openApiConfig.components.responses);
  }
  
  // Merge parameters from base config
  if (openApiConfig.components?.parameters) {
    if (!generatedSpec.components.parameters) {
      generatedSpec.components.parameters = {};
    }
    Object.assign(generatedSpec.components.parameters, openApiConfig.components.parameters);
  }
  
  return generatedSpec;
}