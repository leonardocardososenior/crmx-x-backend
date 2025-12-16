# Design Document

## Overview

A funcionalidade getSalesFunnel adiciona uma nova query ao sistema de dashboard que retorna a distribuição de negócios por estágio do funil de vendas. Esta implementação segue os padrões arquiteturais existentes do sistema, utilizando o controller dashboardController.ts, schemas de validação Zod, e o cliente Supabase para acesso aos dados.

## Architecture

A implementação segue a arquitetura MVC existente:

- **Controller Layer**: Nova função `getSalesFunnel` no `dashboardController.ts`
- **Schema Layer**: Novo schema de validação de resposta no `dashboardSchemas.ts`
- **Database Layer**: Query direta ao Supabase usando `supabaseAdmin`
- **Route Layer**: Nova rota GET `/api/dashboard/sales-funnel`

## Components and Interfaces

### Controller Function
```typescript
export async function getSalesFunnel(req: Request, res: Response): Promise<void>
```

### Response Schema
```typescript
export const SalesFunnelResponseSchema = z.record(
  z.string().min(1, 'Stage name cannot be empty'),
  z.number().int().min(0, 'Count cannot be negative')
);
```

### Database Query
- Tabela: `business`
- Campos: `stage` (para agrupamento)
- Filtros: `stage != 'Closed Lost'`
- Agregação: COUNT por stage

## Data Models

### Input
- Nenhum parâmetro de entrada necessário
- Request: GET `/api/dashboard/sales-funnel`

### Output
```json
{
  "Prospecting": 40,
  "Qualification": 5,
  "Proposal": 12,
  "Negotiation": 8,
  "Closed Won": 25
}
```

### Database Schema
- Utiliza a tabela `business` existente
- Campo `stage` do tipo BusinessStage (enum)
- Filtra registros onde `stage != BusinessStages.CLOSED_LOST`

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Property 1: Sales funnel aggregation accuracy
*For any* set of business records, the getSalesFunnel function should return counts that exactly match the number of records for each stage present in the input data
**Validates: Requirements 1.1**

Property 2: CLOSED_LOST exclusion
*For any* set of business records including CLOSED_LOST records, the getSalesFunnel function should return results that contain no CLOSED_LOST stage entries
**Validates: Requirements 1.2**

Property 3: Response format consistency
*For any* valid sales funnel result, the response should be a JSON object where all keys are stage names (strings) and all values are non-negative integers
**Validates: Requirements 1.3**

Property 4: Empty stage omission
*For any* set of business records, stages that have zero business records should not appear as keys in the response object
**Validates: Requirements 1.4**

Property 5: Successful request status
*For any* valid request to getSalesFunnel, when processing completes successfully, the HTTP response status should be 200
**Validates: Requirements 1.5**

Property 6: Database error handling
*For any* database error condition, the getSalesFunnel function should return an appropriate error response without crashing
**Validates: Requirements 2.5**

## Error Handling

A implementação deve seguir os padrões de tratamento de erro existentes:

- **Database Errors**: Usar `handleDatabaseError` para erros do Supabase
- **Internal Errors**: Usar `handleInternalError` para erros não esperados
- **Response Errors**: Retornar códigos HTTP apropriados (500 para erros internos)

## Testing Strategy

### Unit Testing
- Testar a função `getSalesFunnel` com diferentes conjuntos de dados
- Verificar tratamento de casos extremos (dados vazios, apenas CLOSED_LOST)
- Validar formato de resposta e códigos de status HTTP

### Property-Based Testing
A implementação deve usar uma biblioteca de property-based testing (como fast-check para TypeScript) para validar as propriedades de correção definidas acima. Cada teste deve:

- Executar no mínimo 100 iterações para cobertura adequada
- Ser marcado com comentário referenciando a propriedade específica do design
- Usar o formato: '**Feature: dashboard-sales-funnel-query, Property {number}: {property_text}**'
- Implementar exatamente uma propriedade por teste

### Integration Testing
- Testar o endpoint completo via requisições HTTP
- Verificar integração com o banco de dados Supabase
- Validar comportamento em cenários de erro de rede/banco