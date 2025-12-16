# Exemplos de Payload por Entidade - CRM System

Este documento contém exemplos de payload para todas as entidades do sistema CRM, baseado nos schemas e tipos definidos no projeto.

## 1. User (Usuário)

### Criar usuário
```json
{
  "name": "João Silva",
  "username": "joao.silva",
  "email": "joao.silva@empresa.com",
  "role": "SALES_REP",
  "manager": {
    "id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Atualizar usuário
```json
{
  "name": "João Silva Santos",
  "username": "joao.santos",
  "role": "MANAGER",
  "manager": {
    "id": "550e8400-e29b-41d4-a716-446655440001"
  }
}
```

### Resposta da API (GET por ID)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "João Silva",
  "username": "joao.silva",
  "email": "joao.silva@empresa.com",
  "role": "SALES_REP",
  "manager": {
    "id": "550e8400-e29b-41d4-a716-446655440000"
  },
  "createdAt": "2024-12-16T10:30:00Z"
}
```

### Resposta da API (GET com paginação)
```json
{
  "contents": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "João Silva",
      "username": "joao.silva",
      "email": "joao.silva@empresa.com",
      "role": "SALES_REP",
      "manager": {
        "id": "550e8400-e29b-41d4-a716-446655440000"
      },
      "createdAt": "2024-12-16T10:30:00Z"
    },
    {
      "id": "456e7890-e12b-34c5-d678-901234567890",
      "name": "Maria Santos",
      "username": "maria.santos",
      "email": "maria.santos@empresa.com",
      "role": "MANAGER",
      "createdAt": "2024-12-15T14:20:00Z"
    }
  ],
  "totalElements": 25,
  "totalPages": 3
}
```

## 2. Account (Conta)

### Criar conta
```json
{
  "name": "Empresa ABC Ltda",
  "segment": "Tecnologia",
  "responsible": {
    "id": "123e4567-e89b-12d3-a456-426614174000"
  },
  "email": "contato@empresaabc.com",
  "phone": "+55 11 99999-9999",
  "cnpj": "12.345.678/0001-90",
  "instagram": "https://instagram.com/empresaabc",
  "linkedin": "https://linkedin.com/company/empresaabc",
  "whatsapp": "+55 11 99999-9999"
}
```

### Atualizar conta
```json
{
  "responsible": {
    "id": "123e4567-e89b-12d3-a456-426614174001"
  },
  "status": "ACTIVE",
  "type": "Client",
  "pipeline": "Enterprise",
  "phone": "+55 11 88888-8888"
}
```

### Resposta da API (GET por ID)
```json
{
  "id": "456e7890-e12b-34c5-d678-901234567890",
  "name": "Empresa ABC Ltda",
  "segment": "Tecnologia",
  "responsible": {
    "id": "123e4567-e89b-12d3-a456-426614174000"
  },
  "status": "ACTIVE",
  "type": "Lead",
  "pipeline": "Standard",
  "lastInteraction": "2024-12-16T10:30:00Z",
  "email": "contato@empresaabc.com",
  "phone": "+55 11 99999-9999",
  "cnpj": "12.345.678/0001-90",
  "instagram": "https://instagram.com/empresaabc",
  "linkedin": "https://linkedin.com/company/empresaabc",
  "whatsapp": "+55 11 99999-9999",
  "createdAt": "2024-12-16T10:30:00Z"
}
```

### Resposta da API (GET com paginação)
```json
{
  "contents": [
    {
      "id": "456e7890-e12b-34c5-d678-901234567890",
      "name": "Empresa ABC Ltda",
      "segment": "Tecnologia",
      "responsible": {
        "id": "123e4567-e89b-12d3-a456-426614174000"
      },
      "status": "ACTIVE",
      "type": "Lead",
      "pipeline": "Standard",
      "lastInteraction": "2024-12-16T10:30:00Z",
      "email": "contato@empresaabc.com",
      "phone": "+55 11 99999-9999",
      "createdAt": "2024-12-16T10:30:00Z"
    },
    {
      "id": "789e0123-e45f-67g8-h901-234567890123",
      "name": "Tech Solutions Ltda",
      "segment": "Software",
      "responsible": {
        "id": "123e4567-e89b-12d3-a456-426614174001"
      },
      "status": "ACTIVE",
      "type": "Client",
      "pipeline": "Enterprise",
      "lastInteraction": "2024-12-15T16:45:00Z",
      "createdAt": "2024-12-10T09:15:00Z"
    }
  ],
  "totalElements": 150,
  "totalPages": 15
}
```

