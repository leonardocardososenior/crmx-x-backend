#!/usr/bin/env node

/**
 * Script para criar schema de tenant automaticamente
 * Uso: node scripts/create-tenant.js <tenant_id>
 * Exemplo: node scripts/create-tenant.js empresa_123
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
  process.exit(1);
}

// Criar cliente Supabase com service role
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createTenantSchema(tenantId) {
  try {
    console.log(`🚀 Criando schema para tenant: ${tenantId}`);
    
    // Validar tenant ID
    if (!/^[a-zA-Z0-9_]+$/.test(tenantId)) {
      throw new Error('Tenant ID deve conter apenas letras, números e underscore');
    }

    const schemaName = `crmx_database_${tenantId}`;
    console.log(`📋 Nome do schema: ${schemaName}`);

    // Ler o template SQL
    const sqlTemplatePath = path.join(__dirname, 'create-tenant-schema.sql');
    let sqlTemplate = fs.readFileSync(sqlTemplatePath, 'utf8');

    // Substituir TENANT_ID pelo ID real
    const sql = sqlTemplate.replace(/TENANT_ID/g, tenantId);

    console.log('📝 Executando SQL...');

    // Executar o SQL
    const { data, error } = await supabase.rpc('execute_sql', {
      sql: sql
    });

    if (error) {
      throw new Error(`Erro ao executar SQL: ${error.message}`);
    }

    console.log('✅ Schema criado com sucesso!');
    console.log(`📊 Detalhes:`);
    console.log(`   - Tenant ID: ${tenantId}`);
    console.log(`   - Schema: ${schemaName}`);
    console.log(`   - Tabelas criadas: users, account, business, items, business_proposal, business_proposal_item, account_timeline`);
    console.log(`   - Índices criados para performance`);
    console.log(`   - Triggers configurados`);

    // Verificar se o schema foi criado
    const { data: schemas, error: checkError } = await supabase.rpc('execute_sql', {
      sql: `SELECT schema_name FROM information_schema.schemata WHERE schema_name = '${schemaName}';`
    });

    if (checkError) {
      console.warn('⚠️  Aviso: Não foi possível verificar a criação do schema');
    } else if (schemas && schemas.length > 0) {
      console.log('✅ Verificação: Schema encontrado no banco de dados');
    } else {
      console.warn('⚠️  Aviso: Schema não encontrado na verificação');
    }

    console.log('\n🎉 Tenant criado com sucesso!');
    console.log(`💡 Para usar este tenant, envie o header: tenant: ${tenantId}`);

  } catch (error) {
    console.error('❌ Erro ao criar tenant:', error.message);
    process.exit(1);
  }
}

// Verificar argumentos da linha de comando
const tenantId = process.argv[2];

if (!tenantId) {
  console.error('❌ Erro: Tenant ID é obrigatório');
  console.log('📖 Uso: node scripts/create-tenant.js <tenant_id>');
  console.log('📖 Exemplo: node scripts/create-tenant.js empresa_123');
  process.exit(1);
}

// Executar criação do tenant
createTenantSchema(tenantId);