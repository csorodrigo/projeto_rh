-- =====================================================
-- BATCH_04_ABSENCES
-- Files: 007_absences.sql, 008_health.sql
-- =====================================================


-- FILE: 007_absences.sql
-- =====================================================

-- =====================================================
-- Migration 007: Absences (Ausencias, Ferias, Licencas)
-- Sistema SaaS de RH Multi-tenant
-- =====================================================

-- ENUM para tipos de ausencia
CREATE TYPE absence_type AS ENUM (
  -- Ferias
  'vacation',                -- Ferias regulares
  'vacation_advance',        -- Ferias antecipadas
  'vacation_sold',           -- Abono pecuniario (vender 10 dias)

  -- Licencas legais
  'sick_leave',              -- Licenca medica
  'maternity_leave',         -- Licenca maternidade
  'paternity_leave',         -- Licenca paternidade
  'adoption_leave',          -- Licenca adocao
  'bereavement',             -- Licenca nojo (falecimento)
  'marriage_leave',          -- Licenca casamento (gala)
  'jury_duty',               -- Servico do juri
  'military_service',        -- Servico militar
  'election_duty',           -- Mesario
  'blood_donation',          -- Doacao de sangue
  'union_leave',             -- Licenca sindical

  -- Ausencias justificadas
  'medical_appointment',     -- Consulta medica
  'prenatal',                -- Pre-natal
  'child_sick',              -- Filho doente
  'legal_obligation',        -- Obrigacao legal
  'study_leave',             -- Licenca para estudos

  -- Ausencias nao justificadas
  'unjustified',             -- Falta nao justificada

  -- Outros
  'time_bank',               -- Compensacao de banco de horas
  'compensatory',            -- Folga compensatoria
  'other'                    -- Outros
);

-- ENUM para status da ausencia
CREATE TYPE absence_status AS ENUM (
  'draft',        -- Rascunho
  'pending',      -- Aguardando aprovacao
  'approved',     -- Aprovada
  'rejected',     -- Rejeitada
  'cancelled',    -- Cancelada
  'in_progress',  -- Em andamento
  'completed'     -- Concluida
);

-- =====================================================
-- Tabela de politicas de ferias
-- =====================================================

CREATE TABLE vacation_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Identificacao
  name TEXT NOT NULL,
  description TEXT,

  -- Regras de acumulacao
  accrual_days_per_month NUMERIC(5,2) DEFAULT 2.5, -- 30 dias/ano = 2.5/mes
  max_accrued_days INTEGER DEFAULT 30, -- Maximo acumulavel
  vesting_period_months INTEGER DEFAULT 12, -- Periodo aquisitivo (meses)

  -- Regras de utilizacao
  min_days_per_request INTEGER DEFAULT 5, -- Minimo de dias por solicitacao
  max_days_per_request INTEGER DEFAULT 30, -- Maximo de dias por solicitacao
  advance_notice_days INTEGER DEFAULT 30, -- Antecedencia minima para solicitar

  -- Abono pecuniario
  allow_sell_days BOOLEAN DEFAULT true, -- Permite vender ferias
  max_sell_days INTEGER DEFAULT 10, -- Maximo de dias para vender

  -- Fracionamento (Reforma Trabalhista)
  allow_split BOOLEAN DEFAULT true, -- Permite fracionar
  max_splits INTEGER DEFAULT 3, -- Maximo de fracoes
  min_first_period_days INTEGER DEFAULT 14, -- Minimo do primeiro periodo
  min_other_periods_days INTEGER DEFAULT 5, -- Minimo dos demais periodos

  -- Bloqueio
  blackout_periods JSONB DEFAULT '[]'::jsonb, -- Periodos bloqueados
  -- Estrutura:
  -- [
  --   { "start_month": 12, "start_day": 15, "end_month": 1, "end_day": 15, "reason": "Fechamento anual" }
  -- ]

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- Tabela de saldo de ferias
-- =====================================================

CREATE TABLE vacation_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Funcionario
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Periodo aquisitivo
  period_start DATE NOT NULL, -- Inicio do periodo aquisitivo
  period_end DATE NOT NULL, -- Fim do periodo aquisitivo

  -- Saldo
  accrued_days NUMERIC(5,2) DEFAULT 0, -- Dias acumulados
  used_days NUMERIC(5,2) DEFAULT 0, -- Dias utilizados
  sold_days NUMERIC(5,2) DEFAULT 0, -- Dias vendidos
  available_days NUMERIC(5,2) GENERATED ALWAYS AS (accrued_days - used_days - sold_days) STORED,

  -- Validade
  expires_at DATE, -- Data limite para gozo (periodo concessivo)
  is_expired BOOLEAN DEFAULT false,

  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, used, expired

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Constraint
  CONSTRAINT unique_vacation_period UNIQUE (employee_id, period_start)
);

