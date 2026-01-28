-- =====================================================
-- CONSOLIDATED MIGRATIONS
-- Generated: 2026-01-28T04:46:15.291Z
-- Project: rh-rick (lmpyxqvxzigsusjniarz)
-- =====================================================


-- =====================================================
-- FILE: 000_setup.sql
-- =====================================================

-- =====================================================
-- Migration 000: Setup Inicial
-- Sistema SaaS de RH Multi-tenant
-- =====================================================
-- Este arquivo deve ser executado PRIMEIRO para configurar
-- extensoes e funcoes base necessarias para as demais migrations

-- =====================================================
-- EXTENSOES
-- =====================================================

-- Extensao para busca por similaridade (fuzzy search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Extensao para UUIDs (geralmente ja habilitada no Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extensao para dados geograficos (geofencing)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Extensao para criptografia (senhas, dados sensiveis)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Extensao para estatisticas de queries (monitoramento)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- =====================================================
-- CONFIGURACOES DE SEGURANCA
-- =====================================================

-- Revogar acesso publico ao schema public
REVOKE ALL ON SCHEMA public FROM public;

-- Conceder acesso ao schema para usuarios autenticados
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- =====================================================
-- FUNCOES UTILITARIAS BASE
-- =====================================================

-- Funcao generica para updated_at (usada em todas as tabelas)
-- Nota: Esta funcao eh criada aqui e referenciada nas migrations seguintes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funcao para gerar slug a partir de texto
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        unaccent(input_text),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Funcao para validar CPF
CREATE OR REPLACE FUNCTION validate_cpf(cpf TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  cpf_numbers TEXT;
  sum1 INTEGER := 0;
  sum2 INTEGER := 0;
  digit1 INTEGER;
  digit2 INTEGER;
  i INTEGER;
BEGIN
  -- Remover caracteres nao numericos
  cpf_numbers := regexp_replace(cpf, '[^0-9]', '', 'g');

  -- Verificar tamanho
  IF length(cpf_numbers) != 11 THEN
    RETURN FALSE;
  END IF;

  -- Verificar CPFs invalidos conhecidos
  IF cpf_numbers IN (
    '00000000000', '11111111111', '22222222222', '33333333333',
    '44444444444', '55555555555', '66666666666', '77777777777',
    '88888888888', '99999999999'
  ) THEN
    RETURN FALSE;
  END IF;

  -- Calcular primeiro digito verificador
  FOR i IN 1..9 LOOP
    sum1 := sum1 + (substring(cpf_numbers, i, 1)::INTEGER * (11 - i));
  END LOOP;
  digit1 := (sum1 * 10) % 11;
  IF digit1 = 10 THEN digit1 := 0; END IF;

  -- Verificar primeiro digito
  IF digit1 != substring(cpf_numbers, 10, 1)::INTEGER THEN
    RETURN FALSE;
  END IF;

  -- Calcular segundo digito verificador
  FOR i IN 1..10 LOOP
    sum2 := sum2 + (substring(cpf_numbers, i, 1)::INTEGER * (12 - i));
  END LOOP;
  digit2 := (sum2 * 10) % 11;
  IF digit2 = 10 THEN digit2 := 0; END IF;

  -- Verificar segundo digito
  RETURN digit2 = substring(cpf_numbers, 11, 1)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Funcao para validar CNPJ
CREATE OR REPLACE FUNCTION validate_cnpj(cnpj TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  cnpj_numbers TEXT;
  sum1 INTEGER := 0;
  sum2 INTEGER := 0;
  weights1 INTEGER[] := ARRAY[5,4,3,2,9,8,7,6,5,4,3,2];
  weights2 INTEGER[] := ARRAY[6,5,4,3,2,9,8,7,6,5,4,3,2];
  digit1 INTEGER;
  digit2 INTEGER;
  i INTEGER;
BEGIN
  -- Remover caracteres nao numericos
  cnpj_numbers := regexp_replace(cnpj, '[^0-9]', '', 'g');

  -- Verificar tamanho
  IF length(cnpj_numbers) != 14 THEN
    RETURN FALSE;
  END IF;

  -- Calcular primeiro digito verificador
  FOR i IN 1..12 LOOP
    sum1 := sum1 + (substring(cnpj_numbers, i, 1)::INTEGER * weights1[i]);
  END LOOP;
  digit1 := sum1 % 11;
  IF digit1 < 2 THEN digit1 := 0; ELSE digit1 := 11 - digit1; END IF;

  -- Verificar primeiro digito
  IF digit1 != substring(cnpj_numbers, 13, 1)::INTEGER THEN
    RETURN FALSE;
  END IF;

  -- Calcular segundo digito verificador
  FOR i IN 1..13 LOOP
    sum2 := sum2 + (substring(cnpj_numbers, i, 1)::INTEGER * weights2[i]);
  END LOOP;
  digit2 := sum2 % 11;
  IF digit2 < 2 THEN digit2 := 0; ELSE digit2 := 11 - digit2; END IF;

  -- Verificar segundo digito
  RETURN digit2 = substring(cnpj_numbers, 14, 1)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Funcao para formatar CPF
CREATE OR REPLACE FUNCTION format_cpf(cpf TEXT)
RETURNS TEXT AS $$
DECLARE
  cpf_numbers TEXT;
BEGIN
  cpf_numbers := regexp_replace(cpf, '[^0-9]', '', 'g');
  IF length(cpf_numbers) = 11 THEN
    RETURN substring(cpf_numbers, 1, 3) || '.' ||
           substring(cpf_numbers, 4, 3) || '.' ||
           substring(cpf_numbers, 7, 3) || '-' ||
           substring(cpf_numbers, 10, 2);
  END IF;
  RETURN cpf;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Funcao para formatar CNPJ
CREATE OR REPLACE FUNCTION format_cnpj(cnpj TEXT)
RETURNS TEXT AS $$
DECLARE
  cnpj_numbers TEXT;
BEGIN
  cnpj_numbers := regexp_replace(cnpj, '[^0-9]', '', 'g');
  IF length(cnpj_numbers) = 14 THEN
    RETURN substring(cnpj_numbers, 1, 2) || '.' ||
           substring(cnpj_numbers, 3, 3) || '.' ||
           substring(cnpj_numbers, 6, 3) || '/' ||
           substring(cnpj_numbers, 9, 4) || '-' ||
           substring(cnpj_numbers, 13, 2);
  END IF;
  RETURN cnpj;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Funcao para calcular dias uteis entre duas datas
CREATE OR REPLACE FUNCTION count_business_days(
  start_date DATE,
  end_date DATE
)
RETURNS INTEGER AS $$
DECLARE
  total_days INTEGER := 0;
  current_date DATE := start_date;
BEGIN
  WHILE current_date <= end_date LOOP
    -- Excluir sabados (6) e domingos (0)
    IF EXTRACT(DOW FROM current_date) NOT IN (0, 6) THEN
      total_days := total_days + 1;
    END IF;
    current_date := current_date + 1;
  END LOOP;
  RETURN total_days;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Funcao para obter idade em anos
CREATE OR REPLACE FUNCTION get_age_years(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date))::INTEGER;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- CONFIGURACOES DE STORAGE (Supabase)
-- =====================================================

-- Criar buckets para arquivos
-- Nota: No Supabase, isso eh feito via dashboard ou API
-- Aqui documentamos a estrutura esperada

-- Bucket: employee-documents (documentos dos funcionarios)
-- Bucket: company-assets (logos, arquivos da empresa)
-- Bucket: profile-avatars (fotos de perfil)
-- Bucket: payroll-exports (exportacoes de folha)

-- =====================================================
-- COMENTARIOS GERAIS
-- =====================================================

COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function para atualizar updated_at automaticamente';
COMMENT ON FUNCTION validate_cpf(TEXT) IS 'Valida CPF brasileiro';
COMMENT ON FUNCTION validate_cnpj(TEXT) IS 'Valida CNPJ brasileiro';
COMMENT ON FUNCTION format_cpf(TEXT) IS 'Formata CPF no padrao XXX.XXX.XXX-XX';
COMMENT ON FUNCTION format_cnpj(TEXT) IS 'Formata CNPJ no padrao XX.XXX.XXX/XXXX-XX';
COMMENT ON FUNCTION count_business_days(DATE, DATE) IS 'Conta dias uteis entre duas datas (exclui sabados e domingos)';
COMMENT ON FUNCTION get_age_years(DATE) IS 'Retorna idade em anos a partir da data de nascimento';



-- =====================================================
-- FILE: 001_companies.sql
-- =====================================================

-- =====================================================
-- Migration 001: Companies (Tenants)
-- Sistema SaaS de RH Multi-tenant
-- =====================================================

-- ENUM para planos
CREATE TYPE company_plan AS ENUM ('free', 'starter', 'professional', 'enterprise');

-- ENUM para status da empresa
CREATE TYPE company_status AS ENUM ('active', 'suspended', 'cancelled');

-- Tabela principal de empresas (tenants)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Dados da empresa
  name TEXT NOT NULL,
  trade_name TEXT, -- Nome fantasia
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  state_registration VARCHAR(20), -- Inscricao estadual
  municipal_registration VARCHAR(20), -- Inscricao municipal

  -- Contato
  email TEXT NOT NULL,
  phone VARCHAR(20),
  website TEXT,

  -- Endereco (JSONB para flexibilidade)
  address JSONB DEFAULT '{}'::jsonb,
  -- Estrutura esperada:
  -- {
  --   "street": "Rua Example",
  --   "number": "123",
  --   "complement": "Sala 1",
  --   "neighborhood": "Centro",
  --   "city": "Sao Paulo",
  --   "state": "SP",
  --   "zip_code": "01234-567",
  --   "country": "Brasil"
  -- }

  -- Configuracoes (JSONB para extensibilidade)
  settings JSONB DEFAULT '{}'::jsonb,
  -- Estrutura esperada:
  -- {
  --   "timezone": "America/Sao_Paulo",
  --   "locale": "pt-BR",
  --   "date_format": "DD/MM/YYYY",
  --   "currency": "BRL",
  --   "logo_url": "https://...",
  --   "theme": { "primary_color": "#1976d2" },
  --   "modules": {
  --     "time_tracking": true,
  --     "evaluations": true,
  --     "pdi": true,
  --     "payroll": false
  --   },
  --   "notifications": {
  --     "email": true,
  --     "push": false
  --   }
  -- }

  -- Plano e billing
  plan company_plan DEFAULT 'free' NOT NULL,
  max_employees INTEGER DEFAULT 10,
  billing_email TEXT,

  -- Status
  status company_status DEFAULT 'active' NOT NULL,

  -- Owner (usuario que criou a empresa)
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indices para busca frequente
CREATE INDEX idx_companies_cnpj ON companies (cnpj);
CREATE INDEX idx_companies_status ON companies (status);
CREATE INDEX idx_companies_plan ON companies (plan);
CREATE INDEX idx_companies_name ON companies USING gin (name gin_trgm_ops);
CREATE INDEX idx_companies_owner_id ON companies (owner_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios so veem sua propria empresa
-- Nota: Depende da tabela profiles que sera criada depois
-- Por enquanto, criamos uma policy baseada em claims do JWT
CREATE POLICY "Users can view their own company"
  ON companies
  FOR SELECT
  USING (
    id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Policy: Apenas admins podem atualizar dados da empresa
CREATE POLICY "Admins can update their company"
  ON companies
  FOR UPDATE
  USING (
    id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Inserir empresa (para registro inicial - via service role)
CREATE POLICY "Service role can insert companies"
  ON companies
  FOR INSERT
  WITH CHECK (true); -- Controlado via service role

-- Comentarios
COMMENT ON TABLE companies IS 'Tabela principal de tenants do sistema SaaS de RH';
COMMENT ON COLUMN companies.cnpj IS 'CNPJ formatado: XX.XXX.XXX/XXXX-XX';
COMMENT ON COLUMN companies.address IS 'Endereco completo em formato JSONB';
COMMENT ON COLUMN companies.settings IS 'Configuracoes personalizadas da empresa';
COMMENT ON COLUMN companies.max_employees IS 'Limite de funcionarios baseado no plano';



-- =====================================================
-- FILE: 002_profiles.sql
-- =====================================================

-- =====================================================
-- Migration 002: Profiles (User Profiles)
-- Sistema SaaS de RH Multi-tenant
-- =====================================================

-- ENUM para roles de usuario
CREATE TYPE user_role AS ENUM ('admin', 'hr', 'manager', 'employee');

-- Tabela de perfis (estende auth.users)
CREATE TABLE profiles (
  -- ID referencia auth.users diretamente
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Dados basicos
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  phone VARCHAR(20),

  -- Permissoes
  role user_role DEFAULT 'employee' NOT NULL,

  -- Vinculo com funcionario (opcional - pode ser usuario sem ser funcionario)
  employee_id UUID, -- FK sera adicionada apos criar tabela employees

  -- Configuracoes do usuario
  settings JSONB DEFAULT '{}'::jsonb,
  -- Estrutura esperada:
  -- {
  --   "theme": "light" | "dark" | "system",
  --   "language": "pt-BR",
  --   "notifications": {
  --     "email": true,
  --     "push": true,
  --     "sms": false
  --   },
  --   "dashboard": {
  --     "widgets": ["time_tracking", "pending_approvals", "team_overview"]
  --   }
  -- }

  -- Status
  is_active BOOLEAN DEFAULT true NOT NULL,
  last_login_at TIMESTAMPTZ,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indices para busca frequente
CREATE INDEX idx_profiles_company_id ON profiles (company_id);
CREATE INDEX idx_profiles_role ON profiles (role);
CREATE INDEX idx_profiles_email ON profiles (email);
CREATE INDEX idx_profiles_employee_id ON profiles (employee_id);
CREATE INDEX idx_profiles_is_active ON profiles (is_active);

-- Trigger para updated_at
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios podem ver perfis da mesma empresa
CREATE POLICY "Users can view profiles from same company"
  ON profiles
  FOR SELECT
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Policy: Usuarios podem atualizar seu proprio perfil
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Policy: Admins e HR podem atualizar perfis da empresa
CREATE POLICY "Admins and HR can update company profiles"
  ON profiles
  FOR UPDATE
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'hr')
    )
  );

-- Policy: Admins podem inserir perfis na empresa
CREATE POLICY "Admins can insert profiles"
  ON profiles
  FOR INSERT
  WITH CHECK (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Service role pode inserir (para registro inicial)
CREATE POLICY "Service role can manage profiles"
  ON profiles
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Funcao para criar perfil automaticamente apos signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_company_id UUID;
BEGIN
  -- Se o usuario forneceu company_id no metadata
  IF NEW.raw_user_meta_data->>'company_id' IS NOT NULL THEN
    INSERT INTO profiles (id, company_id, name, email, role)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data->>'company_id')::UUID,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      NEW.email,
      COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'employee')
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Funcao para atualizar last_login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET last_login_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios
COMMENT ON TABLE profiles IS 'Perfis de usuarios vinculados ao auth.users do Supabase';
COMMENT ON COLUMN profiles.role IS 'Nivel de permissao: admin (tudo), hr (RH), manager (gestor), employee (funcionario)';
COMMENT ON COLUMN profiles.employee_id IS 'Vinculo opcional com registro de funcionario';
COMMENT ON COLUMN profiles.settings IS 'Preferencias pessoais do usuario';



-- =====================================================
-- FILE: 003_employees.sql
-- =====================================================

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



-- =====================================================
-- FILE: 004_employee_documents.sql
-- =====================================================

-- =====================================================
-- Migration 004: Employee Documents (Documentos)
-- Sistema SaaS de RH Multi-tenant
-- =====================================================

-- ENUM para tipos de documento
CREATE TYPE document_type AS ENUM (
  -- Documentos pessoais
  'rg',
  'cpf',
  'cnh',
  'titulo_eleitor',
  'reservista',
  'certidao_nascimento',
  'certidao_casamento',
  'comprovante_residencia',
  'foto_3x4',

  -- Documentos trabalhistas
  'ctps',
  'pis',
  'contrato_trabalho',
  'aditivo_contrato',
  'termo_rescisao',
  'aviso_previo',

  -- Documentos de admissao
  'aso_admissional',
  'ficha_registro',
  'declaracao_dependentes',
  'opcao_vale_transporte',

  -- Documentos academicos
  'diploma',
  'certificado',
  'historico_escolar',

  -- Atestados e laudos
  'atestado_medico',
  'laudo_medico',
  'aso_periodico',
  'aso_demissional',

  -- Outros
  'outros'
);

-- ENUM para status do documento
CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- Tabela de documentos anexados
CREATE TABLE employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Vinculo com funcionario
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Tipo e descricao
  type document_type NOT NULL,
  description TEXT, -- Descricao adicional

  -- Arquivo
  file_url TEXT NOT NULL, -- URL no Supabase Storage
  file_name TEXT NOT NULL, -- Nome original do arquivo
  file_size INTEGER, -- Tamanho em bytes
  file_type VARCHAR(100), -- MIME type (application/pdf, image/jpeg, etc)

  -- Metadados do documento
  document_number VARCHAR(50), -- Numero do documento (se aplicavel)
  issue_date DATE, -- Data de emissao
  expires_at DATE, -- Data de validade (opcional)
  issuing_authority TEXT, -- Orgao emissor

  -- Status e validacao
  status document_status DEFAULT 'pending' NOT NULL,
  rejection_reason TEXT, -- Motivo da rejeicao (se aplicavel)
  validated_by UUID REFERENCES profiles(id),
  validated_at TIMESTAMPTZ,

  -- Visibilidade
  is_sensitive BOOLEAN DEFAULT false, -- Documento sensivel (restringir acesso)
  visible_to_employee BOOLEAN DEFAULT true, -- Funcionario pode visualizar

  -- Versioning
  version INTEGER DEFAULT 1,
  previous_version_id UUID REFERENCES employee_documents(id),
  is_current BOOLEAN DEFAULT true,

  -- Auditoria
  uploaded_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  uploaded_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Constraint para garantir arquivo unico ativo por tipo
  CONSTRAINT unique_current_document UNIQUE (employee_id, type, is_current)
    DEFERRABLE INITIALLY DEFERRED
);

-- =====================================================
-- INDICES
-- =====================================================

-- Multi-tenancy
CREATE INDEX idx_employee_documents_company ON employee_documents (company_id);

-- Busca por funcionario
CREATE INDEX idx_employee_documents_employee ON employee_documents (employee_id);

-- Filtros comuns
CREATE INDEX idx_employee_documents_type ON employee_documents (type);
CREATE INDEX idx_employee_documents_status ON employee_documents (status);
CREATE INDEX idx_employee_documents_expires ON employee_documents (expires_at);

-- Busca combinada
CREATE INDEX idx_employee_documents_employee_type ON employee_documents (employee_id, type);
CREATE INDEX idx_employee_documents_company_status ON employee_documents (company_id, status);

-- Documentos proximos de vencer
CREATE INDEX idx_employee_documents_expiring
  ON employee_documents (expires_at)
  WHERE expires_at IS NOT NULL AND status = 'approved' AND is_current = true;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para updated_at
CREATE TRIGGER trigger_employee_documents_updated_at
  BEFORE UPDATE ON employee_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Funcao para gerenciar versoes de documentos
CREATE OR REPLACE FUNCTION manage_document_versions()
RETURNS TRIGGER AS $$
BEGIN
  -- Ao inserir novo documento, desativar versoes anteriores do mesmo tipo
  IF TG_OP = 'INSERT' THEN
    UPDATE employee_documents
    SET is_current = false
    WHERE employee_id = NEW.employee_id
    AND type = NEW.type
    AND id != NEW.id
    AND is_current = true;

    -- Definir versao
    SELECT COALESCE(MAX(version), 0) + 1
    INTO NEW.version
    FROM employee_documents
    WHERE employee_id = NEW.employee_id
    AND type = NEW.type;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_manage_document_versions
  BEFORE INSERT ON employee_documents
  FOR EACH ROW
  EXECUTE FUNCTION manage_document_versions();

-- Funcao para notificar documentos expirando
CREATE OR REPLACE FUNCTION check_expiring_documents()
RETURNS TABLE (
  document_id UUID,
  employee_id UUID,
  employee_name TEXT,
  document_type document_type,
  expires_at DATE,
  days_until_expiry INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.employee_id,
    e.name,
    d.type,
    d.expires_at,
    (d.expires_at - CURRENT_DATE)::INTEGER
  FROM employee_documents d
  JOIN employees e ON e.id = d.employee_id
  WHERE d.expires_at IS NOT NULL
  AND d.status = 'approved'
  AND d.is_current = true
  AND d.expires_at BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
  ORDER BY d.expires_at;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Admins e HR podem ver todos os documentos da empresa
CREATE POLICY "Admins and HR can view all company documents"
  ON employee_documents
  FOR SELECT
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'hr')
    )
  );

