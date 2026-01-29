-- =====================================================
-- Migration 019: Test Script
-- Script de testes para validar a migração 019
-- =====================================================

-- =====================================================
-- SETUP: Verificar estrutura
-- =====================================================

\echo '=== Verificando policies criadas ==='

SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual IS NOT NULL as has_using_clause
FROM pg_policies
WHERE tablename = 'employees'
  AND policyname LIKE '%_via_%_join'
ORDER BY policyname;

-- Esperado: 4 policies
-- - employees_readable_via_absences_join
-- - employees_readable_via_asos_join
-- - employees_readable_via_medical_certificates_join
-- - employees_readable_via_vacation_balances_join

\echo ''
\echo '=== Verificando índices criados ==='

SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname IN (
  'idx_absences_employee_company',
  'idx_asos_employee_company',
  'idx_medical_certificates_employee_company',
  'idx_vacation_balances_employee_company'
)
ORDER BY tablename, indexname;

-- Esperado: 4 índices

-- =====================================================
-- TESTE 1: Verificar que policies não conflitam
-- =====================================================

\echo ''
\echo '=== TESTE 1: Verificar contagem de policies em employees ==='

SELECT
  COUNT(*) as total_policies,
  COUNT(*) FILTER (WHERE cmd = 'SELECT') as select_policies,
  COUNT(*) FILTER (WHERE cmd = 'INSERT') as insert_policies,
  COUNT(*) FILTER (WHERE cmd = 'UPDATE') as update_policies,
  COUNT(*) FILTER (WHERE cmd = 'ALL') as all_policies
FROM pg_policies
WHERE tablename = 'employees';

-- Esperado:
-- total_policies: >= 9 (5 existentes + 4 novas)
-- select_policies: >= 7 (3 existentes + 4 novas)

-- =====================================================
-- TESTE 2: Simular query com JOIN de absences
-- =====================================================

\echo ''
\echo '=== TESTE 2: Estrutura de query de absences com JOIN ==='

EXPLAIN (VERBOSE, FORMAT TEXT)
SELECT
  a.id,
  a.start_date,
  a.end_date,
  a.type,
  e.full_name,
  e.photo_url,
  e.department
FROM absences a
JOIN employees e ON e.id = a.employee_id
WHERE a.company_id = (
  SELECT company_id FROM companies LIMIT 1
)
LIMIT 10;

-- Verifica se a query é válida e mostra o plano de execução

-- =====================================================
-- TESTE 3: Simular query com JOIN de asos
-- =====================================================

\echo ''
\echo '=== TESTE 3: Estrutura de query de asos com JOIN ==='

EXPLAIN (VERBOSE, FORMAT TEXT)
SELECT
  aso.id,
  aso.exam_date,
  aso.result,
  aso.type,
  e.full_name,
  e.photo_url,
  e.department
FROM asos aso
JOIN employees e ON e.id = aso.employee_id
WHERE aso.company_id = (
  SELECT company_id FROM companies LIMIT 1
)
LIMIT 10;

-- =====================================================
-- TESTE 4: Verificar impacto nos índices
-- =====================================================

\echo ''
\echo '=== TESTE 4: Estatísticas de índices criados ==='

SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE indexname IN (
  'idx_absences_employee_company',
  'idx_asos_employee_company',
  'idx_medical_certificates_employee_company',
  'idx_vacation_balances_employee_company'
)
ORDER BY tablename, indexname;

-- Mostra uso dos índices (será 0 logo após criação)

-- =====================================================
-- TESTE 5: Verificar tamanho dos índices
-- =====================================================

\echo ''
\echo '=== TESTE 5: Tamanho dos índices criados ==='

SELECT
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes
WHERE indexname IN (
  'idx_absences_employee_company',
  'idx_asos_employee_company',
  'idx_medical_certificates_employee_company',
  'idx_vacation_balances_employee_company'
)
ORDER BY indexname;

-- Mostra tamanho em disco dos índices

-- =====================================================
-- TESTE 6: Verificar contagem de registros relacionados
-- =====================================================

\echo ''
\echo '=== TESTE 6: Contagem de registros nas tabelas relacionadas ==='

SELECT
  'absences' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT employee_id) as unique_employees,
  COUNT(DISTINCT company_id) as unique_companies
