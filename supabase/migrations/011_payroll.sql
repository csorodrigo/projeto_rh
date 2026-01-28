-- =====================================================
-- Migration 011: Payroll (Folha de Pagamento)
-- Sistema SaaS de RH Multi-tenant
-- =====================================================

-- ENUM para status da folha
CREATE TYPE payroll_status AS ENUM (
  'draft',        -- Rascunho
  'calculating',  -- Calculando
  'calculated',   -- Calculado
  'review',       -- Em revisao
  'approved',     -- Aprovado
  'processing',   -- Processando pagamento
  'paid',         -- Pago
  'exported',     -- Exportado para contabilidade
  'cancelled'     -- Cancelado
);

-- ENUM para tipo de evento
CREATE TYPE payroll_event_type AS ENUM (
  'earning',      -- Provento
  'deduction',    -- Desconto
  'information'   -- Informativo (nao afeta valor)
);

-- ENUM para recorrencia
CREATE TYPE event_recurrence AS ENUM (
  'fixed',        -- Fixo todo mes
  'variable',     -- Variavel (calculado)
  'one_time',     -- Unico
  'temporary'     -- Temporario (periodo definido)
);

-- =====================================================
-- Tabela de rubricas (eventos de folha)
-- =====================================================

CREATE TABLE payroll_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Identificacao
  code VARCHAR(10) NOT NULL, -- Codigo da rubrica (ex: 001, 101)
  name TEXT NOT NULL,
  description TEXT,

  -- Tipo
  type payroll_event_type NOT NULL,
  recurrence event_recurrence DEFAULT 'fixed',

  -- Regras de calculo
  calculation_type VARCHAR(20) DEFAULT 'fixed',
  -- fixed: valor fixo
  -- percentage: percentual do salario
  -- hourly: por hora
  -- daily: por dia
  -- formula: formula customizada

  calculation_formula TEXT, -- Formula para calculo (se aplicavel)
  default_value NUMERIC(12,2), -- Valor ou percentual padrao
  base_reference VARCHAR(50), -- base_salary, gross_salary, net_salary, custom

  -- Referencias legais
  incidence JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "inss": true,
  --   "irrf": true,
  --   "fgts": true,
  --   "13th": true,
  --   "vacation": true,
  --   "severance": false
  -- }

  -- Limites
  min_value NUMERIC(12,2),
  max_value NUMERIC(12,2),

  -- e-Social
  esocial_code VARCHAR(10), -- Codigo e-Social
  esocial_nature VARCHAR(10), -- Natureza da rubrica

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false, -- Rubrica do sistema (nao editavel)

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id),

  -- Constraints
  CONSTRAINT unique_event_code UNIQUE (company_id, code)
);

-- =====================================================
-- Tabela de eventos fixos do funcionario
-- =====================================================

CREATE TABLE employee_fixed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Funcionario e evento
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES payroll_events(id) ON DELETE CASCADE,

  -- Valor
  value NUMERIC(12,2) NOT NULL,
  percentage NUMERIC(5,2), -- Se for percentual

  -- Vigencia
  start_date DATE NOT NULL,
  end_date DATE, -- NULL = permanente

  -- Referencia
  reference TEXT, -- Descricao/motivo
  document_url TEXT, -- Contrato, acordo, etc

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id),

  -- Constraints
  CONSTRAINT unique_fixed_event UNIQUE (employee_id, event_id, start_date)
);

-- =====================================================
-- Tabela de periodos de folha
-- =====================================================