-- Policy: Gestores podem ver documentos de sua equipe
CREATE POLICY "Managers can view team documents"
  ON employee_documents
  FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE manager_id = (
        SELECT employee_id FROM profiles WHERE id = auth.uid()
      )
    )
    AND NOT is_sensitive
  );

-- Policy: Funcionarios podem ver seus proprios documentos
CREATE POLICY "Employees can view own documents"
  ON employee_documents
  FOR SELECT
  USING (
    employee_id = (
      SELECT employee_id FROM profiles
      WHERE id = auth.uid()
    )
    AND visible_to_employee = true
  );

-- Policy: Admins e HR podem inserir documentos
CREATE POLICY "Admins and HR can insert documents"
  ON employee_documents
  FOR INSERT
  WITH CHECK (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'hr')
    )
  );

-- Policy: Admins e HR podem atualizar documentos
CREATE POLICY "Admins and HR can update documents"
  ON employee_documents
  FOR UPDATE
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'hr')
    )
  );

-- Policy: Admins podem deletar documentos
CREATE POLICY "Admins can delete documents"
  ON employee_documents
  FOR DELETE
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- =====================================================
-- VIEWS
-- =====================================================

-- View para documentos expirando
CREATE VIEW v_expiring_documents AS
SELECT
  d.id,
  d.company_id,
  d.employee_id,
  e.name AS employee_name,
  e.department,
  d.type,
  d.file_name,
  d.expires_at,
  (d.expires_at - CURRENT_DATE) AS days_until_expiry,
  CASE
    WHEN d.expires_at < CURRENT_DATE THEN 'expired'
    WHEN d.expires_at <= CURRENT_DATE + INTERVAL '7 days' THEN 'critical'
    WHEN d.expires_at <= CURRENT_DATE + INTERVAL '30 days' THEN 'warning'
    ELSE 'ok'
  END AS urgency_level
FROM employee_documents d
JOIN employees e ON e.id = d.employee_id
WHERE d.expires_at IS NOT NULL
AND d.status = 'approved'
AND d.is_current = true
AND e.status = 'active';

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE employee_documents IS 'Documentos anexados aos funcionarios com controle de versao e validade';
COMMENT ON COLUMN employee_documents.file_url IS 'URL no Supabase Storage - usar politicas de storage para proteger';
COMMENT ON COLUMN employee_documents.is_sensitive IS 'Documentos sensiveis tem acesso mais restrito';
COMMENT ON COLUMN employee_documents.version IS 'Versao do documento para historico';
COMMENT ON COLUMN employee_documents.is_current IS 'Indica se eh a versao atual do documento';



-- =====================================================
-- FILE: 005_time_tracking.sql
-- =====================================================

-- =====================================================
-- Migration 005: Time Tracking (Controle de Ponto)
-- Sistema SaaS de RH Multi-tenant
-- =====================================================

-- ENUM para status do ponto
CREATE TYPE time_record_status AS ENUM ('pending', 'approved', 'rejected', 'adjusted');

-- ENUM para tipo de registro
CREATE TYPE clock_type AS ENUM ('clock_in', 'clock_out', 'break_start', 'break_end');

-- ENUM para origem do registro
CREATE TYPE record_source AS ENUM ('mobile_app', 'web', 'biometric', 'manual', 'import');

-- =====================================================
-- Tabela de registros de ponto (individual)
-- =====================================================

CREATE TABLE time_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Funcionario
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Registro
  record_type clock_type NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,

  -- Localizacao (para registro via app)
  location POINT, -- Coordenadas GPS
  location_address TEXT, -- Endereco reverso
  location_accuracy NUMERIC(10,2), -- Precisao em metros
  is_within_geofence BOOLEAN, -- Dentro da area permitida

  -- Dispositivo
  device_info JSONB DEFAULT '{}'::jsonb,
  -- Estrutura:
  -- {
  --   "device_id": "xxx",
  --   "device_type": "mobile" | "desktop" | "biometric",
  --   "os": "iOS 17.0",
  --   "app_version": "1.2.3",
  --   "ip_address": "192.168.1.1",
  --   "user_agent": "..."
  -- }

  -- Biometria (se aplicavel)
  biometric_data JSONB, -- Hash ou referencia, nunca dado bruto

  -- Origem
  source record_source DEFAULT 'web' NOT NULL,

  -- Foto (se exigido)
  photo_url TEXT,

  -- Observacoes
  notes TEXT,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- Tabela de resumo diario de ponto
-- =====================================================

CREATE TABLE time_tracking_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Funcionario e data
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Horarios consolidados
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  break_start TIMESTAMPTZ,
  break_end TIMESTAMPTZ,

  -- Horarios adicionais (para jornadas com multiplos intervalos)
  additional_breaks JSONB DEFAULT '[]'::jsonb,
  -- Estrutura:
  -- [
  --   { "start": "...", "end": "...", "type": "break" | "meal" }
  -- ]

  -- Calculo de horas
  worked_minutes INTEGER DEFAULT 0, -- Minutos trabalhados
  break_minutes INTEGER DEFAULT 0, -- Minutos de intervalo
  overtime_minutes INTEGER DEFAULT 0, -- Horas extras em minutos
  night_shift_minutes INTEGER DEFAULT 0, -- Adicional noturno em minutos
  missing_minutes INTEGER DEFAULT 0, -- Minutos faltantes

  -- Classificacao do dia
  is_workday BOOLEAN DEFAULT true, -- Dia util
  is_holiday BOOLEAN DEFAULT false, -- Feriado
  is_compensated BOOLEAN DEFAULT false, -- Dia de compensacao (banco de horas)

  -- Justificativas
  absence_type VARCHAR(50), -- vacation, sick_leave, etc (se ausente)
  absence_id UUID, -- Referencia para tabela de ausencias
  justification TEXT,
  justification_file_url TEXT,

  -- Status e aprovacao
  status time_record_status DEFAULT 'pending' NOT NULL,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Ajustes manuais
  is_manually_adjusted BOOLEAN DEFAULT false,
  adjustment_reason TEXT,
  adjusted_by UUID REFERENCES profiles(id),
  adjusted_at TIMESTAMPTZ,
  original_values JSONB, -- Valores antes do ajuste

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Constraint de unicidade
  CONSTRAINT unique_employee_date UNIQUE (employee_id, date)
);

-- =====================================================
-- Tabela de banco de horas
-- =====================================================

CREATE TABLE time_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Funcionario
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Periodo
  reference_date DATE NOT NULL, -- Data de referencia

  -- Tipo de movimentacao
  movement_type VARCHAR(20) NOT NULL, -- credit, debit, adjustment, expiry

  -- Valores (em minutos)
  minutes INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,

  -- Referencia
  time_tracking_id UUID REFERENCES time_tracking_daily(id),
  description TEXT,

  -- Validade
  expires_at DATE, -- Data de expiracao do credito

  -- Aprovacao
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- Tabela de geofences (areas permitidas)
-- =====================================================

CREATE TABLE geofences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Identificacao
  name TEXT NOT NULL,
  description TEXT,

  -- Localizacao
  center POINT NOT NULL, -- Centro da area
  radius_meters INTEGER NOT NULL, -- Raio em metros

  -- Ou poligono para areas irregulares
  polygon POLYGON,

  -- Endereco
  address TEXT,

  -- Configuracao
  is_active BOOLEAN DEFAULT true,
  is_required BOOLEAN DEFAULT false, -- Registro obrigatorio dentro da area

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- INDICES
-- =====================================================

-- time_records
CREATE INDEX idx_time_records_company ON time_records (company_id);
CREATE INDEX idx_time_records_employee ON time_records (employee_id);
CREATE INDEX idx_time_records_date ON time_records (recorded_at);
CREATE INDEX idx_time_records_employee_date ON time_records (employee_id, recorded_at);
CREATE INDEX idx_time_records_type ON time_records (record_type);

-- time_tracking_daily
CREATE INDEX idx_time_tracking_company ON time_tracking_daily (company_id);
CREATE INDEX idx_time_tracking_employee ON time_tracking_daily (employee_id);
CREATE INDEX idx_time_tracking_date ON time_tracking_daily (date);
CREATE INDEX idx_time_tracking_status ON time_tracking_daily (status);
CREATE INDEX idx_time_tracking_employee_date ON time_tracking_daily (employee_id, date);
CREATE INDEX idx_time_tracking_company_date ON time_tracking_daily (company_id, date);
CREATE INDEX idx_time_tracking_pending ON time_tracking_daily (company_id, status)
  WHERE status = 'pending';

-- time_bank
CREATE INDEX idx_time_bank_company ON time_bank (company_id);
CREATE INDEX idx_time_bank_employee ON time_bank (employee_id);
CREATE INDEX idx_time_bank_date ON time_bank (reference_date);
CREATE INDEX idx_time_bank_expires ON time_bank (expires_at)
  WHERE expires_at IS NOT NULL;

-- geofences
CREATE INDEX idx_geofences_company ON geofences (company_id);
CREATE INDEX idx_geofences_active ON geofences (company_id, is_active)
  WHERE is_active = true;

-- Indice espacial para geofences
CREATE INDEX idx_geofences_location ON geofences USING gist (center);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Triggers para updated_at
CREATE TRIGGER trigger_time_tracking_daily_updated_at
  BEFORE UPDATE ON time_tracking_daily
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_geofences_updated_at
  BEFORE UPDATE ON geofences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Funcao para calcular horas trabalhadas
CREATE OR REPLACE FUNCTION calculate_worked_hours()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular minutos trabalhados
  IF NEW.clock_in IS NOT NULL AND NEW.clock_out IS NOT NULL THEN
    NEW.worked_minutes := EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in)) / 60;

    -- Subtrair intervalo
    IF NEW.break_start IS NOT NULL AND NEW.break_end IS NOT NULL THEN
      NEW.break_minutes := EXTRACT(EPOCH FROM (NEW.break_end - NEW.break_start)) / 60;
      NEW.worked_minutes := NEW.worked_minutes - NEW.break_minutes;
    END IF;

    -- Calcular adicional noturno (22h - 5h)
    -- Simplificado - implementacao completa requer logica mais complexa
    NEW.night_shift_minutes := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_worked_hours
  BEFORE INSERT OR UPDATE ON time_tracking_daily
  FOR EACH ROW
  EXECUTE FUNCTION calculate_worked_hours();

-- Funcao para consolidar registros do dia
CREATE OR REPLACE FUNCTION consolidate_daily_records(
  p_employee_id UUID,
  p_date DATE
)
RETURNS UUID AS $$
DECLARE
  v_daily_id UUID;
  v_clock_in TIMESTAMPTZ;
  v_clock_out TIMESTAMPTZ;
  v_break_start TIMESTAMPTZ;
  v_break_end TIMESTAMPTZ;
  v_company_id UUID;
BEGIN
  -- Pegar company_id
  SELECT company_id INTO v_company_id
  FROM employees WHERE id = p_employee_id;

  -- Pegar registros do dia
  SELECT recorded_at INTO v_clock_in
  FROM time_records
  WHERE employee_id = p_employee_id
  AND DATE(recorded_at) = p_date
  AND record_type = 'clock_in'
  ORDER BY recorded_at
  LIMIT 1;

  SELECT recorded_at INTO v_clock_out
  FROM time_records
  WHERE employee_id = p_employee_id
  AND DATE(recorded_at) = p_date
  AND record_type = 'clock_out'
  ORDER BY recorded_at DESC
  LIMIT 1;

  SELECT recorded_at INTO v_break_start
  FROM time_records
  WHERE employee_id = p_employee_id
  AND DATE(recorded_at) = p_date
  AND record_type = 'break_start'
  ORDER BY recorded_at
  LIMIT 1;

  SELECT recorded_at INTO v_break_end
  FROM time_records
  WHERE employee_id = p_employee_id
  AND DATE(recorded_at) = p_date
  AND record_type = 'break_end'
  ORDER BY recorded_at
  LIMIT 1;

  -- Inserir ou atualizar resumo diario
  INSERT INTO time_tracking_daily (
    company_id, employee_id, date,
    clock_in, clock_out, break_start, break_end
  )
  VALUES (
    v_company_id, p_employee_id, p_date,
    v_clock_in, v_clock_out, v_break_start, v_break_end
  )
  ON CONFLICT (employee_id, date)
  DO UPDATE SET
    clock_in = EXCLUDED.clock_in,
    clock_out = EXCLUDED.clock_out,
    break_start = EXCLUDED.break_start,
    break_end = EXCLUDED.break_end,
    updated_at = now()
  RETURNING id INTO v_daily_id;

  RETURN v_daily_id;
END;
$$ LANGUAGE plpgsql;

-- Funcao para atualizar banco de horas
CREATE OR REPLACE FUNCTION update_time_bank()
RETURNS TRIGGER AS $$
DECLARE
  v_current_balance INTEGER;
  v_overtime INTEGER;
BEGIN
  -- Apenas quando aprovado
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Pegar saldo atual
    SELECT COALESCE(balance_after, 0) INTO v_current_balance
    FROM time_bank
    WHERE employee_id = NEW.employee_id
    ORDER BY created_at DESC
    LIMIT 1;

    -- Calcular overtime (positivo) ou falta (negativo)
    v_overtime := NEW.overtime_minutes - NEW.missing_minutes;

    -- Registrar no banco de horas se houver diferenca
    IF v_overtime != 0 THEN
      INSERT INTO time_bank (
        company_id, employee_id, reference_date,
        movement_type, minutes, balance_before, balance_after,
        time_tracking_id, approved_by, approved_at
      )
      VALUES (
        NEW.company_id, NEW.employee_id, NEW.date,
        CASE WHEN v_overtime > 0 THEN 'credit' ELSE 'debit' END,
        ABS(v_overtime), v_current_balance, v_current_balance + v_overtime,
        NEW.id, NEW.approved_by, now()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_time_bank
  AFTER UPDATE ON time_tracking_daily
  FOR EACH ROW
  EXECUTE FUNCTION update_time_bank();

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

ALTER TABLE time_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_tracking_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;

-- time_records policies
CREATE POLICY "Users can view own time records"
  ON time_records FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert own time records"
  ON time_records FOR INSERT
  WITH CHECK (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins and HR can view all time records"
  ON time_records FOR SELECT
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Managers can view team time records"
  ON time_records FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE manager_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  );

-- time_tracking_daily policies
CREATE POLICY "Users can view own daily tracking"
  ON time_tracking_daily FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins and HR can manage daily tracking"
  ON time_tracking_daily FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Managers can approve team tracking"
  ON time_tracking_daily FOR UPDATE
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE manager_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  );

-- time_bank policies
CREATE POLICY "Users can view own time bank"
  ON time_bank FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins and HR can manage time bank"
  ON time_bank FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- geofences policies
CREATE POLICY "Users can view company geofences"
  ON geofences FOR SELECT
  USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage geofences"
  ON geofences FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- VIEWS
