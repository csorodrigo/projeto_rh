-- =====================================================
-- BATCH_01_SETUP
-- Files: 000_setup.sql, 001_companies.sql, 002_profiles.sql
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


