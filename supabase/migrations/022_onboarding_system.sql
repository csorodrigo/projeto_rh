-- =====================================================
-- Migration 022: Onboarding System
-- Sistema de integração de novos funcionários
-- =====================================================

-- =====================================================
-- TABELA: employee_onboarding
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamentos
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  application_id UUID REFERENCES job_applications(id), -- Referência à candidatura original

  -- Checklist de tarefas
  checklist JSONB DEFAULT '[]'::jsonb,
  -- Estrutura:
  -- [
  --   {
  --     "id": "doc-1",
  --     "task": "Coletar RG e CPF",
  --     "category": "documents",
  --     "completed": false,
  --     "completed_by": null,
  --     "completed_at": null,
  --     "assigned_to": "hr",
  --     "due_date": "2024-01-15",
  --     "notes": "",
  --     "priority": "high"
  --   }
  -- ]

  -- Progresso
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100), -- Porcentagem (0-100)
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,

  -- Datas importantes
  start_date DATE NOT NULL,
  first_day DATE NOT NULL,
  orientation_date DATE,
  orientation_completed_at TIMESTAMP WITH TIME ZONE,

  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed')),
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Pessoas envolvidas
  buddy_id UUID REFERENCES employees(id), -- Padrinho/madrinha
  hr_contact_id UUID REFERENCES profiles(id), -- Contato principal do RH

  -- Equipamentos solicitados
  equipment_requested JSONB DEFAULT '[]'::jsonb,
  -- [{"type": "notebook", "model": "Dell Latitude", "requested_at": "...", "delivered_at": null}]

  -- Acessos criados
  accesses_created JSONB DEFAULT '[]'::jsonb,
  -- [{"system": "email", "username": "...", "created_at": "...", "status": "active"}]

  -- Feedback
  new_hire_feedback TEXT,
  new_hire_rating INTEGER CHECK (new_hire_rating >= 1 AND new_hire_rating <= 5),
  feedback_submitted_at TIMESTAMP WITH TIME ZONE,

  -- Manager feedback
  manager_feedback TEXT,
  manager_rating INTEGER CHECK (manager_rating >= 1 AND manager_rating <= 5),
  manager_feedback_at TIMESTAMP WITH TIME ZONE,

  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_onboarding_per_employee UNIQUE (employee_id)
);

-- =====================================================
-- TABELA: onboarding_tasks_log
-- =====================================================

CREATE TABLE IF NOT EXISTS onboarding_tasks_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamentos
  onboarding_id UUID NOT NULL REFERENCES employee_onboarding(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Detalhes da tarefa
  task_id TEXT NOT NULL, -- ID da tarefa no JSONB
  task_name TEXT NOT NULL,

  -- Ação
  action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'completed', 'uncompleted', 'updated', 'deleted', 'assigned')),

  -- Antes e depois
  old_value JSONB,
  new_value JSONB,

  -- Quem e quando
  performed_by UUID REFERENCES profiles(id),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Notas
  notes TEXT
);

-- =====================================================
-- TABELA: onboarding_templates (Templates de checklist)
-- =====================================================

CREATE TABLE IF NOT EXISTS onboarding_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Identificação
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Departamento específico
  department VARCHAR(100), -- null = template geral

  -- Template do checklist
  checklist_template JSONB DEFAULT '[]'::jsonb,
  -- Mesmo formato do checklist, mas sem completed_at, completed_by

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,

  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- INDICES
-- =====================================================

-- employee_onboarding
CREATE INDEX idx_onboarding_company_id ON employee_onboarding(company_id);
CREATE INDEX idx_onboarding_employee_id ON employee_onboarding(employee_id);
CREATE INDEX idx_onboarding_application_id ON employee_onboarding(application_id);
CREATE INDEX idx_onboarding_status ON employee_onboarding(status);
CREATE INDEX idx_onboarding_first_day ON employee_onboarding(first_day);
CREATE INDEX idx_onboarding_buddy_id ON employee_onboarding(buddy_id);

-- onboarding_tasks_log
CREATE INDEX idx_onboarding_log_onboarding_id ON onboarding_tasks_log(onboarding_id);
CREATE INDEX idx_onboarding_log_performed_at ON onboarding_tasks_log(performed_at DESC);

-- onboarding_templates
CREATE INDEX idx_onboarding_templates_company_id ON onboarding_templates(company_id);
CREATE INDEX idx_onboarding_templates_is_active ON onboarding_templates(is_active);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para updated_at
CREATE TRIGGER update_employee_onboarding_updated_at
  BEFORE UPDATE ON employee_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_recruitment_updated_at();

CREATE TRIGGER update_onboarding_templates_updated_at
  BEFORE UPDATE ON onboarding_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_recruitment_updated_at();

-- Trigger para atualizar progresso de onboarding
CREATE OR REPLACE FUNCTION update_onboarding_progress()
RETURNS TRIGGER AS $$
DECLARE
  total INTEGER;
  completed INTEGER;
  progress_pct INTEGER;
