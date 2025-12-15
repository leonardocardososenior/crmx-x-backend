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