CREATE TABLE payroll_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Periodo
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  reference_date DATE NOT NULL, -- Primeiro dia do mes

  -- Tipo
  period_type VARCHAR(20) DEFAULT 'monthly',
  -- monthly: Mensal normal
  -- advance: Adiantamento
  -- 13th_1: 1a parcela 13o
  -- 13th_2: 2a parcela 13o
  -- vacation: Ferias
  -- severance: Rescisao

  -- Datas importantes
  calculation_date DATE,
  payment_date DATE,
  cutoff_date DATE, -- Data de corte para variaveis

  -- Totais
  total_gross NUMERIC(14,2) DEFAULT 0,
  total_deductions NUMERIC(14,2) DEFAULT 0,
  total_net NUMERIC(14,2) DEFAULT 0,
  total_employer_costs NUMERIC(14,2) DEFAULT 0,

  -- Contagem
  total_employees INTEGER DEFAULT 0,
  total_processed INTEGER DEFAULT 0,
  total_errors INTEGER DEFAULT 0,

  -- Status
  status payroll_status DEFAULT 'draft' NOT NULL,

  -- Aprovacao
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,

  -- Exportacao
  exported_at TIMESTAMPTZ,
  export_file_url TEXT,

  -- Notas
  notes TEXT,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id),

  -- Constraints
  CONSTRAINT unique_payroll_period UNIQUE (company_id, year, month, period_type)
);

-- =====================================================
-- Tabela de folha individual
-- =====================================================

CREATE TABLE employee_payrolls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Periodo
  period_id UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,

  -- Funcionario
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Dados do funcionario no momento
  employee_data JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "name": "...",
  --   "cpf": "...",
  --   "position": "...",
  --   "department": "...",
  --   "hire_date": "...",
  --   "base_salary": 5000.00
  -- }

  -- Salario base
  base_salary NUMERIC(12,2) NOT NULL,

  -- Dias/Horas trabalhados
  worked_days INTEGER DEFAULT 30,
  worked_hours NUMERIC(8,2),
  missing_days INTEGER DEFAULT 0,
  missing_hours NUMERIC(8,2) DEFAULT 0,

  -- Horas extras
  overtime_50_hours NUMERIC(8,2) DEFAULT 0,
  overtime_50_value NUMERIC(12,2) DEFAULT 0,
  overtime_100_hours NUMERIC(8,2) DEFAULT 0,
  overtime_100_value NUMERIC(12,2) DEFAULT 0,

  -- Adicional noturno
  night_shift_hours NUMERIC(8,2) DEFAULT 0,
  night_shift_value NUMERIC(12,2) DEFAULT 0,

  -- DSR (Descanso Semanal Remunerado)
  dsr_value NUMERIC(12,2) DEFAULT 0,

  -- Proventos e descontos (detalhado)
  earnings JSONB DEFAULT '[]'::jsonb,
  -- [
  --   { "event_id": "uuid", "code": "001", "name": "Salario", "value": 5000.00, "reference": 30 }
  -- ]

  deductions JSONB DEFAULT '[]'::jsonb,
  -- [
  --   { "event_id": "uuid", "code": "101", "name": "INSS", "value": 550.00, "base": 5000.00 }
  -- ]

  -- Totais
  total_earnings NUMERIC(12,2) DEFAULT 0,
  total_deductions NUMERIC(12,2) DEFAULT 0,
  net_salary NUMERIC(12,2) DEFAULT 0,

  -- Encargos do empregador
  employer_inss NUMERIC(12,2) DEFAULT 0,
  employer_fgts NUMERIC(12,2) DEFAULT 0,
  employer_other NUMERIC(12,2) DEFAULT 0,
  total_employer_cost NUMERIC(12,2) DEFAULT 0,

  -- INSS
  inss_base NUMERIC(12,2) DEFAULT 0,
  inss_value NUMERIC(12,2) DEFAULT 0,
  inss_rate NUMERIC(5,2),

  -- IRRF
  irrf_base NUMERIC(12,2) DEFAULT 0,
  irrf_deductions NUMERIC(12,2) DEFAULT 0, -- Dependentes, etc
  irrf_value NUMERIC(12,2) DEFAULT 0,
  irrf_rate NUMERIC(5,2),

  -- FGTS
  fgts_base NUMERIC(12,2) DEFAULT 0,
  fgts_value NUMERIC(12,2) DEFAULT 0,

  -- Dados bancarios (no momento do pagamento)
  bank_data JSONB DEFAULT '{}'::jsonb,
  -- { "bank": "...", "agency": "...", "account": "...", "pix": "..." }

  -- Status
  status payroll_status DEFAULT 'draft' NOT NULL,
  has_errors BOOLEAN DEFAULT false,
  error_messages TEXT[],

  -- Validacao
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES profiles(id),

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Constraints
  CONSTRAINT unique_employee_payroll UNIQUE (period_id, employee_id)
);