BEGIN
  -- Contar tarefas no checklist
  SELECT
    jsonb_array_length(NEW.checklist),
    (SELECT COUNT(*) FROM jsonb_array_elements(NEW.checklist) WHERE (value->>'completed')::boolean = true)
  INTO total, completed;

  -- Calcular porcentagem
  IF total > 0 THEN
    progress_pct := ROUND((completed::NUMERIC / total::NUMERIC) * 100);
  ELSE
    progress_pct := 0;
  END IF;

  -- Atualizar campos
  NEW.total_tasks := total;
  NEW.completed_tasks := completed;
  NEW.progress := progress_pct;

  -- Atualizar status
  IF progress_pct = 100 AND NEW.status != 'completed' THEN
    NEW.status := 'completed';
    NEW.completed_at := NOW();
  ELSIF progress_pct > 0 AND progress_pct < 100 AND NEW.status = 'pending' THEN
    NEW.status := 'in_progress';
  END IF;

  -- Verificar se está atrasado
  IF NEW.first_day < CURRENT_DATE AND progress_pct < 100 THEN
    NEW.status := 'delayed';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_onboarding_progress
  BEFORE INSERT OR UPDATE OF checklist ON employee_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_progress();

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

ALTER TABLE employee_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_tasks_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_templates ENABLE ROW LEVEL SECURITY;

-- Policies para employee_onboarding
CREATE POLICY "Users can view onboarding from their company"
  ON employee_onboarding FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "HR users can manage onboarding"
  ON employee_onboarding FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'company_admin', 'hr_manager', 'hr_analyst')
    )
  );

-- Policies para onboarding_tasks_log
CREATE POLICY "Users can view onboarding logs from their company"
  ON onboarding_tasks_log FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "HR users can create logs"
  ON onboarding_tasks_log FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'company_admin', 'hr_manager', 'hr_analyst')
    )
  );

-- Policies para onboarding_templates
CREATE POLICY "Users can view templates from their company"
  ON onboarding_templates FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "HR managers can manage templates"
  ON onboarding_templates FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'company_admin', 'hr_manager')
    )
  );

-- =====================================================
-- FUNCOES AUXILIARES
-- =====================================================

