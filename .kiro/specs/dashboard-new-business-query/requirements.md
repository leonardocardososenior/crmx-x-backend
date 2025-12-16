# Requirements Document

## Introduction

Este documento define os requisitos para implementar uma query de dashboard que retorna a quantidade de novos negócios criados em um período específico. A funcionalidade permite aos usuários visualizar quantos negócios foram criados no período selecionado (THIS_MONTH, THIS_YEAR, LAST_QUARTER), fornecendo insights sobre a atividade de geração de leads e oportunidades.

## Glossary

- **Dashboard_System**: O sistema de dashboard que fornece dados agregados para visualização
- **Business**: Entidade de negócio no sistema CRM que representa uma oportunidade de venda
- **New_Business**: Um negócio que foi criado dentro do período especificado
- **Period**: Intervalo de tempo para filtrar os negócios (THIS_MONTH, THIS_YEAR, LAST_QUARTER)
- **Business_Count**: Número total de negócios criados no período especificado

## Requirements

### Requirement 1

**User Story:** Como um usuário do dashboard, eu quero visualizar a quantidade de novos negócios criados em um período específico, para que eu possa acompanhar a atividade de geração de oportunidades.

#### Acceptance Criteria

1. WHEN a user requests new business data for a specific period, THE Dashboard_System SHALL return the count of businesses created within that period
2. WHEN the period is THIS_MONTH, THE Dashboard_System SHALL count businesses created from the first day of the current month until today
3. WHEN the period is THIS_YEAR, THE Dashboard_System SHALL count businesses created from January 1st of the current year until today
4. WHEN the period is LAST_QUARTER, THE Dashboard_System SHALL count businesses created in the previous quarter (3-month period)
5. WHEN no businesses exist for the specified period, THE Dashboard_System SHALL return zero as the count value

### Requirement 2

**User Story:** Como um desenvolvedor da API, eu quero que a query seja eficiente e bem estruturada, para que o sistema possa responder rapidamente às solicitações de dashboard.

#### Acceptance Criteria

1. WHEN the new business query executes, THE Dashboard_System SHALL filter businesses by created_at timestamp within the specified period
2. WHEN processing the query, THE Dashboard_System SHALL use appropriate database indexing on the created_at field
3. WHEN the API receives invalid period parameters, THE Dashboard_System SHALL return appropriate error responses with validation messages
4. WHEN the query completes successfully, THE Dashboard_System SHALL return data in JSON format with a "count" field
5. WHEN database errors occur, THE Dashboard_System SHALL handle them gracefully and return meaningful error messages

### Requirement 3

**User Story:** Como um usuário da API, eu quero que a endpoint seja consistente com os padrões existentes, para que eu possa integrá-la facilmente com outras funcionalidades do dashboard.

#### Acceptance Criteria

1. WHEN accessing the new business endpoint, THE Dashboard_System SHALL follow RESTful conventions for the URL structure
2. WHEN validating input parameters, THE Dashboard_System SHALL ensure the period parameter is one of the valid DashboardPeriod values
3. WHEN returning successful responses, THE Dashboard_System SHALL use appropriate HTTP status codes (200 for success)
4. WHEN authentication is required, THE Dashboard_System SHALL validate user permissions before processing requests
5. WHEN the response is generated, THE Dashboard_System SHALL include appropriate headers and content type (application/json)