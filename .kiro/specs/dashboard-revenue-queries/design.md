# Design Document - Dashboard Revenue Queries

## Overview

Este documento descreve o design para implementar queries de dashboard que fornecem dados de receita agregados para análise de negócios. A funcionalidade inicial foca em uma endpoint REST que retorna dados de receita mensal agregados por ano, filtrando apenas negócios com status CLOSED_WON.

A solução seguirá os padrões arquiteturais existentes no sistema CRM, utilizando Express.js, TypeScript, Supabase e mantendo consistência com os controllers, schemas e tipos já implementados.

## Architecture

### High-Level Architecture

```
Client Request → Express Router → Dashboard Controller → Supabase Query → Response Formatting
```

### Component Integration

- **Router Layer**: Nova rota `/api/dashboard/revenue-per-year/:year` seguindo padrões RESTful
- **Controller Layer**: Novo `dashboardController.ts` com função `getRevenuePerYear`
- **Validation Layer**: Schema Zod para validação de parâmetros de entrada
- **Database Layer**: Query SQL otimizada usando Supabase client
- **Response Layer**: Formatação padronizada seguindo estrutura existente

## Components and Interfaces

### 1. Dashboard Controller

**Localização**: `src/controllers/dashboardController.ts`

**Responsabilidades**:
- Validar parâmetros de entrada (ano)
- Executar query de agregação no banco de dados
- Formatar resposta no formato especificado
- Tratar erros seguindo padrões existentes

### 2. Dashboard Schemas

**Localização**: `src/schemas/dashboardSchemas.ts`

**Responsabilidades**:
- Validação de parâmetros de rota (year)
- Definição de tipos TypeScript para entrada e saída

### 3. Dashboard Routes

**Localização**: `src/routes/dashboardRoutes.ts`

**Responsabilidades**:
- Definir endpoint GET `/revenue-per-year/:year`
- Conectar rota ao controller apropriado

### 4. Type Definitions

**Localização**: `src/types/index.ts` (extensão)

**Responsabilidades**:
- Definir interfaces para resposta de receita mensal
- Manter consistência com tipos existentes

## Data Models

### Input Model

```typescript
interface RevenuePerYearParams {
  year: number; // Ano para consulta (ex: 2024)
}
```

### Output Model

```typescript
interface MonthlyRevenueResponse {
  [monthName: string]: number; // Chave: nome do mês traduzido, Valor: receita total
}

// Exemplo de resposta (português):
{
  "Janeiro": 15000.50,
  "Fevereiro": 23000.75,
  "Março": 18500.00,
  // ... outros meses
  "Dezembro": 31000.25
}

// Exemplo de resposta (inglês):
{
  "January": 15000.50,
  "February": 23000.75,
  "March": 18500.00,
  // ... outros meses
  "December": 31000.25
}
```

### Database Query Model

A query utilizará a tabela `business` com os seguintes campos:
- `value`: Valor do negócio (NUMERIC)
- `stage`: Estágio do negócio (TEXT) - filtrar por 'Closed Won'
- `created_at`: Data de criação (TIMESTAMPTZ) - extrair mês e ano

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Após análise dos critérios de aceitação, foram identificadas as seguintes propriedades de correção, eliminando redundâncias:

**Property Reflection:**
- Requirements 1.2 and 2.1 both test filtering by CLOSED_WON stage - combined into Property 1
- Requirements 1.4 and 2.4 both test response format - combined into Property 2  
- Requirements 2.3 and 3.2 both test input validation - combined into Property 3

**Property 1: CLOSED_WON filtering consistency**
*For any* year and any set of business data, the revenue calculation should include only businesses with stage equal to 'Closed Won', regardless of other business attributes
**Validates: Requirements 1.2, 2.1**

**Property 2: Monthly aggregation accuracy**
*For any* set of CLOSED_WON businesses in a given year, the sum of individual business values grouped by month should equal the reported monthly revenue totals
**Validates: Requirements 1.3**

**Property 3: Response format consistency**
*For any* valid year parameter, the response should be a JSON object with string keys representing localized month names and numeric values representing revenue totals
**Validates: Requirements 1.4, 2.4**

**Property 4: Input validation robustness**
*For any* invalid year parameter (non-numeric, negative, or unreasonable values), the system should return appropriate error responses with meaningful messages
**Validates: Requirements 2.3, 3.2**

**Property 5: HTTP protocol compliance**
*For any* successful request, the system should return HTTP status 200 with appropriate content-type headers, and for any invalid request, appropriate error status codes
**Validates: Requirements 3.3, 3.5**

