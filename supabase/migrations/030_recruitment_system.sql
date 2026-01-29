-- =====================================================
-- Migration 030: Recruitment System (Sistema de Recrutamento)
-- Sistema SaaS de RH Multi-tenant
-- =====================================================

-- ENUMs para campos padronizados
CREATE TYPE job_status AS ENUM ('draft', 'open', 'paused', 'closed');
CREATE TYPE employment_type AS ENUM ('clt', 'pj', 'intern', 'temporary', 'apprentice');
CREATE TYPE location_type AS ENUM ('on_site', 'remote', 'hybrid');
CREATE TYPE candidate_source AS ENUM ('portal', 'linkedin', 'referral', 'agency', 'direct', 'other');
CREATE TYPE application_status AS ENUM ('active', 'rejected', 'hired', 'withdrawn');
CREATE TYPE activity_type AS ENUM ('stage_change', 'comment', 'rating', 'interview_scheduled', 'status_change', 'document_uploaded');

-- =====================================================
-- Tabela de vagas (jobs)
-- =====================================================

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Informacoes basicas
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  benefits TEXT[] DEFAULT '{}',

  -- Localizacao e tipo
  department TEXT,
  location TEXT NOT NULL, -- Cidade ou "Remoto"
  location_type location_type DEFAULT 'on_site' NOT NULL,
  employment_type employment_type DEFAULT 'clt' NOT NULL,

  -- Faixa salarial
  salary_range_min NUMERIC(12,2),
  salary_range_max NUMERIC(12,2),
  show_salary BOOLEAN DEFAULT false, -- Exibir salario publicamente

  -- Status e publicacao
  status job_status DEFAULT 'draft' NOT NULL,
  publish_internally BOOLEAN DEFAULT true,
  publish_externally BOOLEAN DEFAULT false,
  openings_count INTEGER DEFAULT 1,

  -- Responsaveis
  hiring_manager_id UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),

  -- Datas
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  published_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,

  -- Metadados
  custom_fields JSONB DEFAULT '{}'::jsonb,
  -- Estrutura:
  -- {
  --   "remote_allowance": 500,
  --   "languages": ["Ingles", "Espanhol"],
  --   "experience_years": 3
  -- }

  -- Constraints
  CONSTRAINT valid_salary_range CHECK (
    salary_range_min IS NULL OR
    salary_range_max IS NULL OR
    salary_range_min <= salary_range_max
  ),
  CONSTRAINT valid_openings CHECK (openings_count > 0),
  CONSTRAINT valid_published_date CHECK (
    (status != 'open' AND status != 'paused') OR published_at IS NOT NULL
  ),
  CONSTRAINT valid_closed_date CHECK (
    status != 'closed' OR closed_at IS NOT NULL
  )
);

-- =====================================================
-- Tabela de candidatos (candidates)
-- =====================================================

CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Dados pessoais
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  linkedin_url TEXT,

  -- Curriculo e documentos
  resume_url TEXT, -- URL no Supabase Storage
  resume_text TEXT, -- Texto extraido do curriculo (para busca)
  portfolio_url TEXT,

  -- Origem
  source candidate_source DEFAULT 'portal' NOT NULL,
  source_details TEXT, -- Nome do recrutador, link da indicacao, etc

  -- Informacoes adicionais
  current_position TEXT,
  current_company TEXT,
  expected_salary NUMERIC(12,2),
  available_from DATE,
  location TEXT,

  -- Tags e classificacao
  tags TEXT[] DEFAULT '{}',
  notes TEXT, -- Notas gerais do recrutador

  -- Metadados
  custom_fields JSONB DEFAULT '{}'::jsonb,

  -- GDPR / LGPD
  consent_given BOOLEAN DEFAULT true,
  consent_date TIMESTAMPTZ DEFAULT now(),
  gdpr_data_retention_until DATE,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Constraints
  CONSTRAINT unique_email_per_company UNIQUE (company_id, email)
);

-- =====================================================
-- Tabela de estagios do pipeline (pipeline_stages)
-- =====================================================

CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Informacoes do estagio
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6B7280', -- Cor hex para visualizacao

  -- Ordenacao
  order_index INTEGER NOT NULL,

  -- Configuracao
  is_default BOOLEAN DEFAULT false, -- Estagio inicial padrao
  is_final BOOLEAN DEFAULT false, -- Estagio final (contratado)

  -- Automacao
  auto_reject_after_days INTEGER, -- Rejeitar automaticamente apos X dias
  email_template_id UUID, -- Template de email ao mover para este estagio

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Constraints
  CONSTRAINT unique_stage_name_per_company UNIQUE (company_id, name),
  CONSTRAINT unique_order_per_company UNIQUE (company_id, order_index)
);

-- =====================================================
-- Tabela de candidaturas (applications)
-- =====================================================

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Referencias
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES pipeline_stages(id),

  -- Status
  status application_status DEFAULT 'active' NOT NULL,

  -- Candidatura
  applied_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  cover_letter TEXT,

  -- Avaliacao
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  tags TEXT[] DEFAULT '{}',

  -- Entrevistas
  interview_scheduled_at TIMESTAMPTZ,
  interview_completed_at TIMESTAMPTZ,
  interview_feedback TEXT,

  -- Decisao final
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,

  hired_at TIMESTAMPTZ,
  hired_by UUID REFERENCES profiles(id),
  employee_id UUID REFERENCES employees(id), -- Se foi contratado

  withdrawn_at TIMESTAMPTZ,
  withdrawn_reason TEXT,

  -- Metadados
  custom_fields JSONB DEFAULT '{}'::jsonb,
  -- Estrutura:
  -- {
  --   "test_score": 85,
  --   "technical_interview_score": 9,
  --   "cultural_fit_score": 8
  -- }

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Constraints
  CONSTRAINT unique_candidate_per_job UNIQUE (job_id, candidate_id),
  CONSTRAINT valid_rating CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  CONSTRAINT valid_hired CHECK (
    status != 'hired' OR (hired_at IS NOT NULL AND hired_by IS NOT NULL)
  ),
  CONSTRAINT valid_rejected CHECK (
    status != 'rejected' OR (rejected_at IS NOT NULL AND rejected_by IS NOT NULL)
  ),
  CONSTRAINT valid_withdrawn CHECK (
    status != 'withdrawn' OR withdrawn_at IS NOT NULL
  )
);

-- =====================================================
-- Tabela de atividades (application_activities)
-- =====================================================

CREATE TABLE application_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Referencia
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,

  -- Tipo de atividade
  type activity_type NOT NULL,

  -- Mudanca de estagio
  from_stage_id UUID REFERENCES pipeline_stages(id),
  to_stage_id UUID REFERENCES pipeline_stages(id),

  -- Comentario
  comment TEXT,

  -- Avaliacao
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),

  -- Metadados adicionais
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Estrutura (exemplo para entrevista agendada):
  -- {
  --   "interview_type": "technical",
  --   "interviewer_id": "uuid",
  --   "scheduled_date": "2024-03-20T14:00:00Z",
  --   "location": "Sala 3",
  --   "video_link": "https://meet.google.com/..."
  -- }

  -- Auditoria
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Constraints
  CONSTRAINT valid_stage_change CHECK (
    type != 'stage_change' OR (from_stage_id IS NOT NULL AND to_stage_id IS NOT NULL)
  ),
  CONSTRAINT valid_rating_activity CHECK (
    type != 'rating' OR rating IS NOT NULL
  ),
  CONSTRAINT valid_comment_activity CHECK (
    type != 'comment' OR comment IS NOT NULL
  )
);

-- =====================================================
-- INDICES
-- =====================================================

-- jobs
CREATE INDEX idx_jobs_company ON jobs (company_id);
CREATE INDEX idx_jobs_status ON jobs (status);
CREATE INDEX idx_jobs_published ON jobs (company_id, status, published_at)
  WHERE status IN ('open', 'paused');
CREATE INDEX idx_jobs_hiring_manager ON jobs (hiring_manager_id);
CREATE INDEX idx_jobs_department ON jobs (department);
CREATE INDEX idx_jobs_employment_type ON jobs (employment_type);
CREATE INDEX idx_jobs_title ON jobs USING gin (title gin_trgm_ops);

-- candidates
CREATE INDEX idx_candidates_company ON candidates (company_id);
CREATE INDEX idx_candidates_email ON candidates (email);
CREATE INDEX idx_candidates_name ON candidates USING gin (name gin_trgm_ops);
CREATE INDEX idx_candidates_source ON candidates (source);
CREATE INDEX idx_candidates_tags ON candidates USING gin (tags);
CREATE INDEX idx_candidates_resume_text ON candidates USING gin (to_tsvector('portuguese', COALESCE(resume_text, '')));

