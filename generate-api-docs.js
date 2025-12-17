#!/usr/bin/env node

/**
 * Script para gerar documentação OpenAPI em formato YAML
 * 
 * Usage: node generate-api-docs.js
 */

const { endpointDocumentationOrchestrator } = require('./dist/utils/endpointDocumentationOrchestrator');
const fs = require('fs');

// Note: This is a Node.js script, not using the logger system
console.log('[' + new Date().toISOString() + '] INFO [DOCUMENTATION] | Gerando documentação OpenAPI...');

try {
  // Gerar documentação completa
  endpointDocumentationOrchestrator.generateCompleteDocumentation();
  const spec = endpointDocumentationOrchestrator.generateOpenAPISpecification();
  
  // Converter JSON para YAML
  function jsonToYaml(obj, indent = 0) {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    if (Array.isArray(obj)) {
      obj.forEach(item => {
        yaml += `${spaces}- ${jsonToYaml(item, indent + 1).trim()}\n`;
      });
    } else if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (typeof value === 'object' && value !== null) {
          yaml += `${spaces}${key}:\n${jsonToYaml(value, indent + 1)}`;
        } else {
          let yamlValue;
          if (typeof value === 'string') {
            // Escapar caracteres especiais no YAML
            const escapedValue = value
              .replace(/\\/g, '\\\\')  // Escapar backslashes
              .replace(/"/g, '\\"')    // Escapar aspas duplas
              .replace(/\n/g, '\\n')   // Escapar quebras de linha
              .replace(/\r/g, '\\r')   // Escapar retorno de carro
              .replace(/\t/g, '\\t');  // Escapar tabs
            yamlValue = `"${escapedValue}"`;
          } else {
            yamlValue = value;
          }
          yaml += `${spaces}${key}: ${yamlValue}\n`;
        }
      });
    } else {
      return obj;
    }

    return yaml;
  }

  // Salvar arquivo YAML
  const yaml = jsonToYaml(spec);
  fs.writeFileSync('api-docs.yaml', yaml);
  
  console.log('[' + new Date().toISOString() + '] INFO [DOCUMENTATION] | Arquivo api-docs.yaml gerado com sucesso!');
  console.log('[' + new Date().toISOString() + '] INFO [DOCUMENTATION] | Documentação gerada:');
  console.log('[' + new Date().toISOString() + '] INFO [DOCUMENTATION] |    - ' + Object.keys(spec.paths).length + ' endpoints');
  console.log('[' + new Date().toISOString() + '] INFO [DOCUMENTATION] |    - ' + Object.keys(spec.components.schemas).length + ' schemas');
  console.log('[' + new Date().toISOString() + '] INFO [DOCUMENTATION] |    - 7 módulos principais');
  
} catch (error) {
  console.error('[' + new Date().toISOString() + '] ERROR [DOCUMENTATION] | Erro ao gerar documentação: ' + error.message);
  process.exit(1);
}