# Exemplos de Uso do Header Locale

## Configuração do Header Locale

O sistema agora usa o header `Locale` com valores específicos:

### Valores Válidos
- `pt-BR` - Português do Brasil (padrão)
- `en-US` - Inglês dos Estados Unidos  
- `es-CO` - Espanhol da Colômbia

### Comportamento
- Se o header `Locale` não for informado → usa `pt-BR`
- Se o valor for inválido → usa `pt-BR`
- Apenas os valores exatos são aceitos

## Exemplos de Teste

### 1. Teste com Português (padrão)
```bash
# Sem header (usa padrão pt-BR)
curl -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{}'

# Com header pt-BR
curl -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -H "Locale: pt-BR" \
  -d '{}'
```
**Resposta:**
```json
{
  "message": "Nome é obrigatório",
  "status": 400
}
```

### 2. Teste com Inglês
```bash
curl -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -H "Locale: en-US" \
  -d '{}'
```
**Resposta:**
```json
{
  "message": "Name is required",
  "status": 400
}
```

### 3. Teste com Espanhol
```bash
curl -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -H "Locale: es-CO" \
  -d '{}'
```
**Resposta:**
```json
{
  "message": "Nombre es obligatorio",
  "status": 400
}
```

### 4. Teste com Valor Inválido (usa padrão pt-BR)
```bash
# Valor inválido - usa pt-BR como padrão
curl -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -H "Locale: en" \
  -d '{}'

# Outro valor inválido
curl -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -H "Locale: fr-FR" \
  -d '{}'
```
**Resposta (ambos casos):**
```json
{
  "message": "Nome é obrigatório",
  "status": 400
}
```

## Teste de Relacionamento

### Responsável não existe
```bash
# Português
curl -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -H "Locale: pt-BR" \
  -d '{"name": "Teste", "segment": "Tech", "responsibleId": "invalid-id"}'

# Inglês  
curl -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -H "Locale: en-US" \
  -d '{"name": "Test", "segment": "Tech", "responsibleId": "invalid-id"}'

# Espanhol
curl -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -H "Locale: es-CO" \
  -d '{"name": "Prueba", "segment": "Tech", "responsibleId": "invalid-id"}'
```

**Respostas:**
```json
// pt-BR
{"message": "O responsável informado não existe", "status": 400}

// en-US  
{"message": "The specified owner does not exist", "status": 400}

// es-CO
{"message": "El responsable especificado no existe", "status": 400}
```

## Teste de Entidade Não Encontrada

```bash
# Português
curl -X GET http://localhost:3000/api/accounts/invalid-id \
  -H "Locale: pt-BR"

# Inglês
curl -X GET http://localhost:3000/api/accounts/invalid-id \
  -H "Locale: en-US"

# Espanhol  
curl -X GET http://localhost:3000/api/accounts/invalid-id \
  -H "Locale: es-CO"
```

**Respostas:**
```json
// pt-BR
{"message": "Conta não encontrada", "status": 404}

// en-US
{"message": "Account not found", "status": 404}

// es-CO
{"message": "Cuenta no encontrada", "status": 404}
```

## Validação do Header

O sistema valida rigorosamente o header `Locale`:

### ✅ Valores Aceitos
- `Locale: pt-BR`
- `Locale: en-US`  
- `Locale: es-CO`

### ❌ Valores Rejeitados (usam pt-BR como padrão)
- `Locale: pt` (incompleto)
- `Locale: en` (incompleto)
- `Locale: es` (incompleto)
- `Locale: en-GB` (não suportado)
- `Locale: es-ES` (não suportado)
- `Locale: fr-FR` (não suportado)
- Ausência do header

## Implementação no Código

```typescript
// A função detecta automaticamente o locale
export function getLanguageFromRequest(req: any): Language {
  const locale = req.headers['locale'] || req.headers['Locale'];
  
  // Validar se o locale é um dos valores aceitos
  const validLocales: Language[] = ['pt-BR', 'en-US', 'es-CO'];
  
  if (locale && validLocales.includes(locale as Language)) {
    return locale as Language;
  }
  
  return 'pt-BR'; // Default para português brasileiro
}
```