-- Função para obter candidatos pendentes de conversão
CREATE OR REPLACE FUNCTION get_pending_conversions(p_company_id UUID)
RETURNS TABLE (
  application_id UUID,
  candidate_id UUID,
  candidate_name TEXT,
  candidate_email TEXT,
  candidate_phone TEXT,
  job_title TEXT,
  job_department TEXT,
  offer_salary NUMERIC(10, 2),
  hired_at TIMESTAMP WITH TIME ZONE,
  days_since_hire INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ja.id as application_id,
    c.id as candidate_id,
    c.full_name as candidate_name,
    c.email as candidate_email,
    c.phone as candidate_phone,
    j.title as job_title,
    j.department as job_department,
    ol.salary as offer_salary,
    ja.hired_at,
    EXTRACT(DAY FROM NOW() - ja.hired_at)::INTEGER as days_since_hire
  FROM job_applications ja
  INNER JOIN candidates c ON ja.candidate_id = c.id
  INNER JOIN jobs j ON ja.job_id = j.id
  LEFT JOIN offer_letters ol ON ol.application_id = ja.id AND ol.status = 'accepted'
  WHERE ja.company_id = p_company_id
  AND ja.status = 'hired'
  AND ja.employee_id IS NULL
  ORDER BY ja.hired_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Função para validar se candidato pode ser convertido
CREATE OR REPLACE FUNCTION can_convert_candidate(p_application_id UUID)
RETURNS TABLE (
  can_convert BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  v_application job_applications;
  v_candidate candidates;
  v_offer offer_letters;
BEGIN
  -- Buscar application
  SELECT * INTO v_application FROM job_applications WHERE id = p_application_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Candidatura não encontrada';
    RETURN;
  END IF;

  -- Verificar se já foi convertido
  IF v_application.employee_id IS NOT NULL THEN
    RETURN QUERY SELECT false, 'Candidato já foi convertido em funcionário';
    RETURN;
  END IF;

  -- Verificar se foi contratado
  IF v_application.status != 'hired' OR v_application.hired_at IS NULL THEN
    RETURN QUERY SELECT false, 'Candidato não foi marcado como contratado';
    RETURN;
  END IF;

  -- Buscar candidato
  SELECT * INTO v_candidate FROM candidates WHERE id = v_application.candidate_id;

  -- Verificar blacklist
  IF v_candidate.is_blacklisted THEN
    RETURN QUERY SELECT false, 'Candidato está na lista negra: ' || COALESCE(v_candidate.blacklist_reason, 'Sem motivo especificado');
    RETURN;
  END IF;

  -- Verificar se tem oferta aceita
  SELECT * INTO v_offer FROM offer_letters WHERE application_id = p_application_id AND status = 'accepted';
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Nenhuma oferta aceita encontrada';
    RETURN;
  END IF;

  -- Tudo OK
  RETURN QUERY SELECT true, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Função para criar checklist padrão de onboarding
CREATE OR REPLACE FUNCTION create_default_onboarding_checklist(
  p_company_id UUID,
  p_department TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_template onboarding_templates;
  v_checklist JSONB;
BEGIN
  -- Tentar buscar template específico do departamento
  IF p_department IS NOT NULL THEN
    SELECT * INTO v_template
    FROM onboarding_templates
    WHERE company_id = p_company_id
    AND department = p_department
    AND is_active = true
    ORDER BY is_default DESC, created_at DESC
    LIMIT 1;
  END IF;

  -- Se não encontrou, buscar template geral
  IF NOT FOUND OR v_template IS NULL THEN
    SELECT * INTO v_template
    FROM onboarding_templates
    WHERE company_id = p_company_id
    AND department IS NULL
    AND is_active = true
    ORDER BY is_default DESC, created_at DESC
    LIMIT 1;
  END IF;

  -- Se encontrou template, retornar
  IF FOUND AND v_template.checklist_template IS NOT NULL THEN
    RETURN v_template.checklist_template;
  END IF;

  -- Se não tem template, criar checklist padrão
  v_checklist := '[
    {
      "id": "doc-rg-cpf",
      "task": "Coletar RG e CPF",
      "category": "documents",
      "completed": false,
      "assigned_to": "hr",
      "priority": "high",
      "due_days": 0
    },
    {
      "id": "doc-ctps",
      "task": "Coletar CTPS",
      "category": "documents",
      "completed": false,
      "assigned_to": "hr",
      "priority": "high",
      "due_days": 0
    },
    {
      "id": "doc-comprovante",
      "task": "Coletar comprovante de residência",
      "category": "documents",
      "completed": false,
      "assigned_to": "hr",
      "priority": "medium",
      "due_days": 3
    },
    {
      "id": "doc-conta-bancaria",
      "task": "Coletar dados bancários",
      "category": "documents",
      "completed": false,
      "assigned_to": "hr",
      "priority": "high",
      "due_days": 0
    },
    {
      "id": "sys-email",
      "task": "Criar conta de e-mail corporativo",
      "category": "systems",
      "completed": false,
      "assigned_to": "it",
      "priority": "high",
      "due_days": -2
    },
    {
      "id": "sys-erp",
      "task": "Criar acesso ao sistema ERP",
      "category": "systems",
      "completed": false,
      "assigned_to": "it",
      "priority": "medium",
      "due_days": 0
    },
    {
      "id": "equip-notebook",
      "task": "Solicitar notebook",
      "category": "equipment",
      "completed": false,
      "assigned_to": "it",
      "priority": "high",
      "due_days": -5
    },
    {
      "id": "equip-celular",
      "task": "Solicitar celular corporativo (se aplicável)",
      "category": "equipment",
      "completed": false,
      "assigned_to": "it",
      "priority": "low",
      "due_days": 0
    },
    {
      "id": "train-integracao",
      "task": "Agendar treinamento de integração",
      "category": "training",
      "completed": false,
      "assigned_to": "hr",
      "priority": "high",
      "due_days": 0
    },
    {
      "id": "train-sistema",
      "task": "Agendar treinamento nos sistemas",
      "category": "training",
      "completed": false,
      "assigned_to": "manager",
      "priority": "medium",
      "due_days": 1
    },
    {
      "id": "admin-cracha",
      "task": "Providenciar crachá",
      "category": "administrative",
      "completed": false,
      "assigned_to": "hr",
      "priority": "medium",
      "due_days": 0
    },
    {
      "id": "admin-welcome",
      "task": "Enviar e-mail de boas-vindas",
      "category": "administrative",
      "completed": false,
      "assigned_to": "hr",
      "priority": "high",
      "due_days": -1
    },
    {
      "id": "team-apresentacao",
      "task": "Apresentar à equipe",
      "category": "team",
      "completed": false,
      "assigned_to": "manager",
      "priority": "high",
      "due_days": 0
    },
    {
      "id": "team-buddy",
      "task": "Designar padrinho/madrinha",
      "category": "team",
      "completed": false,
      "assigned_to": "manager",
      "priority": "high",
      "due_days": 0
    }
  ]'::jsonb;

  RETURN v_checklist;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE employee_onboarding IS 'Processo de onboarding/integração de novos funcionários';
COMMENT ON TABLE onboarding_tasks_log IS 'Log de alterações em tarefas de onboarding para auditoria';
COMMENT ON TABLE onboarding_templates IS 'Templates de checklist de onboarding por departamento';

COMMENT ON COLUMN employee_onboarding.buddy_id IS 'Funcionário que será padrinho/madrinha do novo colaborador';
COMMENT ON COLUMN employee_onboarding.progress IS 'Porcentagem de conclusão do onboarding (0-100)';
COMMENT ON COLUMN employee_onboarding.equipment_requested IS 'Lista de equipamentos solicitados para o novo funcionário';
COMMENT ON COLUMN employee_onboarding.accesses_created IS 'Lista de acessos/sistemas criados para o novo funcionário';
