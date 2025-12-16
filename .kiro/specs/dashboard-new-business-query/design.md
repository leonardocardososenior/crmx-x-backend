# Design Document

## Overview

A funcionalidade getNewBusiness implementa uma query de dashboard que calcula e retorna a quantidade de novos negócios criados em um período específico. Esta funcionalidade segue os padrões estabelecidos do controller de dashboard e se integra perfeitamente com a arquitetura atual do sistema CRM.

## Architecture

A funcionalidade segue a arquitetura estabelecida de três camadas:
- **Controller Layer**: Manipula requisições e respostas HTTP
- **Database Layer**: Executa queries Supabase para contagem de dados
- **Schema Layer**: Valida formato de resposta usando schemas Zod

A implementação aproveita a estrutura existente do dashboard controller e segue os mesmos padrões de tratamento de erro usados por outras queries de dashboard.

## Components and Interfaces

### Controller Function
- **Function**: `getNewBusiness(req: Request, res: Response): Promise<void>`
- **Route**: `GET /api/dashboard/new-business`
- **Location**: `src/controllers/dashboardController.ts`
- **Query Parameter**: `period` (DashboardPeriod: THIS_MONTH | THIS_YEAR | LAST_QUARTER)

### Database Query
- **Table**: `business`
- **Filter**: `created_at` within specified period range
- **Aggregation**: `COUNT(*)` of all matching records
- **Client**: Supabase Admin client

### Response Schema
- **Schema**: `NewBusinessResponseSchema`
- **Location**: `src/schemas/dashboardSchemas.ts`
- **Format**: `{ "count": number }`

### Period Calculation Logic
- **THIS_MONTH**: From first day of current month to now
- **THIS_YEAR**: From January 1st of current year to now  
- **LAST_QUARTER**: Previous 3-month quarter period

## Data Models

### Input
```typescript
{
  period: DashboardPeriod  // Query parameter: THIS_MONTH | THIS_YEAR | LAST_QUARTER
}
```

### Output
```typescript
{
  count: number  // Number of business records created in the specified period
}
```

### Database Query Structure
```sql
-- Example for THIS_MONTH
SELECT COUNT(*) as count 
FROM business 
WHERE created_at >= '2024-01-01 00:00:00' 
  AND created_at <= '2024-01-31 23:59:59'
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Property 1: Period filtering accuracy
*For any* set of business records with various creation dates and any valid period, the getNewBusiness query should return the count of only those businesses created within the specified period boundaries
**Validates: Requirements 1.1, 2.1**

Property 2: Period calculation correctness
*For any* valid DashboardPeriod (THIS_MONTH, THIS_YEAR, LAST_QUARTER), the system should correctly calculate the date range boundaries and include only businesses created within those exact boundaries
**Validates: Requirements 1.2, 1.3, 1.4**

Property 3: Input validation and error handling
*For any* invalid period parameter value, the system should return appropriate error responses with validation messages and proper HTTP status codes
**Validates: Requirements 2.3, 3.2**

Property 4: Response format consistency
*For any* valid request, the getNewBusiness response should always contain a JSON object with a "count" field containing a numeric value and return HTTP status 200
**Validates: Requirements 2.4, 3.3**

## Error Handling

A funcionalidade implementa tratamento de erro abrangente seguindo os padrões estabelecidos:

### Validation Errors
- Valida parâmetro `period` usando enum `DashboardPeriod`
- Retorna erro 400 com mensagem descritiva para valores inválidos
- Usa schemas Zod para validação consistente

### Database Errors
- Usa helper `handleDatabaseError()` para respostas de erro consistentes
- Registra erros com contexto apropriado para debugging
- Retorna formato de erro padronizado para clientes

### Internal Errors
- Usa helper `handleInternalError()` para exceções inesperadas
- Fornece mensagens de erro genéricas para prevenir vazamento de informações
- Mantém logging detalhado no lado do servidor

### Edge Cases
- Manipula valores null/undefined em registros de negócio
- Retorna zero quando nenhum negócio existe no período especificado
- Manipula graciosamente respostas vazias do banco de dados

## Testing Strategy

### Unit Testing
A implementação incluirá testes unitários focados cobrindo:
- Funcionalidade básica com dados de exemplo para cada período
- Casos extremos: banco de dados vazio, períodos sem dados
- Condições de erro e tratamento adequado de erros
- Validação de parâmetros de entrada

### Property-Based Testing
Testes baseados em propriedades serão implementados usando uma biblioteca de testes adequada para Node.js/TypeScript para verificar:
- **Property 1**: Precisão da filtragem por período em vários conjuntos de dados
- **Property 2**: Correção do cálculo de período para todos os tipos de período
- **Property 3**: Robustez da validação de entrada e tratamento de erros
- **Property 4**: Consistência do formato de resposta independentemente do estado dos dados

Cada teste baseado em propriedade executará um mínimo de 100 iterações para garantir cobertura abrangente do espaço de entrada. Os testes serão marcados com comentários referenciando suas propriedades de correção correspondentes usando o formato: '**Feature: dashboard-new-business-query, Property {number}: {property_text}**'.