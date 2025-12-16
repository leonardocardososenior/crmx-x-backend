# Design Document - Business Proposal CRUD Module

## Overview

Este documento detalha o design para implementação das entidades businessProposal e businessProposalItem no sistema CRM. O módulo seguirá o padrão arquitetural estabelecido pelas outras entidades do sistema, incluindo controllers, schemas de validação, tipos TypeScript, conversores de dados e suporte multilíngue completo.

As propostas comerciais representam ofertas formais que podem ser enviadas aos clientes, contendo itens detalhados com preços, quantidades e descontos. O sistema permitirá operações CRUD completas com validações robustas e mensagens de erro traduzidas.

## Architecture

O módulo seguirá a arquitetura em camadas estabelecida:

```
Controllers (businessProposalController.ts)
    ↓
Schemas (businessProposalSchemas.ts) 
    ↓
Types & Converters (types/index.ts)
    ↓
Database (Supabase)
```

### Componentes Principais:

1. **Controller Layer**: Gerencia requisições HTTP e orquestra operações CRUD
2. **Schema Layer**: Validação de dados usando Zod com mensagens traduzidas
3. **Type Layer**: Definições TypeScript e conversores entre formatos API/DB
4. **Database Layer**: Tabelas relacionais com constraints e índices

## Components and Interfaces

### Database Tables

