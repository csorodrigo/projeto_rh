-- =====================================================
-- BATCH_07_FINALIZE
-- Files: 012_finalize.sql, 013_storage_buckets.sql
-- =====================================================


-- FILE: 012_finalize.sql
-- =====================================================

-- =====================================================
-- Migration 012: Finalizacao e Ajustes
-- Sistema SaaS de RH Multi-tenant
-- =====================================================
-- Este arquivo deve ser executado POR ULTIMO para:
-- 1. Adicionar FKs pendentes (referencias circulares)
-- 2. Criar grants para todas as tabelas
-- 3. Habilitar realtime
-- 4. Criar indexes adicionais de performance

-- =====================================================
-- FOREIGN KEYS PENDENTES
-- =====================================================

-- Adicionar FK employee_id na tabela profiles
-- (Nao foi possivel criar antes porque employees referencia profiles)
ALTER TABLE profiles
  ADD CONSTRAINT fk_profiles_employee
  FOREIGN KEY (employee_id)
  REFERENCES employees(id)
  ON DELETE SET NULL;

-- Adicionar FK absence_id na time_tracking_daily
ALTER TABLE time_tracking_daily
  ADD CONSTRAINT fk_time_tracking_absence
  FOREIGN KEY (absence_id)
  REFERENCES absences(id)
  ON DELETE SET NULL;

-- =====================================================
-- GRANTS PARA AUTHENTICATED USERS
-- =====================================================

-- Nota: RLS ja esta habilitado em todas as tabelas
-- Estes grants permitem acesso, RLS controla O QUE pode ser acessado

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl);
  END LOOP;
END $$;

-- Grants para sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- =====================================================
-- HABILITAR REALTIME (Supabase)
-- =====================================================

-- Tabelas que precisam de realtime para UI reativa
-- Nota: Isso deve ser configurado via Supabase Dashboard
-- Aqui documentamos as tabelas recomendadas

-- Realtime recomendado:
-- - profiles (status online, notificacoes)
-- - time_records (registro de ponto em tempo real)
-- - absences (aprovacoes)
-- - evaluations (avaliacoes em andamento)
-- - pdi_activities (progresso PDI)

-- Para habilitar via SQL (se disponivel):
-- ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
-- ALTER PUBLICATION supabase_realtime ADD TABLE time_records;
-- ALTER PUBLICATION supabase_realtime ADD TABLE absences;

-- =====================================================
-- INDICES COMPOSTOS DE PERFORMANCE
-- =====================================================

-- Indice para busca de funcionarios ativos por empresa
CREATE INDEX IF NOT EXISTS idx_employees_company_active
  ON employees (company_id, status, name)
  WHERE status = 'active';

-- Indice para dashboard de ponto (periodo)
-- Nota: Removido filtro com CURRENT_DATE pois nao e IMMUTABLE
CREATE INDEX IF NOT EXISTS idx_time_tracking_dashboard
  ON time_tracking_daily (company_id, date, status);

-- Indice para ausencias proximas
-- Nota: Removido filtro com CURRENT_DATE pois nao e IMMUTABLE
CREATE INDEX IF NOT EXISTS idx_absences_upcoming
  ON absences (company_id, start_date, status)
  WHERE status IN ('approved', 'pending');

-- Indice para avaliacoes pendentes
CREATE INDEX IF NOT EXISTS idx_evaluations_pending_evaluator
  ON evaluations (evaluator_id, cycle_id, status)
  WHERE status IN ('pending', 'in_progress');

-- Indice para PDIs ativos
CREATE INDEX IF NOT EXISTS idx_pdis_active_employee
  ON pdis (employee_id, status, target_date)
  WHERE status IN ('approved', 'in_progress');

-- Indice para folha do mes atual
CREATE INDEX IF NOT EXISTS idx_payroll_current
  ON employee_payrolls (company_id, period_id, status);

-- =====================================================
-- FUNCOES DE AUDITORIA
-- =====================================================

-- Tabela de audit log (opcional - para compliance)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID,
  action VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES profiles(id),
  changed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_audit_logs_table ON audit_logs (table_name);
CREATE INDEX idx_audit_logs_record ON audit_logs (record_id);
CREATE INDEX idx_audit_logs_date ON audit_logs (changed_at);
CREATE INDEX idx_audit_logs_user ON audit_logs (changed_by);

-- Funcao generica de auditoria
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, changed_by)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, action, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar auditoria em tabelas criticas (opcional)
-- Descomente para habilitar:

