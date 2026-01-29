-- =====================================================
-- Migration 019: Fix RLS for JOINs
-- Resolve bloqueio de RLS em JOINs de absences/asos com employees
-- Data: 2026-01-28
-- =====================================================
--
-- Problema: Queries diretas em employees funcionam (HTTP 200) mas
-- JOINs de absences → employees e asos → employees retornam HTTP 400.
--
-- Causa: RLS policies de employees não contemplam acesso via JOIN
-- quando o usuário tem permissão para ver a tabela origem (absences/asos)
-- mas não tem permissão direta sobre o employee_id referenciado.
--
-- Solução: Adicionar policies que permitam SELECT em employees quando
-- acessado via JOIN de tabelas onde o usuário já tem permissão de leitura.
-- =====================================================

BEGIN;

-- =====================================================
-- POLICY: Permitir acesso a employees via JOINs de absences
-- =====================================================

-- Usuários podem ver dados de employees quando:
-- 1. Estão fazendo JOIN de absences onde têm permissão de leitura
-- 2. O employee_id é referenciado em uma ausência que eles podem ver

CREATE POLICY "employees_readable_via_absences_join"
  ON employees FOR SELECT
  USING (
    -- Permite acesso se o employee está em uma ausência que o usuário pode ver
    id IN (
      -- Ausências próprias
      SELECT DISTINCT employee_id FROM absences
      WHERE employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())

      UNION

      -- Ausências de equipe (se for gestor)
      SELECT DISTINCT employee_id FROM absences
      WHERE employee_id IN (
        SELECT id FROM employees
        WHERE manager_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
      )

      UNION

      -- Todas as ausências (se for admin/HR)
      SELECT DISTINCT employee_id FROM absences
      WHERE company_id IN (
        SELECT company_id FROM profiles
        WHERE id = auth.uid() AND role IN ('admin', 'hr')
      )
    )
  );

COMMENT ON POLICY "employees_readable_via_absences_join" ON employees IS
  'Permite leitura de dados de employees quando acessados via JOIN com absences';

-- =====================================================
-- POLICY: Permitir acesso a employees via JOINs de asos
-- =====================================================

-- Usuários podem ver dados de employees quando:
-- 1. Estão fazendo JOIN de asos onde têm permissão de leitura
-- 2. O employee_id é referenciado em um ASO que eles podem ver

CREATE POLICY "employees_readable_via_asos_join"
  ON employees FOR SELECT
  USING (
    -- Permite acesso se o employee está em um ASO que o usuário pode ver
    id IN (
      -- ASOs próprios
      SELECT DISTINCT employee_id FROM asos
      WHERE employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())

      UNION

      -- Todos os ASOs (se for admin/HR)
      SELECT DISTINCT employee_id FROM asos
      WHERE company_id IN (
        SELECT company_id FROM profiles
        WHERE id = auth.uid() AND role IN ('admin', 'hr')
      )
    )
  );

COMMENT ON POLICY "employees_readable_via_asos_join" ON employees IS
  'Permite leitura de dados de employees quando acessados via JOIN com asos';

-- =====================================================
-- POLICY: Permitir acesso a employees via JOINs de medical_certificates
-- =====================================================

-- Similar para medical_certificates, seguindo o mesmo padrão
CREATE POLICY "employees_readable_via_medical_certificates_join"
  ON employees FOR SELECT
  USING (
    id IN (
      -- Certificados próprios
      SELECT DISTINCT employee_id FROM medical_certificates
      WHERE employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())

      UNION

      -- Todos os certificados (se for admin/HR)
      SELECT DISTINCT employee_id FROM medical_certificates
      WHERE company_id IN (
        SELECT company_id FROM profiles
        WHERE id = auth.uid() AND role IN ('admin', 'hr')
      )
    )
  );

COMMENT ON POLICY "employees_readable_via_medical_certificates_join" ON employees IS
  'Permite leitura de dados de employees quando acessados via JOIN com medical_certificates';

-- =====================================================
-- POLICY: Permitir acesso a employees via JOINs de vacation_balances
-- =====================================================

CREATE POLICY "employees_readable_via_vacation_balances_join"
  ON employees FOR SELECT
  USING (
    id IN (
      -- Saldos de férias próprios
      SELECT DISTINCT employee_id FROM vacation_balances
      WHERE employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())

      UNION

      -- Todos os saldos (se for admin/HR)
      SELECT DISTINCT employee_id FROM vacation_balances
      WHERE company_id IN (
        SELECT company_id FROM profiles
        WHERE id = auth.uid() AND role IN ('admin', 'hr')
      )
    )
  );

COMMENT ON POLICY "employees_readable_via_vacation_balances_join" ON employees IS
  'Permite leitura de dados de employees quando acessados via JOIN com vacation_balances';

-- =====================================================
-- INDICES para otimizar performance das novas policies
-- =====================================================

-- Índice composto para otimizar subqueries de ausências
CREATE INDEX IF NOT EXISTS idx_absences_employee_company
  ON absences(employee_id, company_id);

-- Índice composto para otimizar subqueries de ASOs
CREATE INDEX IF NOT EXISTS idx_asos_employee_company
  ON asos(employee_id, company_id);

-- Índice composto para otimizar subqueries de certificados médicos
CREATE INDEX IF NOT EXISTS idx_medical_certificates_employee_company
  ON medical_certificates(employee_id, company_id);

-- Índice composto para otimizar subqueries de saldos de férias
CREATE INDEX IF NOT EXISTS idx_vacation_balances_employee_company
  ON vacation_balances(employee_id, company_id);

-- =====================================================
-- VALIDAÇÃO: Verificar que policies existentes não conflitam
-- =====================================================

-- As novas policies são aditivas (usando OR implícito via múltiplas policies)
-- e não devem conflitar com as policies existentes:
-- - "Users can view employees from same company"
-- - "Admins and HR can insert employees"
-- - "Admins and HR can update employees"
-- - "Managers can view their team"
-- - "Employees can view own data"

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================

COMMENT ON COLUMN employees.full_name IS
  'Generated column - alias de name. Acessível via JOINs de absences, asos, medical_certificates e vacation_balances';

COMMENT ON COLUMN employees.photo_url IS
  'URL da foto no Supabase Storage. Acessível via JOINs de absences, asos, medical_certificates e vacation_balances';

COMMIT;

-- =====================================================
-- NOTAS DE SEGURANÇA
-- =====================================================
--
-- 1. As novas policies mantêm o princípio de least privilege:
--    - Usuários só veem employees que já têm permissão via tabelas relacionadas
--    - Admins/HR continuam tendo acesso total
--    - Gestores continuam vendo apenas sua equipe
--
-- 2. Performance:
--    - Índices compostos adicionados para otimizar subqueries
--    - Policies usam DISTINCT para evitar duplicatas
--    - UNION ao invés de UNION ALL para garantir unicidade
--
-- 3. Compatibilidade:
--    - Não remove policies existentes
--    - Adiciona policies complementares
--    - Mantém comportamento atual para queries diretas
--
-- =====================================================
