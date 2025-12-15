# Design Document

## Overview

Este documento descreve o design técnico para o módulo de contas do CRM X, um sistema backend desenvolvido em Node.js com TypeScript, Express.js e Supabase como base de dados PostgreSQL. O sistema implementa operações CRUD para contas com autenticação via API externa e cache de tokens para otimização de performance.

## Architecture

### Technology Stack
- **Runtime**: Node.js com TypeScript
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Client**: @supabase/supabase-js
- **Validation**: Zod
- **Authentication**: API externa via healthcheck
- **Cache**: In-memory Map para tokens

### System Components
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client App    │───▶│   Express API    │───▶│   Supabase DB   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │ Authentication   │
                       │     API          │
                       └──────────────────┘
```

## Components and Interfaces

### 1. Authentication Middleware
- **Purpose**: Validar tokens via API externa e gerenciar cache
- **Location**: `src/middleware/auth.ts`
- **Interface**:
```typescript
interface AuthMiddleware {
  requireAuth(req: Request, res: Response, next: NextFunction): Promise<void>
  validateToken(token: string): Promise<boolean>
  getCachedToken(token: string): boolean | null
  setCachedToken(token: string, expiration: number): void
}
```

### 2. Account Controller
- **Purpose**: Implementar lógica de negócio para operações CRUD
- **Location**: `src/controllers/accountController.ts`
- **Interface**:
```typescript
interface AccountController {
  createAccount(req: Request, res: Response): Promise<void>
  getAccounts(req: Request, res: Response): Promise<void>
  updateAccount(req: Request, res: Response): Promise<void>
  deleteAccount(req: Request, res: Response): Promise<void>
}
```

### 3. Supabase Client
- **Purpose**: Configurar conexão com base de dados
- **Location**: `src/supabaseClient.ts`
- **Interface**:
```typescript
interface SupabaseClient {
  from(table: string): SupabaseQueryBuilder
  auth: SupabaseAuth
}
```

### 4. Validation Schemas
- **Purpose**: Definir esquemas Zod para validação
- **Location**: `src/schemas/accountSchemas.ts`
- **Interface**:
```typescript
interface AccountSchemas {
  CreateAccountSchema: ZodSchema
  UpdateAccountSchema: ZodSchema
  QueryParamsSchema: ZodSchema
}
```

## Data Models

### Database Schema

#### Enums
```sql
CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'SALES_REP');
CREATE TYPE account_status AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE account_type AS ENUM ('Lead', 'Prospect', 'Client');
CREATE TYPE deal_stage AS ENUM ('Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost');
```

#### Profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  role user_role DEFAULT 'SALES_REP',
  manager_id UUID REFERENCES profiles(id),
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Accounts Table
```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  segment TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES profiles(id),
  status account_status DEFAULT 'ACTIVE',
  account_type account_type DEFAULT 'Lead',
  pipeline TEXT DEFAULT 'Standard',
  last_interaction TIMESTAMPTZ DEFAULT NOW(),
  contact_email TEXT,
  contact_phone TEXT,
  cnpj TEXT,
  instagram TEXT,
  linkedin TEXT,
  whatsapp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Deal Table