-- =====================================================
-- Tabela de historico de salarios
-- =====================================================

CREATE TABLE salary_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Funcionario
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Salario
  previous_salary NUMERIC(12,2),
  new_salary NUMERIC(12,2) NOT NULL,
  change_percentage NUMERIC(5,2),

  -- Tipo de alteracao
  change_type VARCHAR(50) NOT NULL,
  -- promotion, merit, adjustment, collective_agreement, transfer, correction

  -- Motivo
  reason TEXT,
  document_url TEXT, -- Documento de alteracao

  -- Vigencia
  effective_date DATE NOT NULL,

  -- Aprovacao
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- Tabela de tabelas de INSS
-- =====================================================

CREATE TABLE inss_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Vigencia
  start_date DATE NOT NULL,
  end_date DATE,

  -- Faixas
  brackets JSONB NOT NULL,
  -- [
  --   { "min": 0, "max": 1412.00, "rate": 7.5, "deduction": 0 },
  --   { "min": 1412.01, "max": 2666.68, "rate": 9, "deduction": 21.18 },
  --   { "min": 2666.69, "max": 4000.03, "rate": 12, "deduction": 101.18 },
  --   { "min": 4000.04, "max": 7786.02, "rate": 14, "deduction": 181.18 }
  -- ]

  -- Teto
  ceiling NUMERIC(12,2) NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- Tabela de tabelas de IRRF
-- =====================================================

CREATE TABLE irrf_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Vigencia
  start_date DATE NOT NULL,
  end_date DATE,

  -- Faixas
  brackets JSONB NOT NULL,
  -- [
  --   { "min": 0, "max": 2259.20, "rate": 0, "deduction": 0 },
  --   { "min": 2259.21, "max": 2826.65, "rate": 7.5, "deduction": 169.44 },
  --   { "min": 2826.66, "max": 3751.05, "rate": 15, "deduction": 381.44 },
  --   { "min": 3751.06, "max": 4664.68, "rate": 22.5, "deduction": 662.77 },
  --   { "min": 4664.69, "max": null, "rate": 27.5, "deduction": 896.00 }
  -- ]

  -- Deducao por dependente
  dependent_deduction NUMERIC(12,2) NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- Tabela de emprestimos consignados
-- =====================================================

CREATE TABLE payroll_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Funcionario
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Dados do emprestimo
  bank_name TEXT NOT NULL,
  contract_number VARCHAR(50),
  total_amount NUMERIC(12,2) NOT NULL,
  installment_amount NUMERIC(12,2) NOT NULL,
  total_installments INTEGER NOT NULL,
  paid_installments INTEGER DEFAULT 0,
  remaining_amount NUMERIC(12,2),

  -- Periodo
  start_date DATE NOT NULL,
  end_date DATE,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- INDICES
-- =====================================================

-- payroll_events
CREATE INDEX idx_payroll_events_company ON payroll_events (company_id);
CREATE INDEX idx_payroll_events_type ON payroll_events (type);
CREATE INDEX idx_payroll_events_active ON payroll_events (company_id, is_active)
  WHERE is_active = true;
CREATE INDEX idx_payroll_events_code ON payroll_events (company_id, code);

-- employee_fixed_events
CREATE INDEX idx_fixed_events_company ON employee_fixed_events (company_id);
CREATE INDEX idx_fixed_events_employee ON employee_fixed_events (employee_id);
CREATE INDEX idx_fixed_events_event ON employee_fixed_events (event_id);
CREATE INDEX idx_fixed_events_active ON employee_fixed_events (employee_id, is_active)
  WHERE is_active = true;

-- payroll_periods
CREATE INDEX idx_payroll_periods_company ON payroll_periods (company_id);
CREATE INDEX idx_payroll_periods_date ON payroll_periods (year, month);
CREATE INDEX idx_payroll_periods_status ON payroll_periods (status);
CREATE INDEX idx_payroll_periods_company_date ON payroll_periods (company_id, year, month);

