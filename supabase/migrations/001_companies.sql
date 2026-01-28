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