-- =====================================================
-- Tabela de ausencias
-- =====================================================

CREATE TABLE absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Funcionario
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Tipo
  type absence_type NOT NULL,

  -- Periodo
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER GENERATED ALWAYS AS (end_date - start_date + 1) STORED,

  -- Para ferias fracionadas
  vacation_balance_id UUID REFERENCES vacation_balances(id),
  is_vacation_split BOOLEAN DEFAULT false,
  split_number INTEGER, -- 1, 2 ou 3

  -- Para abono pecuniario
  is_vacation_sold BOOLEAN DEFAULT false,
  sold_days INTEGER DEFAULT 0,

  -- Descricao
  reason TEXT,
  notes TEXT,

  -- Documentacao
  document_url TEXT, -- Atestado, declaracao, etc
  document_type VARCHAR(50),

  -- Para licenca medica
  cid_code VARCHAR(10), -- CID-10
  issuing_doctor TEXT,
  crm VARCHAR(20),

  -- Status e workflow
  status absence_status DEFAULT 'pending' NOT NULL,

  -- Aprovacao
  requested_at TIMESTAMPTZ DEFAULT now(),
  requested_by UUID REFERENCES profiles(id),

  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),

  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,

  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES profiles(id),
  cancellation_reason TEXT,

  -- Impacto financeiro (para calculo de folha)
  affects_salary BOOLEAN DEFAULT false,
  salary_deduction_days NUMERIC(5,2) DEFAULT 0,

  -- Integracao com ponto
  auto_justify_time_records BOOLEAN DEFAULT true,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Constraints
  CONSTRAINT valid_dates CHECK (end_date >= start_date),
  CONSTRAINT valid_split CHECK (
    NOT is_vacation_split OR split_number BETWEEN 1 AND 3
  )
);

-- =====================================================
-- Tabela de historico de ausencias (auditoria)
-- =====================================================

CREATE TABLE absence_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  absence_id UUID NOT NULL REFERENCES absences(id) ON DELETE CASCADE,

  -- Mudanca
  action VARCHAR(50) NOT NULL, -- created, approved, rejected, cancelled, updated
  old_status absence_status,
  new_status absence_status,

  -- Detalhes
  changes JSONB, -- Campos alterados
  notes TEXT,

  -- Quem
  performed_by UUID REFERENCES profiles(id),
  performed_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- INDICES
-- =====================================================

-- vacation_policies
CREATE INDEX idx_vacation_policies_company ON vacation_policies (company_id);
CREATE INDEX idx_vacation_policies_active ON vacation_policies (company_id, is_active)
  WHERE is_active = true;

-- vacation_balances
CREATE INDEX idx_vacation_balances_company ON vacation_balances (company_id);
CREATE INDEX idx_vacation_balances_employee ON vacation_balances (employee_id);
CREATE INDEX idx_vacation_balances_period ON vacation_balances (period_start, period_end);
CREATE INDEX idx_vacation_balances_expires ON vacation_balances (expires_at)
  WHERE NOT is_expired;

-- absences
CREATE INDEX idx_absences_company ON absences (company_id);
CREATE INDEX idx_absences_employee ON absences (employee_id);
CREATE INDEX idx_absences_type ON absences (type);
CREATE INDEX idx_absences_status ON absences (status);
CREATE INDEX idx_absences_dates ON absences (start_date, end_date);
CREATE INDEX idx_absences_employee_dates ON absences (employee_id, start_date, end_date);
CREATE INDEX idx_absences_pending ON absences (company_id, status)
  WHERE status = 'pending';

-- absence_history
CREATE INDEX idx_absence_history_absence ON absence_history (absence_id);
CREATE INDEX idx_absence_history_date ON absence_history (performed_at);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER trigger_vacation_policies_updated_at
  BEFORE UPDATE ON vacation_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_vacation_balances_updated_at
  BEFORE UPDATE ON vacation_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_absences_updated_at
  BEFORE UPDATE ON absences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Funcao para registrar historico de ausencias