-- =====================================================

-- View para dashboard de ponto
CREATE VIEW v_time_tracking_dashboard AS
SELECT
  t.company_id,
  t.employee_id,
  e.name AS employee_name,
  e.department,
  t.date,
  t.clock_in,
  t.clock_out,
  t.worked_minutes,
  t.overtime_minutes,
  t.missing_minutes,
  t.status,
  COALESCE(
    (SELECT balance_after FROM time_bank
     WHERE employee_id = t.employee_id
     ORDER BY created_at DESC LIMIT 1),
    0
  ) AS time_bank_balance
FROM time_tracking_daily t
JOIN employees e ON e.id = t.employee_id
WHERE e.status = 'active';

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE time_records IS 'Registros individuais de ponto (batidas)';
COMMENT ON TABLE time_tracking_daily IS 'Consolidacao diaria do ponto com calculos';
COMMENT ON TABLE time_bank IS 'Banco de horas com movimentacoes';
COMMENT ON TABLE geofences IS 'Areas geograficas permitidas para registro de ponto';
COMMENT ON COLUMN time_records.location IS 'Coordenadas GPS no formato POINT(longitude latitude)';
COMMENT ON COLUMN time_tracking_daily.night_shift_minutes IS 'Minutos trabalhados entre 22h e 5h (adicional noturno)';



-- =====================================================
-- FILE: 006_work_schedules.sql
-- =====================================================

-- =====================================================
-- Migration 006: Work Schedules (Jornadas e Escalas)
-- Sistema SaaS de RH Multi-tenant
-- =====================================================

-- ENUM para tipo de escala
CREATE TYPE schedule_type AS ENUM (
  'fixed',          -- Jornada fixa (segunda a sexta)
  'shift',          -- Turno (6x1, 5x2, etc)
  'flexible',       -- Horario flexivel
  'intermittent',   -- Intermitente
  'remote',         -- Home office / remoto
  'hybrid'          -- Hibrido
);

-- ENUM para dias da semana
CREATE TYPE weekday AS ENUM (
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
);

-- =====================================================
-- Tabela de modelos de jornada
-- =====================================================

CREATE TABLE work_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Identificacao
  name TEXT NOT NULL,
  description TEXT,
  code VARCHAR(20), -- Codigo interno

  -- Tipo de jornada
  schedule_type schedule_type DEFAULT 'fixed' NOT NULL,

  -- Carga horaria
  weekly_hours NUMERIC(5,2) DEFAULT 44 NOT NULL, -- Horas semanais
  daily_hours NUMERIC(5,2) DEFAULT 8 NOT NULL, -- Horas diarias padrao

  -- Intervalo
  break_duration_minutes INTEGER DEFAULT 60 NOT NULL, -- Duracao do intervalo
  break_start_time TIME, -- Inicio padrao do intervalo
  break_end_time TIME, -- Fim padrao do intervalo
  is_break_flexible BOOLEAN DEFAULT false, -- Intervalo flexivel
  min_break_minutes INTEGER DEFAULT 60, -- Minimo de intervalo (CLT)

  -- Tolerancia
  tolerance_minutes INTEGER DEFAULT 10, -- Tolerancia para atraso/saida antecipada

  -- Configuracoes de hora extra
  overtime_rules JSONB DEFAULT '{}'::jsonb,
  -- Estrutura:
  -- {
  --   "daily_limit_minutes": 120,    -- Limite diario de HE
  --   "weekly_limit_minutes": 600,   -- Limite semanal de HE
  --   "multiplier_50": 1.5,          -- Multiplicador 50%
  --   "multiplier_100": 2.0,         -- Multiplicador 100% (domingos/feriados)
  --   "requires_approval": true,     -- Requer aprovacao previa
  --   "auto_approve_limit": 30       -- Auto aprovar ate X minutos
  -- }

  -- Adicional noturno
  night_shift_config JSONB DEFAULT '{}'::jsonb,
  -- Estrutura:
  -- {
  --   "start_time": "22:00",
  --   "end_time": "05:00",
  --   "multiplier": 1.2,
  --   "hour_reduction": true    -- Hora noturna = 52min30s
  -- }

  -- Configuracoes de flexibilidade
  flexibility_config JSONB DEFAULT '{}'::jsonb,
  -- Estrutura:
  -- {
  --   "core_hours_start": "10:00",  -- Horario nucleo inicio
  --   "core_hours_end": "16:00",    -- Horario nucleo fim
  --   "flex_window_start": "07:00", -- Pode comecar a partir de
  --   "flex_window_end": "10:00",   -- Deve comecar ate
  --   "min_daily_hours": 6          -- Minimo de horas por dia
  -- }

  -- Banco de horas
  time_bank_enabled BOOLEAN DEFAULT true,
  time_bank_config JSONB DEFAULT '{}'::jsonb,
  -- Estrutura:
  -- {
  --   "expiry_months": 6,           -- Validade dos creditos
  --   "max_balance_hours": 40,      -- Saldo maximo permitido
  --   "min_balance_hours": -10,     -- Debito maximo permitido
  --   "compensation_rules": {
  --     "min_hours": 4,             -- Minimo de horas para folga
  --     "requires_approval": true
  --   }
  -- }

  -- Status
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_default BOOLEAN DEFAULT false, -- Jornada padrao da empresa

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- Tabela de horarios por dia da semana
-- =====================================================

CREATE TABLE schedule_weekdays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Vinculo com jornada
  schedule_id UUID NOT NULL REFERENCES work_schedules(id) ON DELETE CASCADE,

  -- Dia da semana
  weekday weekday NOT NULL,

  -- E dia de trabalho?
  is_workday BOOLEAN DEFAULT true NOT NULL,

  -- Horarios
  start_time TIME, -- Entrada
  end_time TIME, -- Saida

  -- Intervalo (pode ser diferente do padrao)
  break_start TIME,
  break_end TIME,
  break_duration_minutes INTEGER,

  -- Horas do dia
  expected_hours NUMERIC(5,2),

  -- Constraint de unicidade
  CONSTRAINT unique_schedule_weekday UNIQUE (schedule_id, weekday)
);

-- =====================================================
-- Tabela de escalas de revezamento
-- =====================================================

CREATE TABLE rotation_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Vinculo com jornada
  schedule_id UUID NOT NULL REFERENCES work_schedules(id) ON DELETE CASCADE,

  -- Identificacao
  name TEXT NOT NULL, -- Ex: "Turno A", "Turno B"

  -- Ciclo de revezamento
  cycle_days INTEGER NOT NULL, -- Tamanho do ciclo em dias
  work_days INTEGER NOT NULL, -- Dias de trabalho no ciclo
  off_days INTEGER NOT NULL, -- Dias de folga no ciclo

  -- Padrao do ciclo (array de booleans)
  cycle_pattern BOOLEAN[] NOT NULL, -- [true, true, true, true, true, true, false] = 6x1

  -- Horarios do turno
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration_minutes INTEGER DEFAULT 60,

  -- Data de inicio do ciclo (para calculo)
  cycle_start_date DATE NOT NULL,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- Tabela de vinculo funcionario-jornada
-- =====================================================

CREATE TABLE employee_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Funcionario e jornada
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES work_schedules(id) ON DELETE CASCADE,

  -- Para escalas de revezamento
  rotation_schedule_id UUID REFERENCES rotation_schedules(id),

  -- Vigencia
  start_date DATE NOT NULL,
  end_date DATE, -- NULL = vigente

  -- Motivo da alteracao
  change_reason TEXT,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- Tabela de feriados
-- =====================================================

CREATE TABLE holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy (NULL = feriado nacional)
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Dados do feriado
  name TEXT NOT NULL,
  date DATE NOT NULL,

  -- Tipo
  is_national BOOLEAN DEFAULT false,
  is_state BOOLEAN DEFAULT false,
  is_municipal BOOLEAN DEFAULT false,
  is_company BOOLEAN DEFAULT false, -- Feriado da empresa

  -- Local (para feriados estaduais/municipais)
  state VARCHAR(2),
  city TEXT,

  -- Recorrencia
  is_recurring BOOLEAN DEFAULT true, -- Repete todo ano

  -- Configuracao
  is_optional BOOLEAN DEFAULT false, -- Ponto facultativo

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- Adicionar FK na tabela employees
-- =====================================================

ALTER TABLE employees
  ADD CONSTRAINT fk_employees_work_schedule
  FOREIGN KEY (work_schedule_id)
  REFERENCES work_schedules(id);

-- =====================================================
-- INDICES
-- =====================================================

-- work_schedules
CREATE INDEX idx_work_schedules_company ON work_schedules (company_id);
CREATE INDEX idx_work_schedules_active ON work_schedules (company_id, is_active)
  WHERE is_active = true;
CREATE INDEX idx_work_schedules_type ON work_schedules (schedule_type);

-- schedule_weekdays
CREATE INDEX idx_schedule_weekdays_schedule ON schedule_weekdays (schedule_id);

-- rotation_schedules
CREATE INDEX idx_rotation_schedules_schedule ON rotation_schedules (schedule_id);

-- employee_schedules
CREATE INDEX idx_employee_schedules_company ON employee_schedules (company_id);
CREATE INDEX idx_employee_schedules_employee ON employee_schedules (employee_id);
CREATE INDEX idx_employee_schedules_schedule ON employee_schedules (schedule_id);
CREATE INDEX idx_employee_schedules_active ON employee_schedules (employee_id, end_date)
  WHERE end_date IS NULL;

-- holidays
CREATE INDEX idx_holidays_company ON holidays (company_id);
CREATE INDEX idx_holidays_date ON holidays (date);
CREATE INDEX idx_holidays_national ON holidays (date) WHERE is_national = true;

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER trigger_work_schedules_updated_at
  BEFORE UPDATE ON work_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_rotation_schedules_updated_at
  BEFORE UPDATE ON rotation_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Funcao para garantir apenas uma jornada default
CREATE OR REPLACE FUNCTION ensure_single_default_schedule()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE work_schedules
    SET is_default = false
    WHERE company_id = NEW.company_id
    AND id != NEW.id
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_default_schedule
  BEFORE INSERT OR UPDATE ON work_schedules
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_schedule();

-- Funcao para encerrar vinculo anterior ao criar novo
CREATE OR REPLACE FUNCTION end_previous_employee_schedule()
RETURNS TRIGGER AS $$
BEGIN
  -- Encerrar vinculo anterior
  UPDATE employee_schedules
  SET end_date = NEW.start_date - INTERVAL '1 day'
  WHERE employee_id = NEW.employee_id
  AND end_date IS NULL
  AND id != NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_end_previous_schedule
  BEFORE INSERT ON employee_schedules
  FOR EACH ROW
  EXECUTE FUNCTION end_previous_employee_schedule();

-- =====================================================
-- FUNCOES AUXILIARES
-- =====================================================

