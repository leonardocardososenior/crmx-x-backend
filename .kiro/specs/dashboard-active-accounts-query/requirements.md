# Requirements Document

## Introduction

Este documento define os requisitos para implementar uma query de dashboard que retorna o total de contas ativas no sistema CRM. A funcionalidade fornece uma contagem simples de todas as contas com status ACTIVE para visualização no dashboard, sem necessidade de filtros de período.

## Glossary

- **Dashboard_System**: O sistema de dashboard que fornece dados agregados para visualização
- **Account**: Entidade de conta no sistema CRM que representa clientes, prospects ou leads
- **ACTIVE**: Status de conta que indica que a conta está ativa no sistema
- **Active_Accounts_Query**: Query que conta e retorna o número total de contas ativas

## Requirements

### Requirement 1

**User Story:** Como um usuário do dashboard, eu quero visualizar o número total de contas ativas, para que eu possa ter uma visão geral da base de clientes ativos.

#### Acceptance Criteria

1. WHEN a user requests active accounts data, THE Dashboard_System SHALL count all accounts with status equal to ACTIVE
2. WHEN calculating the total, THE Dashboard_System SHALL include only accounts where status field equals ACTIVE
3. WHEN returning the count, THE Dashboard_System SHALL format the response as a JSON object with a "total" field containing the count
4. WHEN no active accounts exist, THE Dashboard_System SHALL return zero as the total value
5. WHEN the query completes successfully, THE Dashboard_System SHALL return the count without applying any date or period filters

### Requirement 2

**User Story:** Como um desenvolvedor da API, eu quero que a query seja eficiente e consistente com outras queries de dashboard, para que o sistema mantenha performance e padrões uniformes.

#### Acceptance Criteria

1. WHEN the active accounts query executes, THE Dashboard_System SHALL filter accounts by status before counting
2. WHEN processing the database query, THE Dashboard_System SHALL use appropriate indexing strategies for the status field
3. WHEN the API receives the request, THE Dashboard_System SHALL validate the request format
4. WHEN database errors occur, THE Dashboard_System SHALL handle them gracefully and return meaningful error messages
5. WHEN the query completes, THE Dashboard_System SHALL return data in the same JSON format pattern as other dashboard queries

### Requirement 3

**User Story:** Como um usuário da API, eu quero que a endpoint seja consistente com os padrões existentes de dashboard, para que eu possa integrá-la facilmente com outras funcionalidades.

#### Acceptance Criteria

1. WHEN accessing the active accounts endpoint, THE Dashboard_System SHALL follow RESTful conventions for the URL structure
2. WHEN processing the request, THE Dashboard_System SHALL not require any query parameters
3. WHEN returning successful responses, THE Dashboard_System SHALL use appropriate HTTP status codes
4. WHEN authentication is required, THE Dashboard_System SHALL validate user permissions before processing requests
5. WHEN the response is generated, THE Dashboard_System SHALL include appropriate headers and content type