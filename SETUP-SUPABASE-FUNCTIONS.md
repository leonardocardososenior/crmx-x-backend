# Configuração das Funções RPC no Supabase

## Passo 1: Executar as Funções SQL

1. Acesse o **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Copie e execute o conteúdo do arquivo `supabase-functions.sql`

## Passo 2: Verificar se as Funções Foram Criadas

Execute este SQL para verificar:

```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%tenant%';
```

Você deve ver:
- `get_tenant_data`
- `get_tenant_accounts` 
- `count_tenant_data`
- `insert_tenant_data`

## Passo 3: Testar uma Função

Execute este teste para verificar se funciona:

```sql
SELECT get_tenant_accounts('crmx_database_crmxcombr', 5);
```

Se retornar dados JSON, está funcionando!

## Passo 4: Reiniciar o Servidor

Depois de executar as funções SQL:

```bash
# Parar o servidor atual
# Reiniciar com:
npm run dev:simplified
```

## Troubleshooting

### Se der erro "function does not exist":
1. Verifique se executou todo o SQL do arquivo `supabase-functions.sql`
2. Certifique-se de que está executando no schema `public`
3. Verifique se o usuário tem permissões para criar funções

### Se der erro de permissão:
1. Use o usuário `postgres` ou service_role
2. Certifique-se de que as funções têm `SECURITY DEFINER`

### Se não retornar dados:
1. Verifique se o schema `crmx_database_crmxcombr` existe
2. Verifique se a tabela `account` existe no schema
3. Verifique se há dados na tabela