## 3. Business (Negócio)

### Criar negócio
```json
{
  "title": "Implementação Sistema CRM",
  "account": {
    "id": "456e7890-e12b-34c5-d678-901234567890"
  },
  "value": 50000.00,
  "currency": "BRL",
  "stage": "Proposal",
  "probability": 75,
  "responsible": {
    "id": "123e4567-e89b-12d3-a456-426614174000"
  },
  "closingDate": "2025-03-15"
}
```

### Atualizar negócio
```json
{
  "account": {
    "id": "456e7890-e12b-34c5-d678-901234567891"
  },
  "responsible": {
    "id": "123e4567-e89b-12d3-a456-426614174001"
  },
  "stage": "Negotiation",
  "probability": 85,
  "value": 55000.00
}
```

### Resposta da API (GET por ID)
```json
{
  "id": "789e0123-e45f-67g8-h901-234567890123",
  "title": "Implementação Sistema CRM",
  "account": {
    "id": "456e7890-e12b-34c5-d678-901234567890"
  },
  "value": 50000.00,
  "currency": "BRL",
  "stage": "Proposal",
  "probability": 75,
  "responsible": {
    "id": "123e4567-e89b-12d3-a456-426614174000"
  },
  "closingDate": "2025-03-15",
  "createdAt": "2024-12-16T10:30:00Z"
}
```

### Resposta da API (GET com paginação)
```json
{
  "contents": [
    {
      "id": "789e0123-e45f-67g8-h901-234567890123",
      "title": "Implementação Sistema CRM",
      "account": {
        "id": "456e7890-e12b-34c5-d678-901234567890"
      },
      "value": 50000.00,
      "currency": "BRL",
      "stage": "Proposal",
      "probability": 75,
      "responsible": {
        "id": "123e4567-e89b-12d3-a456-426614174000"
      },
      "closingDate": "2025-03-15",
      "createdAt": "2024-12-16T10:30:00Z"
    },
    {
      "id": "012e3456-e78f-90g1-h234-567890123456",
      "title": "Consultoria Digital",
      "account": {
        "id": "456e7890-e12b-34c5-d678-901234567891"
      },
      "value": 25000.00,
      "currency": "BRL",
      "stage": "Negotiation",
      "probability": 60,
      "responsible": {
        "id": "123e4567-e89b-12d3-a456-426614174001"
      },
      "closingDate": "2025-02-28",
      "createdAt": "2024-12-14T11:20:00Z"
    }
  ],
  "totalElements": 87,
  "totalPages": 9
}
```

## 4. Item (Produto/Serviço)

### Criar item
```json
{
  "name": "Licença CRM Premium",
  "type": "SERVICE",
  "price": 299.99,
  "skuCode": "CRM-PREM-001",
  "description": "Licença mensal do CRM Premium com todas as funcionalidades"
}
```

### Atualizar item
```json
{
  "price": 349.99,
  "description": "Licença mensal do CRM Premium com todas as funcionalidades + suporte 24/7"
}
```

### Resposta da API (GET por ID)
```json
{
  "id": "012e3456-e78f-90g1-h234-567890123456",
  "name": "Licença CRM Premium",
  "type": "SERVICE",
  "price": 299.99,
  "skuCode": "CRM-PREM-001",
  "description": "Licença mensal do CRM Premium com todas as funcionalidades",
  "createdAt": "2024-12-16T10:30:00Z"
}
```

