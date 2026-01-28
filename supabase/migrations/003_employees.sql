-- =====================================================
-- Migration 003: Employees (Funcionarios)
-- Sistema SaaS de RH Multi-tenant
-- =====================================================

-- ENUMs para campos padronizados
CREATE TYPE employee_status AS ENUM ('active', 'inactive', 'terminated', 'on_leave');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'prefer_not_say');
CREATE TYPE marital_status_type AS ENUM ('single', 'married', 'divorced', 'widowed', 'stable_union');
CREATE TYPE contract_type AS ENUM ('clt', 'pj', 'intern', 'temporary', 'apprentice');
CREATE TYPE education_level AS ENUM ('fundamental', 'medio', 'tecnico', 'superior', 'pos_graduacao', 'mestrado', 'doutorado');
CREATE TYPE account_type AS ENUM ('checking', 'savings', 'salary');

-- Tabela principal de funcionarios
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- =====================================================
  -- DADOS PESSOAIS
  -- =====================================================

  -- Nome
  name TEXT NOT NULL,
  social_name TEXT, -- Nome social

  -- Documentos pessoais
  cpf VARCHAR(14) NOT NULL, -- XXX.XXX.XXX-XX
  rg VARCHAR(20),
  rg_issuer VARCHAR(20), -- Orgao emissor
  rg_state VARCHAR(2), -- UF do RG
  rg_issue_date DATE,

  -- Nascimento
  birth_date DATE NOT NULL,
  birth_city TEXT,
  birth_state VARCHAR(2),
  nationality TEXT DEFAULT 'Brasileira',

  -- Caracteristicas
  gender gender_type,
  marital_status marital_status_type,
  spouse_name TEXT,
  children_count INTEGER DEFAULT 0,

  -- Contato pessoal
  personal_email TEXT,
  personal_phone VARCHAR(20),
  emergency_contact TEXT,
  emergency_phone VARCHAR(20),

  -- Escolaridade
  education_level education_level,
  education_institution TEXT,
  education_course TEXT,

  -- =====================================================
  -- DADOS PROFISSIONAIS
  -- =====================================================

  -- Cargo e departamento
  "position" TEXT NOT NULL, -- Cargo
  department TEXT, -- Departamento
  cost_center VARCHAR(20), -- Centro de custo
  manager_id UUID REFERENCES employees(id), -- Gestor direto

  -- Contratacao
  registration_number VARCHAR(20), -- Matricula
  hire_date DATE NOT NULL,
  contract_type contract_type DEFAULT 'clt' NOT NULL,
  trial_period_end DATE, -- Fim do periodo de experiencia

  -- Jornada
  work_schedule_id UUID, -- FK sera adicionada apos criar work_schedules
  weekly_hours INTEGER DEFAULT 44,

  -- Salario
  base_salary NUMERIC(12,2),
  salary_type VARCHAR(20) DEFAULT 'monthly', -- monthly, hourly, commission

  -- =====================================================
  -- DOCUMENTOS TRABALHISTAS
  -- =====================================================

  -- PIS/PASEP
  pis VARCHAR(14), -- XXX.XXXXX.XX-X

  -- CTPS (Carteira de Trabalho)
  ctps_number VARCHAR(20),
  ctps_series VARCHAR(10),
  ctps_state VARCHAR(2),
  ctps_issue_date DATE,

  -- Categoria profissional
  professional_category TEXT, -- Ex: "Trabalhador de escritorio"
  cbo VARCHAR(10), -- Codigo Brasileiro de Ocupacoes

  -- CNH (se aplicavel)
  cnh_number VARCHAR(20),
  cnh_category VARCHAR(5), -- A, B, AB, C, D, E
  cnh_expiry DATE,

  -- Titulo de eleitor
  voter_title VARCHAR(20),
  voter_zone VARCHAR(10),
  voter_section VARCHAR(10),

  -- Reservista (se aplicavel)
  military_certificate VARCHAR(20),

  -- =====================================================
  -- DADOS BANCARIOS
  -- =====================================================

  bank_code VARCHAR(10), -- Codigo do banco
  bank_name TEXT,
  agency VARCHAR(10),
  agency_digit VARCHAR(2),
  account VARCHAR(20),
  account_digit VARCHAR(2),
  account_type account_type DEFAULT 'checking',
  pix_key TEXT,
  pix_key_type VARCHAR(20), -- cpf, email, phone, random

  -- =====================================================
  -- ENDERECO
  -- =====================================================

  address JSONB DEFAULT '{}'::jsonb,
  -- Estrutura:
  -- {
  --   "zip_code": "01234-567",
  --   "street": "Rua Example",
  --   "number": "123",
  --   "complement": "Apto 45",
  --   "neighborhood": "Centro",
  --   "city": "Sao Paulo",
  --   "state": "SP",
  --   "country": "Brasil"
  -- }

  -- =====================================================
  -- BENEFICIOS (configuracao individual)
  -- =====================================================

  benefits JSONB DEFAULT '{}'::jsonb,
  -- Estrutura:
  -- {
  --   "vale_transporte": {
  --     "enabled": true,
  --     "daily_value": 15.00,
  --     "discount_percentage": 6
  --   },
  --   "vale_refeicao": {
  --     "enabled": true,
  --     "daily_value": 35.00
  --   },
  --   "plano_saude": {
  --     "enabled": true,
  --     "plan": "Unimed",
  --     "dependents": 2
  --   }
  -- }

  -- =====================================================
  -- DEPENDENTES
  -- =====================================================

  dependents JSONB DEFAULT '[]'::jsonb,
  -- Estrutura (array):
  -- [
  --   {
  --     "name": "Nome Dependente",
  --     "cpf": "XXX.XXX.XXX-XX",
  --     "birth_date": "2010-05-15",
  --     "relationship": "filho",
  --     "ir_dependent": true,
  --     "health_plan": true
  --   }
  -- ]

  -- =====================================================
  -- STATUS E DESLIGAMENTO
  -- =====================================================

  status employee_status DEFAULT 'active' NOT NULL,
  termination_date DATE,
  termination_reason TEXT,
  termination_type VARCHAR(50), -- resignation, dismissal_just_cause, dismissal_no_cause, retirement, death, contract_end

  -- =====================================================
  -- METADADOS
  -- =====================================================

  notes TEXT, -- Observacoes gerais
  custom_fields JSONB DEFAULT '{}'::jsonb, -- Campos customizados pela empresa

  -- =====================================================
  -- AUDITORIA
  -- =====================================================

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),

  -- Constraints
  CONSTRAINT unique_cpf_per_company UNIQUE (company_id, cpf),
  CONSTRAINT unique_registration_per_company UNIQUE (company_id, registration_number),
  CONSTRAINT valid_hire_date CHECK (hire_date <= CURRENT_DATE),
  CONSTRAINT valid_termination CHECK (
    (status != 'terminated') OR
    (status = 'terminated' AND termination_date IS NOT NULL)
  )
);