FROM absences

UNION ALL

SELECT
  'asos' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT employee_id) as unique_employees,
  COUNT(DISTINCT company_id) as unique_companies
FROM asos

UNION ALL

SELECT
  'medical_certificates' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT employee_id) as unique_employees,
  COUNT(DISTINCT company_id) as unique_companies
FROM medical_certificates

UNION ALL

SELECT
  'vacation_balances' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT employee_id) as unique_employees,
  COUNT(DISTINCT company_id) as unique_companies
FROM vacation_balances

ORDER BY table_name;

-- =====================================================
-- TESTE 7: Test de segurança - Verificar isolamento
-- =====================================================

\echo ''
\echo '=== TESTE 7: Verificar que companies estão isoladas ==='

-- Verificar que employee_id são únicos por company
SELECT
  company_id,
  COUNT(*) as total_employees,
  COUNT(DISTINCT cpf) as unique_cpf
FROM employees
GROUP BY company_id
ORDER BY company_id;

-- Esperado: unique_cpf = total_employees (sem duplicatas entre empresas)

-- =====================================================
-- TESTE 8: Verificar comentários das colunas
-- =====================================================

\echo ''
\echo '=== TESTE 8: Verificar comentários das colunas atualizados ==='

SELECT
  table_name,
  column_name,
  col_description((table_schema||'.'||table_name)::regclass::oid, ordinal_position) as column_comment
FROM information_schema.columns
WHERE table_name = 'employees'
  AND column_name IN ('full_name', 'photo_url')
ORDER BY column_name;

-- Esperado: Comentários atualizados mencionando JOINs

-- =====================================================
-- TESTE 9: Performance comparison (OPCIONAL)
-- =====================================================

\echo ''
\echo '=== TESTE 9: Benchmark simples de query com JOIN ==='

-- Habilitar timing
\timing on

-- Query de absences com JOIN
SELECT COUNT(*)
FROM absences a
JOIN employees e ON e.id = a.employee_id;

-- Query de asos com JOIN
SELECT COUNT(*)
FROM asos aso
JOIN employees e ON e.id = aso.employee_id;

-- Query de medical_certificates com JOIN
SELECT COUNT(*)
FROM medical_certificates mc
JOIN employees e ON e.id = mc.employee_id;

-- Query de vacation_balances com JOIN
SELECT COUNT(*)
FROM vacation_balances vb
JOIN employees e ON e.id = vb.employee_id;

\timing off

-- =====================================================
-- TESTE 10: Verificar que views funcionam
-- =====================================================

\echo ''
\echo '=== TESTE 10: Verificar views que usam JOINs com employees ==='

-- Listar views que fazem JOIN com employees
SELECT
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE definition LIKE '%employees%'
  AND viewname LIKE 'v_%'
ORDER BY viewname;

-- =====================================================
-- RESULTADOS ESPERADOS
-- =====================================================

\echo ''
\echo '=== RESUMO DOS TESTES ==='
\echo 'TESTE 1: Deve mostrar >= 9 policies em employees'
\echo 'TESTE 2: Query deve ser válida (sem erros)'
\echo 'TESTE 3: Query deve ser válida (sem erros)'
\echo 'TESTE 4: Índices criados (scans = 0 inicialmente)'
\echo 'TESTE 5: Tamanho dos índices (alguns KB)'
\echo 'TESTE 6: Contagem de registros por tabela'
\echo 'TESTE 7: CPFs únicos por company (sem vazamento)'
\echo 'TESTE 8: Comentários atualizados'
\echo 'TESTE 9: Timing das queries (deve ser rápido)'
\echo 'TESTE 10: Views existentes listadas'
\echo ''
\echo '=== FIM DOS TESTES ==='

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================

-- Como executar este script:
--
-- 1. Via psql (recomendado):
--    psql -h your-db-host -U postgres -d postgres -f 019_test.sql
--
-- 2. Via Supabase Dashboard:
--    - Copie e cole o conteúdo no SQL Editor
--    - Execute seção por seção
--
-- 3. Via código:
--    - Use um cliente PostgreSQL
--    - Execute as queries individuais
--
-- Todos os testes devem passar sem erros.
-- Se algum teste falhar, verifique os logs e revise a migração.
