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
