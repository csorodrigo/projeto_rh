-- Migration 017: Forçar reload do schema cache do PostgREST

-- Função para notificar o PostgREST a recarregar o schema
CREATE OR REPLACE FUNCTION reload_postgrest_schema()
RETURNS void AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Executar imediatamente
SELECT reload_postgrest_schema();

-- Comentário
COMMENT ON FUNCTION reload_postgrest_schema() IS
  'Força o PostgREST a recarregar o schema cache após alterações DDL';
