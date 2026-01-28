-- =====================================================
-- BATCH_05_EVALUATIONS
-- Files: 009_evaluations.sql, 010_pdi.sql
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