-- =====================================================
-- INDICES
-- =====================================================

-- Multi-tenancy
CREATE INDEX idx_employees_company_id ON employees (company_id);

-- Busca por documentos
CREATE INDEX idx_employees_cpf ON employees (cpf);
CREATE INDEX idx_employees_pis ON employees (pis);

-- Busca por nome (full-text)
CREATE INDEX idx_employees_name ON employees USING gin (name gin_trgm_ops);

-- Filtros comuns
CREATE INDEX idx_employees_status ON employees (status);
CREATE INDEX idx_employees_department ON employees (department);
CREATE INDEX idx_employees_position ON employees ("position");
CREATE INDEX idx_employees_manager ON employees (manager_id);
CREATE INDEX idx_employees_hire_date ON employees (hire_date);
CREATE INDEX idx_employees_contract_type ON employees (contract_type);

-- Busca combinada (comum em listagens)
CREATE INDEX idx_employees_company_status ON employees (company_id, status);
CREATE INDEX idx_employees_company_department ON employees (company_id, department);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para updated_at
CREATE TRIGGER trigger_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Funcao para validar limite de funcionarios
CREATE OR REPLACE FUNCTION check_employee_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Contar funcionarios ativos
  SELECT COUNT(*) INTO current_count
  FROM employees
  WHERE company_id = NEW.company_id
  AND status IN ('active', 'on_leave');

  -- Pegar limite da empresa
  SELECT max_employees INTO max_allowed
  FROM companies
  WHERE id = NEW.company_id;

  -- Verificar limite
  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'Limite de funcionarios atingido. Plano atual permite % funcionarios.', max_allowed;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_employee_limit
  BEFORE INSERT ON employees
  FOR EACH ROW
  EXECUTE FUNCTION check_employee_limit();

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios podem ver funcionarios da mesma empresa
CREATE POLICY "Users can view employees from same company"
  ON employees
  FOR SELECT
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Policy: Admins e HR podem inserir funcionarios
CREATE POLICY "Admins and HR can insert employees"
  ON employees
  FOR INSERT
  WITH CHECK (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'hr')
    )
  );