-- employee_payrolls
CREATE INDEX idx_employee_payrolls_company ON employee_payrolls (company_id);
CREATE INDEX idx_employee_payrolls_period ON employee_payrolls (period_id);
CREATE INDEX idx_employee_payrolls_employee ON employee_payrolls (employee_id);
CREATE INDEX idx_employee_payrolls_status ON employee_payrolls (status);
CREATE INDEX idx_employee_payrolls_errors ON employee_payrolls (period_id, has_errors)
  WHERE has_errors = true;

-- salary_history
CREATE INDEX idx_salary_history_company ON salary_history (company_id);
CREATE INDEX idx_salary_history_employee ON salary_history (employee_id);
CREATE INDEX idx_salary_history_date ON salary_history (effective_date);

-- inss_tables
CREATE INDEX idx_inss_tables_active ON inss_tables (is_active, start_date)
  WHERE is_active = true;

-- irrf_tables
CREATE INDEX idx_irrf_tables_active ON irrf_tables (is_active, start_date)
  WHERE is_active = true;

-- payroll_loans
CREATE INDEX idx_payroll_loans_company ON payroll_loans (company_id);
CREATE INDEX idx_payroll_loans_employee ON payroll_loans (employee_id);
CREATE INDEX idx_payroll_loans_active ON payroll_loans (employee_id, is_active)
  WHERE is_active = true;

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER trigger_payroll_events_updated_at
  BEFORE UPDATE ON payroll_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_fixed_events_updated_at
  BEFORE UPDATE ON employee_fixed_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_payroll_periods_updated_at
  BEFORE UPDATE ON payroll_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_employee_payrolls_updated_at
  BEFORE UPDATE ON employee_payrolls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_payroll_loans_updated_at
  BEFORE UPDATE ON payroll_loans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Funcao para calcular totais da folha individual
