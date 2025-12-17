#!/usr/bin/env node

/**
 * Debug específico para verificar se o sistema está usando o schema correto
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

// Headers de autorização necessários
const HEADERS = {
  'Authorization-Url': 'https://platform.senior.com.br/t/senior.com.br/bridge/1.0/rest',
  'Authorization': 'Bearer yLUlVgtR6tBZi0r5HpUgVrqVsL0i7NZh',
  'tenant': 'crmxcombr',
  'Content-Type': 'application/json'
};

async function debugTenantSchema() {
  console.log('🔍 DEBUG: Verificando se o schema correto está sendo usado');
  console.log('Tenant ID: crmxcombr');
  console.log('Schema esperado: crmx_database_crmxcombr');
  console.log('='.repeat(60));

  try {
    console.log('\n📡 Fazendo requisição para /api/accounts...');
    console.log('Headers:', JSON.stringify(HEADERS, null, 2));
    
    const response = await fetch(`${BASE_URL}/api/accounts?size=1`, {
      headers: HEADERS
    });

    console.log('\n📊 Resposta recebida:');
    console.log('Status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('Dados:', JSON.stringify(result, null, 2));
      
      if (result.contents && result.contents.length > 0) {
        console.log('\n✅ Dados encontrados!');
        console.log('⚠️  IMPORTANTE: Verifique os logs do servidor para ver se apareceram as mensagens de DEBUG');
        console.log('⚠️  Se não aparecerem, significa que o proxy não está funcionando');
      }
    } else {
      const error = await response.json();
      console.log('❌ Erro:', JSON.stringify(error, null, 2));
    }

  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

debugTenantSchema();