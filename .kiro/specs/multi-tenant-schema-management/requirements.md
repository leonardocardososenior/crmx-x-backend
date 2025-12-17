# Requirements Document

## Introduction

Este documento especifica os requisitos para implementar um sistema de multi-tenancy baseado em schemas separados por cliente (tenant). O sistema deve criar e gerenciar schemas dinâmicos no banco de dados PostgreSQL, onde cada cliente possui seu próprio schema isolado, garantindo separação completa dos dados entre diferentes tenants.

## Glossary

- **Tenant**: Um cliente ou organização que utiliza a aplicação, identificado por um código único
- **Schema**: Um namespace no banco de dados PostgreSQL que contém tabelas e outros objetos de banco de dados
- **Multi-tenancy**: Arquitetura onde uma única instância da aplicação serve múltiplos clientes (tenants)
- **Tenant Header**: Header HTTP "tenant" que identifica qual cliente está fazendo a requisição
- **Schema Migration**: Script SQL que cria a estrutura de tabelas e objetos necessários em um schema
- **Database Connection**: Conexão ativa com o banco de dados PostgreSQL
- **Schema Validation**: Processo de verificar se um schema existe no banco de dados

## Requirements

### Requirement 1

**User Story:** Como um desenvolvedor da API, eu quero que todas as requisições incluam um header de tenant, para que o sistema possa identificar qual cliente está fazendo a requisição.

#### Acceptance Criteria

1. WHEN a request is received without a tenant header, THEN the system SHALL return a 400 error with message "Tenant header is required"
2. WHEN a request is received with an empty tenant header, THEN the system SHALL return a 400 error with message "Tenant header cannot be empty"
3. WHEN a request is received with a valid tenant header, THEN the system SHALL extract the tenant value for further processing
4. WHEN a tenant header contains invalid characters, THEN the system SHALL return a 400 error with message "Invalid tenant format"

### Requirement 2

**User Story:** Como um administrador do sistema, eu quero que schemas sejam criados automaticamente quando um novo tenant faz sua primeira requisição, para que não seja necessário configuração manual.

#### Acceptance Criteria

1. WHEN a request is received with a tenant that does not have a corresponding schema, THEN the system SHALL create a new schema named "crmx_database_{{tenant}}"
2. WHEN creating a new schema, THEN the system SHALL execute the migration script from schema.sql to populate the schema structure
3. WHEN schema creation fails, THEN the system SHALL return a 500 error with details about the failure
4. WHEN a schema is successfully created, THEN the system SHALL log the creation event with tenant information
5. WHEN multiple concurrent requests arrive for the same new tenant, THEN the system SHALL handle schema creation safely without conflicts

### Requirement 3

**User Story:** Como um desenvolvedor da API, eu quero que todas as consultas ao banco sejam automaticamente direcionadas para o schema correto do tenant, para que os dados permaneçam isolados entre clientes.

#### Acceptance Criteria

1. WHEN executing database queries, THEN the system SHALL set the search_path to the tenant-specific schema
2. WHEN a database connection is established for a tenant, THEN the system SHALL configure the connection to use the correct schema
3. WHEN switching between different tenants in the same request cycle, THEN the system SHALL update the database context appropriately
4. WHEN a query is executed, THEN the system SHALL ensure it operates only within the tenant's schema scope
5. WHEN database operations complete, THEN the system SHALL maintain schema isolation between different tenant requests

### Requirement 4

**User Story:** Como um administrador do sistema, eu quero que o sistema valide a existência de schemas antes de processar requisições, para que erros sejam detectados precocemente.

#### Acceptance Criteria

1. WHEN a request is received, THEN the system SHALL check if the tenant's schema exists in the database
2. WHEN a schema exists, THEN the system SHALL proceed with normal request processing
3. WHEN checking schema existence fails due to database connectivity, THEN the system SHALL return a 503 error
4. WHEN a schema name is malformed, THEN the system SHALL return a 400 error before attempting database operations
5. WHEN schema validation completes successfully, THEN the system SHALL cache the validation result for performance

### Requirement 5

**User Story:** Como um desenvolvedor da API, eu quero que o middleware de tenant seja aplicado a todas as rotas da aplicação, para que a funcionalidade de multi-tenancy seja consistente em toda a API.

#### Acceptance Criteria

1. WHEN the application starts, THEN the system SHALL register the tenant middleware before all route handlers
2. WHEN any API endpoint is called, THEN the system SHALL process the tenant header before executing business logic
3. WHEN tenant processing fails, THEN the system SHALL prevent access to protected resources
4. WHEN tenant processing succeeds, THEN the system SHALL make tenant information available to all subsequent middleware and controllers
5. WHEN the middleware chain completes, THEN the system SHALL ensure proper cleanup of tenant-specific resources