CREATE OR REPLACE FUNCTION record_absence_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO absence_history (absence_id, action, new_status, performed_by)
    VALUES (NEW.id, 'created', NEW.status, NEW.requested_by);
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO absence_history (absence_id, action, old_status, new_status, performed_by)
    VALUES (
      NEW.id,
      CASE NEW.status
        WHEN 'approved' THEN 'approved'
        WHEN 'rejected' THEN 'rejected'
        WHEN 'cancelled' THEN 'cancelled'
        ELSE 'updated'
      END,
      OLD.status,
      NEW.status,
      COALESCE(NEW.approved_by, NEW.rejected_by, NEW.cancelled_by)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_record_absence_history
  AFTER INSERT OR UPDATE ON absences
  FOR EACH ROW
  EXECUTE FUNCTION record_absence_history();

-- Funcao para atualizar saldo de ferias ao aprovar
CREATE OR REPLACE FUNCTION update_vacation_balance_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    IF NEW.type IN ('vacation', 'vacation_advance') AND NEW.vacation_balance_id IS NOT NULL THEN
      -- Atualizar dias usados
      UPDATE vacation_balances
      SET used_days = used_days + NEW.total_days
      WHERE id = NEW.vacation_balance_id;
    ELSIF NEW.type = 'vacation_sold' AND NEW.vacation_balance_id IS NOT NULL THEN
      -- Atualizar dias vendidos
      UPDATE vacation_balances
      SET sold_days = sold_days + NEW.sold_days
      WHERE id = NEW.vacation_balance_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vacation_balance
  AFTER UPDATE ON absences
  FOR EACH ROW
  EXECUTE FUNCTION update_vacation_balance_on_approval();

-- Funcao para verificar sobreposicao de ausencias
CREATE OR REPLACE FUNCTION check_absence_overlap()
RETURNS TRIGGER AS $$
DECLARE
  v_overlap_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_overlap_count
  FROM absences
  WHERE employee_id = NEW.employee_id
  AND id != COALESCE(NEW.id, gen_random_uuid())
  AND status NOT IN ('cancelled', 'rejected')
  AND (
    (NEW.start_date BETWEEN start_date AND end_date)
    OR (NEW.end_date BETWEEN start_date AND end_date)
    OR (start_date BETWEEN NEW.start_date AND NEW.end_date)
  );

  IF v_overlap_count > 0 THEN
    RAISE EXCEPTION 'Ja existe uma ausencia aprovada neste periodo';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_absence_overlap
  BEFORE INSERT OR UPDATE ON absences
  FOR EACH ROW
  WHEN (NEW.status NOT IN ('cancelled', 'rejected'))
  EXECUTE FUNCTION check_absence_overlap();

-- =====================================================
-- FUNCOES AUXILIARES
-- =====================================================

-- Funcao para calcular saldo de ferias
CREATE OR REPLACE FUNCTION calculate_vacation_balance(
  p_employee_id UUID,
  p_reference_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  period_start DATE,
  period_end DATE,
  accrued_days NUMERIC,
  used_days NUMERIC,
  sold_days NUMERIC,
  available_days NUMERIC,
  expires_at DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vb.period_start,
    vb.period_end,
    vb.accrued_days,
    vb.used_days,
    vb.sold_days,
    vb.available_days,
    vb.expires_at
  FROM vacation_balances vb
  WHERE vb.employee_id = p_employee_id
  AND vb.available_days > 0
  AND NOT vb.is_expired
  ORDER BY vb.period_start;
END;
$$ LANGUAGE plpgsql;

-- Funcao para criar periodos de ferias automaticamente
CREATE OR REPLACE FUNCTION create_vacation_period(
  p_employee_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_company_id UUID;
  v_hire_date DATE;
  v_last_period_end DATE;
  v_new_period_start DATE;
  v_new_period_end DATE;
  v_new_id UUID;
BEGIN
  -- Pegar dados do funcionario
  SELECT company_id, hire_date INTO v_company_id, v_hire_date
  FROM employees WHERE id = p_employee_id;

  -- Pegar ultimo periodo
  SELECT period_end INTO v_last_period_end
  FROM vacation_balances
  WHERE employee_id = p_employee_id
  ORDER BY period_end DESC
  LIMIT 1;

  -- Calcular novo periodo
  IF v_last_period_end IS NULL THEN
    v_new_period_start := v_hire_date;
  ELSE
    v_new_period_start := v_last_period_end + INTERVAL '1 day';
  END IF;

  v_new_period_end := v_new_period_start + INTERVAL '1 year' - INTERVAL '1 day';

  -- Inserir novo periodo
  INSERT INTO vacation_balances (
    company_id, employee_id, period_start, period_end,
    accrued_days, expires_at
  )
  VALUES (
    v_company_id, p_employee_id, v_new_period_start, v_new_period_end,
    30, -- 30 dias de ferias
    v_new_period_end + INTERVAL '1 year' -- Periodo concessivo
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql;

-- Funcao para verificar ausencias no periodo
CREATE OR REPLACE FUNCTION get_absences_in_period(
  p_company_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_department TEXT DEFAULT NULL
)
RETURNS TABLE (
  employee_id UUID,
  employee_name TEXT,
  department TEXT,
  absence_type absence_type,
  start_date DATE,
  end_date DATE,
  status absence_status
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.employee_id,
    e.name,
    e.department,
    a.type,
    a.start_date,
    a.end_date,
    a.status
  FROM absences a
  JOIN employees e ON e.id = a.employee_id
  WHERE a.company_id = p_company_id
  AND a.status NOT IN ('cancelled', 'rejected')
  AND (
    (a.start_date BETWEEN p_start_date AND p_end_date)
    OR (a.end_date BETWEEN p_start_date AND p_end_date)
    OR (p_start_date BETWEEN a.start_date AND a.end_date)
  )
  AND (p_department IS NULL OR e.department = p_department)
  ORDER BY a.start_date;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

ALTER TABLE vacation_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE absence_history ENABLE ROW LEVEL SECURITY;

-- vacation_policies policies
CREATE POLICY "Users can view company vacation policies"
  ON vacation_policies FOR SELECT
  USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage vacation policies"
  ON vacation_policies FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- vacation_balances policies
CREATE POLICY "Users can view own vacation balance"
  ON vacation_balances FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins and HR can view all balances"
  ON vacation_balances FOR SELECT
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Admins and HR can manage balances"
  ON vacation_balances FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- absences policies
CREATE POLICY "Users can view own absences"
  ON absences FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can request own absences"
  ON absences FOR INSERT
  WITH CHECK (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update own draft absences"
  ON absences FOR UPDATE
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    AND status = 'draft'
  );

CREATE POLICY "Managers can view team absences"
  ON absences FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE manager_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Managers can approve team absences"
  ON absences FOR UPDATE
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE manager_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
    AND status = 'pending'
  );

CREATE POLICY "Admins and HR can manage all absences"
  ON absences FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- absence_history policies
CREATE POLICY "Users can view own absence history"
  ON absence_history FOR SELECT
  USING (
    absence_id IN (
      SELECT id FROM absences
      WHERE employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all history"
  ON absence_history FOR SELECT
  USING (
    absence_id IN (
      SELECT id FROM absences
      WHERE company_id = (
        SELECT company_id FROM profiles
        WHERE id = auth.uid() AND role IN ('admin', 'hr')
      )
    )
  );

-- =====================================================
-- VIEWS
-- =====================================================

-- View de calendario de ausencias
CREATE VIEW v_absence_calendar AS
SELECT
  a.company_id,
  a.employee_id,
  e.name AS employee_name,
  e.department,
  e."position",
  a.type,
  a.start_date,
  a.end_date,
  a.total_days,
  a.status,
  a.reason
FROM absences a
JOIN employees e ON e.id = a.employee_id
WHERE a.status NOT IN ('cancelled', 'rejected', 'draft')
AND e.status = 'active';

-- View de ferias vencendo
CREATE VIEW v_expiring_vacation_balances AS
SELECT
  vb.company_id,
  vb.employee_id,
  e.name AS employee_name,
  e.department,
  vb.period_start,
  vb.period_end,
  vb.available_days,
  vb.expires_at,
  (vb.expires_at - CURRENT_DATE) AS days_until_expiry,
  CASE
    WHEN vb.expires_at < CURRENT_DATE THEN 'expired'
    WHEN vb.expires_at <= CURRENT_DATE + INTERVAL '30 days' THEN 'critical'
    WHEN vb.expires_at <= CURRENT_DATE + INTERVAL '90 days' THEN 'warning'
    ELSE 'ok'
  END AS urgency_level
FROM vacation_balances vb
JOIN employees e ON e.id = vb.employee_id
WHERE vb.available_days > 0
AND NOT vb.is_expired
AND e.status = 'active'
ORDER BY vb.expires_at;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE vacation_policies IS 'Politicas de ferias configuradas pela empresa';
COMMENT ON TABLE vacation_balances IS 'Saldo de ferias por periodo aquisitivo';
COMMENT ON TABLE absences IS 'Registro de todas as ausencias (ferias, licencas, faltas)';
COMMENT ON TABLE absence_history IS 'Historico de alteracoes nas ausencias (auditoria)';
COMMENT ON COLUMN absences.cid_code IS 'Codigo CID-10 para licencas medicas';
COMMENT ON COLUMN vacation_balances.expires_at IS 'Data limite do periodo concessivo';



-- FILE: 008_health.sql
-- =====================================================

-- =====================================================
-- Migration 008: Health (Saude Ocupacional - ASO e Atestados)
-- Sistema SaaS de RH Multi-tenant
-- =====================================================

-- ENUM para tipos de ASO
CREATE TYPE aso_type AS ENUM (
  'admission',    -- Admissional
  'periodic',     -- Periodico
  'return',       -- Retorno ao trabalho
  'job_change',   -- Mudanca de funcao
  'dismissal'     -- Demissional
);

-- ENUM para resultado do ASO
CREATE TYPE aso_result AS ENUM (
  'fit',              -- Apto
  'unfit',            -- Inapto
  'fit_restrictions', -- Apto com restricoes
  'pending'           -- Pendente de exames
);

-- ENUM para status do exame
CREATE TYPE exam_status AS ENUM (
  'scheduled',    -- Agendado
  'completed',    -- Realizado
  'cancelled',    -- Cancelado
  'expired',      -- Vencido
  'pending'       -- Pendente
);

-- =====================================================
-- Tabela de ASOs (Atestado de Saude Ocupacional)
-- =====================================================

CREATE TABLE asos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Funcionario
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Tipo de ASO
  type aso_type NOT NULL,

  -- Datas
  exam_date DATE NOT NULL,
  next_exam_date DATE, -- Proximo exame periodico
  expiry_date DATE, -- Data de validade

  -- Resultado
  result aso_result DEFAULT 'pending' NOT NULL,
  restrictions TEXT, -- Restricoes (se apto com restricoes)

  -- Clinica/Medico
  clinic_name TEXT,
  clinic_address TEXT,
  doctor_name TEXT NOT NULL,
  crm VARCHAR(20) NOT NULL,
  crm_state VARCHAR(2),

  -- Exames realizados
  exams_performed JSONB DEFAULT '[]'::jsonb,
  -- Estrutura:
  -- [
  --   {
  --     "name": "Hemograma completo",
  --     "code": "HEM001",
  --     "date": "2024-01-15",
  --     "result": "Normal",
  --     "reference_values": "...",
  --     "observations": "..."
  --   }
  -- ]

  -- Riscos ocupacionais avaliados
  occupational_risks JSONB DEFAULT '[]'::jsonb,
  -- Estrutura:
  -- [
  --   {
  --     "risk_type": "fisico" | "quimico" | "biologico" | "ergonomico" | "acidente",
  --     "description": "Ruido acima de 85dB",
  --     "exposure_level": "alto",
  --     "protective_measures": "EPI auricular"
  --   }
  -- ]

  -- Observacoes
  medical_observations TEXT,
  recommendations TEXT,

  -- Arquivo
  file_url TEXT,
  file_name TEXT,

  -- Status
  status exam_status DEFAULT 'completed' NOT NULL,

  -- Integracao com ausencias (para retorno ao trabalho)
  absence_id UUID REFERENCES absences(id),

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- Tabela de Atestados Medicos
-- =====================================================

CREATE TABLE medical_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Funcionario
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Periodo de afastamento
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER GENERATED ALWAYS AS (end_date - start_date + 1) STORED,

  -- CID (opcional por questoes de privacidade)
  cid_code VARCHAR(10), -- Codigo CID-10
  cid_description TEXT,
  show_cid BOOLEAN DEFAULT false, -- Exibir CID nos relatorios

  -- Medico
  doctor_name TEXT NOT NULL,
  crm VARCHAR(20) NOT NULL,
  crm_state VARCHAR(2),

  -- Local de atendimento
  healthcare_facility TEXT,
  facility_type VARCHAR(50), -- hospital, clinica, ups, consultorio

  -- Tipo de atestado
  certificate_type VARCHAR(50) DEFAULT 'medical_leave',
  -- medical_leave, accident, surgery, maternity, psychiatric

  -- Observacoes
  medical_notes TEXT,
  internal_notes TEXT, -- Notas internas do RH

  -- Arquivo
  file_url TEXT,
  file_name TEXT,

  -- Validacao
  is_validated BOOLEAN DEFAULT false,
  validated_by UUID REFERENCES profiles(id),
  validated_at TIMESTAMPTZ,
  validation_notes TEXT,

  -- Integracao
  absence_id UUID REFERENCES absences(id), -- Link com ausencia criada

  -- INSS (para afastamentos > 15 dias)
  requires_inss BOOLEAN DEFAULT false,
  inss_protocol VARCHAR(50),
  inss_start_date DATE, -- Quando INSS assume
  inss_status VARCHAR(50), -- pending, approved, denied

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  submitted_by UUID REFERENCES profiles(id),

  -- Constraints
  CONSTRAINT valid_certificate_dates CHECK (end_date >= start_date)
);

-- =====================================================
-- Tabela de Exames Periodicos Agendados
-- =====================================================

CREATE TABLE scheduled_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Funcionario
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Tipo de exame
  exam_type aso_type DEFAULT 'periodic' NOT NULL,

  -- Agendamento
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  scheduled_clinic TEXT,
  scheduled_address TEXT,

  -- Exames a realizar
  required_exams JSONB DEFAULT '[]'::jsonb,
  -- ["Hemograma", "Audiometria", "Espirometria"]

  -- Status
  status exam_status DEFAULT 'scheduled' NOT NULL,
  completed_aso_id UUID REFERENCES asos(id), -- ASO gerado apos exame

  -- Notificacoes
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMPTZ,

  -- Observacoes
  notes TEXT,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- Tabela de PCMSO (Programa de Controle Medico)
-- =====================================================

CREATE TABLE pcmso_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Vigencia
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  year INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM start_date)) STORED,

  -- Responsavel
  coordinator_name TEXT NOT NULL, -- Medico coordenador
  coordinator_crm VARCHAR(20) NOT NULL,
  coordinator_specialty TEXT DEFAULT 'Medicina do Trabalho',

  -- Documento
  document_url TEXT,
  document_version VARCHAR(20),

  -- Configuracoes de periodicidade por risco
  periodicity_rules JSONB DEFAULT '{}'::jsonb,
  -- Estrutura:
  -- {
  --   "default_months": 12,
  --   "high_risk_months": 6,
  --   "age_over_45_months": 6,
  --   "specific_risks": {
  --     "ruido": 12,
  --     "poeira": 6,
  --     "quimicos": 6
  --   }
  -- }

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- Tabela de Acidentes de Trabalho
-- =====================================================

CREATE TABLE work_accidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Funcionario
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Data e local
  accident_date DATE NOT NULL,
  accident_time TIME,
  accident_location TEXT NOT NULL,
  was_during_work_hours BOOLEAN DEFAULT true,
  was_commute_accident BOOLEAN DEFAULT false, -- Acidente de trajeto

  -- Descricao
  description TEXT NOT NULL,
  body_parts_affected TEXT[],
  accident_type VARCHAR(50), -- queda, corte, impacto, queimadura, etc

  -- Testemunhas
  witnesses JSONB DEFAULT '[]'::jsonb,
  -- [{ "name": "...", "role": "...", "statement": "..." }]

  -- Gravidade
  severity VARCHAR(20), -- leve, moderado, grave, fatal
  days_away INTEGER DEFAULT 0, -- Dias de afastamento
  is_fatal BOOLEAN DEFAULT false,

  -- CAT (Comunicacao de Acidente de Trabalho)
  cat_number VARCHAR(50),
  cat_date DATE,
  cat_type VARCHAR(20), -- inicial, reabertura, comunicacao_obito
  cat_file_url TEXT,

  -- INSS
  inss_benefit_number VARCHAR(50),
  inss_start_date DATE,

  -- Investigacao
  investigation_status VARCHAR(20) DEFAULT 'pending',
  -- pending, in_progress, completed
  root_cause TEXT,
  corrective_actions TEXT,
  preventive_actions TEXT,
  investigation_completed_at TIMESTAMPTZ,
  investigation_by UUID REFERENCES profiles(id),

  -- Retorno ao trabalho
  return_date DATE,
  return_aso_id UUID REFERENCES asos(id),

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  reported_by UUID REFERENCES profiles(id),

  -- Constraint
  CONSTRAINT valid_return_date CHECK (
    return_date IS NULL OR return_date >= accident_date
  )
);

-- =====================================================
-- INDICES
-- =====================================================

-- asos
CREATE INDEX idx_asos_company ON asos (company_id);
CREATE INDEX idx_asos_employee ON asos (employee_id);
CREATE INDEX idx_asos_type ON asos (type);
CREATE INDEX idx_asos_result ON asos (result);
CREATE INDEX idx_asos_exam_date ON asos (exam_date);
CREATE INDEX idx_asos_next_exam ON asos (next_exam_date)
  WHERE next_exam_date IS NOT NULL;
CREATE INDEX idx_asos_employee_type ON asos (employee_id, type);

-- medical_certificates
CREATE INDEX idx_medical_certificates_company ON medical_certificates (company_id);
CREATE INDEX idx_medical_certificates_employee ON medical_certificates (employee_id);
CREATE INDEX idx_medical_certificates_dates ON medical_certificates (start_date, end_date);
CREATE INDEX idx_medical_certificates_validated ON medical_certificates (is_validated);
CREATE INDEX idx_medical_certificates_inss ON medical_certificates (requires_inss)
  WHERE requires_inss = true;

-- scheduled_exams
CREATE INDEX idx_scheduled_exams_company ON scheduled_exams (company_id);
CREATE INDEX idx_scheduled_exams_employee ON scheduled_exams (employee_id);
CREATE INDEX idx_scheduled_exams_date ON scheduled_exams (scheduled_date);
CREATE INDEX idx_scheduled_exams_status ON scheduled_exams (status);
CREATE INDEX idx_scheduled_exams_pending ON scheduled_exams (company_id, scheduled_date)
  WHERE status = 'scheduled';

-- pcmso_programs
CREATE INDEX idx_pcmso_company ON pcmso_programs (company_id);
CREATE INDEX idx_pcmso_active ON pcmso_programs (company_id, is_active)
  WHERE is_active = true;

-- work_accidents
CREATE INDEX idx_work_accidents_company ON work_accidents (company_id);
CREATE INDEX idx_work_accidents_employee ON work_accidents (employee_id);
CREATE INDEX idx_work_accidents_date ON work_accidents (accident_date);
CREATE INDEX idx_work_accidents_severity ON work_accidents (severity);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER trigger_asos_updated_at
  BEFORE UPDATE ON asos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_medical_certificates_updated_at
  BEFORE UPDATE ON medical_certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_scheduled_exams_updated_at
  BEFORE UPDATE ON scheduled_exams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_pcmso_updated_at
  BEFORE UPDATE ON pcmso_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_work_accidents_updated_at
  BEFORE UPDATE ON work_accidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Funcao para criar ausencia automatica ao validar atestado
CREATE OR REPLACE FUNCTION create_absence_from_certificate()
RETURNS TRIGGER AS $$
DECLARE
  v_absence_id UUID;
BEGIN
  -- Apenas quando validado e sem ausencia vinculada
  IF NEW.is_validated = true AND OLD.is_validated = false AND NEW.absence_id IS NULL THEN
    INSERT INTO absences (
      company_id, employee_id, type,
      start_date, end_date, reason,
      document_url, cid_code,
      status, approved_by, approved_at
    )
    VALUES (
      NEW.company_id, NEW.employee_id, 'sick_leave',
      NEW.start_date, NEW.end_date, 'Atestado medico',
      NEW.file_url, NEW.cid_code,
      'approved', NEW.validated_by, now()
    )
    RETURNING id INTO v_absence_id;

    -- Vincular ausencia ao atestado
    NEW.absence_id := v_absence_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_absence_from_certificate
  BEFORE UPDATE ON medical_certificates
  FOR EACH ROW
  EXECUTE FUNCTION create_absence_from_certificate();

-- Funcao para calcular proximo exame periodico
CREATE OR REPLACE FUNCTION calculate_next_exam_date()
RETURNS TRIGGER AS $$
DECLARE
  v_months INTEGER := 12;
  v_employee_age INTEGER;
  v_has_high_risk BOOLEAN;
BEGIN
  -- Apenas para ASOs periodicos ou admissionais
  IF NEW.type IN ('periodic', 'admission') AND NEW.result = 'fit' THEN
    -- Calcular idade do funcionario
    SELECT EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date))
    INTO v_employee_age
    FROM employees WHERE id = NEW.employee_id;

    -- Ajustar periodicidade
    IF v_employee_age >= 45 OR v_employee_age < 18 THEN
      v_months := 6;
    END IF;

    -- Verificar riscos (simplificado)
    IF jsonb_array_length(NEW.occupational_risks) > 0 THEN
      v_months := LEAST(v_months, 6);
    END IF;

    -- Definir proxima data
    NEW.next_exam_date := NEW.exam_date + (v_months || ' months')::INTERVAL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_next_exam
  BEFORE INSERT OR UPDATE ON asos
  FOR EACH ROW
  EXECUTE FUNCTION calculate_next_exam_date();

