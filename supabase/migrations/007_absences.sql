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
  e.position,
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