-- Funcao para verificar se uma data eh dia util
CREATE OR REPLACE FUNCTION is_workday(
  p_company_id UUID,
  p_employee_id UUID,
  p_date DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  v_schedule_id UUID;
  v_weekday weekday;
  v_is_workday BOOLEAN;
  v_is_holiday BOOLEAN;
BEGIN
  -- Pegar jornada do funcionario
  SELECT schedule_id INTO v_schedule_id
  FROM employee_schedules
  WHERE employee_id = p_employee_id
  AND start_date <= p_date
  AND (end_date IS NULL OR end_date >= p_date)
  ORDER BY start_date DESC
  LIMIT 1;

  IF v_schedule_id IS NULL THEN
    -- Sem jornada definida, usar padrao
    SELECT id INTO v_schedule_id
    FROM work_schedules
    WHERE company_id = p_company_id
    AND is_default = true;
  END IF;

  -- Verificar dia da semana
  v_weekday := LOWER(to_char(p_date, 'FMDay'))::weekday;

  SELECT COALESCE(sw.is_workday, true) INTO v_is_workday
  FROM schedule_weekdays sw
  WHERE sw.schedule_id = v_schedule_id
  AND sw.weekday = v_weekday;

  -- Verificar se eh feriado
  SELECT EXISTS (
    SELECT 1 FROM holidays
    WHERE date = p_date
    AND (company_id = p_company_id OR is_national = true)
  ) INTO v_is_holiday;

  RETURN v_is_workday AND NOT v_is_holiday;
END;
$$ LANGUAGE plpgsql;

-- Funcao para calcular horas esperadas do dia
CREATE OR REPLACE FUNCTION get_expected_hours(
  p_employee_id UUID,
  p_date DATE
)
RETURNS NUMERIC AS $$
DECLARE
  v_schedule_id UUID;
  v_weekday weekday;
  v_hours NUMERIC;
BEGIN
  -- Pegar jornada do funcionario
  SELECT schedule_id INTO v_schedule_id
  FROM employee_schedules
  WHERE employee_id = p_employee_id
  AND start_date <= p_date
  AND (end_date IS NULL OR end_date >= p_date)
  ORDER BY start_date DESC
  LIMIT 1;

  IF v_schedule_id IS NULL THEN
    RETURN 8; -- Padrao 8 horas
  END IF;

  -- Verificar dia da semana
  v_weekday := LOWER(to_char(p_date, 'FMDay'))::weekday;

  SELECT COALESCE(sw.expected_hours, ws.daily_hours)
  INTO v_hours
  FROM work_schedules ws
  LEFT JOIN schedule_weekdays sw ON sw.schedule_id = ws.id AND sw.weekday = v_weekday
  WHERE ws.id = v_schedule_id;

  RETURN COALESCE(v_hours, 8);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_weekdays ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotation_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- work_schedules policies
CREATE POLICY "Users can view company schedules"
  ON work_schedules FOR SELECT
  USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage schedules"
  ON work_schedules FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- schedule_weekdays policies
CREATE POLICY "Users can view schedule weekdays"
  ON schedule_weekdays FOR SELECT
  USING (
    schedule_id IN (
      SELECT id FROM work_schedules
      WHERE company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage schedule weekdays"
  ON schedule_weekdays FOR ALL
  USING (
    schedule_id IN (
      SELECT id FROM work_schedules
      WHERE company_id = (
        SELECT company_id FROM profiles
        WHERE id = auth.uid() AND role IN ('admin', 'hr')
      )
    )
  );

-- rotation_schedules policies
CREATE POLICY "Users can view rotation schedules"
  ON rotation_schedules FOR SELECT
  USING (
    schedule_id IN (
      SELECT id FROM work_schedules
      WHERE company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage rotation schedules"
  ON rotation_schedules FOR ALL
  USING (
    schedule_id IN (
      SELECT id FROM work_schedules
      WHERE company_id = (
        SELECT company_id FROM profiles
        WHERE id = auth.uid() AND role IN ('admin', 'hr')
      )
    )
  );

-- employee_schedules policies
CREATE POLICY "Users can view own schedule"
  ON employee_schedules FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage employee schedules"
  ON employee_schedules FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- holidays policies
CREATE POLICY "Users can view holidays"
  ON holidays FOR SELECT
  USING (
    company_id IS NULL
    OR company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage company holidays"
  ON holidays FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- =====================================================
-- DADOS INICIAIS - Feriados nacionais
-- =====================================================

INSERT INTO holidays (name, date, is_national, is_recurring) VALUES
  ('Confraternizacao Universal', '2024-01-01', true, true),
  ('Carnaval', '2024-02-12', true, false), -- Data variavel
  ('Carnaval', '2024-02-13', true, false),
  ('Sexta-feira Santa', '2024-03-29', true, false), -- Data variavel
  ('Tiradentes', '2024-04-21', true, true),
  ('Dia do Trabalho', '2024-05-01', true, true),
  ('Corpus Christi', '2024-05-30', true, false), -- Data variavel
  ('Independencia do Brasil', '2024-09-07', true, true),
  ('Nossa Senhora Aparecida', '2024-10-12', true, true),
  ('Finados', '2024-11-02', true, true),
  ('Proclamacao da Republica', '2024-11-15', true, true),
  ('Natal', '2024-12-25', true, true);

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE work_schedules IS 'Modelos de jornada de trabalho da empresa';
COMMENT ON TABLE schedule_weekdays IS 'Configuracao de horarios por dia da semana';
COMMENT ON TABLE rotation_schedules IS 'Escalas de revezamento (turnos)';
COMMENT ON TABLE employee_schedules IS 'Vinculo entre funcionario e sua jornada';
COMMENT ON TABLE holidays IS 'Feriados nacionais, estaduais, municipais e da empresa';
COMMENT ON COLUMN work_schedules.flexibility_config IS 'Configuracoes para jornada flexivel';
COMMENT ON COLUMN work_schedules.time_bank_config IS 'Regras do banco de horas';
COMMENT ON COLUMN rotation_schedules.cycle_pattern IS 'Array de booleans representando dias de trabalho (true) e folga (false)';



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



-- =====================================================
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



-- =====================================================
-- FILE: 009_evaluations.sql
-- =====================================================

-- =====================================================
-- Migration 009: Evaluations (Avaliacoes 360)
-- Sistema SaaS de RH Multi-tenant
-- =====================================================

-- ENUM para tipo de avaliacao
CREATE TYPE evaluation_type AS ENUM (
  'self',         -- Auto-avaliacao
  'manager',      -- Avaliacao do gestor
  'peer',         -- Avaliacao de pares
  'subordinate',  -- Avaliacao de subordinados
  'client',       -- Avaliacao de clientes internos/externos
  'committee'     -- Avaliacao de comite
);

-- ENUM para status do ciclo de avaliacao
CREATE TYPE evaluation_cycle_status AS ENUM (
  'draft',        -- Rascunho
  'scheduled',    -- Agendado
  'in_progress',  -- Em andamento
  'review',       -- Em revisao
  'calibration',  -- Calibracao
  'completed',    -- Concluido
  'cancelled'     -- Cancelado
);

-- ENUM para status da avaliacao individual
CREATE TYPE evaluation_status AS ENUM (
  'pending',      -- Pendente
  'in_progress',  -- Em andamento
  'submitted',    -- Enviada
  'reviewed',     -- Revisada
  'acknowledged', -- Conhecida pelo avaliado
  'expired'       -- Expirada
);

-- ENUM para tipo de escala
CREATE TYPE scale_type AS ENUM (
  'numeric',      -- 1-5, 1-10
  'descriptive',  -- Exceeds, Meets, Below
  'percentage',   -- 0-100%
  'custom'        -- Escala customizada
);

-- =====================================================
-- Tabela de modelos de avaliacao
-- =====================================================

CREATE TABLE evaluation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Identificacao
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER DEFAULT 1,

  -- Tipo de avaliacao
  evaluation_types evaluation_type[] DEFAULT '{self,manager}'::evaluation_type[],

  -- Escala
  scale_type scale_type DEFAULT 'numeric' NOT NULL,
  scale_config JSONB DEFAULT '{}'::jsonb,
  -- Estrutura para numeric:
  -- {
  --   "min": 1,
  --   "max": 5,
  --   "labels": {
  --     "1": "Nao atende",
  --     "2": "Atende parcialmente",
  --     "3": "Atende",
  --     "4": "Supera",
  --     "5": "Excepcional"
  --   }
  -- }

  -- Competencias/Criterios
  criteria JSONB DEFAULT '[]'::jsonb,
  -- Estrutura:
  -- [
  --   {
  --     "id": "uuid",
  --     "category": "Competencias Tecnicas",
  --     "name": "Conhecimento Tecnico",
  --     "description": "Dominio das habilidades tecnicas necessarias",
  --     "weight": 1.0,
  --     "required": true,
  --     "applies_to": ["self", "manager", "peer"]
  --   }
  -- ]

  -- Perguntas abertas
  open_questions JSONB DEFAULT '[]'::jsonb,
  -- [
  --   {
  --     "id": "uuid",
  --     "question": "Quais sao os pontos fortes?",
  --     "required": true,
  --     "applies_to": ["manager", "peer"]
  --   }
  -- ]

  -- Metas/OKRs (opcional)
  include_goals BOOLEAN DEFAULT false,
  goals_weight NUMERIC(3,2) DEFAULT 0.5, -- Peso das metas na nota final

  -- Configuracoes
  allow_comments BOOLEAN DEFAULT true,
  anonymous_peer_review BOOLEAN DEFAULT false,
  require_evidence BOOLEAN DEFAULT false,
  min_evaluators_per_type JSONB DEFAULT '{}'::jsonb,
  -- { "peer": 2, "subordinate": 1 }

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- Tabela de ciclos de avaliacao
-- =====================================================

CREATE TABLE evaluation_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Identificacao
  name TEXT NOT NULL,
  description TEXT,
  reference_period TEXT, -- "2024-Q1", "2024-H1", "2024"

  -- Template
  template_id UUID NOT NULL REFERENCES evaluation_templates(id),

  -- Periodo do ciclo
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Fases do ciclo
  phases JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "self_evaluation": { "start": "2024-01-15", "end": "2024-01-31" },
  --   "manager_evaluation": { "start": "2024-02-01", "end": "2024-02-15" },
  --   "peer_evaluation": { "start": "2024-02-01", "end": "2024-02-15" },
  --   "calibration": { "start": "2024-02-16", "end": "2024-02-20" },
  --   "feedback": { "start": "2024-02-21", "end": "2024-02-28" }
  -- }

  -- Participantes
  target_departments TEXT[], -- Departamentos participantes (NULL = todos)
  target_positions TEXT[], -- Cargos participantes (NULL = todos)
  exclude_employees UUID[], -- Funcionarios excluidos

  -- Configuracoes
  allow_late_submission BOOLEAN DEFAULT false,
  late_submission_days INTEGER DEFAULT 0,
  require_goal_setting BOOLEAN DEFAULT false,

  -- Status
  status evaluation_cycle_status DEFAULT 'draft' NOT NULL,

  -- Metricas
  total_participants INTEGER DEFAULT 0,
  completed_evaluations INTEGER DEFAULT 0,
  completion_rate NUMERIC(5,2) DEFAULT 0,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- Tabela de participantes do ciclo
-- =====================================================

CREATE TABLE evaluation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ciclo
  cycle_id UUID NOT NULL REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Avaliado
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Avaliadores definidos
  evaluators JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "manager": "uuid",
  --   "peers": ["uuid1", "uuid2"],
  --   "subordinates": ["uuid3"],
  --   "clients": []
  -- }

  -- Status
  self_evaluation_completed BOOLEAN DEFAULT false,
  manager_evaluation_completed BOOLEAN DEFAULT false,
  peer_evaluations_completed INTEGER DEFAULT 0,
  feedback_delivered BOOLEAN DEFAULT false,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,

  -- Resultado final
  final_score NUMERIC(4,2),
  final_rating TEXT, -- "Exceeds", "Meets", etc
  calibrated_score NUMERIC(4,2), -- Score apos calibracao
  calibration_notes TEXT,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Constraint
  CONSTRAINT unique_cycle_employee UNIQUE (cycle_id, employee_id)
);

-- =====================================================
-- Tabela de avaliacoes individuais
-- =====================================================

CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ciclo e participante
  cycle_id UUID NOT NULL REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES evaluation_participants(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Avaliador e avaliado
  evaluator_id UUID NOT NULL REFERENCES employees(id), -- Quem avalia
  evaluated_id UUID NOT NULL REFERENCES employees(id), -- Quem eh avaliado

  -- Tipo
  type evaluation_type NOT NULL,

  -- Respostas por criterio
  scores JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "criteria_id_1": {
  --     "score": 4,
  --     "comment": "Demonstra bom conhecimento...",
  --     "evidence": "Exemplo: projeto X"
  --   },
  --   "criteria_id_2": {
  --     "score": 3,
  --     "comment": "..."
  --   }
  -- }

  -- Respostas abertas
  open_answers JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "question_id_1": "Resposta...",
  --   "question_id_2": "Resposta..."
  -- }

  -- Avaliacao de metas (se aplicavel)
  goals_scores JSONB DEFAULT '[]'::jsonb,
  -- [
  --   { "goal_id": "uuid", "achievement": 85, "comment": "..." }
  -- ]

  -- Pontuacoes calculadas
  competency_score NUMERIC(4,2), -- Media das competencias
  goals_score NUMERIC(4,2), -- Media das metas
  overall_score NUMERIC(4,2), -- Score geral ponderado

  -- Status
  status evaluation_status DEFAULT 'pending' NOT NULL,
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,

  -- Feedback
  general_feedback TEXT,
  strengths TEXT,
  development_areas TEXT,
  recommendations TEXT,

  -- Para anonimato (peer review)
  is_anonymous BOOLEAN DEFAULT false,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Constraints
  CONSTRAINT unique_evaluation UNIQUE (cycle_id, evaluator_id, evaluated_id, type),
  CONSTRAINT valid_self_evaluation CHECK (
    type != 'self' OR evaluator_id = evaluated_id
  )
);

-- =====================================================
-- Tabela de metas/objetivos
-- =====================================================

CREATE TABLE employee_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Funcionario
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Ciclo (opcional - pode ser meta independente)
  cycle_id UUID REFERENCES evaluation_cycles(id),

  -- Meta
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- business, development, team

  -- Metricas
  metric_type VARCHAR(20) DEFAULT 'percentage', -- percentage, numeric, boolean
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT, -- %, R$, unidades, etc

  -- Peso
  weight NUMERIC(3,2) DEFAULT 1.0,

  -- Prazo
  start_date DATE,
  due_date DATE NOT NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'in_progress',
  -- in_progress, achieved, partially_achieved, not_achieved, cancelled
  achievement_percentage NUMERIC(5,2) DEFAULT 0,

  -- Acompanhamento
  check_ins JSONB DEFAULT '[]'::jsonb,
  -- [
  --   { "date": "2024-02-15", "progress": 30, "notes": "..." }
  -- ]

  -- Vinculo com gestor
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- Tabela de calibracao
-- =====================================================

CREATE TABLE calibration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ciclo
  cycle_id UUID NOT NULL REFERENCES evaluation_cycles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Identificacao
  name TEXT NOT NULL,
  department TEXT, -- Departamento sendo calibrado

  -- Periodo
  scheduled_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,

  -- Participantes da calibracao
  calibrators UUID[] NOT NULL, -- Gestores participantes

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed

  -- Notas da sessao
  notes TEXT,
  decisions JSONB DEFAULT '[]'::jsonb,
  -- [
  --   {
  --     "employee_id": "uuid",
  --     "original_score": 3.8,
  --     "calibrated_score": 4.0,
  --     "justification": "..."
  --   }
  -- ]

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- INDICES
-- =====================================================

-- evaluation_templates
CREATE INDEX idx_eval_templates_company ON evaluation_templates (company_id);
CREATE INDEX idx_eval_templates_active ON evaluation_templates (company_id, is_active)
  WHERE is_active = true;

-- evaluation_cycles
CREATE INDEX idx_eval_cycles_company ON evaluation_cycles (company_id);
CREATE INDEX idx_eval_cycles_status ON evaluation_cycles (status);
CREATE INDEX idx_eval_cycles_dates ON evaluation_cycles (start_date, end_date);
CREATE INDEX idx_eval_cycles_template ON evaluation_cycles (template_id);

-- evaluation_participants
CREATE INDEX idx_eval_participants_cycle ON evaluation_participants (cycle_id);
CREATE INDEX idx_eval_participants_employee ON evaluation_participants (employee_id);
CREATE INDEX idx_eval_participants_company ON evaluation_participants (company_id);

-- evaluations
CREATE INDEX idx_evaluations_cycle ON evaluations (cycle_id);
CREATE INDEX idx_evaluations_participant ON evaluations (participant_id);
CREATE INDEX idx_evaluations_evaluator ON evaluations (evaluator_id);
CREATE INDEX idx_evaluations_evaluated ON evaluations (evaluated_id);
CREATE INDEX idx_evaluations_type ON evaluations (type);
CREATE INDEX idx_evaluations_status ON evaluations (status);
CREATE INDEX idx_evaluations_pending ON evaluations (evaluator_id, status)
  WHERE status IN ('pending', 'in_progress');

-- employee_goals
CREATE INDEX idx_goals_company ON employee_goals (company_id);
CREATE INDEX idx_goals_employee ON employee_goals (employee_id);
CREATE INDEX idx_goals_cycle ON employee_goals (cycle_id);
CREATE INDEX idx_goals_status ON employee_goals (status);
CREATE INDEX idx_goals_due_date ON employee_goals (due_date);

-- calibration_sessions
CREATE INDEX idx_calibration_cycle ON calibration_sessions (cycle_id);
CREATE INDEX idx_calibration_status ON calibration_sessions (status);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER trigger_eval_templates_updated_at
  BEFORE UPDATE ON evaluation_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_eval_cycles_updated_at
  BEFORE UPDATE ON evaluation_cycles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_eval_participants_updated_at
  BEFORE UPDATE ON evaluation_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_evaluations_updated_at
  BEFORE UPDATE ON evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_goals_updated_at
  BEFORE UPDATE ON employee_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_calibration_updated_at
  BEFORE UPDATE ON calibration_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Funcao para calcular score da avaliacao
CREATE OR REPLACE FUNCTION calculate_evaluation_score()
RETURNS TRIGGER AS $$
DECLARE
  v_total_score NUMERIC := 0;
  v_total_weight NUMERIC := 0;
  v_criteria JSONB;
  v_template_id UUID;
BEGIN
  -- Pegar template do ciclo
  SELECT template_id INTO v_template_id
  FROM evaluation_cycles WHERE id = NEW.cycle_id;

  -- Pegar criterios do template
  SELECT criteria INTO v_criteria
  FROM evaluation_templates WHERE id = v_template_id;

  -- Calcular media ponderada
  SELECT
    SUM((NEW.scores->>c->>'id')::NUMERIC * COALESCE((c->>'weight')::NUMERIC, 1.0)),
    SUM(COALESCE((c->>'weight')::NUMERIC, 1.0))
  INTO v_total_score, v_total_weight
  FROM jsonb_array_elements(v_criteria) c
  WHERE NEW.scores ? (c->>'id');

  IF v_total_weight > 0 THEN
    NEW.competency_score := ROUND(v_total_score / v_total_weight, 2);
  END IF;

  -- Calcular score geral (simplificado - sem metas por enquanto)
  NEW.overall_score := NEW.competency_score;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_eval_score
  BEFORE INSERT OR UPDATE ON evaluations
  FOR EACH ROW
  WHEN (NEW.scores IS NOT NULL AND NEW.scores != '{}'::jsonb)
  EXECUTE FUNCTION calculate_evaluation_score();

-- Funcao para atualizar status do participante
CREATE OR REPLACE FUNCTION update_participant_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar flags baseado no tipo de avaliacao
  IF NEW.status = 'submitted' THEN
    IF NEW.type = 'self' THEN
      UPDATE evaluation_participants
      SET self_evaluation_completed = true
      WHERE id = NEW.participant_id;
    ELSIF NEW.type = 'manager' THEN
      UPDATE evaluation_participants
      SET manager_evaluation_completed = true
      WHERE id = NEW.participant_id;
    ELSIF NEW.type = 'peer' THEN
      UPDATE evaluation_participants
      SET peer_evaluations_completed = peer_evaluations_completed + 1
      WHERE id = NEW.participant_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_participant_status
  AFTER UPDATE ON evaluations
  FOR EACH ROW
  WHEN (NEW.status = 'submitted' AND OLD.status != 'submitted')
  EXECUTE FUNCTION update_participant_status();

-- Funcao para atualizar metricas do ciclo
CREATE OR REPLACE FUNCTION update_cycle_metrics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE evaluation_cycles
  SET
    total_participants = (
      SELECT COUNT(*) FROM evaluation_participants WHERE cycle_id = NEW.cycle_id
    ),
    completed_evaluations = (
      SELECT COUNT(*) FROM evaluations
      WHERE cycle_id = NEW.cycle_id AND status = 'submitted'
    )
  WHERE id = NEW.cycle_id;

  -- Recalcular completion_rate
  UPDATE evaluation_cycles
  SET completion_rate = CASE
    WHEN total_participants > 0
    THEN ROUND((completed_evaluations::NUMERIC / total_participants) * 100, 2)
    ELSE 0
  END
  WHERE id = NEW.cycle_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cycle_metrics
  AFTER INSERT OR UPDATE ON evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_cycle_metrics();

-- =====================================================
-- FUNCOES AUXILIARES
-- =====================================================

-- Funcao para criar avaliacoes de um ciclo
CREATE OR REPLACE FUNCTION create_cycle_evaluations(
  p_cycle_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_participant RECORD;
  v_template RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Pegar configuracao do template
  SELECT et.*
  INTO v_template
  FROM evaluation_cycles ec
  JOIN evaluation_templates et ON et.id = ec.template_id
  WHERE ec.id = p_cycle_id;

  -- Para cada participante
  FOR v_participant IN
    SELECT * FROM evaluation_participants WHERE cycle_id = p_cycle_id
  LOOP
    -- Criar auto-avaliacao se configurado
    IF 'self' = ANY(v_template.evaluation_types) THEN
      INSERT INTO evaluations (
        cycle_id, participant_id, company_id,
        evaluator_id, evaluated_id, type
      )
      VALUES (
        p_cycle_id, v_participant.id, v_participant.company_id,
        v_participant.employee_id, v_participant.employee_id, 'self'
      )
      ON CONFLICT DO NOTHING;
      v_count := v_count + 1;
    END IF;

    -- Criar avaliacao do gestor se configurado
    IF 'manager' = ANY(v_template.evaluation_types) THEN
      INSERT INTO evaluations (
        cycle_id, participant_id, company_id,
        evaluator_id, evaluated_id, type
      )
      SELECT
        p_cycle_id, v_participant.id, v_participant.company_id,
        (v_participant.evaluators->>'manager')::UUID, v_participant.employee_id, 'manager'
      WHERE v_participant.evaluators->>'manager' IS NOT NULL
      ON CONFLICT DO NOTHING;
      v_count := v_count + 1;
    END IF;

    -- Criar avaliacoes de pares se configurado
    IF 'peer' = ANY(v_template.evaluation_types) THEN
      INSERT INTO evaluations (
        cycle_id, participant_id, company_id,
        evaluator_id, evaluated_id, type, is_anonymous
      )
      SELECT
        p_cycle_id, v_participant.id, v_participant.company_id,
        peer_id::UUID, v_participant.employee_id, 'peer',
        v_template.anonymous_peer_review
      FROM jsonb_array_elements_text(v_participant.evaluators->'peers') AS peer_id
      ON CONFLICT DO NOTHING;
      v_count := v_count + (SELECT jsonb_array_length(v_participant.evaluators->'peers'));
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Funcao para obter avaliacoes pendentes
CREATE OR REPLACE FUNCTION get_pending_evaluations(
  p_evaluator_id UUID
)
RETURNS TABLE (
  evaluation_id UUID,
  cycle_name TEXT,
  evaluated_name TEXT,
  evaluation_type evaluation_type,
  due_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ev.id,
    ec.name,
    e.name,
    ev.type,
    ec.end_date
  FROM evaluations ev
  JOIN evaluation_cycles ec ON ec.id = ev.cycle_id
  JOIN employees e ON e.id = ev.evaluated_id
  WHERE ev.evaluator_id = p_evaluator_id
  AND ev.status IN ('pending', 'in_progress')
  AND ec.status = 'in_progress'
  ORDER BY ec.end_date;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

ALTER TABLE evaluation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_sessions ENABLE ROW LEVEL SECURITY;

-- evaluation_templates policies
CREATE POLICY "Users can view company templates"
  ON evaluation_templates FOR SELECT
  USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    AND is_published = true
  );

CREATE POLICY "Admins can manage templates"
  ON evaluation_templates FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- evaluation_cycles policies
CREATE POLICY "Users can view company cycles"
  ON evaluation_cycles FOR SELECT
  USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage cycles"
  ON evaluation_cycles FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- evaluation_participants policies
CREATE POLICY "Users can view own participation"
  ON evaluation_participants FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage participants"
  ON evaluation_participants FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- evaluations policies
CREATE POLICY "Users can view own evaluations"
  ON evaluations FOR SELECT
  USING (
    evaluated_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    AND status IN ('submitted', 'reviewed', 'acknowledged')
    AND NOT is_anonymous
  );

CREATE POLICY "Users can manage evaluations they perform"
  ON evaluations FOR ALL
  USING (
    evaluator_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can view all evaluations"
  ON evaluations FOR SELECT
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- employee_goals policies
CREATE POLICY "Users can view own goals"
  ON employee_goals FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can manage own goals"
  ON employee_goals FOR ALL
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Managers can view team goals"
  ON employee_goals FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE manager_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage all goals"
  ON employee_goals FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- calibration_sessions policies
CREATE POLICY "Calibrators can view their sessions"
  ON calibration_sessions FOR SELECT
  USING (
    (SELECT employee_id FROM profiles WHERE id = auth.uid()) = ANY(calibrators)
  );

CREATE POLICY "Admins can manage calibration"
  ON calibration_sessions FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- =====================================================
-- VIEWS
-- =====================================================

-- View de avaliacoes pendentes
CREATE VIEW v_pending_evaluations AS
SELECT
  ev.id AS evaluation_id,
  ev.evaluator_id,
  evaluator.name AS evaluator_name,
  ev.evaluated_id,
  evaluated.name AS evaluated_name,
  ev.type,
  ec.id AS cycle_id,
  ec.name AS cycle_name,
  ec.end_date AS due_date,
  (ec.end_date - CURRENT_DATE) AS days_remaining
FROM evaluations ev
JOIN evaluation_cycles ec ON ec.id = ev.cycle_id
JOIN employees evaluator ON evaluator.id = ev.evaluator_id
JOIN employees evaluated ON evaluated.id = ev.evaluated_id
WHERE ev.status IN ('pending', 'in_progress')
AND ec.status = 'in_progress';

-- View de resultados consolidados
CREATE VIEW v_evaluation_results AS
SELECT
  ep.company_id,
  ec.id AS cycle_id,
  ec.name AS cycle_name,
  ep.employee_id,
  e.name AS employee_name,
  e.department,
  e."position",
  ep.final_score,
  ep.calibrated_score,
  ep.final_rating,
  (SELECT overall_score FROM evaluations WHERE participant_id = ep.id AND type = 'self') AS self_score,
  (SELECT overall_score FROM evaluations WHERE participant_id = ep.id AND type = 'manager') AS manager_score,
  (SELECT AVG(overall_score) FROM evaluations WHERE participant_id = ep.id AND type = 'peer') AS peer_avg_score
FROM evaluation_participants ep
JOIN evaluation_cycles ec ON ec.id = ep.cycle_id
JOIN employees e ON e.id = ep.employee_id;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE evaluation_templates IS 'Modelos de avaliacao configurados pela empresa';
COMMENT ON TABLE evaluation_cycles IS 'Ciclos de avaliacao de desempenho';
COMMENT ON TABLE evaluation_participants IS 'Funcionarios participantes de cada ciclo';
COMMENT ON TABLE evaluations IS 'Avaliacoes individuais realizadas';
COMMENT ON TABLE employee_goals IS 'Metas e objetivos dos funcionarios';
COMMENT ON TABLE calibration_sessions IS 'Sessoes de calibracao de notas';
COMMENT ON COLUMN evaluations.is_anonymous IS 'Avaliacao anonima (peer review)';
COMMENT ON COLUMN evaluation_participants.calibrated_score IS 'Score apos sessao de calibracao';



-- =====================================================
-- FILE: 010_pdi.sql
-- =====================================================

-- =====================================================
-- Migration 010: PDI (Plano de Desenvolvimento Individual)
-- Sistema SaaS de RH Multi-tenant
-- =====================================================

-- ENUM para status do PDI
CREATE TYPE pdi_status AS ENUM (
  'draft',        -- Rascunho
  'pending',      -- Aguardando aprovacao
  'approved',     -- Aprovado
  'in_progress',  -- Em andamento
  'on_hold',      -- Pausado
  'completed',    -- Concluido
  'cancelled'     -- Cancelado
);

-- ENUM para tipo de atividade de desenvolvimento
CREATE TYPE development_activity_type AS ENUM (
  'training',         -- Treinamento formal
  'course',           -- Curso
  'certification',    -- Certificacao
  'mentoring',        -- Mentoria
  'coaching',         -- Coaching
  'job_rotation',     -- Rotacao de funcao
  'project',          -- Projeto especial
  'shadowing',        -- Acompanhamento
  'reading',          -- Leitura/Estudo
  'conference',       -- Conferencia/Evento
  'workshop',         -- Workshop
  'on_the_job',       -- Aprendizado no trabalho
  'other'             -- Outros
);

-- ENUM para prioridade
CREATE TYPE priority_level AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- ENUM para status de atividade
CREATE TYPE activity_status AS ENUM (
  'not_started',
  'in_progress',
  'completed',
  'cancelled',
  'blocked'
);

-- =====================================================
-- Tabela de competencias da empresa
-- =====================================================

CREATE TABLE company_competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Identificacao
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- tecnica, comportamental, lideranca, etc

  -- Niveis de proficiencia
  proficiency_levels JSONB DEFAULT '[]'::jsonb,
  -- [
  --   { "level": 1, "name": "Basico", "description": "..." },
  --   { "level": 2, "name": "Intermediario", "description": "..." },
  --   { "level": 3, "name": "Avancado", "description": "..." },
  --   { "level": 4, "name": "Especialista", "description": "..." }
  -- ]

  -- Vinculo com cargos (opcional)
  required_for_positions TEXT[],

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- Tabela de PDIs
-- =====================================================

CREATE TABLE pdis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Funcionario
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Identificacao
  title TEXT NOT NULL,
  description TEXT,

  -- Periodo
  start_date DATE NOT NULL,
  target_date DATE NOT NULL,
  completed_date DATE,

  -- Objetivos (JSONB para flexibilidade)
  objectives JSONB DEFAULT '[]'::jsonb,
  -- [
  --   {
  --     "id": "uuid",
  --     "description": "Desenvolver habilidades de lideranca",
  --     "competency_id": "uuid", -- Link com company_competencies
  --     "current_level": 2,
  --     "target_level": 3,
  --     "measurement_criteria": "Feedback 360 e avaliacao do gestor",
  --     "status": "in_progress",
  --     "progress": 60
  --   }
  -- ]

  -- Vinculo com avaliacao
  evaluation_cycle_id UUID REFERENCES evaluation_cycles(id),
  based_on_evaluation BOOLEAN DEFAULT false,

  -- Gaps identificados
  development_gaps JSONB DEFAULT '[]'::jsonb,
  -- [
  --   {
  --     "competency": "Comunicacao",
  --     "current_state": "Dificuldade em apresentacoes",
  --     "desired_state": "Apresentar com confianca",
  --     "priority": "high"
  --   }
  -- ]

  -- Status
  status pdi_status DEFAULT 'draft' NOT NULL,
  overall_progress NUMERIC(5,2) DEFAULT 0, -- 0-100%

  -- Aprovacao
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,

  -- Gestor responsavel
  mentor_id UUID REFERENCES employees(id),

  -- Sugestoes de IA
  ai_suggestions JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "generated_at": "2024-01-15T10:00:00Z",
  --   "activities": [
  --     { "type": "course", "title": "Lideranca Situacional", "reason": "..." }
  --   ],
  --   "resources": [
  --     { "type": "book", "title": "...", "author": "..." }
  --   ],
  --   "timeline_suggestion": "6 meses",
  --   "focus_areas": ["comunicacao", "lideranca"]
  -- }

  -- Orcamento
  budget_allocated NUMERIC(12,2) DEFAULT 0,
  budget_used NUMERIC(12,2) DEFAULT 0,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id),

  -- Constraints
  CONSTRAINT valid_pdi_dates CHECK (target_date >= start_date)
);