**Property 6: Error handling resilience**
*For any* database error condition, the system should handle the error gracefully and return meaningful error messages without exposing internal details
**Validates: Requirements 2.5**

## Error Handling

### Input Validation Errors
- **Invalid Year Parameter**: Retorna HTTP 400 com mensagem explicativa
- **Missing Year Parameter**: Retorna HTTP 400 indicando parâmetro obrigatório
- **Year Out of Range**: Retorna HTTP 400 para anos inválidos (ex: negativos, muito futuros)

### Database Errors
- **Connection Errors**: Retorna HTTP 500 com mensagem genérica
- **Query Timeout**: Retorna HTTP 504 com mensagem de timeout
- **Permission Errors**: Retorna HTTP 403 se aplicável

### Business Logic Errors
- **No Data Found**: Retorna resposta válida com zeros para todos os meses
- **Calculation Errors**: Log interno e retorno de HTTP 500

## Testing Strategy

### Dual Testing Approach

A estratégia de testes seguirá uma abordagem dual combinando testes unitários e testes baseados em propriedades (Property-Based Testing):

**Unit Tests**:
- Verificar exemplos específicos de entrada e saída
- Testar casos extremos conhecidos (anos sem dados, meses específicos)
- Validar integração com componentes existentes
- Testar cenários de erro específicos

**Property-Based Tests**:
- Verificar propriedades universais que devem ser mantidas em todas as execuções
- Usar biblioteca **fast-check** (já disponível no projeto) para geração de dados de teste
- Configurar mínimo de 100 iterações por teste de propriedade
- Cada teste de propriedade deve referenciar explicitamente a propriedade do documento de design

**Configuração de Testes**:
- Framework: Jest (já configurado no projeto)
- Property Testing: fast-check v3.15.0
- Localização: `src/controllers/__tests__/dashboardController.test.ts`
- Cada teste de propriedade deve incluir comentário: `**Feature: dashboard-revenue-queries, Property {number}: {property_text}**`

### Test Data Strategy

**Generators Inteligentes**:
- Gerar anos válidos (ex: 2020-2030)
- Gerar dados de business com diferentes estágios
- Gerar valores monetários realistas
- Gerar datas distribuídas ao longo do ano

**Edge Cases**:
- Anos sem nenhum business
- Meses específicos sem dados
- Valores monetários extremos (zero, muito altos)
- Diferentes moedas (se aplicável)

## Implementation Notes

### Database Query Optimization

```sql
-- Query otimizada para agregação mensal
SELECT 
  EXTRACT(MONTH FROM created_at) as month,
  SUM(value) as total_revenue
FROM business 
WHERE 
  stage = 'Closed Won' 
  AND EXTRACT(YEAR FROM created_at) = $1
GROUP BY EXTRACT(MONTH FROM created_at)
ORDER BY month;
```

### Performance Considerations

- **Indexing**: Utilizar índices existentes em `stage` e `created_at`
- **Caching**: Considerar cache para consultas frequentes (implementação futura)
- **Pagination**: Não aplicável para dados agregados
- **Memory Usage**: Query retorna máximo 12 registros (um por mês)

### Localization Strategy

**Month Name Translation**:
- Utilizar `getLanguageFromRequest()` de `src/utils/translations.ts` para detectar idioma
- Implementar função de tradução de meses baseada no locale
- Suportar inicialmente português (pt-BR) e inglês (en-US)
- Fallback para inglês se idioma não suportado

**Implementation Approach**:
```typescript
// Exemplo de mapeamento de meses
const monthNames = {
  'pt-BR': ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
           'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  'en-US': ['January', 'February', 'March', 'April', 'May', 'June',
           'July', 'August', 'September', 'October', 'November', 'December']
};
```

### Integration Points

- **Existing Controllers**: Seguir padrões de `businessController.ts` e `accountController.ts`
- **Error Handling**: Utilizar funções de `controllerHelpers.ts`
- **Validation**: Seguir padrões de schemas Zod existentes
- **Routing**: Integrar com estrutura de rotas existente
- **Translations**: Utilizar sistema de tradução existente em `src/utils/translations.ts`

### Future Extensibility

O design permite extensões futuras como:
- Filtros adicionais (responsável, conta, moeda)
- Diferentes períodos de agregação (trimestral, anual)
- Múltiplas métricas (quantidade de negócios, ticket médio)
- Comparações entre períodos