-- Policy: Admins e HR podem atualizar funcionarios
CREATE POLICY "Admins and HR can update employees"
  ON employees
  FOR UPDATE
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'hr')
    )
  );

-- Policy: Gestores podem ver sua equipe
CREATE POLICY "Managers can view their team"
  ON employees
  FOR SELECT
  USING (
    manager_id = (
      SELECT employee_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Policy: Funcionarios podem ver seus proprios dados
CREATE POLICY "Employees can view own data"
  ON employees
  FOR SELECT
  USING (
    id = (
      SELECT employee_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- =====================================================
-- FUNCOES AUXILIARES
-- =====================================================

-- Funcao para calcular tempo de empresa
CREATE OR REPLACE FUNCTION get_employee_tenure(employee_uuid UUID)
RETURNS INTERVAL AS $$
DECLARE
  emp_hire_date DATE;
  emp_term_date DATE;
BEGIN
  SELECT hire_date, termination_date
  INTO emp_hire_date, emp_term_date
  FROM employees
  WHERE id = employee_uuid;

  IF emp_term_date IS NOT NULL THEN
    RETURN emp_term_date - emp_hire_date;
  ELSE
    RETURN CURRENT_DATE - emp_hire_date;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Funcao para gerar matricula automatica
CREATE OR REPLACE FUNCTION generate_registration_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  year_prefix TEXT;
BEGIN
  IF NEW.registration_number IS NULL THEN
    year_prefix := to_char(CURRENT_DATE, 'YYYY');

    SELECT COALESCE(MAX(CAST(SUBSTRING(registration_number FROM 5) AS INTEGER)), 0) + 1
    INTO next_number
    FROM employees
    WHERE company_id = NEW.company_id
    AND registration_number LIKE year_prefix || '%';

    NEW.registration_number := year_prefix || LPAD(next_number::TEXT, 4, '0');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_registration
  BEFORE INSERT ON employees
  FOR EACH ROW
  EXECUTE FUNCTION generate_registration_number();

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE employees IS 'Cadastro completo de funcionarios com dados pessoais, profissionais e trabalhistas';
COMMENT ON COLUMN employees.social_name IS 'Nome social para pessoas trans/nao-binarias';
COMMENT ON COLUMN employees.cbo IS 'Codigo Brasileiro de Ocupacoes - tabela oficial do MTE';
COMMENT ON COLUMN employees.cost_center IS 'Centro de custo para alocacao contabil';
COMMENT ON COLUMN employees.benefits IS 'Configuracao individual de beneficios do funcionario';
COMMENT ON COLUMN employees.dependents IS 'Lista de dependentes para IR e plano de saude';
COMMENT ON COLUMN employees.custom_fields IS 'Campos adicionais configurados pela empresa';