-- pipeline_stages
CREATE INDEX idx_pipeline_stages_company ON pipeline_stages (company_id);
CREATE INDEX idx_pipeline_stages_order ON pipeline_stages (company_id, order_index);
CREATE INDEX idx_pipeline_stages_default ON pipeline_stages (company_id, is_default)
  WHERE is_default = true;

-- applications
CREATE INDEX idx_applications_job ON applications (job_id);
CREATE INDEX idx_applications_candidate ON applications (candidate_id);
CREATE INDEX idx_applications_stage ON applications (stage_id);
CREATE INDEX idx_applications_status ON applications (status);
CREATE INDEX idx_applications_applied_at ON applications (applied_at);
CREATE INDEX idx_applications_rating ON applications (rating);
CREATE INDEX idx_applications_job_stage ON applications (job_id, stage_id)
  WHERE status = 'active';

-- application_activities
CREATE INDEX idx_application_activities_application ON application_activities (application_id);
CREATE INDEX idx_application_activities_type ON application_activities (type);
CREATE INDEX idx_application_activities_created_at ON application_activities (created_at);
CREATE INDEX idx_application_activities_created_by ON application_activities (created_by);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER trigger_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_pipeline_stages_updated_at
  BEFORE UPDATE ON pipeline_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para registrar atividade ao mudar estagio
