-- CRM X Database Schema
-- This script creates the complete database schema for the CRM accounts module

-- Enums removed from database - validation will be handled in application code

-- Create users table with hierarchy support (requirements 6.2)
CREATE TABLE users
(
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    role       TEXT NOT NULL,
    manager_id UUID REFERENCES users (id),
    email      TEXT NOT NULL,
    created_at TIMESTAMPTZ      DEFAULT NOW()
);

-- Create account table with all specified fields and constraints (requirements 6.3)
CREATE TABLE account
(
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             TEXT NOT NULL,
    segment          TEXT NOT NULL,
    responsible_id   UUID NOT NULL REFERENCES users (id),
    status           TEXT NOT NULL,
    type             TEXT NOT NULL,
    pipeline         TEXT             DEFAULT 'Standard',
    last_interaction TIMESTAMPTZ      DEFAULT NOW(),
    email            TEXT,
    phone            TEXT,
    cnpj             TEXT,
    instagram        TEXT,
    linkedin         TEXT,
    whatsapp         TEXT,
    created_at       TIMESTAMPTZ      DEFAULT NOW()
);

-- Create business table with foreign key relationships (requirements 6.4, 6.5)
CREATE TABLE business
(
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title        TEXT    NOT NULL,
    account_id   UUID    NOT NULL REFERENCES account (id),
    value        NUMERIC NOT NULL,
    currency     TEXT    NOT NULL,
    stage        TEXT    NOT NULL,
    probability  INTEGER,
    owner_id     UUID REFERENCES users (id),
    closing_date DATE,
    created_at   TIMESTAMPTZ      DEFAULT NOW()
);

-- Create item table for products and services (requirements 6.1, 6.2, 6.3, 6.5)
CREATE TABLE item
(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT    NOT NULL,
    type        TEXT    NOT NULL, -- PRODUCT or SERVICE (validated in application)
    price       NUMERIC NOT NULL,
    sku_code    TEXT,             -- Optional SKU code
    description TEXT,             -- Optional description
    created_at  TIMESTAMPTZ      DEFAULT NOW()
);

-- Create account_timeline table for tracking account interactions and changes (requirements 6.1, 6.2, 6.3, 6.4, 6.5)
CREATE TABLE account_timeline
(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id  UUID NOT NULL REFERENCES account (id) ON DELETE CASCADE,
    type        TEXT NOT NULL,    -- NOTE, CALL, EMAIL, MEETING, SYSTEM (validated in application)
    title       TEXT NOT NULL,
    description TEXT,             -- Optional description
    date        TIMESTAMPTZ NOT NULL,
    created_by  UUID NOT NULL REFERENCES users (id),
    created_at  TIMESTAMPTZ      DEFAULT NOW()
);

-- Create business_proposal table with all required fields and constraints
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

-- Create business_proposal_item table with foreign key relationships
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

-- Create indexes for better query performance
CREATE INDEX idx_account_responsible_id ON account (responsible_id);
CREATE INDEX idx_account_status ON account (status);
CREATE INDEX idx_account_type ON account (type);
CREATE INDEX idx_account_name ON account (name);
CREATE INDEX idx_account_segment ON account (segment);
CREATE INDEX idx_business_account_id ON business (account_id);
CREATE INDEX idx_business_owner_id ON business (owner_id);
CREATE INDEX idx_business_stage ON business (stage);
CREATE INDEX idx_users_manager_id ON users (manager_id);
CREATE INDEX idx_item_name ON item (name);
CREATE INDEX idx_item_type ON item (type);
CREATE INDEX idx_item_price ON item (price);
CREATE INDEX idx_item_sku_code ON item (sku_code);
CREATE INDEX idx_account_timeline_account_id ON account_timeline (account_id);
CREATE INDEX idx_account_timeline_type ON account_timeline (type);
CREATE INDEX idx_account_timeline_date ON account_timeline (date);
CREATE INDEX idx_account_timeline_created_by ON account_timeline (created_by);
-- Business proposal indexes for query performance
CREATE INDEX idx_business_proposal_business_id ON business_proposal (business_id);
CREATE INDEX idx_business_proposal_responsible_id ON business_proposal (responsible_id);
CREATE INDEX idx_business_proposal_status ON business_proposal (status);
CREATE INDEX idx_business_proposal_date ON business_proposal (date);
CREATE INDEX idx_business_proposal_item_proposal_id ON business_proposal_item (proposal_id);
CREATE INDEX idx_business_proposal_item_item_id ON business_proposal_item (item_id);