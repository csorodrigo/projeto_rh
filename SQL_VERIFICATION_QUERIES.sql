-- ============================================================
-- SQL VERIFICATION QUERIES - Migração 018
-- Execute estas queries no Supabase SQL Editor para verificar
-- que a migração foi aplicada corretamente
-- ============================================================

-- Query 1: Verificar estrutura das colunas
-- Deve retornar 3 linhas: name, full_name, photo_url
SELECT
  column_name,
  data_type,
  is_nullable,
  is_generated,
  generation_expression
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'employees'
  AND column_name IN ('name', 'full_name', 'photo_url')
ORDER BY column_name;

-- Resultado esperado:
-- name        | text | NO  | NEVER | NULL
-- full_name   | text | YES | ALWAYS | name
-- photo_url   | text | YES | NEVER | NULL


-- ============================================================

-- Query 2: Verificar índices criados
-- Deve retornar 2 índices: idx_employees_full_name e idx_employees_photo_url
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'employees'
  AND (indexname LIKE '%full_name%' OR indexname LIKE '%photo_url%')
ORDER BY indexname;

-- Resultado esperado:
-- idx_employees_full_name  | CREATE INDEX ... USING gin (full_name gin_trgm_ops)
-- idx_employees_photo_url  | CREATE INDEX ... WHERE photo_url IS NOT NULL


-- ============================================================

-- Query 3: Teste de dados (se houver funcionários)
-- Verifica se full_name = name
SELECT
  id,
  name,
  full_name,
  photo_url,
  CASE
    WHEN name = full_name THEN '✅ OK'
    ELSE '❌ ERRO'
  END as validation
FROM employees
LIMIT 5;

-- Resultado esperado:
-- Todos os registros devem ter validation = '✅ OK'
-- full_name deve ser idêntico a name


-- ============================================================

-- Query 4: Teste de performance do índice
-- Verifica se índice de busca funciona
EXPLAIN ANALYZE
SELECT id, name, full_name
FROM employees
WHERE full_name ILIKE '%teste%'
LIMIT 10;

-- Resultado esperado:
-- Query plan deve mencionar "idx_employees_full_name"
-- Execution time < 10ms (para tabelas com até 10k registros)


-- ============================================================

-- Query 5: Estatísticas da tabela
-- Verifica quantidade de dados
SELECT
  COUNT(*) as total_employees,
  COUNT(photo_url) as employees_with_photo,
  COUNT(*) - COUNT(photo_url) as employees_without_photo,
  ROUND(100.0 * COUNT(photo_url) / NULLIF(COUNT(*), 0), 2) as photo_percentage
FROM employees;

-- Resultado esperado:
-- Estatísticas gerais da tabela


-- ============================================================

-- Query 6: Verificar comentários das colunas
-- Confirma que documentação está presente
SELECT
  column_name,
  col_description((table_schema||'.'||table_name)::regclass::oid, ordinal_position) as column_comment
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'employees'
  AND column_name IN ('full_name', 'photo_url')
ORDER BY column_name;

-- Resultado esperado:
-- full_name | Generated column - alias de name para compatibilidade com código legado
-- photo_url | URL da foto armazenada no Supabase Storage


-- ============================================================

-- Query 7: Teste de atualização (NÃO EXECUTE EM PRODUÇÃO SEM BACKUP)
-- Verifica se generated column atualiza automaticamente
-- APENAS PARA AMBIENTE DE DESENVOLVIMENTO/TESTE!

-- BEGIN;
-- UPDATE employees
-- SET name = 'Teste Atualização'
-- WHERE id = (SELECT id FROM employees LIMIT 1);
--
-- SELECT name, full_name
-- FROM employees
-- WHERE name = 'Teste Atualização';
--
-- ROLLBACK; -- Desfaz a mudança

-- Resultado esperado:
-- full_name deve ser automaticamente atualizado para 'Teste Atualização'


-- ============================================================

-- Query 8: Verificar permissões (RLS)
-- Confirma que políticas de segurança ainda funcionam
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'employees'
ORDER BY policyname;

-- Resultado esperado:
-- Todas as políticas RLS devem estar ativas
-- Nenhuma política deve estar quebrada


-- ============================================================

-- Query 9: Teste de JOIN com outras tabelas
-- Verifica se relacionamentos ainda funcionam
SELECT
  e.id,
  e.name,
  e.full_name,
  e.photo_url,
  COUNT(DISTINCT a.id) as total_absences
FROM employees e
LEFT JOIN absences a ON a.employee_id = e.id
WHERE e.status = 'active'
GROUP BY e.id, e.name, e.full_name, e.photo_url
LIMIT 5;

-- Resultado esperado:
-- JOIN funciona normalmente
-- full_name aparece corretamente


-- ============================================================

-- Query 10: Verificar tamanho dos índices
-- Monitora uso de espaço em disco
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE tablename = 'employees'
  AND (indexname LIKE '%full_name%' OR indexname LIKE '%photo_url%')
ORDER BY indexname;

-- Resultado esperado:
-- Tamanho dos índices deve ser razoável
-- Tipicamente < 1MB para tabelas pequenas


-- ============================================================
-- TROUBLESHOOTING
-- ============================================================

-- Se as colunas NÃO existirem, execute a migração:
-- (Copie e cole o conteúdo de supabase/migrations/018_schema_compatibility.sql)

-- Se os índices NÃO existirem:
-- CREATE INDEX IF NOT EXISTS idx_employees_full_name
--   ON employees USING gin (full_name gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_employees_photo_url
--   ON employees(photo_url) WHERE photo_url IS NOT NULL;

-- Se full_name ≠ name, recriar a coluna:
-- ALTER TABLE employees DROP COLUMN IF EXISTS full_name;
-- ALTER TABLE employees
--   ADD COLUMN full_name TEXT
--   GENERATED ALWAYS AS (name) STORED;

-- ============================================================
-- FIM DAS QUERIES DE VERIFICAÇÃO
-- ============================================================