-- CREATE TRIGGER audit_employees
--   AFTER INSERT OR UPDATE OR DELETE ON employees
--   FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- CREATE TRIGGER audit_absences
--   AFTER INSERT OR UPDATE OR DELETE ON absences
--   FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- CREATE TRIGGER audit_employee_payrolls
--   AFTER INSERT OR UPDATE OR DELETE ON employee_payrolls
--   FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- RLS para audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- VIEWS CONSOLIDADAS
-- =====================================================

-- View de dashboard do RH
CREATE OR REPLACE VIEW v_hr_dashboard AS
SELECT
  c.id AS company_id,
  c.name AS company_name,
  (SELECT COUNT(*) FROM employees WHERE company_id = c.id AND status = 'active') AS total_active_employees,
  (SELECT COUNT(*) FROM employees WHERE company_id = c.id AND status = 'on_leave') AS total_on_leave,
  (SELECT COUNT(*) FROM absences WHERE company_id = c.id AND status = 'pending') AS pending_absences,
  (SELECT COUNT(*) FROM time_tracking_daily WHERE company_id = c.id AND status = 'pending' AND date >= CURRENT_DATE - INTERVAL '7 days') AS pending_time_records,
  (SELECT COUNT(*) FROM evaluations e JOIN evaluation_cycles ec ON ec.id = e.cycle_id WHERE ec.company_id = c.id AND e.status = 'pending') AS pending_evaluations,
  (SELECT COUNT(*) FROM pdis WHERE company_id = c.id AND status = 'in_progress') AS active_pdis,
  (SELECT COUNT(*) FROM employee_documents WHERE company_id = c.id AND expires_at IS NOT NULL AND expires_at <= CURRENT_DATE + INTERVAL '30 days' AND status = 'approved') AS expiring_documents,
  (SELECT COUNT(*) FROM asos a JOIN employees e ON e.id = a.employee_id WHERE e.company_id = c.id AND a.next_exam_date <= CURRENT_DATE + INTERVAL '30 days') AS expiring_exams
FROM companies c;

-- View de funcionario completo (para detalhes)
CREATE OR REPLACE VIEW v_employee_complete AS
SELECT
  e.*,
  p.id AS profile_id,
  p.role AS user_role,
  p.avatar_url,
  p.last_login_at,
  ws.name AS schedule_name,
  ws.weekly_hours AS schedule_hours,
  m.name AS manager_name,
  (SELECT json_agg(json_build_object('type', type, 'file_url', file_url, 'expires_at', expires_at))
   FROM employee_documents WHERE employee_id = e.id AND is_current = true) AS documents,
  (SELECT json_build_object('last_exam', exam_date, 'result', result, 'next_exam', next_exam_date)
   FROM asos WHERE employee_id = e.id ORDER BY exam_date DESC LIMIT 1) AS health_status,
  (SELECT available_days FROM vacation_balances WHERE employee_id = e.id AND NOT is_expired ORDER BY period_start DESC LIMIT 1) AS vacation_balance
FROM employees e
LEFT JOIN profiles p ON p.employee_id = e.id
LEFT JOIN work_schedules ws ON ws.id = e.work_schedule_id
LEFT JOIN employees m ON m.id = e.manager_id;

-- =====================================================
-- FUNCOES DE RELATORIO
-- =====================================================

-- Funcao para gerar relatorio de headcount
CREATE OR REPLACE FUNCTION report_headcount(
  p_company_id UUID,
  p_reference_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  department TEXT,
  "position" TEXT,
  total_employees BIGINT,
  active_employees BIGINT,
  on_leave BIGINT,
  avg_tenure_months NUMERIC,
  avg_salary NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.department,
    e."position",
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE e.status = 'active')::BIGINT,
    COUNT(*) FILTER (WHERE e.status = 'on_leave')::BIGINT,
    ROUND(AVG(EXTRACT(MONTH FROM AGE(p_reference_date, e.hire_date)))::NUMERIC, 1),
    ROUND(AVG(e.base_salary)::NUMERIC, 2)
  FROM employees e
  WHERE e.company_id = p_company_id
  AND e.status IN ('active', 'on_leave')
  GROUP BY e.department, e."position"
  ORDER BY e.department, e."position";
END;
$$ LANGUAGE plpgsql;