CREATE OR REPLACE FUNCTION record_stage_change_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.stage_id != NEW.stage_id THEN
    INSERT INTO application_activities (
      application_id,
      type,
      from_stage_id,
      to_stage_id,
      created_by
    )
    VALUES (
      NEW.id,
      'stage_change',
      OLD.stage_id,
      NEW.stage_id,
      -- Pegar usuario atual ou usar o primeiro admin da empresa
      COALESCE(
        auth.uid(),
        (SELECT id FROM profiles WHERE company_id = (
          SELECT company_id FROM jobs WHERE id = NEW.job_id
        ) AND role = 'admin' LIMIT 1)
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_record_stage_change
  AFTER UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION record_stage_change_activity();

-- Trigger para atualizar data de publicacao
CREATE OR REPLACE FUNCTION update_job_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('open', 'paused') AND OLD.status = 'draft' AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  ELSIF NEW.status = 'closed' AND NEW.closed_at IS NULL THEN
    NEW.closed_at := now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_job_dates
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_job_published_at();

-- =====================================================
-- FUNCOES AUXILIARES
-- =====================================================

-- Funcao para obter estatisticas de uma vaga
CREATE OR REPLACE FUNCTION get_job_stats(p_job_id UUID)
RETURNS TABLE (
  total_applications BIGINT,
  active_applications BIGINT,
  hired_count BIGINT,
  rejected_count BIGINT,
  avg_rating NUMERIC,
  applications_by_stage JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_applications,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT AS active_applications,
    COUNT(*) FILTER (WHERE status = 'hired')::BIGINT AS hired_count,
    COUNT(*) FILTER (WHERE status = 'rejected')::BIGINT AS rejected_count,
    ROUND(AVG(rating), 2) AS avg_rating,
    COALESCE(
      jsonb_object_agg(
        ps.name,
        stage_counts.count
      ) FILTER (WHERE ps.name IS NOT NULL),
      '{}'::jsonb
    ) AS applications_by_stage
  FROM applications a
  LEFT JOIN LATERAL (
    SELECT ps.name, COUNT(*) as count
    FROM applications a2
    JOIN pipeline_stages ps ON ps.id = a2.stage_id
    WHERE a2.job_id = p_job_id AND a2.status = 'active'
    GROUP BY ps.name, ps.order_index
    ORDER BY ps.order_index
  ) stage_counts ON true
  LEFT JOIN pipeline_stages ps ON true
  WHERE a.job_id = p_job_id
  GROUP BY applications_by_stage;
END;
$$ LANGUAGE plpgsql;

-- Funcao para criar estagios padrao do pipeline
CREATE OR REPLACE FUNCTION create_default_pipeline_stages(p_company_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Verificar se ja existem estagios
  IF EXISTS (SELECT 1 FROM pipeline_stages WHERE company_id = p_company_id) THEN
    RETURN;
  END IF;

  -- Criar estagios padrao
  INSERT INTO pipeline_stages (company_id, name, description, color, order_index, is_default)
  VALUES
    (p_company_id, 'Triagem', 'Analise inicial do curriculo', '#6B7280', 1, true),
    (p_company_id, 'Entrevista RH', 'Entrevista com RH', '#3B82F6', 2, false),
    (p_company_id, 'Teste Tecnico', 'Avaliacao tecnica', '#8B5CF6', 3, false),
    (p_company_id, 'Entrevista Tecnica', 'Entrevista com gestor', '#10B981', 4, false),
    (p_company_id, 'Proposta', 'Envio de proposta', '#F59E0B', 5, false),
    (p_company_id, 'Contratado', 'Candidato contratado', '#22C55E', 6, false);
END;
$$ LANGUAGE plpgsql;

-- Funcao para mesclar candidatos duplicados
CREATE OR REPLACE FUNCTION merge_candidates(
  p_keep_id UUID,
  p_merge_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Atualizar aplicacoes para o candidato mantido
  UPDATE applications
  SET candidate_id = p_keep_id
  WHERE candidate_id = p_merge_id;

  -- Deletar candidato duplicado
  DELETE FROM candidates WHERE id = p_merge_id;
END;
$$ LANGUAGE plpgsql;

-- Funcao para buscar candidatos por skills/keywords
CREATE OR REPLACE FUNCTION search_candidates(
  p_company_id UUID,
  p_search_query TEXT
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  current_position TEXT,
  resume_text TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.email,
    c.current_position,
    c.resume_text,
    ts_rank(
      to_tsvector('portuguese', COALESCE(c.resume_text, '') || ' ' || c.name),
      plainto_tsquery('portuguese', p_search_query)
    ) AS rank
  FROM candidates c
  WHERE c.company_id = p_company_id
  AND to_tsvector('portuguese', COALESCE(c.resume_text, '') || ' ' || c.name)
      @@ plainto_tsquery('portuguese', p_search_query)
  ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_activities ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies: jobs
-- =====================================================

-- Usuarios podem ver vagas da empresa
CREATE POLICY "Users can view company jobs"
  ON jobs FOR SELECT
  USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- Acesso publico para vagas publicadas externamente (portal de carreiras)
CREATE POLICY "Public can view published jobs"
  ON jobs FOR SELECT
  USING (
    status = 'open'
    AND publish_externally = true
  );

-- Admins e HR podem criar vagas
CREATE POLICY "Admins and HR can create jobs"
  ON jobs FOR INSERT
  WITH CHECK (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'hr')
    )
  );

-- Admins, HR e hiring managers podem atualizar vagas
CREATE POLICY "Admins, HR and hiring managers can update jobs"
  ON jobs FOR UPDATE
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
      AND (role IN ('admin', 'hr') OR id = hiring_manager_id)
    )
  );

-- Admins e HR podem deletar vagas
CREATE POLICY "Admins and HR can delete jobs"
  ON jobs FOR DELETE
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'hr')
    )
  );

-- =====================================================
-- RLS Policies: candidates
-- =====================================================

-- Usuarios podem ver candidatos da empresa
CREATE POLICY "Users can view company candidates"
  ON candidates FOR SELECT
  USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- Candidatos publicos podem ser criados (portal de carreiras)
CREATE POLICY "Public can create candidates"
  ON candidates FOR INSERT
  WITH CHECK (true);

-- Admins e HR podem gerenciar candidatos
CREATE POLICY "Admins and HR can manage candidates"
  ON candidates FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'hr')
    )
  );

-- =====================================================
-- RLS Policies: pipeline_stages
-- =====================================================

-- Usuarios podem ver estagios da empresa
CREATE POLICY "Users can view company pipeline stages"
  ON pipeline_stages FOR SELECT
  USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- Admins e HR podem gerenciar estagios
CREATE POLICY "Admins and HR can manage pipeline stages"
  ON pipeline_stages FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'hr')
    )
  );

-- =====================================================
-- RLS Policies: applications
-- =====================================================

