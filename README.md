# CRM Accounts Module

Sistema de gestão de contas para CRM X desenvolvido em Node.js com TypeScript, Express.js e Supabase.

## Funcionalidades

- ✅ Operações CRUD para contas
- ✅ Autenticação via API externa com cache de tokens
- ✅ Validação de dados com Zod
- ✅ Base de dados PostgreSQL via Supabase
- ✅ Testes unitários e property-based testing

## Tecnologias

- **Runtime**: Node.js com TypeScript
- **Framework**: Express.js
- **Base de Dados**: Supabase (PostgreSQL)
- **Validação**: Zod
- **Testes**: Jest + fast-check
- **Autenticação**: API externa via healthcheck

## Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. Execute o projeto:
```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## Scripts Disponíveis

- `npm run dev` - Executa em modo desenvolvimento
- `npm run build` - Compila o TypeScript
- `npm start` - Executa a versão compilada
- `npm test` - Executa os testes
- `npm run test:watch` - Executa os testes em modo watch
- `npm run test:coverage` - Executa os testes com coverage
- `npm run generate-docs` - Gera documentação OpenAPI em formato YAML

## Estrutura do Projeto

```
src/
├── controllers/     # Controladores da API
├── database/        # Scripts SQL e migrações
├── middleware/      # Middlewares (autenticação, etc.)
├── routes/          # Definições de rotas da API
├── schemas/         # Esquemas de validação Zod
├── types/          # Interfaces e tipos TypeScript
├── test/           # Configuração de testes
├── utils/          # Utilitários e helpers
└── index.ts        # Ponto de entrada da aplicação
```

## Migração de Tabelas

Execute o script de migração único que funciona tanto para bancos existentes quanto novos:

```sql
-- Execute no Supabase SQL Editor
-- Este script detecta automaticamente se você tem dados existentes ou é uma instalação nova
\i src/database/migration_deal_to_business.sql
```

O script faz automaticamente:
- **Se tabela `profiles` existe**: Renomeia para `users` e atualiza índices e referências
- **Se tabela `deal` existe**: Renomeia para `business` e atualiza índices
- **Se é instalação nova**: Cria tabelas `users` e `business` com índices corretos
- **Verificação**: Confirma que tudo foi criado/migrado corretamente

## API Endpoints

### Contas
- `POST /api/accounts` - Criar nova conta
- `GET /api/accounts` - Listar contas (com filtros e paginação)
- `GET /api/accounts/:id` - Obter conta por ID
- `PUT /api/accounts/:id` - Atualizar conta
- `DELETE /api/accounts/:id` - Eliminar conta

### Usuários
- `POST /api/users` - Criar novo usuário
- `GET /api/users` - Listar usuários (com filtros e paginação)
- `GET /api/users/:id` - Obter usuário por ID
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Eliminar usuário

### Negócios
- `POST /api/business` - Criar novo negócio
- `GET /api/business` - Listar negócios (com filtros e paginação)
- `GET /api/business/:id` - Obter negócio por ID
- `PUT /api/business/:id` - Atualizar negócio
- `DELETE /api/business/:id` - Eliminar negócio

### Itens
- `POST /api/items` - Criar novo item
- `GET /api/items` - Listar itens (com filtros e paginação)
- `GET /api/items/:id` - Obter item por ID
- `PUT /api/items/:id` - Atualizar item
- `DELETE /api/items/:id` - Eliminar item

### Timeline de Contas
- `POST /api/account-timeline` - Criar nova entrada de timeline
- `GET /api/account-timeline` - Listar entradas de timeline
- `GET /api/account-timeline/:id` - Obter entrada por ID
- `PUT /api/account-timeline/:id` - Atualizar entrada
- `DELETE /api/account-timeline/:id` - Eliminar entrada
- `GET /api/accounts/:accountId/timeline` - Timeline específica de uma conta

### Propostas de Negócio
- `POST /api/business-proposals` - Criar nova proposta
- `GET /api/business-proposals` - Listar propostas
- `GET /api/business-proposals/:id` - Obter proposta por ID
- `PUT /api/business-proposals/:id` - Atualizar proposta
- `DELETE /api/business-proposals/:id` - Eliminar proposta

### Itens de Proposta
- `POST /api/business-proposal-items` - Criar novo item de proposta
- `GET /api/business-proposal-items` - Listar itens de proposta
- `GET /api/business-proposal-items/:id` - Obter item por ID
- `PUT /api/business-proposal-items/:id` - Atualizar item
- `DELETE /api/business-proposal-items/:id` - Eliminar item

### Dashboard Analytics
- `GET /api/dashboard/revenue-per-year/:year` - Receita mensal por ano
- `GET /api/dashboard/more-sales-by-responsible` - Vendas por responsável
- `GET /api/dashboard/sales-funnel` - Funil de vendas
- `GET /api/dashboard/total-revenue` - Receita total
- `GET /api/dashboard/active-accounts` - Contas ativas
- `GET /api/dashboard/new-business` - Novos negócios

### Health Check
- `GET /health-check` - Verificar status da aplicação

## Parâmetros de Query para APIs GET/all

Todas as APIs de listagem (GET /api/accounts, GET /api/users, GET /api/business) aceitam apenas os seguintes parâmetros:

### Paginação
- `page` (opcional): Número da página (padrão: 1)
- `size` (opcional): Número de itens por página (padrão: 10, máximo: 100)

### Filtros
- `filter` (opcional): Filtro dinâmico usando sintaxe SQL-like

### Exemplos de Uso

#### Paginação básica
```
GET /api/accounts?page=2&size=20
```

#### Filtros dinâmicos
```
# Filtrar por status
GET /api/accounts?filter=status = 'ACTIVE'

# Filtrar por múltiplas condições
GET /api/accounts?filter=status = 'ACTIVE' AND type = 'Lead'

# Filtrar com LIKE (busca parcial)
GET /api/accounts?filter=name ILIKE '%empresa%'

# Filtrar com IN (múltiplos valores)
GET /api/business?filter=stage IN ('Proposal', 'Negotiation')

# Combinar filtros e paginação
GET /api/users?filter=role = 'SALES_REP'&page=1&size=10
```

#### Campos disponíveis para filtros

**Contas (accounts):**
- `id`, `name`, `segment`, `status`, `type`, `pipeline`
- `email`, `phone`, `cnpj`, `instagram`, `linkedin`, `whatsapp`
- `created_at`, `last_interaction`

**Usuários (users):**
- `id`, `name`, `email`, `role`, `manager_id`, `created_at`

**Negócios (business):**
- `id`, `title`, `account_id`, `value`, `currency`, `stage`
- `probability`, `owner_id`, `closing_date`, `created_at`

#### Operadores suportados
- `=`, `!=`, `<>`, `<`, `>`, `<=`, `>=`
- `LIKE`, `ILIKE` (busca com wildcards %)
- `IN`, `NOT IN` (múltiplos valores entre parênteses)

## Variáveis de Ambiente

```env
# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Server
PORT=3000
NODE_ENV=development


```