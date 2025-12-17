-- Função para executar queries em schemas específicos de tenant
-- Execute este SQL no seu Supabase para criar a função necessária

CREATE OR REPLACE FUNCTION get_tenant_data(
  tenant_schema TEXT,
  table_name TEXT,
  columns_list TEXT DEFAULT '*',
  where_clause TEXT DEFAULT '',
  order_clause TEXT DEFAULT '',
  limit_count INTEGER DEFAULT 10,
  offset_count INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  query_text TEXT;
  result JSON;
BEGIN
  -- Validar o nome do schema para segurança
  IF tenant_schema !~ '^[a-zA-Z0-9_]+$' THEN
    RAISE EXCEPTION 'Invalid schema name: %', tenant_schema;
  END IF;
  
  -- Validar o nome da tabela para segurança
  IF table_name !~ '^[a-zA-Z0-9_]+$' THEN
    RAISE EXCEPTION 'Invalid table name: %', table_name;
  END IF;
  
  -- Construir a query
  query_text := format('SELECT %s FROM %I.%I', columns_list, tenant_schema, table_name);
  
  -- Adicionar WHERE se fornecido
  IF where_clause != '' THEN
    query_text := query_text || ' WHERE ' || where_clause;
  END IF;
  
  -- Adicionar ORDER BY se fornecido
  IF order_clause != '' THEN
    query_text := query_text || ' ORDER BY ' || order_clause;
  END IF;
  
  -- Adicionar LIMIT e OFFSET
  query_text := query_text || format(' LIMIT %s OFFSET %s', limit_count, offset_count);
  
  -- Executar a query e retornar como JSON
  EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (%s) t', query_text) INTO result;
  
  -- Se não há resultados, retornar array vazio
  IF result IS NULL THEN
    result := '[]'::json;
  END IF;
  
  RETURN result;
END;
$$;

-- Função específica para contas (accounts)
CREATE OR REPLACE FUNCTION get_tenant_accounts(
  tenant_schema TEXT,
  limit_count INTEGER DEFAULT 10,
  offset_count INTEGER DEFAULT 0,
  order_by TEXT DEFAULT 'created_at DESC'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN get_tenant_data(
    tenant_schema,
    'account',
    '*',
    '',
    order_by,
    limit_count,
    offset_count
  );
END;
$$;

-- Função para contar registros em uma tabela de tenant
CREATE OR REPLACE FUNCTION count_tenant_data(
  tenant_schema TEXT,
  table_name TEXT,
  where_clause TEXT DEFAULT ''
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  query_text TEXT;
  result INTEGER;
BEGIN
  -- Validar o nome do schema para segurança
  IF tenant_schema !~ '^[a-zA-Z0-9_]+$' THEN
    RAISE EXCEPTION 'Invalid schema name: %', tenant_schema;
  END IF;
  
  -- Validar o nome da tabela para segurança
  IF table_name !~ '^[a-zA-Z0-9_]+$' THEN
    RAISE EXCEPTION 'Invalid table name: %', table_name;
  END IF;
  
  -- Construir a query de contagem
  query_text := format('SELECT COUNT(*) FROM %I.%I', tenant_schema, table_name);
  
  -- Adicionar WHERE se fornecido
  IF where_clause != '' THEN
    query_text := query_text || ' WHERE ' || where_clause;
  END IF;
  
  -- Executar a query
  EXECUTE query_text INTO result;
  
  RETURN result;
END;
$$;

-- Função para inserir dados em uma tabela de tenant
CREATE OR REPLACE FUNCTION insert_tenant_data(
  tenant_schema TEXT,
  table_name TEXT,
  data_json JSON
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  query_text TEXT;
  columns_list TEXT;
  values_list TEXT;
  result JSON;
BEGIN
  -- Validar o nome do schema para segurança
  IF tenant_schema !~ '^[a-zA-Z0-9_]+$' THEN
    RAISE EXCEPTION 'Invalid schema name: %', tenant_schema;
  END IF;
  
  -- Validar o nome da tabela para segurança
  IF table_name !~ '^[a-zA-Z0-9_]+$' THEN
    RAISE EXCEPTION 'Invalid table name: %', table_name;
  END IF;
  
  -- Construir a query de inserção usando json_populate_record
  query_text := format(
    'INSERT INTO %I.%I SELECT * FROM json_populate_record(null::%I.%I, $1) RETURNING *',
    tenant_schema, table_name, tenant_schema, table_name
  );
  
  -- Executar a inserção
  EXECUTE query_text USING data_json INTO result;
  
  RETURN row_to_json(result);
END;
$$;