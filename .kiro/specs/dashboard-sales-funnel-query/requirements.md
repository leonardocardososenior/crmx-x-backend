# Requirements Document

## Introduction

Esta funcionalidade adiciona uma nova query ao dashboard para visualizar o funil de vendas, mostrando a distribuição de negócios por estágio. A query getSalesFunnel fornece uma visão rápida da pipeline de vendas, excluindo negócios perdidos para focar nos negócios ativos.

## Glossary

- **Dashboard_System**: O sistema de dashboard que fornece métricas e visualizações de vendas
- **Business**: Registro de negócio/oportunidade de venda no sistema
- **Stage**: Estágio atual do negócio no funil de vendas
- **Sales_Funnel**: Representação da distribuição de negócios por estágio
- **CLOSED_LOST**: Estágio que representa negócios perdidos/fechados sem sucesso

## Requirements

### Requirement 1

**User Story:** Como um usuário do dashboard, eu quero visualizar a distribuição de negócios por estágio do funil de vendas, para que eu possa acompanhar o progresso da pipeline de vendas.

#### Acceptance Criteria

1. WHEN a user requests the sales funnel data THEN the Dashboard_System SHALL return the count of business records grouped by stage
2. WHEN aggregating business records THEN the Dashboard_System SHALL exclude all business records with stage equal to CLOSED_LOST
3. WHEN returning the sales funnel data THEN the Dashboard_System SHALL format the response as a JSON object with stage names as keys and counts as values
4. WHEN no business records exist for a stage THEN the Dashboard_System SHALL omit that stage from the response
5. WHEN the request is processed successfully THEN the Dashboard_System SHALL return HTTP status 200 with the aggregated data

### Requirement 2

**User Story:** Como um desenvolvedor, eu quero que a query getSalesFunnel seja implementada seguindo os padrões existentes do sistema, para que ela seja consistente com outras funcionalidades do dashboard.

#### Acceptance Criteria

1. WHEN implementing the getSalesFunnel endpoint THEN the Dashboard_System SHALL follow the same controller pattern used by other dashboard queries
2. WHEN handling errors THEN the Dashboard_System SHALL use the existing error handling utilities
3. WHEN accessing the database THEN the Dashboard_System SHALL use the supabaseAdmin client
4. WHEN the endpoint is called THEN the Dashboard_System SHALL be accessible via GET request to /api/dashboard/sales-funnel
5. WHEN processing the request THEN the Dashboard_System SHALL handle database errors gracefully and return appropriate error responses