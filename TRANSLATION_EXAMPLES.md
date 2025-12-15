# Exemplos de Traduções - Sistema de Erros

## Como Testar as Traduções

As traduções são detectadas automaticamente pelo header `Locale` da requisição:

- `Locale: pt-BR` → Português do Brasil (padrão)
- `Locale: en-US` → Inglês (Estados Unidos)
- `Locale: es-CO` → Espanhol (Colômbia)

**Importante**: Se o header `Locale` não for informado ou contiver um valor inválido, o sistema usará `pt-BR` como padrão.

## Exemplos de Erros por Idioma

### 1. Campo Obrigatório

#### Português (pt-BR)
```bash
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

#### Inglês (en-US)
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

#### Espanhol (es-CO)
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

### 2. Email Inválido

#### Português (pt-BR)
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Locale: pt-BR" \
  -d '{"name": "João", "email": "invalid-email"}'
```
**Resposta:**
```json
{
  "message": "Email deve ser um email válido",
  "status": 400
}
```

#### Inglês (en)
```json
{
  "message": "Email must be a valid email",
  "status": 400
}
```

#### Espanhol (es)
```json
{
  "message": "Email debe ser un email válido",
  "status": 400
}
```

### 3. Relacionamento Não Encontrado

#### Português (pt-BR)
```bash
curl -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -H "Locale: pt-BR" \
  -d '{"name": "Teste", "segment": "Tech", "responsibleId": "invalid-uuid"}'
```
**Resposta:**
```json
{
  "message": "O responsável informado não existe",
  "status": 400
}
```

#### Inglês (en)
```json
{
  "message": "The specified owner does not exist",
  "status": 400
}
```

#### Espanhol (es)
```json
{
  "message": "El responsable especificado no existe",
  "status": 400
}
```

### 4. Entidade Não Encontrada

#### Português (pt-BR)
```bash
curl -X GET http://localhost:3000/api/accounts/invalid-id \
  -H "Locale: pt-BR"
```
**Resposta:**
```json
{
  "message": "Conta não encontrada",
  "status": 404
}
```

#### Inglês (en)
```json
{
  "message": "Account not found",
  "status": 404
}
```

#### Espanhol (es)
```json
{
  "message": "Cuenta no encontrada",
  "status": 404
}
```

### 5. Rota Não Encontrada

#### Português (pt-BR)
```bash
curl -X GET http://localhost:3000/api/invalid-route \
  -H "Locale: pt-BR"
```
**Resposta:**
```json
{
  "message": "Rota não encontrada: GET /api/invalid-route",
  "status": 404
}
```

#### Inglês (en)
```json
{
  "message": "Route not found: GET /api/invalid-route",
  "status": 404
}
```

#### Espanhol (es)
```json
{
  "message": "Ruta no encontrada: GET /api/invalid-route",
  "status": 404
}
```

### 6. Sucesso na Exclusão

#### Português (pt-BR)
```bash
curl -X DELETE http://localhost:3000/api/accounts/valid-id \
  -H "Locale: pt-BR"
```
**Resposta:**
```json
{
  "message": "Conta excluída com sucesso",
  "id": "valid-id"
}
```

#### Inglês (en)
```json
{
  "message": "Account deleted successfully",
  "id": "valid-id"
}
```

#### Espanhol (es)
```json
{
  "message": "Cuenta eliminada exitosamente",
  "id": "valid-id"
}
```

## Campos Traduzidos

Todos os nomes de campos são traduzidos automaticamente:

| Campo (API) | Português | Inglês | Espanhol |
|-------------|-----------|--------|----------|
| name | Nome | Name | Nombre |
| email | Email | Email | Email |
| responsibleId | Responsável | Owner | Responsable |
| managerId | Gerente | Manager | Gerente |
| accountId | Conta | Account | Cuenta |
| role | Função | Role | Rol |
| status | Status | Status | Estado |
| type | Tipo | Type | Tipo |

## Detecção Automática de Idioma

O sistema detecta o idioma baseado no header `Locale`:
- `Locale: pt-BR` → Português do Brasil
- `Locale: en-US` → Inglês (Estados Unidos)
- `Locale: es-CO` → Espanhol (Colômbia)
- Qualquer outro valor ou ausência do header → Português (padrão)

Exemplos de headers válidos:
- `Locale: pt-BR`
- `Locale: en-US`
- `Locale: es-CO`

Exemplos de valores inválidos (usarão pt-BR como padrão):
- `Locale: en` (deve ser `en-US`)
- `Locale: es` (deve ser `es-CO`)
- `Locale: fr-FR` (não suportado)
- Sem header `Locale`