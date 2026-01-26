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