-- Funcao para agendar exame periodico automaticamente
CREATE OR REPLACE FUNCTION schedule_periodic_exam()
RETURNS TRIGGER AS $$
BEGIN
  -- Ao inserir ASO com proximo exame definido, agendar
  IF NEW.next_exam_date IS NOT NULL THEN
    INSERT INTO scheduled_exams (
      company_id, employee_id, exam_type,
      scheduled_date, required_exams,
      status, created_by
    )
    VALUES (
      NEW.company_id, NEW.employee_id, 'periodic',
      NEW.next_exam_date - INTERVAL '30 days', -- Agendar 30 dias antes
      NEW.exams_performed,
      'scheduled', NEW.created_by
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_schedule_periodic_exam
  AFTER INSERT ON asos
  FOR EACH ROW
  EXECUTE FUNCTION schedule_periodic_exam();

-- =====================================================
-- FUNCOES AUXILIARES
-- =====================================================

-- Funcao para listar exames vencendo
CREATE OR REPLACE FUNCTION get_expiring_exams(
  p_company_id UUID,
  p_days_ahead INTEGER DEFAULT 30
)
RETURNS TABLE (
  employee_id UUID,
  employee_name TEXT,
  department TEXT,
  last_exam_date DATE,
  next_exam_date DATE,
  days_until_due INTEGER,
  exam_type aso_type
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (a.employee_id)
    a.employee_id,
    e.name,
    e.department,
    a.exam_date,
    a.next_exam_date,
    (a.next_exam_date - CURRENT_DATE)::INTEGER,
    a.type
  FROM asos a
  JOIN employees e ON e.id = a.employee_id
  WHERE a.company_id = p_company_id
  AND a.next_exam_date IS NOT NULL
  AND a.next_exam_date <= CURRENT_DATE + p_days_ahead
  AND e.status = 'active'
  ORDER BY a.employee_id, a.exam_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Funcao para verificar aptidao do funcionario
CREATE OR REPLACE FUNCTION check_employee_fitness(
  p_employee_id UUID
)
RETURNS TABLE (
  is_fit BOOLEAN,
  last_aso_date DATE,
  last_aso_result aso_result,
  next_exam_due DATE,
  is_exam_overdue BOOLEAN,
  restrictions TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.result IN ('fit', 'fit_restrictions'),
    a.exam_date,
    a.result,
    a.next_exam_date,
    COALESCE(a.next_exam_date < CURRENT_DATE, false),
    a.restrictions
  FROM asos a
  WHERE a.employee_id = p_employee_id
  AND a.status = 'completed'
  ORDER BY a.exam_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

ALTER TABLE asos ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE pcmso_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_accidents ENABLE ROW LEVEL SECURITY;

-- asos policies
CREATE POLICY "Users can view own ASOs"
  ON asos FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins and HR can manage ASOs"
  ON asos FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- medical_certificates policies
CREATE POLICY "Users can view own certificates"
  ON medical_certificates FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can submit own certificates"
  ON medical_certificates FOR INSERT
  WITH CHECK (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins and HR can manage certificates"
  ON medical_certificates FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- scheduled_exams policies
CREATE POLICY "Users can view own scheduled exams"
  ON scheduled_exams FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins and HR can manage scheduled exams"
  ON scheduled_exams FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- pcmso_programs policies
CREATE POLICY "Users can view company PCMSO"
  ON pcmso_programs FOR SELECT
  USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage PCMSO"
  ON pcmso_programs FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- work_accidents policies
CREATE POLICY "Users can view own accidents"
  ON work_accidents FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can report accidents"
  ON work_accidents FOR INSERT
  WITH CHECK (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins and HR can manage accidents"
  ON work_accidents FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- =====================================================
-- VIEWS
-- =====================================================

-- View de saude ocupacional do funcionario
CREATE VIEW v_employee_health_status AS
SELECT
  e.id AS employee_id,
  e.company_id,
  e.name,
  e.department,
  e."position",
  a.exam_date AS last_aso_date,
  a.type AS last_aso_type,
  a.result AS aso_result,
  a.next_exam_date,
  CASE
    WHEN a.next_exam_date IS NULL THEN 'no_exam'
    WHEN a.next_exam_date < CURRENT_DATE THEN 'overdue'
    WHEN a.next_exam_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'due_soon'
    ELSE 'ok'
  END AS exam_status,
  a.restrictions
FROM employees e
LEFT JOIN LATERAL (
  SELECT * FROM asos
  WHERE employee_id = e.id
  AND status = 'completed'
  ORDER BY exam_date DESC
  LIMIT 1
) a ON true
WHERE e.status = 'active';

-- View de atestados pendentes de validacao
CREATE VIEW v_pending_certificates AS
SELECT
  mc.id,
  mc.company_id,
  mc.employee_id,
  e.name AS employee_name,
  e.department,
  mc.start_date,
  mc.end_date,
  mc.total_days,
  mc.doctor_name,
  mc.crm,
  mc.created_at AS submitted_at
FROM medical_certificates mc
JOIN employees e ON e.id = mc.employee_id
WHERE mc.is_validated = false
ORDER BY mc.created_at;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE asos IS 'Atestados de Saude Ocupacional (ASO) dos funcionarios';
COMMENT ON TABLE medical_certificates IS 'Atestados medicos apresentados pelos funcionarios';
COMMENT ON TABLE scheduled_exams IS 'Exames ocupacionais agendados';
COMMENT ON TABLE pcmso_programs IS 'Programas de Controle Medico de Saude Ocupacional';
COMMENT ON TABLE work_accidents IS 'Registro de acidentes de trabalho e CAT';
COMMENT ON COLUMN asos.occupational_risks IS 'Riscos ocupacionais avaliados no exame';
COMMENT ON COLUMN medical_certificates.cid_code IS 'Codigo CID-10 - protegido por LGPD';
COMMENT ON COLUMN medical_certificates.requires_inss IS 'Afastamento superior a 15 dias';
COMMENT ON COLUMN work_accidents.cat_number IS 'Numero da CAT emitida';


