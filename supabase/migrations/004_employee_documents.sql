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
