-- =====================================================
-- Migration 024: Terminations (Rescisoes Trabalhistas)
-- Sistema SaaS de RH Multi-tenant
-- =====================================================

-- ENUM para tipo de rescisao
CREATE TYPE termination_type AS ENUM (
  'sem_justa_causa',   -- Demissao sem justa causa
  'justa_causa',       -- Demissao por justa causa (Art. 482 CLT)
  'pedido_demissao',   -- Pedido de demissao pelo funcionario
  'acordo_mutuo'       -- Acordo mutuo (Art. 484-A CLT)
);

-- ENUM para status da rescisao
CREATE TYPE termination_status AS ENUM (
  'draft',             -- Rascunho
  'calculated',        -- Calculada
  'review',            -- Em revisao
  'approved',          -- Aprovada
  'paid',              -- Paga
  'cancelled'          -- Cancelada
);

-- =====================================================
-- Tabela de rescisoes
-- =====================================================

CREATE TABLE terminations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Funcionario
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Dados do funcionario no momento da rescisao
  employee_data JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "name": "...",
  --   "cpf": "...",
  --   "position": "...",
  --   "department": "...",
  --   "hire_date": "...",
  --   "base_salary": 5000.00,
  --   "dependents": 2
  -- }

  -- Tipo e datas
  termination_type termination_type NOT NULL,
  termination_date DATE NOT NULL,
  notice_worked BOOLEAN DEFAULT false,
  notice_days INTEGER DEFAULT 30,

  -- Motivo
  reason TEXT,

  -- Dados de entrada
  base_salary NUMERIC(12,2) NOT NULL,
  fgts_balance NUMERIC(12,2) DEFAULT 0,

  -- Verbas rescisorias (proventos)
  salary_balance NUMERIC(12,2) DEFAULT 0,
  vacation_vested NUMERIC(12,2) DEFAULT 0,
  vacation_proportional NUMERIC(12,2) DEFAULT 0,
  vacation_bonus NUMERIC(12,2) DEFAULT 0,           -- 1/3 constitucional
  thirteenth_proportional NUMERIC(12,2) DEFAULT 0,
  notice_period_value NUMERIC(12,2) DEFAULT 0,
  fgts_fine NUMERIC(12,2) DEFAULT 0,
  other_earnings NUMERIC(12,2) DEFAULT 0,

  -- Descontos
  inss_deduction NUMERIC(12,2) DEFAULT 0,
  irrf_deduction NUMERIC(12,2) DEFAULT 0,
  notice_penalty NUMERIC(12,2) DEFAULT 0,           -- Desconto por nao cumprir aviso
  other_deductions NUMERIC(12,2) DEFAULT 0,

  -- Totais
  total_gross NUMERIC(12,2) DEFAULT 0,
  total_deductions NUMERIC(12,2) DEFAULT 0,
  total_net NUMERIC(12,2) DEFAULT 0,

  -- FGTS
  fgts_withdrawable NUMERIC(12,2) DEFAULT 0,
  has_unemployment_insurance BOOLEAN DEFAULT false,
  can_withdraw_fgts BOOLEAN DEFAULT false,

  -- Detalhes adicionais
  details JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "worked_months": 36,
  --   "worked_years": 3,
  --   "vested_vacation_periods": 1,
  --   ...
  -- }

  -- Status e aprovacao
  status termination_status DEFAULT 'draft' NOT NULL,
  calculated_at TIMESTAMPTZ,
  calculated_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES profiles(id),

  -- Documentos
  document_url TEXT,                   -- TRCT gerado

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id),

  -- Constraints
  CONSTRAINT unique_employee_termination UNIQUE (employee_id, termination_date)
);

-- =====================================================
-- INDICES
-- =====================================================

