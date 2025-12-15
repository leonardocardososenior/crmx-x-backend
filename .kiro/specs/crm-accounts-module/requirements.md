# Requirements Document

## Introduction

Este documento especifica os requisitos para o módulo de contas (accounts) do sistema CRM X desenvolvido em Node.js com TypeScript, Express.js, Supabase como base de dados PostgreSQL e API REST para operações CRUD com autenticação JWT e controlo de acesso hierárquico.

## Glossary

- **CRM_X_System**: Sistema de gestão de relacionamento com clientes "CRM X"
- **Account**: Entidade que representa uma empresa ou organização cliente com campos específicos como CNPJ, redes sociais
- **Supabase_Database**: Base de dados PostgreSQL gerenciada pelo Supabase com tabelas profiles, account e deal
- **REST_API**: Interface de programação de aplicações que segue os princípios REST com autenticação Bearer Token
- **CRUD_Operations**: Operações de Create (criar), Read (ler), Update (atualizar) e Delete (eliminar)
- **Hierarchy_Visibility**: Sistema de controlo de acesso baseado na hierarquia organizacional (ADMIN, MANAGER, SALES_REP)
- **Profile**: Extensão da tabela auth.users do Supabase com dados específicos da aplicação
- **Bearer_Token**: Token usado para autenticação nas requisições API
- **Zod_Schema**: Esquema de validação de dados usando a biblioteca Zod
- **Authentication_API**: API externa de healthcheck para validação de tokens
- **Token_Cache**: Cache local em memória para armazenar tokens válidos e evitar chamadas repetidas

## Requirements

### Requirement 1

**User Story:** Como utilizador do CRM X, quero criar novas contas no sistema, para que possa registar informações completas de empresas clientes incluindo dados de contacto e redes sociais.

#### Acceptance Criteria

1. WHEN a user submits valid account data via POST /api/accounts, THE CRM_X_System SHALL validate data using Zod_Schema and create new account in Supabase_Database
2. WHEN account creation is successful, THE CRM_X_System SHALL return the created account with UUID, timestamps and all provided fields
3. WHEN required fields (name, segment, owner_id) are missing, THE CRM_X_System SHALL reject request and return Zod validation error messages
4. WHEN owner_id references invalid profile, THE CRM_X_System SHALL reject request and return foreign key validation error
5. WHEN account is created, THE CRM_X_System SHALL set default values for status (ACTIVE), account_type (Lead), pipeline (Standard) and last_interaction (now)

### Requirement 2

**User Story:** Como utilizador do CRM X, quero consultar contas do sistema, para que possa visualizar informações das empresas clientes com filtros e paginação.

#### Acceptance Criteria

1. WHEN a user requests GET /api/accounts, THE CRM_X_System SHALL return all accounts from Supabase_Database
2. WHEN search query parameters are provided, THE CRM_X_System SHALL filter results by name or segment matching the search term
3. WHEN status filter is provided, THE CRM_X_System SHALL return only accounts matching the specified account_status
4. WHEN account_type filter is provided, THE CRM_X_System SHALL return only accounts matching the specified account_type
5. WHEN pagination parameters (page, limit) are provided, THE CRM_X_System SHALL return paginated results with metadata

### Requirement 3

**User Story:** Como utilizador do CRM X, quero atualizar informações de contas existentes incluindo mudanças de tipo via Kanban, para que possa manter os dados atualizados e gerir o pipeline.

#### Acceptance Criteria

1. WHEN a user submits valid update data via PATCH /api/accounts/:id, THE CRM_X_System SHALL validate data using Zod_Schema and update specified fields in Supabase_Database
2. WHEN account_type is updated via Kanban drag-drop, THE CRM_X_System SHALL validate enum value (Lead, Prospect, Client) and update the field
3. WHEN account to update does not exist, THE CRM_X_System SHALL return 404 error response
4. WHEN update validation fails, THE CRM_X_System SHALL reject request and return Zod validation error messages
5. WHEN update is successful, THE CRM_X_System SHALL return the updated account data with new last_interaction timestamp