-- =====================================================
-- Tabela de atividades do PDI
-- =====================================================

CREATE TABLE pdi_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- PDI
  pdi_id UUID NOT NULL REFERENCES pdis(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Atividade
  title TEXT NOT NULL,
  description TEXT,
  type development_activity_type NOT NULL,

  -- Vinculo com objetivo
  objective_id TEXT, -- ID do objetivo em pdis.objectives

  -- Periodo
  start_date DATE,
  due_date DATE NOT NULL,
  completed_date DATE,

  -- Detalhes
  provider TEXT, -- Instituicao/Fornecedor
  location TEXT, -- Local ou "Online"
  duration_hours NUMERIC(6,2), -- Carga horaria
  url TEXT, -- Link do curso/recurso

  -- Custo
  estimated_cost NUMERIC(10,2) DEFAULT 0,
  actual_cost NUMERIC(10,2) DEFAULT 0,

  -- Status
  status activity_status DEFAULT 'not_started' NOT NULL,
  progress_percentage NUMERIC(5,2) DEFAULT 0,
  priority priority_level DEFAULT 'medium',

  -- Resultado
  result TEXT,
  certificate_url TEXT,
  evidence_urls TEXT[],

  -- Avaliacao
  effectiveness_rating INTEGER, -- 1-5
  effectiveness_notes TEXT,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id),

  -- Constraints
  CONSTRAINT valid_activity_dates CHECK (
    due_date >= COALESCE(start_date, due_date)
  ),
  CONSTRAINT valid_effectiveness CHECK (
    effectiveness_rating IS NULL OR effectiveness_rating BETWEEN 1 AND 5
  )
);

-- =====================================================
-- Tabela de check-ins do PDI
-- =====================================================

CREATE TABLE pdi_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- PDI
  pdi_id UUID NOT NULL REFERENCES pdis(id) ON DELETE CASCADE,

  -- Data do check-in
  check_in_date DATE NOT NULL,

  -- Progresso geral
  overall_progress NUMERIC(5,2) NOT NULL, -- 0-100%

  -- Progresso por objetivo
  objectives_progress JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "objective_id_1": 75,
  --   "objective_id_2": 50
  -- }

  -- Atividades atualizadas
  activities_completed TEXT[], -- IDs de atividades concluidas desde ultimo check-in

  -- Feedback
  employee_notes TEXT, -- Notas do funcionario
  mentor_notes TEXT, -- Notas do mentor/gestor
  achievements TEXT, -- Conquistas do periodo
  challenges TEXT, -- Desafios enfrentados
  next_steps TEXT, -- Proximos passos

  -- Ajustes
  adjustments_made TEXT, -- Ajustes no plano
  new_activities_added UUID[], -- Novas atividades

  -- Participantes
  conducted_by UUID REFERENCES profiles(id),
  attendees UUID[], -- Participantes da reuniao

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- Tabela de recursos de desenvolvimento
-- =====================================================

CREATE TABLE development_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Identificacao
  title TEXT NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- book, course, video, article, tool, etc

  -- Detalhes
  author TEXT,
  provider TEXT, -- Coursera, Udemy, interno, etc
  url TEXT,
  duration_hours NUMERIC(6,2),
  level VARCHAR(20), -- beginner, intermediate, advanced

  -- Custo
  is_free BOOLEAN DEFAULT true,
  cost NUMERIC(10,2),

  -- Competencias relacionadas
  competency_ids UUID[], -- Links com company_competencies

  -- Avaliacao
  average_rating NUMERIC(3,2),
  total_ratings INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- Tabela de avaliacoes de recursos
-- =====================================================

CREATE TABLE resource_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  resource_id UUID NOT NULL REFERENCES development_resources(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  would_recommend BOOLEAN,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  CONSTRAINT unique_resource_rating UNIQUE (resource_id, employee_id)
);

-- =====================================================
-- INDICES
-- =====================================================

-- company_competencies
CREATE INDEX idx_competencies_company ON company_competencies (company_id);
CREATE INDEX idx_competencies_active ON company_competencies (company_id, is_active)
  WHERE is_active = true;
CREATE INDEX idx_competencies_category ON company_competencies (category);

-- pdis
CREATE INDEX idx_pdis_company ON pdis (company_id);
CREATE INDEX idx_pdis_employee ON pdis (employee_id);
CREATE INDEX idx_pdis_status ON pdis (status);
CREATE INDEX idx_pdis_dates ON pdis (start_date, target_date);
CREATE INDEX idx_pdis_mentor ON pdis (mentor_id);
CREATE INDEX idx_pdis_evaluation ON pdis (evaluation_cycle_id);
CREATE INDEX idx_pdis_employee_status ON pdis (employee_id, status);

-- pdi_activities
CREATE INDEX idx_pdi_activities_pdi ON pdi_activities (pdi_id);
CREATE INDEX idx_pdi_activities_company ON pdi_activities (company_id);
CREATE INDEX idx_pdi_activities_type ON pdi_activities (type);
CREATE INDEX idx_pdi_activities_status ON pdi_activities (status);
CREATE INDEX idx_pdi_activities_due ON pdi_activities (due_date);
CREATE INDEX idx_pdi_activities_pending ON pdi_activities (pdi_id, status)
  WHERE status NOT IN ('completed', 'cancelled');

-- pdi_check_ins
CREATE INDEX idx_pdi_check_ins_pdi ON pdi_check_ins (pdi_id);
CREATE INDEX idx_pdi_check_ins_date ON pdi_check_ins (check_in_date);

-- development_resources
CREATE INDEX idx_dev_resources_company ON development_resources (company_id);
CREATE INDEX idx_dev_resources_type ON development_resources (type);
CREATE INDEX idx_dev_resources_active ON development_resources (company_id, is_active)
  WHERE is_active = true;
CREATE INDEX idx_dev_resources_featured ON development_resources (company_id, is_featured)
  WHERE is_featured = true;