CREATE INDEX idx_terminations_company ON terminations (company_id);
CREATE INDEX idx_terminations_employee ON terminations (employee_id);
CREATE INDEX idx_terminations_type ON terminations (termination_type);
CREATE INDEX idx_terminations_date ON terminations (termination_date);
CREATE INDEX idx_terminations_status ON terminations (status);
CREATE INDEX idx_terminations_company_date ON terminations (company_id, termination_date DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER trigger_terminations_updated_at
  BEFORE UPDATE ON terminations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para calcular totais automaticamente
CREATE OR REPLACE FUNCTION calculate_termination_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular total bruto
  NEW.total_gross := COALESCE(NEW.salary_balance, 0) +
    COALESCE(NEW.vacation_vested, 0) +
    COALESCE(NEW.vacation_proportional, 0) +
    COALESCE(NEW.vacation_bonus, 0) +
    COALESCE(NEW.thirteenth_proportional, 0) +
    COALESCE(NEW.notice_period_value, 0) +
    COALESCE(NEW.other_earnings, 0);

  -- Calcular total de descontos
  NEW.total_deductions := COALESCE(NEW.inss_deduction, 0) +
    COALESCE(NEW.irrf_deduction, 0) +
    COALESCE(NEW.notice_penalty, 0) +
    COALESCE(NEW.other_deductions, 0);

  -- Calcular total liquido (incluindo multa FGTS)
  NEW.total_net := NEW.total_gross - NEW.total_deductions + COALESCE(NEW.fgts_fine, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_termination_totals
  BEFORE INSERT OR UPDATE ON terminations
  FOR EACH ROW
  EXECUTE FUNCTION calculate_termination_totals();

-- Trigger para atualizar status do funcionario apos aprovacao
CREATE OR REPLACE FUNCTION update_employee_on_termination()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a rescisao foi aprovada, atualizar funcionario
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE employees
    SET
      status = 'terminated',
      termination_date = NEW.termination_date,
      termination_reason = NEW.reason,
      termination_type = NEW.termination_type::TEXT,
      updated_at = now()
    WHERE id = NEW.employee_id;
  END IF;

  -- Se a rescisao foi cancelada, reverter status do funcionario
  IF NEW.status = 'cancelled' AND OLD.status = 'approved' THEN
    UPDATE employees
    SET
      status = 'active',
      termination_date = NULL,
      termination_reason = NULL,
      termination_type = NULL,
      updated_at = now()
    WHERE id = NEW.employee_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_employee_on_termination
  AFTER UPDATE ON terminations
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_on_termination();

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

ALTER TABLE terminations ENABLE ROW LEVEL SECURITY;

-- Politica de visualizacao
CREATE POLICY "Users can view company terminations"
  ON terminations FOR SELECT
  USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- Politica de gerenciamento
CREATE POLICY "Admins can manage terminations"
  ON terminations FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'company_admin', 'hr_manager')
    )
  );

-- =====================================================
-- FUNCAO AUXILIAR PARA CRIAR RESCISAO
-- =====================================================

CREATE OR REPLACE FUNCTION create_termination(
  p_company_id UUID,
  p_employee_id UUID,
  p_termination_type termination_type,
  p_termination_date DATE,
  p_notice_worked BOOLEAN DEFAULT false,
  p_fgts_balance NUMERIC DEFAULT 0,
  p_reason TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_employee RECORD;
  v_termination_id UUID;
  v_dependents INTEGER;
BEGIN
  -- Buscar dados do funcionario
  SELECT * INTO v_employee
  FROM employees WHERE id = p_employee_id AND company_id = p_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Funcionario nao encontrado';
  END IF;

  -- Contar dependentes
  SELECT COALESCE(jsonb_array_length(v_employee.dependents), 0)
  INTO v_dependents;

  -- Inserir rescisao
  INSERT INTO terminations (
    company_id,
    employee_id,
    employee_data,
    termination_type,
    termination_date,
    notice_worked,
    reason,
    base_salary,
    fgts_balance,
    status,
    created_by
  )
  VALUES (
    p_company_id,
    p_employee_id,
    jsonb_build_object(
      'name', v_employee.name,
      'cpf', v_employee.cpf,
      'position', v_employee."position",
      'department', v_employee.department,
      'hire_date', v_employee.hire_date,
      'base_salary', COALESCE(v_employee.base_salary, v_employee.salary),
      'dependents', v_dependents
    ),
    p_termination_type,
    p_termination_date,
    p_notice_worked,
    p_reason,
    COALESCE(v_employee.base_salary, v_employee.salary),
    p_fgts_balance,
    'draft',
    p_created_by
  )
  RETURNING id INTO v_termination_id;

  RETURN v_termination_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEW DE RESCISOES
-- =====================================================

CREATE VIEW v_terminations_summary AS
SELECT
  t.id,
  t.company_id,
  t.employee_id,
  t.employee_data->>'name' AS employee_name,
  t.employee_data->>'cpf' AS employee_cpf,
  t.employee_data->>'position' AS employee_position,
  t.employee_data->>'department' AS employee_department,
  t.termination_type,
  t.termination_date,
  t.notice_worked,
  t.status,
  t.base_salary,
  t.total_gross,
  t.total_deductions,
  t.total_net,
  t.fgts_fine,
  t.fgts_withdrawable,
  t.has_unemployment_insurance,
  t.created_at,
  t.approved_at
FROM terminations t;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE terminations IS 'Rescisoes trabalhistas dos funcionarios';
COMMENT ON COLUMN terminations.termination_type IS 'Tipo de rescisao conforme CLT';
COMMENT ON COLUMN terminations.notice_worked IS 'Se o aviso previo foi trabalhado';
COMMENT ON COLUMN terminations.vacation_bonus IS 'Terco constitucional sobre ferias';
COMMENT ON COLUMN terminations.notice_penalty IS 'Desconto por nao cumprir aviso (pedido demissao)';
COMMENT ON COLUMN terminations.fgts_withdrawable IS 'Valor total do FGTS sacavel (saldo + multa)';