-- Funcao para gerar relatorio de absenteismo
CREATE OR REPLACE FUNCTION report_absenteeism(
  p_company_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  department TEXT,
  total_employees BIGINT,
  total_absence_days BIGINT,
  absence_rate NUMERIC,
  main_reasons JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH employee_counts AS (
    SELECT department, COUNT(*) as emp_count
    FROM employees
    WHERE company_id = p_company_id AND status = 'active'
    GROUP BY department
  ),
  absence_stats AS (
    SELECT
      e.department,
      SUM(a.total_days) as total_days,
      jsonb_agg(DISTINCT a.type) as reasons
    FROM absences a
    JOIN employees e ON e.id = a.employee_id
    WHERE a.company_id = p_company_id
    AND a.status = 'approved'
    AND a.start_date >= p_start_date
    AND a.end_date <= p_end_date
    GROUP BY e.department
  )
  SELECT
    ec.department,
    ec.emp_count,
    COALESCE(abs.total_days, 0)::BIGINT,
    ROUND(
      COALESCE(abs.total_days, 0)::NUMERIC /
      (ec.emp_count * (p_end_date - p_start_date + 1)) * 100,
      2
    ),
    COALESCE(abs.reasons, '[]'::jsonb)
  FROM employee_counts ec
  LEFT JOIN absence_stats abs ON abs.department = ec.department
  ORDER BY ec.department;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CLEANUP E MANUTENCAO
-- =====================================================

-- Funcao para limpar dados expirados (executar via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
  -- Marcar ferias expiradas
  UPDATE vacation_balances
  SET is_expired = true
  WHERE expires_at < CURRENT_DATE
  AND is_expired = false;

  -- Marcar documentos expirados
  UPDATE employee_documents
  SET status = 'expired'
  WHERE expires_at < CURRENT_DATE
  AND status = 'approved';

  -- Marcar exames agendados expirados
  UPDATE scheduled_exams
  SET status = 'expired'
  WHERE scheduled_date < CURRENT_DATE
  AND status = 'scheduled';

  -- Limpar audit logs antigos (manter 2 anos)
  DELETE FROM audit_logs
  WHERE changed_at < CURRENT_DATE - INTERVAL '2 years';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTARIOS FINAIS
-- =====================================================

COMMENT ON VIEW v_hr_dashboard IS 'Dashboard consolidado para RH com metricas principais';
COMMENT ON VIEW v_employee_complete IS 'Visao completa do funcionario com dados relacionados';
COMMENT ON TABLE audit_logs IS 'Log de auditoria para rastreamento de alteracoes';
COMMENT ON FUNCTION report_headcount IS 'Relatorio de headcount por departamento e cargo';
COMMENT ON FUNCTION report_absenteeism IS 'Relatorio de absenteismo por departamento';
COMMENT ON FUNCTION cleanup_expired_data IS 'Funcao de manutencao para marcar dados expirados';

-- =====================================================
-- VERIFICACAO FINAL
-- =====================================================

DO $$
DECLARE
  table_count INTEGER;
  rls_count INTEGER;
BEGIN
  -- Contar tabelas
  SELECT COUNT(*) INTO table_count
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%';

  -- Contar tabelas com RLS
  SELECT COUNT(*) INTO rls_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = true;

  RAISE NOTICE 'Setup completo!';
  RAISE NOTICE 'Total de tabelas criadas: %', table_count;
  RAISE NOTICE 'Tabelas com RLS habilitado: %', rls_count;
END $$;



-- FILE: 013_storage_buckets.sql
-- =====================================================

-- =====================================================
-- Migration 013: Storage Buckets para Documentos
-- Sistema SaaS de RH Multi-tenant
-- =====================================================

-- Criar bucket para documentos de funcionarios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employee-documents',
  'employee-documents',
  false, -- Bucket privado
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- RLS Policies para Storage
-- =====================================================

-- Policy: Usuarios autenticados da mesma empresa podem fazer upload
CREATE POLICY "Users can upload documents for their company"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] = (
    SELECT company_id::text FROM profiles WHERE id = auth.uid()
  )
);

-- Policy: Usuarios autenticados da mesma empresa podem visualizar
CREATE POLICY "Users can view documents from their company"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] = (
    SELECT company_id::text FROM profiles WHERE id = auth.uid()
  )
);

-- Policy: Admins podem deletar documentos da empresa
CREATE POLICY "Admins can delete documents from their company"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] = (
    SELECT company_id::text FROM profiles WHERE id = auth.uid()
  ) AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'hr')
  )
);

-- Policy: Admins podem atualizar documentos da empresa
CREATE POLICY "Admins can update documents from their company"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'employee-documents' AND
  (storage.foldername(name))[1] = (
    SELECT company_id::text FROM profiles WHERE id = auth.uid()
  ) AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'hr')
  )
);

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE storage.buckets IS 'Buckets de armazenamento do Supabase Storage';


