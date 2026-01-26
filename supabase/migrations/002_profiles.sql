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