-- Usuarios podem ver candidaturas da empresa
CREATE POLICY "Users can view company applications"
  ON applications FOR SELECT
  USING (
    job_id IN (
      SELECT id FROM jobs
      WHERE company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Candidaturas publicas podem ser criadas (portal de carreiras)
CREATE POLICY "Public can create applications"
  ON applications FOR INSERT
  WITH CHECK (
    job_id IN (
      SELECT id FROM jobs
      WHERE status = 'open' AND publish_externally = true
    )
  );

-- Admins e HR podem gerenciar candidaturas
CREATE POLICY "Admins and HR can manage applications"
  ON applications FOR ALL
  USING (
    job_id IN (
      SELECT id FROM jobs
      WHERE company_id = (
        SELECT company_id FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'hr')
      )
    )
  );

-- Hiring managers podem gerenciar candidaturas de suas vagas
CREATE POLICY "Hiring managers can manage their job applications"
  ON applications FOR ALL
  USING (
    job_id IN (
      SELECT id FROM jobs
      WHERE hiring_manager_id = auth.uid()
    )
  );

-- =====================================================
-- RLS Policies: application_activities
-- =====================================================

-- Usuarios podem ver atividades de candidaturas da empresa
CREATE POLICY "Users can view company application activities"
  ON application_activities FOR SELECT
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE j.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Usuarios podem criar atividades em candidaturas da empresa
CREATE POLICY "Users can create application activities"
  ON application_activities FOR INSERT
  WITH CHECK (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE j.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
    AND created_by = auth.uid()
  );

-- Admins e HR podem gerenciar todas as atividades
CREATE POLICY "Admins and HR can manage all activities"
  ON application_activities FOR ALL
  USING (
    application_id IN (
      SELECT a.id FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE j.company_id = (
        SELECT company_id FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'hr')
      )
    )
  );

-- =====================================================
-- VIEWS
-- =====================================================

-- View de vagas com estatisticas
CREATE VIEW v_jobs_with_stats AS
SELECT
  j.*,
  COUNT(a.id) AS total_applications,
  COUNT(a.id) FILTER (WHERE a.status = 'active') AS active_applications,
  COUNT(a.id) FILTER (WHERE a.status = 'hired') AS hired_count,
  COUNT(a.id) FILTER (WHERE a.status = 'rejected') AS rejected_count,
  ROUND(AVG(a.rating), 2) AS avg_rating
FROM jobs j
LEFT JOIN applications a ON a.job_id = j.id
GROUP BY j.id;

-- View de candidaturas com detalhes
CREATE VIEW v_applications_with_details AS
SELECT
  a.*,
  c.name AS candidate_name,
  c.email AS candidate_email,
  c.phone AS candidate_phone,
  c.linkedin_url AS candidate_linkedin,
  c.resume_url AS candidate_resume,
  c.current_position AS candidate_current_position,
  c.current_company AS candidate_current_company,
  j.title AS job_title,
  j.department AS job_department,
  ps.name AS stage_name,
  ps.color AS stage_color,
  ps.order_index AS stage_order
FROM applications a
JOIN candidates c ON c.id = a.candidate_id
JOIN jobs j ON j.id = a.job_id
JOIN pipeline_stages ps ON ps.id = a.stage_id;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE jobs IS 'Vagas de emprego publicadas pela empresa';
COMMENT ON TABLE candidates IS 'Banco de candidatos da empresa';
COMMENT ON TABLE pipeline_stages IS 'Estagios do pipeline de recrutamento';
COMMENT ON TABLE applications IS 'Candidaturas dos candidatos as vagas';
COMMENT ON TABLE application_activities IS 'Historico de atividades nas candidaturas';

COMMENT ON COLUMN jobs.publish_externally IS 'Publicar no portal publico de carreiras';
COMMENT ON COLUMN jobs.publish_internally IS 'Publicar internamente para funcionarios';
COMMENT ON COLUMN candidates.resume_text IS 'Texto extraido do curriculo para busca full-text';
COMMENT ON COLUMN candidates.gdpr_data_retention_until IS 'Data limite para retencao de dados (LGPD/GDPR)';
COMMENT ON COLUMN pipeline_stages.is_default IS 'Estagio inicial padrao para novas candidaturas';
COMMENT ON COLUMN pipeline_stages.is_final IS 'Estagio final indicando contratacao';
COMMENT ON COLUMN applications.employee_id IS 'Referencia ao funcionario se o candidato foi contratado';
