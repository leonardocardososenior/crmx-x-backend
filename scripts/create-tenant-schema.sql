-- Script para criar schema de tenant manualmente
-- Substitua 'TENANT_ID' pelo ID real do tenant

-- 1. Criar o schema
CREATE SCHEMA IF NOT EXISTS "crmx_database_TENANT_ID";

-- 2. Definir search_path para facilitar a criação das tabelas
SET search_path TO "crmx_database_TENANT_ID", public;

-- 3. Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) DEFAULT 'user',
    manager_id UUID REFERENCES users(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar tabela de contas
CREATE TABLE IF NOT EXISTS account (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    segment VARCHAR(100) NOT NULL,
    responsible_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'active',
    type VARCHAR(50) DEFAULT 'lead',
    pipeline VARCHAR(100) DEFAULT 'Standard',
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email VARCHAR(255),
    phone VARCHAR(50),
    cnpj VARCHAR(20),
    instagram VARCHAR(255),
    linkedin VARCHAR(255),
    whatsapp VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Criar tabela de negócios
CREATE TABLE IF NOT EXISTS business (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    account_id UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    value DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL',
    stage VARCHAR(100) NOT NULL,
    probability INTEGER CHECK (probability >= 0 AND probability <= 100),
    responsible_id UUID REFERENCES users(id),
    closing_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Criar tabela de itens
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    unit VARCHAR(50) DEFAULT 'un',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Criar tabela de propostas comerciais
CREATE TABLE IF NOT EXISTS business_proposal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    total_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'BRL',
    status VARCHAR(50) DEFAULT 'draft',
    valid_until DATE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Criar tabela de itens da proposta
CREATE TABLE IF NOT EXISTS business_proposal_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_proposal_id UUID NOT NULL REFERENCES business_proposal(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id),
    quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Criar tabela de timeline de contas
CREATE TABLE IF NOT EXISTS account_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_account_responsible ON account(responsible_id);
CREATE INDEX IF NOT EXISTS idx_account_status ON account(status);
CREATE INDEX IF NOT EXISTS idx_account_created_at ON account(created_at);

CREATE INDEX IF NOT EXISTS idx_business_account ON business(account_id);
CREATE INDEX IF NOT EXISTS idx_business_responsible ON business(responsible_id);
CREATE INDEX IF NOT EXISTS idx_business_stage ON business(stage);
CREATE INDEX IF NOT EXISTS idx_business_created_at ON business(created_at);

CREATE INDEX IF NOT EXISTS idx_business_proposal_business ON business_proposal(business_id);
CREATE INDEX IF NOT EXISTS idx_business_proposal_status ON business_proposal(status);
CREATE INDEX IF NOT EXISTS idx_business_proposal_created_at ON business_proposal(created_at);

CREATE INDEX IF NOT EXISTS idx_business_proposal_item_proposal ON business_proposal_item(business_proposal_id);
CREATE INDEX IF NOT EXISTS idx_business_proposal_item_item ON business_proposal_item(item_id);

CREATE INDEX IF NOT EXISTS idx_account_timeline_account ON account_timeline(account_id);
CREATE INDEX IF NOT EXISTS idx_account_timeline_created_at ON account_timeline(created_at);

CREATE INDEX IF NOT EXISTS idx_items_active ON items(active);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);

-- 11. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. Criar trigger para business_proposal
CREATE TRIGGER update_business_proposal_updated_at 
    BEFORE UPDATE ON business_proposal 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 13. Resetar search_path
RESET search_path;

-- Exemplo de uso:
-- Para criar schema para tenant "empresa_123":
-- 1. Substitua todas as ocorrências de "TENANT_ID" por "empresa_123"
-- 2. Execute o script no seu banco de dados
-- 3. O schema "crmx_database_empresa_123" será criado com todas as tabelas