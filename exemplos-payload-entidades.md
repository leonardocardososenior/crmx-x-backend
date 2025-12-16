# Exemplos de Payload por Entidade - CRM System

Este documento contém exemplos de payload para todas as entidades do sistema CRM, baseado nos schemas e tipos definidos no projeto.

## 1. User (Usuário)

### Criar usuário
```json
{
  "name": "João Silva",
  "email": "joao.silva@empresa.com",
  "role": "SALES_REP",
  "managerId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Atualizar usuário
```json
{
  "name": "João Silva Santos",
  "role": "MANAGER"
}
```

### Resposta da API
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "João Silva",
  "email": "joao.silva@empresa.com",
  "role": "SALES_REP",
  "manager": {
    "id": "550e8400-e29b-41d4-a716-446655440000"
  },
  "createdAt": "2024-12-16T10:30:00Z"
}
```

## 2. Account (Conta)

### Criar conta
```json
{
  "name": "Empresa ABC Ltda",
  "segment": "Tecnologia",
  "responsibleId": "123e4567-e89b-12d3-a456-426614174000",
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
  "status": "ACTIVE",
  "type": "Client",
  "pipeline": "Enterprise",
  "phone": "+55 11 88888-8888"
}
```

### Resposta da API
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

## 3. Business (Negócio)

### Criar negócio
```json
{
  "title": "Implementação Sistema CRM",
  "accountId": "456e7890-e12b-34c5-d678-901234567890",
  "value": 50000.00,
  "currency": "BRL",
  "stage": "Proposal",
  "probability": 75,
  "ownerId": "123e4567-e89b-12d3-a456-426614174000",
  "closingDate": "2025-03-15"
}
```

### Atualizar negócio
```json
{
  "stage": "Negotiation",
  "probability": 85,
  "value": 55000.00
}
```

### Resposta da API
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
  "owner": {
    "id": "123e4567-e89b-12d3-a456-426614174000"
  },
  "closingDate": "2025-03-15",
  "createdAt": "2024-12-16T10:30:00Z"
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

### Resposta da API
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

## 5. AccountTimeline (Timeline da Conta)

### Criar entrada na timeline
```json
{
  "accountId": "456e7890-e12b-34c5-d678-901234567890",
  "type": "CALL",
  "title": "Ligação de follow-up",
  "description": "Cliente demonstrou interesse na proposta. Agendada reunião para próxima semana.",
  "date": "2024-12-16T14:30:00Z",
  "createdBy": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Atualizar entrada na timeline
```json
{
  "title": "Ligação de follow-up - Reunião confirmada",
  "description": "Cliente confirmou reunião para 23/12 às 15h. Preparar apresentação técnica."
}
```

### Resposta da API
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
  "createdBy": {
    "id": "123e4567-e89b-12d3-a456-426614174000"
  },
  "createdAt": "2024-12-16T10:30:00Z"
}
```

## 6. BusinessProposal (Proposta Comercial)

### Criar proposta
```json
{
  "businessId": "789e0123-e45f-67g8-h901-234567890123",
  "responsibleId": "123e4567-e89b-12d3-a456-426614174000",
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
  "status": "Enviado",
  "themeColor": "#28a745",
  "termsAndConditions": "Pagamento em 45 dias. Garantia de 18 meses."
}
```

### Resposta da API
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

## 7. BusinessProposalItem (Item da Proposta)

### Criar item da proposta
```json
{
  "proposalId": "901e2345-e67f-89g0-h123-456789012345",
  "itemId": "012e3456-e78f-90g1-h234-567890123456",
  "name": "Consultoria Técnica",
  "quantity": 20,
  "unitPrice": 150.00,
  "discount": 200.00
}
```

### Atualizar item da proposta
```json
{
  "quantity": 25,
  "discount": 250.00,
  "name": "Consultoria Técnica Avançada"
}
```

### Resposta da API
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