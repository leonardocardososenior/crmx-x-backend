# Design Document

## Overview

A funcionalidade getActiveAccounts implementa uma query simples de dashboard que conta e retorna o número total de contas ativas no sistema CRM. Esta funcionalidade segue os padrões estabelecidos do dashboard controller e se integra perfeitamente com a arquitetura atual do sistema CRM.

## Architecture

A funcionalidade segue a arquitetura estabelecida de três camadas:
- **Controller Layer**: Manipula requisições e respostas HTTP
- **Database Layer**: Executa queries Supabase para agregação de dados
- **Schema Layer**: Valida formato de resposta usando schemas Zod

A implementação aproveita a estrutura existente do dashboard controller e segue os mesmos padrões de tratamento de erro usados por outras queries de dashboard.

## Components and Interfaces

### Controller Function
- **Function**: `getActiveAccounts(req: Request, res: Response): Promise<void>`
- **Route**: `GET /api/dashboard/active-accounts`
- **Location**: `src/controllers/dashboardController.ts`

### Database Query
- **Table**: `account`
- **Filter**: `status = 'ACTIVE'` (using `AccountStatuses.ACTIVE`)
- **Aggregation**: `COUNT(*)` of all matching records
- **Client**: Supabase Admin client

### Response Schema
- **Schema**: `ActiveAccountsResponseSchema` (to be created)
- **Location**: `src/schemas/dashboardSchemas.ts`
- **Format**: `{ "total": number }`

## Data Models

### Input
- Nenhum parâmetro de entrada necessário
- Objeto Request padrão do Express

### Output
```typescript
{
  total: number  // Count of all accounts where status = 'ACTIVE'
}
```

### Database Query Structure
```sql
SELECT COUNT(*) as total 
FROM account 
WHERE status = 'ACTIVE'
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Property 1: ACTIVE status filtering accuracy
*For any* set of account records with mixed statuses, the getActiveAccounts query should return the count of only those records with ACTIVE status
**Validates: Requirements 1.1, 1.2, 2.1**

Property 2: Response format consistency
*For any* database state, the getActiveAccounts response should always contain a JSON object with a "total" field containing a numeric value
**Validates: Requirements 1.3, 2.5**

Property 3: Date-independent counting
*For any* set of ACTIVE accounts with different creation dates, the getActiveAccounts query should count all ACTIVE accounts regardless of their creation date
**Validates: Requirements 1.5**

Property 4: Error handling robustness
*For any* database error condition, the getActiveAccounts query should return an appropriate HTTP error response without exposing internal system details
**Validates: Requirements 2.4**

Property 5: HTTP response correctness
*For any* successful query execution, the getActiveAccounts endpoint should return HTTP status code 200 with appropriate content-type headers
**Validates: Requirements 3.3, 3.5**

## Error Handling

A funcionalidade implementa tratamento de erro abrangente seguindo os padrões estabelecidos:

### Database Errors
- Usa helper `handleDatabaseError()` para respostas de erro consistentes
- Registra erros com contexto apropriado para debugging
- Retorna formato de erro padronizado para clientes

### Internal Errors
- Usa helper `handleInternalError()` para exceções inesperadas
- Fornece mensagens de erro genéricas para prevenir vazamento de informações
- Mantém logging detalhado no lado do servidor

### Edge Cases
- Manipula valores null/undefined em registros de conta
- Retorna zero quando não existem contas ativas
- Manipula graciosamente respostas vazias do banco de dados

## Testing Strategy

### Unit Testing
A implementação incluirá testes unitários focados cobrindo:
- Funcionalidade básica com dados de exemplo
- Caso extremo: banco de dados vazio
- Condições de erro e tratamento adequado de erro

### Property-Based Testing
Testes baseados em propriedades serão implementados usando uma biblioteca de teste adequada para Node.js/TypeScript para verificar:
- **Property 1**: Precisão da filtragem de status ACTIVE através de vários conjuntos de dados
- **Property 2**: Consistência do formato de resposta independentemente do estado dos dados
- **Property 3**: Contagem independente de data para todas as contas ACTIVE
- **Property 4**: Robustez do tratamento de erro sob condições de falha
- **Property 5**: Correção da resposta HTTP incluindo códigos de status e headers

Cada teste baseado em propriedade executará um mínimo de 100 iterações para garantir cobertura abrangente do espaço de entrada. Os testes serão marcados com comentários referenciando suas propriedades de correção correspondentes usando o formato: '**Feature: dashboard-active-accounts-query, Property {number}: {property_text}**'.