-- resource_ratings
CREATE INDEX idx_resource_ratings_resource ON resource_ratings (resource_id);
CREATE INDEX idx_resource_ratings_employee ON resource_ratings (employee_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER trigger_competencies_updated_at
  BEFORE UPDATE ON company_competencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_pdis_updated_at
  BEFORE UPDATE ON pdis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_pdi_activities_updated_at
  BEFORE UPDATE ON pdi_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_dev_resources_updated_at
  BEFORE UPDATE ON development_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Funcao para atualizar progresso do PDI
CREATE OR REPLACE FUNCTION update_pdi_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_total_activities INTEGER;
  v_completed_activities INTEGER;
  v_progress NUMERIC;
BEGIN
  -- Contar atividades
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
  INTO v_total_activities, v_completed_activities
  FROM pdi_activities
  WHERE pdi_id = COALESCE(NEW.pdi_id, OLD.pdi_id);

  -- Calcular progresso
  IF v_total_activities > 0 THEN
    v_progress := ROUND((v_completed_activities::NUMERIC / v_total_activities) * 100, 2);
  ELSE
    v_progress := 0;
  END IF;

  -- Atualizar PDI
  UPDATE pdis
  SET overall_progress = v_progress
  WHERE id = COALESCE(NEW.pdi_id, OLD.pdi_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pdi_progress
  AFTER INSERT OR UPDATE OR DELETE ON pdi_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_pdi_progress();

-- Funcao para atualizar budget usado
CREATE OR REPLACE FUNCTION update_pdi_budget()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pdis
  SET budget_used = (
    SELECT COALESCE(SUM(actual_cost), 0)
    FROM pdi_activities
    WHERE pdi_id = COALESCE(NEW.pdi_id, OLD.pdi_id)
  )
  WHERE id = COALESCE(NEW.pdi_id, OLD.pdi_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pdi_budget
  AFTER INSERT OR UPDATE OR DELETE ON pdi_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_pdi_budget();

-- Funcao para atualizar rating medio do recurso
CREATE OR REPLACE FUNCTION update_resource_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE development_resources
  SET
    average_rating = (
      SELECT ROUND(AVG(rating)::NUMERIC, 2)
      FROM resource_ratings
      WHERE resource_id = COALESCE(NEW.resource_id, OLD.resource_id)
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM resource_ratings
      WHERE resource_id = COALESCE(NEW.resource_id, OLD.resource_id)
    )
  WHERE id = COALESCE(NEW.resource_id, OLD.resource_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_resource_rating
  AFTER INSERT OR UPDATE OR DELETE ON resource_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_resource_rating();

-- =====================================================
-- FUNCOES AUXILIARES
-- =====================================================

-- Funcao para criar PDI a partir de avaliacao
CREATE OR REPLACE FUNCTION create_pdi_from_evaluation(
  p_employee_id UUID,
  p_cycle_id UUID,
  p_title TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_pdi_id UUID;
  v_company_id UUID;
  v_manager_id UUID;
  v_low_scores JSONB;
  v_gaps JSONB;
BEGIN
  -- Pegar dados do funcionario
  SELECT company_id, manager_id INTO v_company_id, v_manager_id
  FROM employees WHERE id = p_employee_id;

  -- Pegar competencias com nota baixa da avaliacao
  SELECT jsonb_agg(
    jsonb_build_object(
      'competency', key,
      'current_state', 'Score: ' || (value->>'score')::TEXT,
      'desired_state', 'Melhorar para nivel superior',
      'priority', CASE
        WHEN (value->>'score')::NUMERIC < 2 THEN 'critical'
        WHEN (value->>'score')::NUMERIC < 3 THEN 'high'
        ELSE 'medium'
      END
    )
  )
  INTO v_gaps
  FROM (
    SELECT key, value
    FROM evaluations e,
    LATERAL jsonb_each(e.scores)
    WHERE e.evaluated_id = p_employee_id
    AND e.cycle_id = p_cycle_id
    AND e.type = 'manager'
    AND (value->>'score')::NUMERIC < 3
  ) low_scores;

  -- Criar PDI
  INSERT INTO pdis (
    company_id, employee_id, title,
    start_date, target_date,
    evaluation_cycle_id, based_on_evaluation,
    development_gaps, mentor_id,
    status
  )
  VALUES (
    v_company_id, p_employee_id,
    COALESCE(p_title, 'PDI - Ciclo de Avaliacao'),
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '6 months',
    p_cycle_id, true,
    COALESCE(v_gaps, '[]'::jsonb),
    v_manager_id,
    'draft'
  )
  RETURNING id INTO v_pdi_id;

  RETURN v_pdi_id;
END;
$$ LANGUAGE plpgsql;

-- Funcao para listar PDIs com atividades pendentes
CREATE OR REPLACE FUNCTION get_pdis_with_pending_activities(
  p_company_id UUID,
  p_days_ahead INTEGER DEFAULT 30
)
RETURNS TABLE (
  pdi_id UUID,
  employee_id UUID,
  employee_name TEXT,
  pdi_title TEXT,
  pending_activities_count INTEGER,
  next_due_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.employee_id,
    e.name,
    p.title,
    COUNT(a.id)::INTEGER,
    MIN(a.due_date)
  FROM pdis p
  JOIN employees e ON e.id = p.employee_id
  LEFT JOIN pdi_activities a ON a.pdi_id = p.id
    AND a.status NOT IN ('completed', 'cancelled')
    AND a.due_date <= CURRENT_DATE + p_days_ahead
  WHERE p.company_id = p_company_id
  AND p.status = 'in_progress'
  GROUP BY p.id, p.employee_id, e.name, p.title
  HAVING COUNT(a.id) > 0
  ORDER BY MIN(a.due_date);
END;
$$ LANGUAGE plpgsql;

-- Funcao para sugerir recursos com base em gaps
CREATE OR REPLACE FUNCTION suggest_resources_for_pdi(
  p_pdi_id UUID
)
RETURNS TABLE (
  resource_id UUID,
  resource_title TEXT,
  resource_type VARCHAR,
  relevance_score NUMERIC
) AS $$
DECLARE
  v_company_id UUID;
  v_gaps JSONB;
BEGIN
  -- Pegar gaps do PDI
  SELECT company_id, development_gaps
  INTO v_company_id, v_gaps
  FROM pdis WHERE id = p_pdi_id;

  -- Retornar recursos relevantes
  RETURN QUERY
  SELECT
    r.id,
    r.title,
    r.type,
    COALESCE(r.average_rating, 3.0)::NUMERIC AS relevance
  FROM development_resources r
  WHERE r.company_id = v_company_id
  AND r.is_active = true
  ORDER BY
    r.is_featured DESC,
    r.average_rating DESC NULLS LAST,
    r.total_ratings DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

ALTER TABLE company_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdis ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdi_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdi_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE development_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_ratings ENABLE ROW LEVEL SECURITY;

-- company_competencies policies
CREATE POLICY "Users can view company competencies"
  ON company_competencies FOR SELECT
  USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage competencies"
  ON company_competencies FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- pdis policies
CREATE POLICY "Users can view own PDI"
  ON pdis FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can manage own PDI"
  ON pdis FOR ALL
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    AND status IN ('draft', 'pending')
  );

CREATE POLICY "Mentors can view mentee PDIs"
  ON pdis FOR SELECT
  USING (
    mentor_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Managers can view team PDIs"
  ON pdis FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE manager_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage all PDIs"
  ON pdis FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- pdi_activities policies
CREATE POLICY "Users can view own PDI activities"
  ON pdi_activities FOR SELECT
  USING (
    pdi_id IN (
      SELECT id FROM pdis
      WHERE employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can manage own PDI activities"
  ON pdi_activities FOR ALL
  USING (
    pdi_id IN (
      SELECT id FROM pdis
      WHERE employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
    AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage all activities"
  ON pdi_activities FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- pdi_check_ins policies
CREATE POLICY "Users can view own check-ins"
  ON pdi_check_ins FOR SELECT
  USING (
    pdi_id IN (
      SELECT id FROM pdis
      WHERE employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Mentors and managers can manage check-ins"
  ON pdi_check_ins FOR ALL
  USING (
    pdi_id IN (
      SELECT id FROM pdis
      WHERE mentor_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
      OR employee_id IN (
        SELECT id FROM employees
        WHERE manager_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
      )
    )
  );

-- development_resources policies
CREATE POLICY "Users can view company resources"
  ON development_resources FOR SELECT
  USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage resources"
  ON development_resources FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- resource_ratings policies
CREATE POLICY "Users can view ratings"
  ON resource_ratings FOR SELECT
  USING (
    resource_id IN (
      SELECT id FROM development_resources
      WHERE company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can manage own ratings"
  ON resource_ratings FOR ALL
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

-- =====================================================
-- VIEWS
-- =====================================================

-- View de PDIs em andamento
CREATE VIEW v_active_pdis AS
SELECT
  p.id,
  p.company_id,
  p.employee_id,
  e.name AS employee_name,
  e.department,
  p.title,
  p.start_date,
  p.target_date,
  p.overall_progress,
  p.status,
  m.name AS mentor_name,
  (SELECT COUNT(*) FROM pdi_activities WHERE pdi_id = p.id AND status = 'not_started') AS pending_activities,
  (SELECT COUNT(*) FROM pdi_activities WHERE pdi_id = p.id AND status = 'in_progress') AS active_activities,
  (SELECT COUNT(*) FROM pdi_activities WHERE pdi_id = p.id AND status = 'completed') AS completed_activities
FROM pdis p
JOIN employees e ON e.id = p.employee_id
LEFT JOIN employees m ON m.id = p.mentor_id
WHERE p.status IN ('approved', 'in_progress')
AND e.status = 'active';

-- View de atividades proximas
CREATE VIEW v_upcoming_pdi_activities AS
SELECT
  a.id AS activity_id,
  a.pdi_id,
  p.employee_id,
  e.name AS employee_name,
  a.title AS activity_title,
  a.type,
  a.due_date,
  (a.due_date - CURRENT_DATE) AS days_until_due,
  a.status,
  a.priority
FROM pdi_activities a
JOIN pdis p ON p.id = a.pdi_id
JOIN employees e ON e.id = p.employee_id
WHERE a.status NOT IN ('completed', 'cancelled')
AND a.due_date >= CURRENT_DATE
AND p.status = 'in_progress'
ORDER BY a.due_date;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE company_competencies IS 'Competencias definidas pela empresa para avaliacao e desenvolvimento';
COMMENT ON TABLE pdis IS 'Planos de Desenvolvimento Individual dos funcionarios';
COMMENT ON TABLE pdi_activities IS 'Atividades de desenvolvimento do PDI';
COMMENT ON TABLE pdi_check_ins IS 'Registro de acompanhamentos periodicos do PDI';
COMMENT ON TABLE development_resources IS 'Catalogo de recursos de desenvolvimento';
COMMENT ON TABLE resource_ratings IS 'Avaliacoes dos recursos pelos funcionarios';
COMMENT ON COLUMN pdis.ai_suggestions IS 'Sugestoes geradas por IA para o desenvolvimento';
COMMENT ON COLUMN pdis.development_gaps IS 'Gaps de desenvolvimento identificados';



-- =====================================================
-- FILE: 011_payroll.sql
-- =====================================================

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



-- =====================================================
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



-- =====================================================
-- FILE: 014_time_tracking_enhancements.sql
-- =====================================================

-- =====================================================
-- Migration 014: Time Tracking Enhancements
-- Sistema SaaS de RH Multi-tenant
-- =====================================================
-- Adiciona funcoes para dashboard em tempo real e melhorias
-- nas operacoes de ponto eletronico
-- =====================================================

-- =====================================================
-- FUNCAO: get_whos_in
-- Retorna lista de funcionarios no momento (trabalhando/intervalo/remoto)
-- =====================================================

CREATE OR REPLACE FUNCTION get_whos_in(p_company_id UUID)
RETURNS TABLE (
  employee_id UUID,
  employee_name TEXT,
  department TEXT,
  avatar_url TEXT,
  current_status TEXT,
  clock_in TIMESTAMPTZ,
  last_action TIMESTAMPTZ,
  last_action_type clock_type,
  location_address TEXT,
  is_remote BOOLEAN,
  worked_minutes INTEGER,
  schedule_start TIME,
  schedule_end TIME
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_records AS (
    SELECT DISTINCT ON (tr.employee_id)
      tr.employee_id,
      tr.record_type,
      tr.recorded_at,
      tr.location_address,
      tr.source
    FROM time_records tr
    WHERE tr.company_id = p_company_id
    AND DATE(tr.recorded_at AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
    ORDER BY tr.employee_id, tr.recorded_at DESC
  ),
  todays_summary AS (
    SELECT
      ttd.employee_id,
      ttd.clock_in,
      ttd.worked_minutes
    FROM time_tracking_daily ttd
    WHERE ttd.company_id = p_company_id
    AND ttd.date = CURRENT_DATE
  ),
  employee_schedules_today AS (
    SELECT
      es.employee_id,
      sw.start_time,
      sw.end_time
    FROM employee_schedules es
    JOIN work_schedules ws ON ws.id = es.schedule_id
    LEFT JOIN schedule_weekdays sw ON sw.schedule_id = ws.id
      AND sw.weekday = LOWER(to_char(CURRENT_DATE, 'FMDay'))::weekday
    WHERE es.company_id = p_company_id
    AND es.start_date <= CURRENT_DATE
    AND (es.end_date IS NULL OR es.end_date >= CURRENT_DATE)
  )
  SELECT
    e.id AS employee_id,
    e.name AS employee_name,
    e.department,
    p.avatar_url,
    CASE
      WHEN lr.record_type IS NULL THEN 'not_clocked_in'
      WHEN lr.record_type = 'clock_in' THEN 'working'
      WHEN lr.record_type = 'break_start' THEN 'on_break'
      WHEN lr.record_type = 'break_end' THEN 'working'
      WHEN lr.record_type = 'clock_out' THEN 'clocked_out'
      ELSE 'unknown'
    END AS current_status,
    ts.clock_in,
    lr.recorded_at AS last_action,
    lr.record_type AS last_action_type,
    lr.location_address,
    COALESCE(
      lr.source IN ('remote', 'web') AND lr.location_address IS NULL,
      false
    ) AS is_remote,
    COALESCE(ts.worked_minutes, 0) AS worked_minutes,
    est.start_time AS schedule_start,
    est.end_time AS schedule_end
  FROM employees e
  LEFT JOIN profiles p ON p.employee_id = e.id
  LEFT JOIN latest_records lr ON lr.employee_id = e.id
  LEFT JOIN todays_summary ts ON ts.employee_id = e.id
  LEFT JOIN employee_schedules_today est ON est.employee_id = e.id
  WHERE e.company_id = p_company_id
  AND e.status = 'active'
  AND (
    lr.record_type IN ('clock_in', 'break_start', 'break_end')
    OR (lr.record_type IS NULL AND est.start_time IS NOT NULL)
  )
  ORDER BY e.name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_whos_in IS 'Retorna lista de funcionarios ativos no momento para dashboard em tempo real';

-- =====================================================
-- FUNCAO: get_employee_time_summary
-- Retorna resumo detalhado do dia para um funcionario
-- =====================================================

CREATE OR REPLACE FUNCTION get_employee_time_summary(
  p_employee_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  employee_id UUID,
  employee_name TEXT,
  date DATE,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  break_start TIMESTAMPTZ,
  break_end TIMESTAMPTZ,
  worked_minutes INTEGER,
  break_minutes INTEGER,
  overtime_minutes INTEGER,
  missing_minutes INTEGER,
  expected_hours NUMERIC,
  schedule_start TIME,
  schedule_end TIME,
  status time_record_status,
  is_workday BOOLEAN,
  is_holiday BOOLEAN,
  time_bank_balance INTEGER,
  all_records JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH employee_info AS (
    SELECT
      e.id,
      e.name,
      e.company_id
    FROM employees e
    WHERE e.id = p_employee_id
  ),
  daily_tracking AS (
    SELECT
      ttd.*
    FROM time_tracking_daily ttd
    WHERE ttd.employee_id = p_employee_id
    AND ttd.date = p_date
  ),
  schedule_info AS (
    SELECT
      sw.start_time,
      sw.end_time,
      ws.daily_hours
    FROM employee_schedules es
    JOIN work_schedules ws ON ws.id = es.schedule_id
    LEFT JOIN schedule_weekdays sw ON sw.schedule_id = ws.id
      AND sw.weekday = LOWER(to_char(p_date, 'FMDay'))::weekday
    WHERE es.employee_id = p_employee_id
    AND es.start_date <= p_date
    AND (es.end_date IS NULL OR es.end_date >= p_date)
    LIMIT 1
  ),
  time_bank_info AS (
    SELECT
      COALESCE(tb.balance_after, 0) AS balance
    FROM time_bank tb
    WHERE tb.employee_id = p_employee_id
    ORDER BY tb.created_at DESC
    LIMIT 1
  ),
  all_records_json AS (
    SELECT
      jsonb_agg(
        jsonb_build_object(
          'id', tr.id,
          'record_type', tr.record_type,
          'recorded_at', tr.recorded_at,
          'location_address', tr.location_address,
          'is_within_geofence', tr.is_within_geofence,
          'source', tr.source,
          'notes', tr.notes
        ) ORDER BY tr.recorded_at
      ) AS records
    FROM time_records tr
    WHERE tr.employee_id = p_employee_id
    AND DATE(tr.recorded_at) = p_date
  )
  SELECT
    ei.id AS employee_id,
    ei.name AS employee_name,
    p_date AS date,
    dt.clock_in,
    dt.clock_out,
    dt.break_start,
    dt.break_end,
    COALESCE(dt.worked_minutes, 0) AS worked_minutes,
    COALESCE(dt.break_minutes, 0) AS break_minutes,
    COALESCE(dt.overtime_minutes, 0) AS overtime_minutes,
    COALESCE(dt.missing_minutes, 0) AS missing_minutes,
    COALESCE(si.daily_hours, 8) AS expected_hours,
    si.start_time AS schedule_start,
    si.end_time AS schedule_end,
    COALESCE(dt.status, 'pending'::time_record_status) AS status,
    COALESCE(dt.is_workday, true) AS is_workday,
    COALESCE(dt.is_holiday, false) AS is_holiday,
    COALESCE(tbi.balance, 0) AS time_bank_balance,
    COALESCE(arj.records, '[]'::jsonb) AS all_records
  FROM employee_info ei
  LEFT JOIN daily_tracking dt ON true
  LEFT JOIN schedule_info si ON true
  LEFT JOIN time_bank_info tbi ON true
  LEFT JOIN all_records_json arj ON true;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_employee_time_summary IS 'Retorna resumo completo do dia de trabalho de um funcionario';

-- =====================================================
-- FUNCAO: clock_in_out
-- Registra ponto com validacoes automaticas
-- =====================================================

CREATE OR REPLACE FUNCTION clock_in_out(
  p_employee_id UUID,
  p_company_id UUID,
  p_action clock_type,
  p_source record_source DEFAULT 'web',
  p_device_info JSONB DEFAULT '{}'::jsonb,
  p_location POINT DEFAULT NULL,
  p_location_address TEXT DEFAULT NULL,
  p_photo_url TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  record_id UUID,
  next_expected_action clock_type,
  validation_warnings JSONB
) AS $$
DECLARE
  v_record_id UUID;
  v_last_action clock_type;
  v_last_action_time TIMESTAMPTZ;
  v_is_within_geofence BOOLEAN := NULL;
  v_warnings JSONB := '[]'::jsonb;
  v_today_date DATE := CURRENT_DATE;
  v_employee_status TEXT;
  v_schedule_id UUID;
  v_geofence_required BOOLEAN := false;
  v_next_action clock_type;
BEGIN
  -- Validacao: Funcionario existe e esta ativo
  SELECT status INTO v_employee_status
  FROM employees
  WHERE id = p_employee_id AND company_id = p_company_id;

  IF v_employee_status IS NULL THEN
    RETURN QUERY SELECT false, 'Funcionario nao encontrado', NULL::UUID, NULL::clock_type, '[]'::jsonb;
    RETURN;
  END IF;

  IF v_employee_status != 'active' THEN
    RETURN QUERY SELECT false, 'Funcionario nao esta ativo', NULL::UUID, NULL::clock_type, '[]'::jsonb;
    RETURN;
  END IF;

  -- Pegar ultima acao do dia
  SELECT record_type, recorded_at
  INTO v_last_action, v_last_action_time
  FROM time_records
  WHERE employee_id = p_employee_id
  AND DATE(recorded_at) = v_today_date
  ORDER BY recorded_at DESC
  LIMIT 1;

  -- Validacao: Sequencia logica de acoes
  IF v_last_action IS NOT NULL THEN
    CASE p_action
      WHEN 'clock_in' THEN
        IF v_last_action != 'clock_out' AND v_last_action IS NOT NULL THEN
          RETURN QUERY SELECT false, 'Ja existe entrada registrada hoje. Registre saida primeiro', NULL::UUID, NULL::clock_type, '[]'::jsonb;
          RETURN;
        END IF;
      WHEN 'break_start' THEN
        IF v_last_action NOT IN ('clock_in', 'break_end') THEN
          RETURN QUERY SELECT false, 'Registre entrada antes de iniciar intervalo', NULL::UUID, NULL::clock_type, '[]'::jsonb;
          RETURN;
        END IF;
      WHEN 'break_end' THEN
        IF v_last_action != 'break_start' THEN
          RETURN QUERY SELECT false, 'Nao ha intervalo ativo para finalizar', NULL::UUID, NULL::clock_type, '[]'::jsonb;
          RETURN;
        END IF;
      WHEN 'clock_out' THEN
        IF v_last_action = 'break_start' THEN
          RETURN QUERY SELECT false, 'Finalize o intervalo antes de registrar saida', NULL::UUID, NULL::clock_type, '[]'::jsonb;
          RETURN;
        END IF;
        IF v_last_action NOT IN ('clock_in', 'break_end') THEN
          RETURN QUERY SELECT false, 'Registre entrada antes de registrar saida', NULL::UUID, NULL::clock_type, '[]'::jsonb;
          RETURN;
        END IF;
    END CASE;
  ELSE
    -- Primeira acao do dia deve ser clock_in
    IF p_action != 'clock_in' THEN
      RETURN QUERY SELECT false, 'Primeira acao do dia deve ser entrada (clock_in)', NULL::UUID, NULL::clock_type, '[]'::jsonb;
      RETURN;
    END IF;
  END IF;

  -- Validacao: Tempo minimo entre acoes (evitar registros duplicados)
  IF v_last_action_time IS NOT NULL THEN
    IF EXTRACT(EPOCH FROM (now() - v_last_action_time)) < 60 THEN
      RETURN QUERY SELECT false, 'Aguarde pelo menos 1 minuto entre registros', NULL::UUID, NULL::clock_type, '[]'::jsonb;
      RETURN;
    END IF;
  END IF;

  -- Validacao de geofence (se localizacao fornecida)
  IF p_location IS NOT NULL THEN
    SELECT
      CASE
        WHEN COUNT(*) = 0 THEN NULL
        WHEN COUNT(*) FILTER (WHERE
          ST_DWithin(
            center::geography,
            p_location::geography,
            radius_meters
          )
        ) > 0 THEN true
        ELSE false
      END,
      BOOL_OR(is_required)
    INTO v_is_within_geofence, v_geofence_required
    FROM geofences
    WHERE company_id = p_company_id
    AND is_active = true;

    -- Aviso se fora da geofence permitida
    IF v_is_within_geofence = false THEN
      v_warnings := v_warnings || jsonb_build_object(
        'type', 'geofence',
        'message', 'Registro realizado fora das areas permitidas',
        'severity', CASE WHEN v_geofence_required THEN 'error' ELSE 'warning' END
      );

      -- Se geofence e obrigatoria, bloquear
      IF v_geofence_required THEN
        RETURN QUERY SELECT false, 'Registro deve ser feito dentro das areas permitidas pela empresa', NULL::UUID, NULL::clock_type, v_warnings;
        RETURN;
      END IF;
    END IF;
  END IF;

  -- Inserir registro
  INSERT INTO time_records (
    company_id,
    employee_id,
    record_type,
    recorded_at,
    location,
    location_address,
    is_within_geofence,
    device_info,
    source,
    photo_url,
    notes,
    created_by
  )
  VALUES (
    p_company_id,
    p_employee_id,
    p_action,
    now(),
    p_location,
    p_location_address,
    v_is_within_geofence,
    p_device_info,
    p_source,
    p_photo_url,
    p_notes,
    (SELECT id FROM profiles WHERE employee_id = p_employee_id LIMIT 1)
  )
  RETURNING id INTO v_record_id;

  -- Consolidar registros do dia
  PERFORM consolidate_daily_records(p_employee_id, v_today_date);

  -- Determinar proxima acao esperada
  CASE p_action
    WHEN 'clock_in' THEN v_next_action := 'break_start';
    WHEN 'break_start' THEN v_next_action := 'break_end';
    WHEN 'break_end' THEN v_next_action := 'clock_out';
    WHEN 'clock_out' THEN v_next_action := NULL;
  END CASE;

  -- Retornar sucesso
  RETURN QUERY SELECT true, 'Ponto registrado com sucesso', v_record_id, v_next_action, v_warnings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION clock_in_out IS 'Registra ponto com validacoes automaticas de sequencia, tempo e geofence';

-- =====================================================
-- VIEW: v_whos_in_today
-- View materializada para dashboard em tempo real
-- =====================================================

CREATE MATERIALIZED VIEW v_whos_in_today AS
WITH latest_records AS (
  SELECT DISTINCT ON (tr.employee_id)
    tr.employee_id,
    tr.company_id,
    tr.record_type,
    tr.recorded_at,
    tr.location_address,
    tr.source,
    tr.is_within_geofence
  FROM time_records tr
  WHERE DATE(tr.recorded_at AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
  ORDER BY tr.employee_id, tr.recorded_at DESC
),
todays_summary AS (
  SELECT
    ttd.employee_id,
    ttd.company_id,
    ttd.clock_in,
    ttd.worked_minutes,
    ttd.break_minutes
  FROM time_tracking_daily ttd
  WHERE ttd.date = CURRENT_DATE
),
employee_schedules_today AS (
  SELECT
    es.employee_id,
    es.company_id,
    sw.start_time,
    sw.end_time,
    ws.name AS schedule_name
  FROM employee_schedules es
  JOIN work_schedules ws ON ws.id = es.schedule_id
  LEFT JOIN schedule_weekdays sw ON sw.schedule_id = ws.id
    AND sw.weekday = LOWER(to_char(CURRENT_DATE, 'FMDay'))::weekday
  WHERE es.start_date <= CURRENT_DATE
  AND (es.end_date IS NULL OR es.end_date >= CURRENT_DATE)
)
SELECT
  e.company_id,
  e.id AS employee_id,
  e.name AS employee_name,
  e.department,
  p.avatar_url,
  p.email,
  CASE
    WHEN lr.record_type IS NULL THEN 'not_clocked_in'
    WHEN lr.record_type = 'clock_in' THEN 'working'
    WHEN lr.record_type = 'break_start' THEN 'on_break'
    WHEN lr.record_type = 'break_end' THEN 'working'
    WHEN lr.record_type = 'clock_out' THEN 'clocked_out'
    ELSE 'unknown'
  END AS current_status,
  ts.clock_in,
  lr.recorded_at AS last_action,
  lr.record_type AS last_action_type,
  lr.location_address,
  lr.is_within_geofence,
  COALESCE(
    lr.source IN ('remote', 'web') AND lr.location_address IS NULL,
    false
  ) AS is_remote,
  COALESCE(ts.worked_minutes, 0) AS worked_minutes,
  COALESCE(ts.break_minutes, 0) AS break_minutes,
  est.schedule_name,
  est.start_time AS schedule_start,
  est.end_time AS schedule_end,
  now() AS refreshed_at
FROM employees e
LEFT JOIN profiles p ON p.employee_id = e.id
LEFT JOIN latest_records lr ON lr.employee_id = e.id
LEFT JOIN todays_summary ts ON ts.employee_id = e.id
LEFT JOIN employee_schedules_today est ON est.employee_id = e.id
WHERE e.status = 'active'
AND (
  lr.record_type IN ('clock_in', 'break_start', 'break_end')
  OR (lr.record_type IS NULL AND est.start_time IS NOT NULL)
);

-- Indices para a view materializada
CREATE INDEX idx_v_whos_in_company ON v_whos_in_today (company_id);
CREATE INDEX idx_v_whos_in_status ON v_whos_in_today (current_status);
CREATE INDEX idx_v_whos_in_employee ON v_whos_in_today (employee_id);

COMMENT ON MATERIALIZED VIEW v_whos_in_today IS 'Dashboard em tempo real de quem esta trabalhando';

-- Funcao para refresh automatico da view
CREATE OR REPLACE FUNCTION refresh_whos_in_today()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY v_whos_in_today;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION refresh_whos_in_today IS 'Atualiza view materializada de funcionarios trabalhando';

-- =====================================================
-- INDICES ADICIONAIS PARA PERFORMANCE
-- =====================================================

-- Indice composto para consultas de dashboard
CREATE INDEX idx_time_records_company_date_employee
  ON time_records (company_id, DATE(recorded_at), employee_id);

-- Indice para consultas de ultimo registro do dia
-- Nota: Removido filtro com CURRENT_DATE pois nao e IMMUTABLE
CREATE INDEX idx_time_records_employee_date_desc
  ON time_records (employee_id, recorded_at DESC);

-- Indice para validacao de geofence
CREATE INDEX idx_geofences_company_active_required
  ON geofences (company_id, is_active, is_required)
  WHERE is_active = true;

-- Indice espacial otimizado para geofences
CREATE INDEX idx_geofences_geography ON geofences
  USING GIST ((center::geography));

-- Indice para consultas de jornada vigente
-- Nota: Removido filtro com CURRENT_DATE pois nao e IMMUTABLE
CREATE INDEX idx_employee_schedules_current
  ON employee_schedules (employee_id, start_date, end_date);

-- Indice para banco de horas - saldo atual
CREATE INDEX idx_time_bank_employee_balance
  ON time_bank (employee_id, created_at DESC, balance_after);

-- =====================================================
-- MELHORIAS NAS RLS POLICIES
-- =====================================================

-- Adicionar policy para usuarios verem status de colegas (dashboard)
CREATE POLICY "Users can view colleagues current status"
  ON time_records FOR SELECT
  USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    AND DATE(recorded_at) = CURRENT_DATE
    AND record_type IN ('clock_in', 'break_start', 'break_end', 'clock_out')
  );

-- Policy para HR/Admin bulk operations
CREATE POLICY "Admins can bulk manage records"
  ON time_records FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- =====================================================
-- FUNCAO AUXILIAR: Validar horas esperadas
-- =====================================================

CREATE OR REPLACE FUNCTION validate_expected_hours()
RETURNS TRIGGER AS $$
DECLARE
  v_expected_hours NUMERIC;
  v_worked_hours NUMERIC;
BEGIN
  -- Pegar horas esperadas
  v_expected_hours := get_expected_hours(NEW.employee_id, NEW.date);
  v_worked_hours := NEW.worked_minutes / 60.0;

  -- Calcular overtime ou falta
  IF v_worked_hours > v_expected_hours THEN
    NEW.overtime_minutes := ROUND((v_worked_hours - v_expected_hours) * 60);
    NEW.missing_minutes := 0;
  ELSIF v_worked_hours < v_expected_hours THEN
    NEW.overtime_minutes := 0;
    NEW.missing_minutes := ROUND((v_expected_hours - v_worked_hours) * 60);
  ELSE
    NEW.overtime_minutes := 0;
    NEW.missing_minutes := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Substituir trigger existente
DROP TRIGGER IF EXISTS trigger_calculate_worked_hours ON time_tracking_daily;

CREATE TRIGGER trigger_calculate_worked_hours
  BEFORE INSERT OR UPDATE ON time_tracking_daily
  FOR EACH ROW
  EXECUTE FUNCTION calculate_worked_hours();

CREATE TRIGGER trigger_validate_expected_hours
  BEFORE INSERT OR UPDATE ON time_tracking_daily
  FOR EACH ROW
  WHEN (NEW.worked_minutes IS NOT NULL)
  EXECUTE FUNCTION validate_expected_hours();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Conceder acesso as funcoes para usuarios autenticados
GRANT EXECUTE ON FUNCTION get_whos_in TO authenticated;
GRANT EXECUTE ON FUNCTION get_employee_time_summary TO authenticated;
GRANT EXECUTE ON FUNCTION clock_in_out TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_whos_in_today TO authenticated;

-- Conceder acesso a view materializada
GRANT SELECT ON v_whos_in_today TO authenticated;

-- =====================================================
-- COMENTARIOS FINAIS
-- =====================================================

COMMENT ON INDEX idx_time_records_company_date_employee IS 'Otimiza consultas de dashboard por empresa e data';
COMMENT ON INDEX idx_time_records_employee_date_desc IS 'Otimiza busca de ultimo registro do dia';
COMMENT ON INDEX idx_geofences_company_active_required IS 'Otimiza validacao de geofence obrigatoria';



-- =====================================================
-- FILE: 015_time_tracking_rls_and_functions.sql
-- =====================================================

-- =====================================================
-- Migration 015: Time Tracking RLS Policies & SQL Functions
-- Sistema SaaS de RH Multi-tenant
-- =====================================================
-- Implementa politicas RLS completas, funcoes SQL e triggers
-- para o modulo de controle de ponto eletronico
-- =====================================================

-- =====================================================
-- ENUM para tipo de correcao de ponto
-- =====================================================

CREATE TYPE signing_correction_type AS ENUM (
  'missed_clock_in',
  'missed_clock_out',
  'missed_break_start',
  'missed_break_end',
  'wrong_time',
  'system_error',
  'other'
);

-- =====================================================
-- Tabela de solicitacoes de correcao de ponto
-- =====================================================

CREATE TABLE IF NOT EXISTS signing_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Funcionario solicitante
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Referencia ao registro original (se existir)
  time_record_id UUID REFERENCES time_records(id) ON DELETE SET NULL,
  time_tracking_daily_id UUID REFERENCES time_tracking_daily(id) ON DELETE SET NULL,

  -- Tipo de correcao
  correction_type signing_correction_type NOT NULL,

  -- Data e horario da correcao
  correction_date DATE NOT NULL,
  correction_time TIME NOT NULL,

  -- Motivo da solicitacao
  reason TEXT NOT NULL,
  justification_file_url TEXT,

  -- Valores originais (se for alteracao)
  original_values JSONB,
  -- Estrutura:
  -- {
  --   "original_time": "14:30:00",
  --   "original_date": "2024-01-15",
  --   "original_type": "clock_in"
  -- }

  -- Status da solicitacao
  status time_record_status DEFAULT 'pending' NOT NULL,

  -- Aprovacao/Rejeicao
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- Indices para signing_corrections
CREATE INDEX idx_signing_corrections_company ON signing_corrections (company_id);
CREATE INDEX idx_signing_corrections_employee ON signing_corrections (employee_id);
CREATE INDEX idx_signing_corrections_status ON signing_corrections (status);
CREATE INDEX idx_signing_corrections_date ON signing_corrections (correction_date);
CREATE INDEX idx_signing_corrections_pending ON signing_corrections (company_id, status)
  WHERE status = 'pending';

-- Trigger para updated_at
CREATE TRIGGER trigger_signing_corrections_updated_at
  BEFORE UPDATE ON signing_corrections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCAO: calculate_worked_hours_detail
-- Calcula horas trabalhadas no dia para um funcionario
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_worked_hours_detail(
  p_employee_id UUID,
  p_date DATE
)
RETURNS TABLE (
  worked_minutes INTEGER,
  break_minutes INTEGER,
  total_minutes INTEGER,
  is_complete BOOLEAN
) AS $$
DECLARE
  v_clock_in TIMESTAMPTZ;
  v_clock_out TIMESTAMPTZ;
  v_break_start TIMESTAMPTZ;
  v_break_end TIMESTAMPTZ;
  v_worked INTEGER := 0;
  v_break INTEGER := 0;
  v_complete BOOLEAN := false;
BEGIN
  -- Pegar registros do dia
  SELECT
    MAX(CASE WHEN record_type = 'clock_in' THEN recorded_at END),
    MAX(CASE WHEN record_type = 'clock_out' THEN recorded_at END),
    MAX(CASE WHEN record_type = 'break_start' THEN recorded_at END),
    MAX(CASE WHEN record_type = 'break_end' THEN recorded_at END)
  INTO v_clock_in, v_clock_out, v_break_start, v_break_end
  FROM time_records
  WHERE employee_id = p_employee_id
  AND DATE(recorded_at) = p_date;

  -- Calcular minutos trabalhados
  IF v_clock_in IS NOT NULL AND v_clock_out IS NOT NULL THEN
    v_worked := EXTRACT(EPOCH FROM (v_clock_out - v_clock_in))::INTEGER / 60;
    v_complete := true;

    -- Subtrair intervalo se existir
    IF v_break_start IS NOT NULL AND v_break_end IS NOT NULL THEN
      v_break := EXTRACT(EPOCH FROM (v_break_end - v_break_start))::INTEGER / 60;
      v_worked := v_worked - v_break;
    END IF;
  ELSIF v_clock_in IS NOT NULL THEN
    -- Calcular ate o momento atual (para dias incompletos)
    v_worked := EXTRACT(EPOCH FROM (now() - v_clock_in))::INTEGER / 60;

    IF v_break_start IS NOT NULL THEN
      IF v_break_end IS NOT NULL THEN
        v_break := EXTRACT(EPOCH FROM (v_break_end - v_break_start))::INTEGER / 60;
      ELSE
        v_break := EXTRACT(EPOCH FROM (now() - v_break_start))::INTEGER / 60;
      END IF;
      v_worked := v_worked - v_break;
    END IF;
  END IF;

  RETURN QUERY SELECT
    v_worked AS worked_minutes,
    v_break AS break_minutes,
    (v_worked + v_break) AS total_minutes,
    v_complete AS is_complete;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION calculate_worked_hours IS 'Calcula horas trabalhadas no dia para um funcionario especifico';

-- =====================================================
-- FUNCAO: get_overtime_hours
-- Calcula horas extras em um periodo
-- =====================================================

CREATE OR REPLACE FUNCTION get_overtime_hours(
  p_employee_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_overtime_minutes INTEGER,
  total_missing_minutes INTEGER,
  net_balance_minutes INTEGER,
  days_worked INTEGER,
  days_with_overtime INTEGER,
  days_with_missing INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(ttd.overtime_minutes), 0)::INTEGER AS total_overtime_minutes,
    COALESCE(SUM(ttd.missing_minutes), 0)::INTEGER AS total_missing_minutes,
    COALESCE(SUM(ttd.overtime_minutes - ttd.missing_minutes), 0)::INTEGER AS net_balance_minutes,
    COUNT(*)::INTEGER AS days_worked,
    COUNT(*) FILTER (WHERE ttd.overtime_minutes > 0)::INTEGER AS days_with_overtime,
    COUNT(*) FILTER (WHERE ttd.missing_minutes > 0)::INTEGER AS days_with_missing
  FROM time_tracking_daily ttd
  WHERE ttd.employee_id = p_employee_id
  AND ttd.date BETWEEN p_start_date AND p_end_date
  AND ttd.clock_in IS NOT NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_overtime_hours IS 'Calcula horas extras e faltas em um periodo especifico';

-- =====================================================
-- FUNCAO: validate_signing
-- Valida se uma batida de ponto eh permitida
-- =====================================================

CREATE OR REPLACE FUNCTION validate_signing(
  p_employee_id UUID,
  p_signing_time TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE (
  is_valid BOOLEAN,
  error_code TEXT,
  error_message TEXT,
  last_action clock_type,
  expected_action clock_type
) AS $$
DECLARE
  v_last_action clock_type;
  v_last_time TIMESTAMPTZ;
  v_employee_status TEXT;
  v_signing_date DATE;
BEGIN
  v_signing_date := DATE(p_signing_time);

  -- Verificar se funcionario existe e esta ativo
  SELECT status INTO v_employee_status
  FROM employees
  WHERE id = p_employee_id;

  IF v_employee_status IS NULL THEN
    RETURN QUERY SELECT
      false AS is_valid,
      'EMPLOYEE_NOT_FOUND'::TEXT AS error_code,
      'Funcionario nao encontrado'::TEXT AS error_message,
      NULL::clock_type AS last_action,
      NULL::clock_type AS expected_action;
    RETURN;
  END IF;

  IF v_employee_status != 'active' THEN
    RETURN QUERY SELECT
      false AS is_valid,
      'EMPLOYEE_INACTIVE'::TEXT AS error_code,
      'Funcionario nao esta ativo'::TEXT AS error_message,
      NULL::clock_type AS last_action,
      NULL::clock_type AS expected_action;
    RETURN;
  END IF;

  -- Pegar ultima acao do dia
  SELECT record_type, recorded_at
  INTO v_last_action, v_last_time
  FROM time_records
  WHERE employee_id = p_employee_id
  AND DATE(recorded_at) = v_signing_date
  ORDER BY recorded_at DESC
  LIMIT 1;

  -- Validar intervalo minimo entre batidas (1 minuto)
  IF v_last_time IS NOT NULL THEN
    IF EXTRACT(EPOCH FROM (p_signing_time - v_last_time)) < 60 THEN
      RETURN QUERY SELECT
        false AS is_valid,
        'MIN_INTERVAL_NOT_MET'::TEXT AS error_code,
        'Aguarde pelo menos 1 minuto entre registros'::TEXT AS error_message,
        v_last_action AS last_action,
        NULL::clock_type AS expected_action;
      RETURN;
    END IF;
  END IF;

  -- Determinar proxima acao esperada
  RETURN QUERY SELECT
    true AS is_valid,
    NULL::TEXT AS error_code,
    NULL::TEXT AS error_message,
    v_last_action AS last_action,
    CASE v_last_action
      WHEN 'clock_in' THEN 'break_start'::clock_type
      WHEN 'break_start' THEN 'break_end'::clock_type
      WHEN 'break_end' THEN 'clock_out'::clock_type
      WHEN 'clock_out' THEN 'clock_in'::clock_type
      ELSE 'clock_in'::clock_type
    END AS expected_action;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION validate_signing IS 'Valida se uma batida de ponto eh permitida no momento atual';

-- =====================================================
-- FUNCAO: get_monthly_summary
-- Retorna resumo mensal completo de um funcionario
-- =====================================================

CREATE OR REPLACE FUNCTION get_monthly_summary(
  p_employee_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS TABLE (
  employee_id UUID,
  employee_name TEXT,
  month INTEGER,
  year INTEGER,
  total_days INTEGER,
  worked_days INTEGER,
  absent_days INTEGER,
  total_worked_minutes INTEGER,
  total_overtime_minutes INTEGER,
  total_missing_minutes INTEGER,
  net_balance_minutes INTEGER,
  time_bank_balance INTEGER,
  average_daily_hours NUMERIC,
  on_time_percentage NUMERIC,
  pending_approvals INTEGER,
  pending_corrections INTEGER
) AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_employee_name TEXT;
BEGIN
  -- Calcular range de datas
  v_start_date := make_date(p_year, p_month, 1);
  v_end_date := (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  -- Pegar nome do funcionario
  SELECT name INTO v_employee_name
  FROM employees
  WHERE id = p_employee_id;

  RETURN QUERY
  WITH daily_stats AS (
    SELECT
      COUNT(*) AS worked_days,
      COUNT(*) FILTER (WHERE ttd.clock_in IS NULL) AS absent_days,
      COALESCE(SUM(ttd.worked_minutes), 0) AS total_worked,
      COALESCE(SUM(ttd.overtime_minutes), 0) AS total_overtime,
      COALESCE(SUM(ttd.missing_minutes), 0) AS total_missing,
      COUNT(*) FILTER (WHERE ttd.status = 'pending') AS pending_approvals,
      COUNT(*) FILTER (WHERE ttd.missing_minutes = 0 AND ttd.clock_in IS NOT NULL) AS on_time_days
    FROM time_tracking_daily ttd
    WHERE ttd.employee_id = p_employee_id
    AND ttd.date BETWEEN v_start_date AND v_end_date
  ),
  corrections_pending AS (
    SELECT COUNT(*) AS pending_count
    FROM signing_corrections
    WHERE employee_id = p_employee_id
    AND correction_date BETWEEN v_start_date AND v_end_date
    AND status = 'pending'
  ),
  time_bank_current AS (
    SELECT COALESCE(balance_after, 0) AS balance
    FROM time_bank
    WHERE employee_id = p_employee_id
    ORDER BY created_at DESC
    LIMIT 1
  )
  SELECT
    p_employee_id AS employee_id,
    v_employee_name AS employee_name,
    p_month AS month,
    p_year AS year,
    EXTRACT(DAY FROM v_end_date)::INTEGER AS total_days,
    ds.worked_days::INTEGER,
    ds.absent_days::INTEGER,
    ds.total_worked::INTEGER AS total_worked_minutes,
    ds.total_overtime::INTEGER AS total_overtime_minutes,
    ds.total_missing::INTEGER AS total_missing_minutes,
    (ds.total_overtime - ds.total_missing)::INTEGER AS net_balance_minutes,
    tb.balance::INTEGER AS time_bank_balance,
    ROUND((ds.total_worked::NUMERIC / NULLIF(ds.worked_days, 0) / 60), 2) AS average_daily_hours,
    ROUND((ds.on_time_days::NUMERIC / NULLIF(ds.worked_days, 0) * 100), 2) AS on_time_percentage,
    ds.pending_approvals::INTEGER,
    cp.pending_count::INTEGER AS pending_corrections
  FROM daily_stats ds
  CROSS JOIN corrections_pending cp
  CROSS JOIN time_bank_current tb;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_monthly_summary IS 'Retorna resumo completo mensal de um funcionario';

-- =====================================================
-- FUNCAO: get_expected_hours
-- Retorna horas esperadas para um dia especifico
-- =====================================================

CREATE OR REPLACE FUNCTION get_expected_hours(
  p_employee_id UUID,
  p_date DATE
)
RETURNS NUMERIC AS $$
DECLARE
  v_daily_hours NUMERIC;
  v_weekday TEXT;
BEGIN
  v_weekday := LOWER(to_char(p_date, 'FMDay'));

  SELECT ws.daily_hours INTO v_daily_hours
  FROM employee_schedules es
  JOIN work_schedules ws ON ws.id = es.schedule_id
  WHERE es.employee_id = p_employee_id
  AND es.start_date <= p_date
  AND (es.end_date IS NULL OR es.end_date >= p_date)
  LIMIT 1;

  RETURN COALESCE(v_daily_hours, 8); -- Default 8 horas
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_expected_hours IS 'Retorna horas esperadas de trabalho para uma data especifica';

-- =====================================================
-- TRIGGER: Validar sequencia de batidas
-- Garante ordem logica: entrada → intervalo → saida
-- =====================================================

CREATE OR REPLACE FUNCTION validate_signing_sequence()
RETURNS TRIGGER AS $$
DECLARE
  v_last_action clock_type;
  v_today_date DATE;
BEGIN
  v_today_date := DATE(NEW.recorded_at);

  -- Pegar ultima acao do dia
  SELECT record_type INTO v_last_action
  FROM time_records
  WHERE employee_id = NEW.employee_id
  AND DATE(recorded_at) = v_today_date
  AND id != NEW.id
  ORDER BY recorded_at DESC
  LIMIT 1;

  -- Validar sequencia
  IF v_last_action IS NOT NULL THEN
    CASE NEW.record_type
      WHEN 'clock_in' THEN
        IF v_last_action != 'clock_out' THEN
          RAISE EXCEPTION 'Ja existe entrada registrada hoje. Registre saida primeiro';
        END IF;
      WHEN 'break_start' THEN
        IF v_last_action NOT IN ('clock_in', 'break_end') THEN
          RAISE EXCEPTION 'Registre entrada antes de iniciar intervalo';
        END IF;
      WHEN 'break_end' THEN
        IF v_last_action != 'break_start' THEN
          RAISE EXCEPTION 'Nao ha intervalo ativo para finalizar';
        END IF;
      WHEN 'clock_out' THEN
        IF v_last_action = 'break_start' THEN
          RAISE EXCEPTION 'Finalize o intervalo antes de registrar saida';
        END IF;
        IF v_last_action NOT IN ('clock_in', 'break_end') THEN
          RAISE EXCEPTION 'Registre entrada antes de registrar saida';
        END IF;
    END CASE;
  ELSE
    -- Primeira acao do dia deve ser clock_in
    IF NEW.record_type != 'clock_in' THEN
      RAISE EXCEPTION 'Primeira acao do dia deve ser entrada (clock_in)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_signing_sequence
  BEFORE INSERT ON time_records
  FOR EACH ROW
  EXECUTE FUNCTION validate_signing_sequence();

COMMENT ON FUNCTION validate_signing_sequence IS 'Valida sequencia logica de batidas de ponto';

-- =====================================================
-- TRIGGER: Prevenir batidas duplicadas
-- Intervalo minimo de 1 minuto entre batidas
-- =====================================================

CREATE OR REPLACE FUNCTION prevent_duplicate_signings()
RETURNS TRIGGER AS $$
DECLARE
  v_last_time TIMESTAMPTZ;
BEGIN
  -- Pegar horario da ultima batida
  SELECT recorded_at INTO v_last_time
  FROM time_records
  WHERE employee_id = NEW.employee_id
  ORDER BY recorded_at DESC
  LIMIT 1;

  -- Validar intervalo minimo
  IF v_last_time IS NOT NULL THEN
    IF EXTRACT(EPOCH FROM (NEW.recorded_at - v_last_time)) < 60 THEN
      RAISE EXCEPTION 'Aguarde pelo menos 1 minuto entre registros';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_duplicate_signings
  BEFORE INSERT ON time_records
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_signings();

COMMENT ON FUNCTION prevent_duplicate_signings IS 'Previne batidas de ponto duplicadas em menos de 1 minuto';

-- =====================================================
-- TRIGGER: Atualizar status automaticamente
-- Muda status baseado em horarios completos
-- =====================================================

CREATE OR REPLACE FUNCTION auto_update_tracking_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Se tem entrada e saida, pode ser aprovado automaticamente (depende da config)
  IF NEW.clock_in IS NOT NULL AND NEW.clock_out IS NOT NULL THEN
    -- Verificar se funcionario tem aprovacao automatica
    IF EXISTS (
      SELECT 1 FROM employees
      WHERE id = NEW.employee_id
      AND status = 'active'
      -- Adicionar campo auto_approve_timesheet se necessario
    ) THEN
      NEW.status := 'approved';
      NEW.approved_at := now();
    ELSE
      NEW.status := 'pending';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_update_tracking_status
  BEFORE INSERT OR UPDATE ON time_tracking_daily
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_tracking_status();

COMMENT ON FUNCTION auto_update_tracking_status IS 'Atualiza status automaticamente baseado em completude de horarios';

-- =====================================================
-- RLS POLICIES MELHORADAS
-- =====================================================

-- Remover policies existentes se houver conflito
DROP POLICY IF EXISTS "Users can view colleagues current status" ON time_records;
DROP POLICY IF EXISTS "Admins can bulk manage records" ON time_records;

-- =====================================================
-- POLICIES: time_records
-- =====================================================

-- Usuarios podem ver seus proprios registros
CREATE POLICY "employees_view_own_records"
  ON time_records FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

-- Usuarios podem criar seus proprios registros
CREATE POLICY "employees_insert_own_records"
  ON time_records FOR INSERT
  WITH CHECK (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- Usuarios podem ver status atual de colegas (dashboard)
CREATE POLICY "employees_view_colleagues_today"
  ON time_records FOR SELECT
  USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    AND DATE(recorded_at AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
  );

-- Gestores podem ver registros da equipe
CREATE POLICY "managers_view_team_records"
  ON time_records FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE manager_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Admins/HR podem gerenciar todos os registros
CREATE POLICY "admins_manage_all_records"
  ON time_records FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- =====================================================
-- POLICIES: signing_corrections
-- =====================================================

ALTER TABLE signing_corrections ENABLE ROW LEVEL SECURITY;

-- Funcionarios podem ver e criar suas proprias solicitacoes
CREATE POLICY "employees_view_own_corrections"
  ON signing_corrections FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "employees_create_corrections"
  ON signing_corrections FOR INSERT
  WITH CHECK (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- Gestores podem ver e aprovar solicitacoes da equipe
CREATE POLICY "managers_manage_team_corrections"
  ON signing_corrections FOR ALL
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE manager_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Admins/HR podem gerenciar todas as solicitacoes
CREATE POLICY "admins_manage_all_corrections"
  ON signing_corrections FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- =====================================================
-- POLICIES: time_tracking_daily
-- =====================================================

-- Usuarios podem ver seu proprio resumo diario
CREATE POLICY "employees_view_own_daily"
  ON time_tracking_daily FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

-- Gestores podem ver e aprovar resumos da equipe
CREATE POLICY "managers_manage_team_daily"
  ON time_tracking_daily FOR ALL
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE manager_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Admins/HR podem gerenciar todos os resumos
CREATE POLICY "admins_manage_all_daily"
  ON time_tracking_daily FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- =====================================================
-- POLICIES: time_bank
-- =====================================================

-- Usuarios podem ver seu proprio banco de horas
CREATE POLICY "employees_view_own_timebank"
  ON time_bank FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

-- Gestores podem ver banco de horas da equipe
CREATE POLICY "managers_view_team_timebank"
  ON time_bank FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE manager_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Admins/HR podem gerenciar todos os bancos de horas
CREATE POLICY "admins_manage_all_timebank"
  ON time_bank FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- =====================================================
-- INDICES ADICIONAIS PARA PERFORMANCE
-- =====================================================

-- Indice para consultas de validacao de batidas (sem predicado de data)
CREATE INDEX IF NOT EXISTS idx_time_records_employee_recent
  ON time_records (employee_id, recorded_at DESC);

-- Indice para consultas de resumo mensal (sem predicado de data)
CREATE INDEX IF NOT EXISTS idx_time_tracking_employee_month
  ON time_tracking_daily (employee_id, date DESC);

-- Indice para consultas de correcoes pendentes
CREATE INDEX IF NOT EXISTS idx_corrections_employee_pending
  ON signing_corrections (employee_id, status, correction_date DESC)
  WHERE status = 'pending';

-- Indice para consultas de banco de horas atual
CREATE INDEX IF NOT EXISTS idx_time_bank_employee_latest
  ON time_bank (employee_id, created_at DESC);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Conceder acesso as novas funcoes
GRANT EXECUTE ON FUNCTION calculate_worked_hours TO authenticated;
GRANT EXECUTE ON FUNCTION get_overtime_hours TO authenticated;
GRANT EXECUTE ON FUNCTION validate_signing TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_expected_hours TO authenticated;

-- =====================================================
-- VIEWS ADICIONAIS
-- =====================================================

-- View para correcoes pendentes de aprovacao
CREATE OR REPLACE VIEW v_pending_corrections AS
SELECT
  sc.*,
  e.name AS employee_name,
  e.department,
  p.name AS reviewer_name,
  EXTRACT(DAY FROM (now() - sc.created_at)) AS days_pending
FROM signing_corrections sc
JOIN employees e ON e.id = sc.employee_id
LEFT JOIN profiles p ON p.id = sc.reviewed_by
WHERE sc.status = 'pending'
ORDER BY sc.created_at ASC;

COMMENT ON VIEW v_pending_corrections IS 'View de correcoes de ponto pendentes de aprovacao';

-- View para banco de horas consolidado
CREATE OR REPLACE VIEW v_time_bank_current AS
SELECT DISTINCT ON (tb.employee_id)
  tb.employee_id,
  e.name AS employee_name,
  e.department,
  tb.balance_after AS current_balance,
  tb.created_at AS last_update,
  CASE
    WHEN tb.balance_after > 0 THEN 'credit'
    WHEN tb.balance_after < 0 THEN 'debit'
    ELSE 'zero'
  END AS balance_status
FROM time_bank tb
JOIN employees e ON e.id = tb.employee_id
WHERE e.status = 'active'
ORDER BY tb.employee_id, tb.created_at DESC;

COMMENT ON VIEW v_time_bank_current IS 'View do saldo atual do banco de horas por funcionario';

-- =====================================================
-- COMENTARIOS FINAIS
-- =====================================================

COMMENT ON TABLE signing_corrections IS 'Solicitacoes de correcao de batidas de ponto';
COMMENT ON COLUMN signing_corrections.correction_type IS 'Tipo de correcao solicitada';
COMMENT ON COLUMN signing_corrections.original_values IS 'Valores originais antes da correcao (JSONB)';

-- =====================================================
-- FIM DA MIGRATION 015
-- =====================================================