#### business_proposal
```sql
CREATE TABLE business_proposal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business(id),
    responsible_id UUID NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Rascunho',
    date TIMESTAMPTZ NOT NULL,
    value NUMERIC NOT NULL,
    content TEXT,
    theme_color TEXT,
    terms_and_conditions TEXT,
    show_unit_prices BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### business_proposal_item
```sql
CREATE TABLE business_proposal_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES business_proposal(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES item(id),
    name TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    unit_price NUMERIC NOT NULL,
    discount NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### TypeScript Interfaces

#### Database Representations (snake_case)
```typescript
export interface BusinessProposalDB {
  id: string;
  business_id: string;
  responsible_id: string;
  title: string;
  status: string;
  date: string;
  value: number;
  content?: string | null;
  theme_color?: string | null;
  terms_and_conditions?: string | null;
  show_unit_prices?: boolean | null;
  created_at: string;
}

export interface BusinessProposalItemDB {
  id: string;
  proposal_id: string;
  item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  discount?: number | null;
  total: number;
  created_at: string;
}
```

#### API Representations (camelCase)
```typescript
export interface BusinessProposal {
  id: string;
  business: BusinessReference;
  responsible: UserReference;
  title: string;
  status: string;
  date: string;
  value: number;
  content?: string;
  items: BusinessProposalItem[];
  themeColor?: string;
  termsAndConditions?: string;
  showUnitPrices?: boolean;
  createdAt: string;
}

export interface BusinessProposalItem {
  id: string;
  proposal: BusinessProposalReference;
  item: ItemReference;
  name: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
  createdAt: string;
}
```

### Controller Endpoints

#### BusinessProposal Endpoints
- `POST /api/business-proposals` - Criar nova proposta
- `GET /api/business-proposals` - Listar propostas com filtros e paginação
- `GET /api/business-proposals/:id` - Obter proposta específica com itens
- `PUT /api/business-proposals/:id` - Atualizar proposta
- `DELETE /api/business-proposals/:id` - Excluir proposta e itens relacionados

#### BusinessProposalItem Endpoints
- `POST /api/business-proposals/:proposalId/items` - Adicionar item à proposta
- `GET /api/business-proposals/:proposalId/items` - Listar itens da proposta
- `GET /api/business-proposal-items/:id` - Obter item específico
- `PUT /api/business-proposal-items/:id` - Atualizar item
- `DELETE /api/business-proposal-items/:id` - Excluir item

## Data Models

### Enums and Constants

```typescript
export const BusinessProposalStatuses = {
  DRAFT: 'Rascunho',
  IN_REVIEW: 'Em Revisão', 
  SENT: 'Enviado',
  ACCEPTED: 'Aceito',
  REJECTED: 'Rejeitado'
} as const;

export type BusinessProposalStatus = typeof BusinessProposalStatuses[keyof typeof BusinessProposalStatuses];
```

### Request/Response Types

```typescript
export interface CreateBusinessProposalRequest {
  businessId: string;
  responsibleId: string;
  title: string;
  status?: string;
  date: string;
  value: number;
  content?: string;
  items: CreateBusinessProposalItemRequest[];
  themeColor?: string;
  termsAndConditions?: string;
  showUnitPrices?: boolean;
}

export interface CreateBusinessProposalItemRequest {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}
```

### Data Conversion Functions

```typescript
export function businessProposalDbToApi(dbProposal: BusinessProposalDB): BusinessProposal;
export function businessProposalApiToDb(apiProposal: CreateBusinessProposalRequest | UpdateBusinessProposalRequest): Partial<BusinessProposalDB>;
export function businessProposalItemDbToApi(dbItem: BusinessProposalItemDB): BusinessProposalItem;
export function businessProposalItemApiToDb(apiItem: CreateBusinessProposalItemRequest | UpdateBusinessProposalItemRequest): Partial<BusinessProposalItemDB>;
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

Após análise dos critérios de aceitação, identifiquei algumas redundâncias que podem ser consolidadas:

- Propriedades de validação de campos obrigatórios (1.1, 2.1) podem ser combinadas em uma propriedade geral
- Propriedades de validação de relacionamentos (1.3, 1.4, 2.2, 2.3, 4.2) podem ser agrupadas
- Propriedades de geração de UUID (1.5, 2.5) são redundantes e podem ser uma só
- Propriedades de cálculo de total (2.4, 4.4) são essencialmente a mesma
- Propriedades de tradução de mensagens (6.1, 6.2, 6.3, 6.4) podem ser consolidadas

### Correctness Properties

**Property 1: Required field validation**
*For any* business proposal or proposal item creation request, all required fields must be present and non-empty, otherwise the system should reject the request with appropriate validation errors
**Validates: Requirements 1.1, 2.1**

**Property 2: Referential integrity validation**
*For any* entity creation or update that includes foreign key references, all referenced entities must exist in the database, otherwise the system should reject the request with relationship error messages
**Validates: Requirements 1.3, 1.4, 2.2, 2.3, 4.2**

**Property 3: UUID generation uniqueness**
*For any* entity creation, the system should generate a unique UUID that does not conflict with existing entities
**Validates: Requirements 1.5, 2.5**

**Property 4: Total calculation accuracy**
*For any* proposal item with quantity, unit price, and discount values, the calculated total should equal (quantity × unitPrice) - discount
**Validates: Requirements 2.4, 4.4**

**Property 5: Paginated query consistency**
*For any* valid pagination parameters, the system should return results that respect the page size limits and provide accurate total counts
**Validates: Requirements 3.1**

**Property 6: Filter processing consistency**
*For any* valid filter syntax, the system should apply filters correctly and return only matching results
**Validates: Requirements 3.2**

**Property 7: Complete data retrieval**
*For any* existing proposal ID, the system should return the complete proposal data including all related items
**Validates: Requirements 3.3**

**Property 8: Validation error handling**
*For any* invalid input parameters, the system should return validation errors with appropriate HTTP status codes
**Validates: Requirements 3.5**

**Property 9: Entity existence validation**
*For any* update operation, the system should verify the target entity exists before applying changes
**Validates: Requirements 4.1**

**Property 10: Enum validation**
*For any* status field update, the new value must be one of the allowed enum values
**Validates: Requirements 4.3**

**Property 11: Cascade deletion consistency**
*For any* proposal deletion, all related proposal items should be automatically removed
**Validates: Requirements 5.1**

**Property 12: Individual item deletion**
*For any* proposal item deletion, only the specific item should be removed while maintaining the parent proposal
**Validates: Requirements 5.3**

**Property 13: Multilingual message consistency**
*For any* error or success operation, messages should be returned in the requested language (pt-BR, en-US, es-CO) with pt-BR as default
**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

**Property 14: Data format conversion consistency**
*For any* API request/response, field names should be converted between camelCase (API) and snake_case (database) formats correctly
**Validates: Requirements 7.1, 7.2**

**Property 15: Reference object structure**
*For any* relationship field in API responses, the system should return reference objects containing only the id field
**Validates: Requirements 7.3**

**Property 16: ISO 8601 timestamp format**
*For any* timestamp field, the system should use ISO 8601 format consistently
**Validates: Requirements 7.4**

## Error Handling

### Validation Errors
- Campo obrigatório ausente: HTTP 400 com mensagem específica do campo
- Formato inválido: HTTP 400 com detalhes do erro de formato
- Valor fora do range: HTTP 400 com limites esperados

### Relationship Errors  
- Entidade relacionada não encontrada: HTTP 400 com identificação da entidade
- Violação de constraint: HTTP 409 com detalhes do conflito

### Not Found Errors
- Entidade não encontrada: HTTP 404 com mensagem traduzida
- Rota não encontrada: HTTP 404 genérico

### Server Errors
- Erro interno: HTTP 500 com log detalhado
- Erro de banco de dados: HTTP 500 com contexto da operação

## Testing Strategy

### Dual Testing Approach

O módulo implementará tanto testes unitários quanto testes baseados em propriedades para garantir cobertura abrangente:

**Unit Testing:**
- Testes específicos para casos de borda e exemplos concretos
- Validação de integração entre componentes
- Casos específicos como status padrão "Rascunho" e idioma padrão pt-BR
- Testes de endpoints específicos com dados conhecidos

**Property-Based Testing:**
- Biblioteca: **fast-check** para TypeScript/Node.js
- Configuração mínima: **100 iterações** por teste de propriedade
- Cada teste de propriedade deve incluir comentário: **'Feature: business-proposal-crud, Property {number}: {property_text}'**
- Validação de propriedades universais que devem funcionar para qualquer entrada válida

**Requisitos específicos:**
- Cada propriedade de correção deve ser implementada por UM ÚNICO teste baseado em propriedades
- Testes devem ser colocados próximos à implementação para detecção precoce de erros
- Geradores inteligentes que constrainjam o espaço de entrada de forma apropriada
- Testes sem mocks quando possível para simplicidade máxima

### Test Organization
- Testes unitários: co-localizados com arquivos fonte usando sufixo `.test.ts`
- Testes de propriedade: organizados por funcionalidade com referências claras às propriedades do design
- Testes de integração: validação de fluxos completos de API