### Requirement 4

**User Story:** Como utilizador do CRM X, quero eliminar contas do sistema, para que possa remover registos desnecessários ou incorretos.

#### Acceptance Criteria

1. WHEN a user requests account deletion via DELETE /api/accounts/:id, THE CRM_X_System SHALL remove the specified account from Supabase_Database
2. WHEN account to delete does not exist, THE CRM_X_System SHALL return 404 error response
3. WHEN deletion is successful, THE CRM_X_System SHALL return confirmation response
4. WHEN account has related deal, THE CRM_X_System SHALL handle cascading operations according to foreign key constraints
5. WHEN deletion fails due to database constraints, THE CRM_X_System SHALL return appropriate error response with constraint details

### Requirement 5

**User Story:** Como utilizador do CRM X, quero que todas as requisições sejam autenticadas via Bearer Token usando API externa, para que apenas utilizadores autorizados possam aceder ao sistema.

#### Acceptance Criteria

1. WHEN any API request is received, THE CRM_X_System SHALL validate Bearer_Token by calling Authentication_API healthcheck endpoint
2. WHEN Authentication_API returns status 200, THE CRM_X_System SHALL consider token valid and proceed with request
3. WHEN Authentication_API returns status 401 with "Unauthorized" message, THE CRM_X_System SHALL return 401 unauthorized error response
4. WHEN Bearer_Token is missing from Authorization header, THE CRM_X_System SHALL return 401 unauthorized error response
5. WHEN token is found in Token_Cache, THE CRM_X_System SHALL skip Authentication_API call and proceed with cached validation

### Requirement 6

**User Story:** Como desenvolvedor do sistema, quero que o esquema da base de dados seja bem estruturado com enums e relações, para que a integridade dos dados seja garantida.

#### Acceptance Criteria

1. WHEN database schema is created, THE CRM_X_System SHALL define enums for user_role, account_status, account_type and deal_stage
2. WHEN profiles table is created, THE CRM_X_System SHALL reference auth.users and include self-referencing manager_id for hierarchy
3. WHEN accounts table is created, THE CRM_X_System SHALL include all specified fields with proper types and constraints
4. WHEN foreign key relationships are defined, THE CRM_X_System SHALL ensure referential integrity between profiles and accounts
5. WHEN default values are specified, THE CRM_X_System SHALL apply them automatically on record creation

### Requirement 7

**User Story:** Como desenvolvedor do sistema, quero implementar cache de tokens para otimizar performance, para que não seja necessário validar o mesmo token repetidamente via API externa.

#### Acceptance Criteria

1. WHEN a token is successfully validated via Authentication_API, THE CRM_X_System SHALL store token in Token_Cache with expiration time
2. WHEN same token is received in subsequent requests, THE CRM_X_System SHALL check Token_Cache before calling Authentication_API
3. WHEN cached token is found and not expired, THE CRM_X_System SHALL consider token valid without external API call
4. WHEN cached token is expired, THE CRM_X_System SHALL remove from cache and validate via Authentication_API
5. WHEN Token_Cache reaches memory limit, THE CRM_X_System SHALL implement LRU eviction strategy to manage cache size

### Requirement 8

**User Story:** Como desenvolvedor do sistema, quero que todas as operações de dados sejam validadas usando Zod schemas, para que a integridade e consistência dos dados seja mantida.

#### Acceptance Criteria

1. WHEN CreateAccountSchema is defined, THE CRM_X_System SHALL validate required fields (name, segment, owner_id) and optional fields
2. WHEN UpdateAccountSchema is defined, THE CRM_X_System SHALL validate partial updates with proper type checking
3. WHEN enum values are validated, THE CRM_X_System SHALL ensure only valid account_status, account_type values are accepted
4. WHEN validation fails, THE CRM_X_System SHALL return detailed Zod error messages with field-specific information
5. WHEN validation passes, THE CRM_X_System SHALL proceed with database operations using validated data