### Resposta da API (GET com paginação)
```json
{
  "contents": [
    {
      "id": "012e3456-e78f-90g1-h234-567890123456",
      "name": "Licença CRM Premium",
      "type": "SERVICE",
      "price": 299.99,
      "skuCode": "CRM-PREM-001",
      "description": "Licença mensal do CRM Premium com todas as funcionalidades",
      "createdAt": "2024-12-16T10:30:00Z"
    },
    {
      "id": "345e6789-e01f-23g4-h567-890123456789",
      "name": "Consultoria Técnica",
      "type": "SERVICE",
      "price": 150.00,
      "skuCode": "CONS-TEC-001",
      "description": "Hora de consultoria técnica especializada",
      "createdAt": "2024-12-15T08:45:00Z"
    },
    {
      "id": "678e9012-e34f-56g7-h890-123456789012",
      "name": "Servidor Cloud",
      "type": "PRODUCT",
      "price": 89.90,
      "skuCode": "SRV-CLD-001",
      "createdAt": "2024-12-14T13:30:00Z"
    }
  ],
  "totalElements": 42,
  "totalPages": 5
}
```

## 5. AccountTimeline (Timeline da Conta)

### Criar entrada na timeline
```json
{
  "account": {
    "id": "456e7890-e12b-34c5-d678-901234567890"
  },
  "type": "CALL",
  "title": "Ligação de follow-up",
  "description": "Cliente demonstrou interesse na proposta. Agendada reunião para próxima semana.",
  "date": "2024-12-16T14:30:00Z",
  "responsible": {
    "id": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### Atualizar entrada na timeline
```json
{
  "account": {
    "id": "456e7890-e12b-34c5-d678-901234567891"
  },
  "responsible": {
    "id": "123e4567-e89b-12d3-a456-426614174001"
  },
  "title": "Ligação de follow-up - Reunião confirmada",
  "description": "Cliente confirmou reunião para 23/12 às 15h. Preparar apresentação técnica."
}
```

### Resposta da API (GET por ID)
```json
{
  "id": "345e6789-e01f-23g4-h567-890123456789",
  "account": {
    "id": "456e7890-e12b-34c5-d678-901234567890"
  },
  "type": "CALL",
  "title": "Ligação de follow-up",
  "description": "Cliente demonstrou interesse na proposta. Agendada reunião para próxima semana.",
  "date": "2024-12-16T14:30:00Z",
  "responsible": {
    "id": "123e4567-e89b-12d3-a456-426614174000"
  },
  "createdAt": "2024-12-16T10:30:00Z"
}
```

### Resposta da API (GET com paginação)
```json
{
  "contents": [
    {
      "id": "345e6789-e01f-23g4-h567-890123456789",
      "account": {
        "id": "456e7890-e12b-34c5-d678-901234567890"
      },
      "type": "CALL",
      "title": "Ligação de follow-up",
      "description": "Cliente demonstrou interesse na proposta. Agendada reunião para próxima semana.",
      "date": "2024-12-16T14:30:00Z",
      "responsible": {
        "id": "123e4567-e89b-12d3-a456-426614174000"
      },
      "createdAt": "2024-12-16T10:30:00Z"
    },
    {
      "id": "678e9012-e34f-56g7-h890-123456789012",
      "account": {
        "id": "456e7890-e12b-34c5-d678-901234567890"
      },
      "type": "EMAIL",
      "title": "Envio de proposta",
      "description": "Proposta comercial enviada por email para análise.",
      "date": "2024-12-15T09:15:00Z",
      "responsible": {
        "id": "123e4567-e89b-12d3-a456-426614174000"
      },
      "createdAt": "2024-12-15T09:15:00Z"
    },
    {
      "id": "901e2345-e67f-89g0-h123-456789012345",
      "account": {
        "id": "456e7890-e12b-34c5-d678-901234567891"
      },
      "type": "MEETING",
      "title": "Reunião de apresentação",
      "date": "2024-12-14T15:00:00Z",
      "responsible": {
        "id": "123e4567-e89b-12d3-a456-426614174001"
      },
      "createdAt": "2024-12-14T15:00:00Z"
    }
  ],
  "totalElements": 156,
  "totalPages": 16
}
```

## 6. BusinessProposal (Proposta Comercial)

### Criar proposta
```json
{
  "business": {
    "id": "789e0123-e45f-67g8-h901-234567890123"
  },
  "responsible": {
    "id": "123e4567-e89b-12d3-a456-426614174000"
  },
  "title": "Proposta CRM Premium - Empresa ABC",
  "status": "Rascunho",
  "date": "2024-12-20",
  "value": 3599.88,
  "content": "Proposta para implementação completa do sistema CRM",
  "themeColor": "#007bff",
  "termsAndConditions": "Pagamento em 30 dias. Garantia de 12 meses.",
  "showUnitPrices": true
}
```

### Atualizar proposta
```json
{
  "business": {
    "id": "789e0123-e45f-67g8-h901-234567890124"
  },
  "responsible": {
    "id": "123e4567-e89b-12d3-a456-426614174001"
  },
  "status": "Enviado",
  "themeColor": "#28a745",
  "termsAndConditions": "Pagamento em 45 dias. Garantia de 18 meses."
}
```

### Resposta da API (GET por ID)
```json
{
  "id": "901e2345-e67f-89g0-h123-456789012345",
  "business": {
    "id": "789e0123-e45f-67g8-h901-234567890123"
  },
  "responsible": {
    "id": "123e4567-e89b-12d3-a456-426614174000"
  },
  "title": "Proposta CRM Premium - Empresa ABC",
  "status": "Rascunho",
  "date": "2024-12-20",
  "value": 3599.88,
  "content": "Proposta para implementação completa do sistema CRM",
  "themeColor": "#007bff",
  "termsAndConditions": "Pagamento em 30 dias. Garantia de 12 meses.",
  "showUnitPrices": true,
  "createdAt": "2024-12-16T10:30:00Z"
}
```

### Resposta da API (GET com paginação)
```json
{
  "contents": [
    {
      "id": "901e2345-e67f-89g0-h123-456789012345",
      "business": {
        "id": "789e0123-e45f-67g8-h901-234567890123"
      },
      "responsible": {
        "id": "123e4567-e89b-12d3-a456-426614174000"
      },
      "title": "Proposta CRM Premium - Empresa ABC",
      "status": "Rascunho",
      "date": "2024-12-20",
      "value": 3599.88,
      "content": "Proposta para implementação completa do sistema CRM",
      "themeColor": "#007bff",
      "termsAndConditions": "Pagamento em 30 dias. Garantia de 12 meses.",
      "showUnitPrices": true,
      "createdAt": "2024-12-16T10:30:00Z"
    },
    {
      "id": "234e5678-e90f-12g3-h456-789012345678",
      "business": {
        "id": "789e0123-e45f-67g8-h901-234567890124"
      },
      "responsible": {
        "id": "123e4567-e89b-12d3-a456-426614174001"
      },
      "title": "Proposta Consultoria Digital",
      "status": "Enviado",
      "date": "2024-12-18",
      "value": 2500.00,
      "themeColor": "#28a745",
      "showUnitPrices": false,
      "createdAt": "2024-12-15T11:45:00Z"
    }
  ],
  "totalElements": 73,
  "totalPages": 8
}
```

## 7. BusinessProposalItem (Item da Proposta)

### Criar item da proposta
```json
{
  "proposal": {
    "id": "901e2345-e67f-89g0-h123-456789012345"
  },
  "item": {
    "id": "012e3456-e78f-90g1-h234-567890123456"
  },
  "name": "Consultoria Técnica",
  "quantity": 20,
  "unitPrice": 150.00,
  "discount": 200.00
}
```

### Atualizar item da proposta
```json
{
  "proposal": {
    "id": "901e2345-e67f-89g0-h123-456789012346"
  },
  "item": {
    "id": "012e3456-e78f-90g1-h234-567890123457"
  },
  "quantity": 25,
  "discount": 250.00,
  "name": "Consultoria Técnica Avançada"
}
```

### Resposta da API (GET por ID)
```json
{
  "id": "890e1234-e56f-78g9-h012-345678901234",
  "proposal": {
    "id": "901e2345-e67f-89g0-h123-456789012345"
  },
  "item": {
    "id": "012e3456-e78f-90g1-h234-567890123456"
  },
  "name": "Consultoria Técnica",
  "quantity": 20,
  "unitPrice": 150.00,
  "discount": 200.00,
  "total": 2800.00,
  "createdAt": "2024-12-16T10:30:00Z"
}
```

### Resposta da API (GET com paginação)
```json
{
  "contents": [
    {
      "id": "890e1234-e56f-78g9-h012-345678901234",
      "proposal": {
        "id": "901e2345-e67f-89g0-h123-456789012345"
      },
      "item": {
        "id": "012e3456-e78f-90g1-h234-567890123456"
      },
      "name": "Consultoria Técnica",
      "quantity": 20,
      "unitPrice": 150.00,
      "discount": 200.00,
      "total": 2800.00,
      "createdAt": "2024-12-16T10:30:00Z"
    },
    {
      "id": "567e8901-e23f-45g6-h789-012345678901",
      "proposal": {
        "id": "901e2345-e67f-89g0-h123-456789012345"
      },
      "item": {
        "id": "345e6789-e01f-23g4-h567-890123456789"
      },
      "name": "Licença CRM Premium",
      "quantity": 12,
      "unitPrice": 299.99,
      "discount": 0.00,
      "total": 3599.88,
      "createdAt": "2024-12-16T10:35:00Z"
    },
    {
      "id": "234e5678-e90f-12g3-h456-789012345678",
      "proposal": {
        "id": "234e5678-e90f-12g3-h456-789012345679"
      },
      "item": {
        "id": "678e9012-e34f-56g7-h890-123456789012"
      },
      "name": "Servidor Cloud",
      "quantity": 3,
      "unitPrice": 89.90,
      "discount": 50.00,
      "total": 219.70,
      "createdAt": "2024-12-15T14:20:00Z"
    }
  ],
  "totalElements": 128,
  "totalPages": 13
}
```

## Valores Válidos para Enums

### UserRole
- `ADMIN` - Administrador do sistema
- `MANAGER` - Gerente de vendas
- `SALES_REP` - Representante de vendas

### AccountStatus
- `ACTIVE` - Conta ativa
- `INACTIVE` - Conta inativa

### AccountType
- `Lead` - Lead (prospect inicial)
- `Prospect` - Prospect qualificado
- `Client` - Cliente ativo

### BusinessStage
- `Prospecting` - Prospecção
- `Qualification` - Qualificação
- `Proposal` - Proposta
- `Negotiation` - Negociação
- `Closed Won` - Fechado ganho
- `Closed Lost` - Fechado perdido

### Currency
- `BRL` - Real brasileiro
- `USD` - Dólar americano
- `EUR` - Euro

### ItemType
- `PRODUCT` - Produto físico
- `SERVICE` - Serviço

### TimelineType
- `NOTE` - Anotação
- `CALL` - Ligação telefônica
- `EMAIL` - E-mail
- `MEETING` - Reunião
- `SYSTEM` - Evento do sistema

### BusinessProposalStatus
- `Rascunho` - Proposta em elaboração
- `Em Revisão` - Proposta sendo revisada
- `Enviado` - Proposta enviada ao cliente
- `Aceito` - Proposta aceita pelo cliente
- `Rejeitado` - Proposta rejeitada pelo cliente

## Padronização de Relacionamentos

**IMPORTANTE**: Todos os relacionamentos agora seguem o mesmo padrão tanto para GET quanto para POST/PUT:

### ✅ Formato Padronizado (Novo)
```json
{
  "responsible": {
    "id": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### ❌ Formato Antigo (Descontinuado)
```json
{
  "responsibleId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Relacionamentos Padronizados:
- `responsible` ao invés de `responsibleId`
- `account` ao invés de `accountId`
- `business` ao invés de `businessId`
- `manager` ao invés de `managerId`
- `item` ao invés de `itemId`
- `proposal` ao invés de `proposalId`

**Nota**: O campo `responsible` é usado para Account, Business e AccountTimeline, mantendo consistência na nomenclatura.

### Exemplos de Migração

#### ❌ Formato Antigo (Descontinuado)
```json
// POST /api/accounts
{
  "name": "Empresa XYZ",
  "responsibleId": "123e4567-e89b-12d3-a456-426614174000"
}

// PUT /api/business/789
{
  "accountId": "456e7890-e12b-34c5-d678-901234567890",
  "ownerId": "123e4567-e89b-12d3-a456-426614174000"
}
```

#### ✅ Formato Novo (Padronizado)
```json
// POST /api/accounts
{
  "name": "Empresa XYZ",
  "responsible": {
    "id": "123e4567-e89b-12d3-a456-426614174000"
  }
}

// PUT /api/business/789
{
  "account": {
    "id": "456e7890-e12b-34c5-d678-901234567890"
  },
  "responsible": {
    "id": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

## Rotas da API

### BusinessProposalItem (CRUD Completo)

O `BusinessProposalItem` agora possui um CRUD completo e independente:

- **POST** `/api/business-proposal-items` - Criar item da proposta
- **GET** `/api/business-proposal-items` - Listar itens (com filtros e paginação)
- **GET** `/api/business-proposal-items/:id` - Buscar item por ID
- **PUT** `/api/business-proposal-items/:id` - Atualizar item
- **DELETE** `/api/business-proposal-items/:id` - Deletar item

### Filtros disponíveis para BusinessProposalItem

- `proposalId` - Filtrar por proposta específica
- `itemId` - Filtrar por item específico
- `search` - Buscar por nome do item
- `minQuantity` / `maxQuantity` - Filtrar por faixa de quantidade
- `minUnitPrice` / `maxUnitPrice` - Filtrar por faixa de preço unitário
- `page` / `size` - Paginação

**Exemplo de busca por proposta:**
```
GET /api/business-proposal-items?proposalId=901e2345-e67f-89g0-h123-456789012345&page=1&size=10
```

**Nota**: Os filtros de query parameters ainda usam o formato `Id` (ex: `proposalId`, `accountId`) para manter compatibilidade com URLs.

### Campos Opcionais em Relacionamentos

Nos payloads de **PUT** (atualização), os relacionamentos são opcionais. Você pode:

1. **Omitir completamente** se não quiser alterar:
```json
{
  "name": "Novo nome",
  "status": "ACTIVE"
  // responsible não incluído = não será alterado
}
```

2. **Incluir para alterar**:
```json
{
  "name": "Novo nome",
  "responsible": {
    "id": "novo-id-do-responsavel"
  }
}
```

## Formato de Resposta Paginada

Todas as APIs de listagem (GET) retornam dados no formato paginado padrão:

### Estrutura da Resposta Paginada
```json
{
  "contents": [
    // Array com os registros da página atual
  ],
  "totalElements": 150,  // Total de registros no banco
  "totalPages": 15       // Total de páginas (baseado no size)
}
```

### Parâmetros de Paginação
- **page**: Número da página (começa em 1) - padrão: 1
- **size**: Quantidade de registros por página (máximo 100) - padrão: 10

### Exemplos de URLs com Paginação
```
GET /api/accounts?page=1&size=20
GET /api/business?page=2&size=5&filter=stage="Proposal"
GET /api/account-timeline?accountId=123&page=1&size=15
GET /api/business-proposal-items?proposalId=456&page=3&size=25
```

### Cálculo de Páginas
- **totalPages** = ceil(totalElements / size)
- **Página atual** = page
- **Registros na página** = length(contents)

### Navegação
- **Primeira página**: page=1
- **Última página**: page=totalPages
- **Próxima página**: page + 1 (se page < totalPages)
- **Página anterior**: page - 1 (se page > 1)

## Notas Importantes

1. **UUIDs**: Todos os IDs são UUIDs v4 válidos
2. **Datas**: Usar formato ISO 8601 para timestamps (`2024-12-16T10:30:00Z`)
3. **Datas simples**: Usar formato YYYY-MM-DD para datas (`2024-12-20`)
4. **Campos opcionais**: Campos marcados como opcionais podem ser omitidos ou enviados como `null`
5. **Validação**: Todos os payloads são validados pelos schemas Zod definidos no projeto
6. **Relacionamentos**: Entidades relacionadas são representadas por objetos com apenas o `id`
7. **Cálculos**: O campo `total` em `BusinessProposalItem` é calculado automaticamente: `(quantity × unitPrice) - discount`
8. **BusinessProposal**: Não contém mais o array `items`. Os itens devem ser gerenciados separadamente via API do `BusinessProposalItem`
9. **Vínculo**: A relação entre `BusinessProposal` e `BusinessProposalItem` é feita através do campo `proposalId`
10. **Validação de Relacionamentos**: Todos os IDs de relacionamento são validados - a API retornará erro 400 se um ID não existir
11. **Campos Obrigatórios**: Em POST, relacionamentos marcados como obrigatórios devem ser fornecidos
12. **Campos Opcionais**: Em PUT, todos os relacionamentos são opcionais - omitir significa "não alterar"