```sql
CREATE TABLE deal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  account_id UUID NOT NULL REFERENCES account(id),
  value NUMERIC NOT NULL,
  currency TEXT DEFAULT 'BRL',
  stage deal_stage NOT NULL,
  probability INTEGER CHECK (probability >= 0 AND probability <= 100),
  owner_id UUID REFERENCES profiles(id),
  closing_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### TypeScript Interfaces

#### Account Interface
```typescript
interface Account {
  id: string;
  name: string;
  segment: string;
  owner_id: string;
  status: 'ACTIVE' | 'INACTIVE';
  account_type: 'Lead' | 'Prospect' | 'Client';
  pipeline: string;
  last_interaction: string;
  contact_email?: string;
  contact_phone?: string;
  cnpj?: string;
  instagram?: string;
  linkedin?: string;
  whatsapp?: string;
  created_at: string;
}
```

#### Token Cache Interface
```typescript
interface TokenCache {
  token: string;
  expiration: number;
  isValid(): boolean;
}
```

## Error Handling

### Error Response Format
```typescript
interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
  request_id?: string;
}
```

### Error Types
1. **Validation Errors** (400): Zod schema validation failures
2. **Authentication Errors** (401): Invalid or missing tokens
3. **Not Found Errors** (404): Resource not found
4. **Database Errors** (500): Supabase operation failures
5. **External API Errors** (502): Authentication API failures

## Testing Strategy

### Unit Testing
- Test individual functions and methods
- Mock external dependencies (Supabase, Authentication API)
- Focus on business logic validation
- Test error handling scenarios

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated to eliminate redundancy:

- Properties 1.1 and 1.2 can be combined into a comprehensive account creation property
- Properties 2.3 and 2.4 can be combined into a general filtering property
- Properties 3.1 and 3.5 can be combined into a comprehensive update property
- Properties 5.1, 5.2, and 5.3 can be combined into a comprehensive authentication property
- Properties 7.1, 7.2, and 7.3 can be combined into a comprehensive cache property

### Core Properties

**Property 1: Account creation round trip**
*For any* valid account data with required fields (name, segment, owner_id), creating the account should result in a stored record with all provided fields plus generated UUID, timestamps, and default values
**Validates: Requirements 1.1, 1.2, 1.5**

**Property 2: Invalid input rejection**
*For any* account data missing required fields or with invalid owner_id references, the system should reject the request with appropriate Zod or foreign key validation errors
**Validates: Requirements 1.3, 1.4**

**Property 3: Account retrieval completeness**
*For any* set of accounts in the database, GET /api/accounts should return all existing accounts
**Validates: Requirements 2.1**

**Property 4: Search filtering accuracy**
*For any* search term and account collection, filtered results should only contain accounts where name or segment contains the search term
**Validates: Requirements 2.2**

**Property 5: Status and type filtering**
*For any* filter parameters (status, account_type), all returned results should match the specified filter criteria
**Validates: Requirements 2.3, 2.4**

**Property 6: Pagination correctness**
*For any* pagination parameters (page, limit), the system should return the correct subset of results with accurate metadata
**Validates: Requirements 2.5**

**Property 7: Partial update preservation**
*For any* existing account and valid partial update data, only the specified fields should be modified while preserving other fields and updating last_interaction timestamp
**Validates: Requirements 3.1, 3.5**

**Property 8: Enum validation during updates**
*For any* account_type update, only valid enum values (Lead, Prospect, Client) should be accepted
**Validates: Requirements 3.2**

**Property 9: Update validation error handling**
*For any* invalid update data, the system should reject the request with detailed Zod validation error messages
**Validates: Requirements 3.4**

**Property 10: Account deletion completeness**
*For any* existing account, successful deletion should remove the account from the database and return confirmation
**Validates: Requirements 4.1**

**Property 11: Cascading deletion handling**
*For any* account with related deal, deletion should handle foreign key constraints appropriately
**Validates: Requirements 4.4, 4.5**

**Property 12: Authentication flow integrity**
*For any* API request with Bearer token, the system should validate the token via external Authentication API and proceed only on successful validation
**Validates: Requirements 5.1, 5.2, 5.3**

**Property 13: Token cache optimization**
*For any* previously validated token within expiration time, subsequent requests should use cached validation without external API calls
**Validates: Requirements 7.1, 7.2, 7.3**

**Property 14: Cache expiration and eviction**
*For any* expired token or full cache, the system should remove expired tokens and implement LRU eviction strategy
**Validates: Requirements 7.4, 7.5**

**Property 15: Schema validation consistency**
*For any* input data, Zod schemas should consistently validate field types, requirements, and enum values with detailed error messages
**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

### Property-Based Testing
Property-based testing will be implemented using **fast-check** library with minimum 100 iterations per test.

Each property-based test will be tagged with comments referencing the design document property:
`**Feature: crm-accounts-module, Property {number}: {property_text}**`