CREATE OR REPLACE FUNCTION calculate_payroll_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular total de proventos
  NEW.total_earnings := COALESCE(
    (SELECT SUM((item->>'value')::NUMERIC) FROM jsonb_array_elements(NEW.earnings) AS item),
    0
  );

  -- Calcular total de descontos
  NEW.total_deductions := COALESCE(
    (SELECT SUM((item->>'value')::NUMERIC) FROM jsonb_array_elements(NEW.deductions) AS item),
    0
  );

  -- Calcular salario liquido
  NEW.net_salary := NEW.total_earnings - NEW.total_deductions;

  -- Calcular custo total empregador
  NEW.total_employer_cost := NEW.total_earnings +
    COALESCE(NEW.employer_inss, 0) +
    COALESCE(NEW.employer_fgts, 0) +
    COALESCE(NEW.employer_other, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_payroll_totals
  BEFORE INSERT OR UPDATE ON employee_payrolls
  FOR EACH ROW
  EXECUTE FUNCTION calculate_payroll_totals();

-- Funcao para atualizar totais do periodo
CREATE OR REPLACE FUNCTION update_period_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE payroll_periods
  SET
    total_gross = (
      SELECT COALESCE(SUM(total_earnings), 0)
      FROM employee_payrolls WHERE period_id = COALESCE(NEW.period_id, OLD.period_id)
    ),
    total_deductions = (
      SELECT COALESCE(SUM(total_deductions), 0)
      FROM employee_payrolls WHERE period_id = COALESCE(NEW.period_id, OLD.period_id)
    ),
    total_net = (
      SELECT COALESCE(SUM(net_salary), 0)
      FROM employee_payrolls WHERE period_id = COALESCE(NEW.period_id, OLD.period_id)
    ),
    total_employer_costs = (
      SELECT COALESCE(SUM(total_employer_cost), 0)
      FROM employee_payrolls WHERE period_id = COALESCE(NEW.period_id, OLD.period_id)
    ),
    total_processed = (
      SELECT COUNT(*) FROM employee_payrolls
      WHERE period_id = COALESCE(NEW.period_id, OLD.period_id)
      AND status != 'draft'
    ),
    total_errors = (
      SELECT COUNT(*) FROM employee_payrolls
      WHERE period_id = COALESCE(NEW.period_id, OLD.period_id)
      AND has_errors = true
    )
  WHERE id = COALESCE(NEW.period_id, OLD.period_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_period_totals
  AFTER INSERT OR UPDATE OR DELETE ON employee_payrolls
  FOR EACH ROW
  EXECUTE FUNCTION update_period_totals();

-- Funcao para registrar alteracao de salario
CREATE OR REPLACE FUNCTION record_salary_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.base_salary IS DISTINCT FROM NEW.base_salary THEN
    INSERT INTO salary_history (
      company_id, employee_id,
      previous_salary, new_salary, change_percentage,
      change_type, effective_date
    )
    VALUES (
      NEW.company_id, NEW.id,
      OLD.base_salary, NEW.base_salary,
      CASE WHEN OLD.base_salary > 0
        THEN ROUND(((NEW.base_salary - OLD.base_salary) / OLD.base_salary) * 100, 2)
        ELSE NULL
      END,
      'adjustment', CURRENT_DATE
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_record_salary_change
  AFTER UPDATE ON employees
  FOR EACH ROW
  WHEN (OLD.base_salary IS DISTINCT FROM NEW.base_salary)
  EXECUTE FUNCTION record_salary_change();

-- =====================================================
-- FUNCOES AUXILIARES
-- =====================================================

-- Funcao para calcular INSS
CREATE OR REPLACE FUNCTION calculate_inss(
  p_base NUMERIC,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC AS $$
DECLARE
  v_table RECORD;
  v_bracket RECORD;
  v_inss NUMERIC := 0;
  v_remaining NUMERIC;
  v_prev_max NUMERIC := 0;
BEGIN
  -- Pegar tabela vigente
  SELECT * INTO v_table
  FROM inss_tables
  WHERE is_active = true
  AND start_date <= p_date
  AND (end_date IS NULL OR end_date >= p_date)
  ORDER BY start_date DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Calcular progressivamente
  v_remaining := LEAST(p_base, v_table.ceiling);

  FOR v_bracket IN
    SELECT * FROM jsonb_to_recordset(v_table.brackets)
    AS x(min NUMERIC, max NUMERIC, rate NUMERIC, deduction NUMERIC)
    ORDER BY min
  LOOP
    IF v_remaining > 0 THEN
      v_inss := v_inss + (
        LEAST(v_remaining, COALESCE(v_bracket.max, v_remaining) - v_prev_max) *
        v_bracket.rate / 100
      );
      v_prev_max := COALESCE(v_bracket.max, v_remaining);
      v_remaining := v_remaining - v_bracket.max;
    END IF;
  END LOOP;

  RETURN ROUND(v_inss, 2);
END;
$$ LANGUAGE plpgsql;

-- Funcao para calcular IRRF
CREATE OR REPLACE FUNCTION calculate_irrf(
  p_base NUMERIC,
  p_dependents INTEGER DEFAULT 0,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC AS $$
DECLARE
  v_table RECORD;
  v_bracket RECORD;
  v_taxable_base NUMERIC;
  v_irrf NUMERIC := 0;
BEGIN
  -- Pegar tabela vigente
  SELECT * INTO v_table
  FROM irrf_tables
  WHERE is_active = true
  AND start_date <= p_date
  AND (end_date IS NULL OR end_date >= p_date)
  ORDER BY start_date DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Calcular base tributavel (deducao de dependentes)
  v_taxable_base := p_base - (p_dependents * v_table.dependent_deduction);

  IF v_taxable_base <= 0 THEN
    RETURN 0;
  END IF;

  -- Encontrar faixa e calcular
  FOR v_bracket IN
    SELECT * FROM jsonb_to_recordset(v_table.brackets)
    AS x(min NUMERIC, max NUMERIC, rate NUMERIC, deduction NUMERIC)
    ORDER BY min DESC
  LOOP
    IF v_taxable_base >= v_bracket.min THEN
      v_irrf := (v_taxable_base * v_bracket.rate / 100) - v_bracket.deduction;
      EXIT;
    END IF;
  END LOOP;

  RETURN GREATEST(ROUND(v_irrf, 2), 0);
END;
$$ LANGUAGE plpgsql;

-- Funcao para calcular folha de um funcionario
CREATE OR REPLACE FUNCTION calculate_employee_payroll(
  p_employee_id UUID,
  p_period_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_employee RECORD;
  v_period RECORD;
  v_payroll_id UUID;
  v_earnings JSONB := '[]'::jsonb;
  v_deductions JSONB := '[]'::jsonb;
  v_inss_value NUMERIC;
  v_irrf_value NUMERIC;
  v_dependents INTEGER;
BEGIN
  -- Pegar dados do funcionario
  SELECT * INTO v_employee
  FROM employees WHERE id = p_employee_id;

  -- Pegar dados do periodo
  SELECT * INTO v_period
  FROM payroll_periods WHERE id = p_period_id;

  -- Calcular INSS
  v_inss_value := calculate_inss(v_employee.base_salary, v_period.reference_date);

  -- Contar dependentes
  SELECT jsonb_array_length(COALESCE(v_employee.dependents, '[]'::jsonb))
  INTO v_dependents;

  -- Calcular IRRF (base = salario - INSS)
  v_irrf_value := calculate_irrf(
    v_employee.base_salary - v_inss_value,
    v_dependents,
    v_period.reference_date
  );

  -- Montar proventos
  v_earnings := jsonb_build_array(
    jsonb_build_object(
      'code', '001',
      'name', 'Salario Base',
      'value', v_employee.base_salary,
      'reference', 30
    )
  );

  -- Montar descontos
  v_deductions := jsonb_build_array(
    jsonb_build_object(
      'code', '101',
      'name', 'INSS',
      'value', v_inss_value,
      'base', v_employee.base_salary
    ),
    jsonb_build_object(
      'code', '102',
      'name', 'IRRF',
      'value', v_irrf_value,
      'base', v_employee.base_salary - v_inss_value
    )
  );

  -- Inserir ou atualizar folha
  INSERT INTO employee_payrolls (
    company_id, period_id, employee_id,
    base_salary, earnings, deductions,
    inss_base, inss_value, irrf_base, irrf_value,
    fgts_base, fgts_value,
    employee_data, bank_data,
    status
  )
  VALUES (
    v_employee.company_id, p_period_id, p_employee_id,
    v_employee.base_salary, v_earnings, v_deductions,
    v_employee.base_salary, v_inss_value,
    v_employee.base_salary - v_inss_value, v_irrf_value,
    v_employee.base_salary, ROUND(v_employee.base_salary * 0.08, 2),
    jsonb_build_object(
      'name', v_employee.name,
      'cpf', v_employee.cpf,
      'position', v_employee."position",
      'department', v_employee.department
    ),
    jsonb_build_object(
      'bank', v_employee.bank_name,
      'agency', v_employee.agency,
      'account', v_employee.account,
      'pix', v_employee.pix_key
    ),
    'calculated'
  )
  ON CONFLICT (period_id, employee_id)
  DO UPDATE SET
    base_salary = EXCLUDED.base_salary,
    earnings = EXCLUDED.earnings,
    deductions = EXCLUDED.deductions,
    inss_base = EXCLUDED.inss_base,
    inss_value = EXCLUDED.inss_value,
    irrf_base = EXCLUDED.irrf_base,
    irrf_value = EXCLUDED.irrf_value,
    fgts_base = EXCLUDED.fgts_base,
    fgts_value = EXCLUDED.fgts_value,
    employee_data = EXCLUDED.employee_data,
    bank_data = EXCLUDED.bank_data,
    status = 'calculated',
    updated_at = now()
  RETURNING id INTO v_payroll_id;

  RETURN v_payroll_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

ALTER TABLE payroll_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_fixed_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_payrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE inss_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE irrf_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_loans ENABLE ROW LEVEL SECURITY;

-- payroll_events policies
CREATE POLICY "Users can view company events"
  ON payroll_events FOR SELECT
  USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage events"
  ON payroll_events FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
    AND NOT is_system
  );

-- employee_fixed_events policies
CREATE POLICY "Users can view own fixed events"
  ON employee_fixed_events FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage fixed events"
  ON employee_fixed_events FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- payroll_periods policies
CREATE POLICY "Users can view company periods"
  ON payroll_periods FOR SELECT
  USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage periods"
  ON payroll_periods FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- employee_payrolls policies
CREATE POLICY "Users can view own payrolls"
  ON employee_payrolls FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage payrolls"
  ON employee_payrolls FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- salary_history policies
CREATE POLICY "Users can view own salary history"
  ON salary_history FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage salary history"
  ON salary_history FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- tax tables - all authenticated users can view
CREATE POLICY "All can view INSS tables"
  ON inss_tables FOR SELECT
  USING (true);

CREATE POLICY "All can view IRRF tables"
  ON irrf_tables FOR SELECT
  USING (true);

-- payroll_loans policies
CREATE POLICY "Users can view own loans"
  ON payroll_loans FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage loans"
  ON payroll_loans FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- =====================================================
-- DADOS INICIAIS - Tabelas INSS e IRRF 2024
-- =====================================================

INSERT INTO inss_tables (start_date, brackets, ceiling) VALUES
('2024-01-01',
'[
  {"min": 0, "max": 1412.00, "rate": 7.5, "deduction": 0},
  {"min": 1412.01, "max": 2666.68, "rate": 9, "deduction": 21.18},
  {"min": 2666.69, "max": 4000.03, "rate": 12, "deduction": 101.18},
  {"min": 4000.04, "max": 7786.02, "rate": 14, "deduction": 181.18}
]'::jsonb,
7786.02);

INSERT INTO irrf_tables (start_date, brackets, dependent_deduction) VALUES
('2024-01-01',
'[
  {"min": 0, "max": 2259.20, "rate": 0, "deduction": 0},
  {"min": 2259.21, "max": 2826.65, "rate": 7.5, "deduction": 169.44},
  {"min": 2826.66, "max": 3751.05, "rate": 15, "deduction": 381.44},
  {"min": 3751.06, "max": 4664.68, "rate": 22.5, "deduction": 662.77},
  {"min": 4664.69, "max": null, "rate": 27.5, "deduction": 896.00}
]'::jsonb,
189.59);

-- =====================================================
-- VIEWS
-- =====================================================

-- View de resumo da folha
CREATE VIEW v_payroll_summary AS
SELECT
  pp.id AS period_id,
  pp.company_id,
  pp.year,
  pp.month,
  pp.period_type,
  pp.status,
  pp.total_employees,
  pp.total_gross,
  pp.total_deductions,
  pp.total_net,
  pp.total_employer_costs,
  pp.payment_date
FROM payroll_periods pp;

-- View de holerite do funcionario
CREATE VIEW v_employee_payslip AS
SELECT
  ep.id,
  ep.company_id,
  pp.year,
  pp.month,
  pp.period_type,
  ep.employee_id,
  ep.employee_data->>'name' AS employee_name,
  ep.employee_data->>'cpf' AS employee_cpf,
  ep.employee_data->>'position' AS "position",
  ep.employee_data->>'department' AS department,
  ep.base_salary,
  ep.earnings,
  ep.deductions,
  ep.total_earnings,
  ep.total_deductions,
  ep.net_salary,
  ep.inss_value,
  ep.irrf_value,
  ep.fgts_value,
  pp.payment_date,
  ep.status
FROM employee_payrolls ep
JOIN payroll_periods pp ON pp.id = ep.period_id;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE payroll_events IS 'Rubricas/Eventos de folha de pagamento';
COMMENT ON TABLE employee_fixed_events IS 'Eventos fixos por funcionario (beneficios, descontos fixos)';
COMMENT ON TABLE payroll_periods IS 'Periodos de folha de pagamento';
COMMENT ON TABLE employee_payrolls IS 'Folha de pagamento individual do funcionario';
COMMENT ON TABLE salary_history IS 'Historico de alteracoes salariais';
COMMENT ON TABLE inss_tables IS 'Tabelas progressivas do INSS';
COMMENT ON TABLE irrf_tables IS 'Tabelas progressivas do IRRF';
COMMENT ON TABLE payroll_loans IS 'Emprestimos consignados em folha';
COMMENT ON COLUMN payroll_events.incidence IS 'Incidencia do evento sobre encargos';
COMMENT ON COLUMN payroll_events.esocial_code IS 'Codigo para integracao com e-Social';
