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

## Estrutura do Projeto

```
src/
├── controllers/     # Controladores da API
├── middleware/      # Middlewares (autenticação, etc.)
├── schemas/         # Esquemas de validação Zod
├── types/          # Interfaces e tipos TypeScript
├── test/           # Configuração de testes
└── index.ts        # Ponto de entrada da aplicação
```

## API Endpoints

### Contas
- `POST /api/accounts` - Criar nova conta
- `GET /api/accounts` - Listar contas (com filtros e paginação)
- `PATCH /api/accounts/:id` - Atualizar conta
- `DELETE /api/accounts/:id` - Eliminar conta

### Health Check
- `GET /health` - Verificar status da aplicação

## Variáveis de Ambiente

```env
# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Authentication API
AUTH_API_BASE_URL=your_auth_api_base_url

# Server
PORT=3000
NODE_ENV=development
```