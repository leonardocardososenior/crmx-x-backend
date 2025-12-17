-- PostgreSQL functions for multi-tenant schema management
-- These functions should be executed in the database to support schema creation

-- Function to create a tenant schema
CREATE OR REPLACE FUNCTION create_tenant_schema(schema_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validate schema name to prevent SQL injection
    IF schema_name !~ '^[a-zA-Z0-9_]+$' THEN
        RAISE EXCEPTION 'Invalid schema name: %', schema_name;
    END IF;
    
    -- Check if schema already exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.schemata 
        WHERE schema_name = $1
    ) THEN
        -- Schema already exists, no need to create
        RETURN;
    END IF;
    
    -- Create the schema
    EXECUTE format('CREATE SCHEMA %I', schema_name);
    
    -- Grant necessary permissions
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO authenticated', schema_name);
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO service_role', schema_name);
    EXECUTE format('GRANT CREATE ON SCHEMA %I TO service_role', schema_name);
END;
$$;

-- Function to drop a tenant schema (for cleanup)
CREATE OR REPLACE FUNCTION drop_tenant_schema(schema_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validate schema name to prevent SQL injection
    IF schema_name !~ '^[a-zA-Z0-9_]+$' THEN
        RAISE EXCEPTION 'Invalid schema name: %', schema_name;
    END IF;
    
    -- Additional safety check - only allow dropping tenant schemas
    IF schema_name !~ '^crmx_database_' THEN
        RAISE EXCEPTION 'Can only drop tenant schemas (must start with crmx_database_): %', schema_name;
    END IF;
    
    -- Check if schema exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.schemata 
        WHERE schema_name = $1
    ) THEN
        -- Schema doesn't exist, nothing to drop
        RETURN;
    END IF;
    
    -- Drop the schema and all its contents
    EXECUTE format('DROP SCHEMA %I CASCADE', schema_name);
END;
$$;

-- Function to execute migration script in a specific schema
CREATE OR REPLACE FUNCTION execute_migration_in_schema(schema_name TEXT, migration_sql TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_search_path TEXT;
BEGIN
    -- Validate schema name to prevent SQL injection
    IF schema_name !~ '^[a-zA-Z0-9_]+$' THEN
        RAISE EXCEPTION 'Invalid schema name: %', schema_name;
    END IF;
    
    -- Check if schema exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.schemata 
        WHERE schema_name = $1
    ) THEN
        RAISE EXCEPTION 'Schema does not exist: %', schema_name;
    END IF;
    
    -- Store current search_path
    SELECT current_setting('search_path') INTO current_search_path;
    
    -- Set search_path to the target schema
    EXECUTE format('SET search_path TO %I, public', schema_name);
    
    -- Execute the migration SQL
    EXECUTE migration_sql;
    
    -- Grant permissions on all tables in the schema
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I TO authenticated', schema_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I TO service_role', schema_name);
    EXECUTE format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA %I TO authenticated', schema_name);
    EXECUTE format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA %I TO service_role', schema_name);
    
    -- Set default privileges for future tables
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated', schema_name);
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role', schema_name);
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT USAGE, SELECT ON SEQUENCES TO authenticated', schema_name);
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT USAGE, SELECT ON SEQUENCES TO service_role', schema_name);
    
    -- Restore original search_path
    EXECUTE format('SET search_path TO %s', current_search_path);
    
EXCEPTION
    WHEN OTHERS THEN
        -- Restore original search_path on error
        EXECUTE format('SET search_path TO %s', current_search_path);
        RAISE;
END;
$$;

-- Function to set search_path for tenant context
CREATE OR REPLACE FUNCTION set_search_path(path TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validate that path contains only safe characters
    IF path !~ '^[a-zA-Z0-9_",\s]+$' THEN
        RAISE EXCEPTION 'Invalid search_path: %', path;
    END IF;
    
    -- Set the search_path
    EXECUTE format('SET search_path TO %s', path);
END;
$$;

-- Function to get current search_path
CREATE OR REPLACE FUNCTION get_current_search_path()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN current_setting('search_path');
END;
$$;

-- Function to execute a query in tenant context (for tenant-aware client)
CREATE OR REPLACE FUNCTION execute_tenant_query(query_sql TEXT, query_params JSONB DEFAULT '[]'::jsonb)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    param_count INTEGER;
    i INTEGER;
    param_value TEXT;
BEGIN
    -- Basic validation of query to prevent obvious SQL injection
    IF query_sql ILIKE '%DROP%' OR query_sql ILIKE '%ALTER%' OR query_sql ILIKE '%CREATE%' THEN
        RAISE EXCEPTION 'DDL operations not allowed in tenant queries';
    END IF;
    
    -- Get parameter count
    param_count := jsonb_array_length(query_params);
    
    -- For now, execute the query directly (in production, you'd want better parameter handling)
    -- This is a simplified implementation - in production you'd want proper prepared statements
    EXECUTE query_sql INTO result;
    
    RETURN result;
END;
$$;

-- Function to check if a schema exists (already exists in schema.sql but ensuring it's here too)
CREATE OR REPLACE FUNCTION check_schema_exists(schema_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.schemata 
        WHERE schema_name = $1
    );
END;
$$;

-- Grant execute permissions to the roles that need them
GRANT EXECUTE ON FUNCTION create_tenant_schema(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION drop_tenant_schema(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION execute_migration_in_schema(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION set_search_path(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_current_search_path() TO service_role;
GRANT EXECUTE ON FUNCTION execute_tenant_query(TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION check_schema_exists(TEXT) TO service_role;

-- Also grant to authenticated for schema checking and context management
GRANT EXECUTE ON FUNCTION create_tenant_schema(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_migration_in_schema(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION set_search_path(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_search_path() TO authenticated;
GRANT EXECUTE ON FUNCTION execute_tenant_query(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION check_schema_exists(TEXT) TO authenticated;