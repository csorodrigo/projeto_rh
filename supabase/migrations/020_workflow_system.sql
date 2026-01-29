-- Migration: Sistema de Workflows de Aprovação Multi-nível
-- Descrição: Tabelas e funções para gerenciar workflows configuráveis de aprovação
-- Data: 2026-01-29

-- =====================================================
-- TABLES
-- =====================================================

-- Definições de workflow (configurações de tipos de workflow)
CREATE TABLE IF NOT EXISTS workflow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  rules JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para workflow_definitions
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_type ON workflow_definitions(type);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_active ON workflow_definitions(active);

-- Instâncias de workflow (processos de aprovação em execução)
CREATE TABLE IF NOT EXISTS workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  workflow_type VARCHAR(50) NOT NULL REFERENCES workflow_definitions(type),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  requester_id UUID NOT NULL REFERENCES auth.users(id),
  current_step INT DEFAULT 1,
  total_steps INT NOT NULL DEFAULT 1,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  sla_due_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para workflow_instances
CREATE INDEX IF NOT EXISTS idx_workflow_instances_company ON workflow_instances(company_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_status ON workflow_instances(status, current_step);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_sla ON workflow_instances(sla_due_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_workflow_instances_entity ON workflow_instances(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_requester ON workflow_instances(requester_id);

-- Aprovações individuais (steps de aprovação)
CREATE TABLE IF NOT EXISTS workflow_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  step_level INT NOT NULL,
  approver_id UUID NOT NULL REFERENCES auth.users(id),
  decision VARCHAR(20) CHECK (decision IN ('approved', 'rejected', 'skipped', NULL)),
  comments TEXT,
  decided_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sla_due_at TIMESTAMP WITH TIME ZONE,
  delegated_from UUID REFERENCES auth.users(id),
  UNIQUE(instance_id, step_level, approver_id)
);

-- Índices para workflow_approvals
CREATE INDEX IF NOT EXISTS idx_workflow_approvals_instance ON workflow_approvals(instance_id);
CREATE INDEX IF NOT EXISTS idx_workflow_approvals_approver ON workflow_approvals(approver_id, decision);
CREATE INDEX IF NOT EXISTS idx_workflow_approvals_pending ON workflow_approvals(approver_id) WHERE decision IS NULL;

-- Delegações de aprovação
CREATE TABLE IF NOT EXISTS workflow_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id),
  to_user_id UUID NOT NULL REFERENCES auth.users(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (end_date >= start_date),
  CHECK (from_user_id != to_user_id)
);

-- Índices para workflow_delegations
CREATE INDEX IF NOT EXISTS idx_workflow_delegations_from ON workflow_delegations(from_user_id, active);
CREATE INDEX IF NOT EXISTS idx_workflow_delegations_to ON workflow_delegations(to_user_id, active);
CREATE INDEX IF NOT EXISTS idx_workflow_delegations_dates ON workflow_delegations(start_date, end_date) WHERE active = TRUE;

-- Histórico de ações do workflow (auditoria)
CREATE TABLE IF NOT EXISTS workflow_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  performed_by UUID REFERENCES auth.users(id),
  old_status VARCHAR(20),
  new_status VARCHAR(20),
  step_level INT,
  comments TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para workflow_history
CREATE INDEX IF NOT EXISTS idx_workflow_history_instance ON workflow_history(instance_id);
CREATE INDEX IF NOT EXISTS idx_workflow_history_created ON workflow_history(created_at DESC);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_workflow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_workflow_definitions_updated_at ON workflow_definitions;
CREATE TRIGGER update_workflow_definitions_updated_at
  BEFORE UPDATE ON workflow_definitions
  FOR EACH ROW EXECUTE FUNCTION update_workflow_updated_at();

DROP TRIGGER IF EXISTS update_workflow_instances_updated_at ON workflow_instances;
CREATE TRIGGER update_workflow_instances_updated_at
  BEFORE UPDATE ON workflow_instances
  FOR EACH ROW EXECUTE FUNCTION update_workflow_updated_at();

DROP TRIGGER IF EXISTS update_workflow_delegations_updated_at ON workflow_delegations;
CREATE TRIGGER update_workflow_delegations_updated_at
  BEFORE UPDATE ON workflow_delegations
  FOR EACH ROW EXECUTE FUNCTION update_workflow_updated_at();

-- Função para verificar delegação ativa
CREATE OR REPLACE FUNCTION get_active_delegate(
  p_user_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID AS $$
DECLARE
  v_delegate_id UUID;
BEGIN
  SELECT to_user_id INTO v_delegate_id
  FROM workflow_delegations
  WHERE from_user_id = p_user_id
    AND active = TRUE
    AND p_date BETWEEN start_date AND end_date
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN v_delegate_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Função para obter aprovadores de um step
CREATE OR REPLACE FUNCTION get_step_approvers(
  p_company_id UUID,
  p_workflow_type VARCHAR(50),
  p_step_level INT,
  p_requester_id UUID DEFAULT NULL
)
RETURNS TABLE(user_id UUID, user_name TEXT, user_email TEXT, role VARCHAR(50)) AS $$
DECLARE
  v_step_config JSONB;
  v_required_role VARCHAR(50);
BEGIN
  -- Buscar configuração do step
  SELECT steps->((p_step_level - 1)::int) INTO v_step_config
  FROM workflow_definitions
  WHERE type = p_workflow_type AND active = TRUE;

  IF v_step_config IS NULL THEN
    RETURN;
  END IF;

  v_required_role := v_step_config->>'role';

  -- Se o role for 'manager', buscar o manager do solicitante
  IF v_required_role = 'manager' AND p_requester_id IS NOT NULL THEN
    RETURN QUERY
    SELECT
      e.manager_id,
      p.name,
      p.email,
      p.role
    FROM employees e
    INNER JOIN profiles p ON p.id = e.manager_id
    WHERE e.id IN (
      SELECT employee_id FROM profiles WHERE id = p_requester_id
    )
    AND e.manager_id IS NOT NULL;
  -- Caso contrário, buscar por role
  ELSE
    RETURN QUERY
    SELECT
      p.id,
      p.name,
      p.email,
      p.role
    FROM profiles p
    WHERE p.company_id = p_company_id
      AND p.role = v_required_role;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Função para calcular SLA
CREATE OR REPLACE FUNCTION calculate_sla_due_at(
  p_workflow_type VARCHAR(50),
  p_step_level INT,
  p_start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  v_sla_hours INT;
  v_step_config JSONB;
BEGIN
  -- Buscar SLA do step
  SELECT steps->((p_step_level - 1)::int) INTO v_step_config
  FROM workflow_definitions
  WHERE type = p_workflow_type AND active = TRUE;

  IF v_step_config IS NULL THEN
    RETURN NULL;
  END IF;

  v_sla_hours := COALESCE((v_step_config->>'sla')::int, 24);

  RETURN p_start_time + (v_sla_hours || ' hours')::interval;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_history ENABLE ROW LEVEL SECURITY;

-- Políticas para workflow_definitions (todos podem ler, apenas super_admin pode modificar)
CREATE POLICY "workflow_definitions_select" ON workflow_definitions
  FOR SELECT TO authenticated
  USING (active = TRUE);

CREATE POLICY "workflow_definitions_all" ON workflow_definitions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Políticas para workflow_instances
CREATE POLICY "workflow_instances_select" ON workflow_instances
  FOR SELECT TO authenticated
  USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "workflow_instances_insert" ON workflow_instances
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    AND requester_id = auth.uid()
  );

CREATE POLICY "workflow_instances_update" ON workflow_instances
  FOR UPDATE TO authenticated
  USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- Políticas para workflow_approvals
CREATE POLICY "workflow_approvals_select" ON workflow_approvals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflow_instances wi
      WHERE wi.id = workflow_approvals.instance_id
      AND wi.company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "workflow_approvals_insert" ON workflow_approvals
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflow_instances wi
      WHERE wi.id = workflow_approvals.instance_id
      AND wi.company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "workflow_approvals_update" ON workflow_approvals
  FOR UPDATE TO authenticated
  USING (
    approver_id = auth.uid() OR
    approver_id IN (
      SELECT from_user_id FROM workflow_delegations
      WHERE to_user_id = auth.uid()
      AND active = TRUE
      AND CURRENT_DATE BETWEEN start_date AND end_date
    )
  )
  WITH CHECK (
    approver_id = auth.uid() OR
    approver_id IN (
      SELECT from_user_id FROM workflow_delegations
      WHERE to_user_id = auth.uid()
      AND active = TRUE
      AND CURRENT_DATE BETWEEN start_date AND end_date
    )
  );

-- Políticas para workflow_delegations
CREATE POLICY "workflow_delegations_select" ON workflow_delegations
  FOR SELECT TO authenticated
  USING (
    from_user_id = auth.uid() OR to_user_id = auth.uid()
  );

CREATE POLICY "workflow_delegations_insert" ON workflow_delegations
  FOR INSERT TO authenticated
  WITH CHECK (
    from_user_id = auth.uid()
  );

CREATE POLICY "workflow_delegations_update" ON workflow_delegations
  FOR UPDATE TO authenticated
  USING (
    from_user_id = auth.uid()
  )
  WITH CHECK (
    from_user_id = auth.uid()
  );

-- Políticas para workflow_history
CREATE POLICY "workflow_history_select" ON workflow_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflow_instances wi
      WHERE wi.id = workflow_history.instance_id
      AND wi.company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "workflow_history_insert" ON workflow_history
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflow_instances wi
      WHERE wi.id = workflow_history.instance_id
      AND wi.company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- =====================================================
-- SEED DATA - Definições de Workflow Padrão
-- =====================================================

INSERT INTO workflow_definitions (type, name, description, steps, rules) VALUES
-- Workflow de Ausência
('absence', 'Aprovação de Ausência', 'Workflow para aprovação de solicitações de ausência (férias, licenças, etc.)',
'[
  {"level": 1, "role": "manager", "sla": 24, "name": "Aprovação do Gestor"},
  {"level": 2, "role": "hr_manager", "sla": 48, "name": "Aprovação do RH"}
]'::jsonb,
'{
  "skipIfAmount": {"field": "days", "operator": "<", "value": 2},
  "requireAll": false,
  "autoApprove": null
}'::jsonb),

-- Workflow de Hora Extra
('overtime', 'Aprovação de Hora Extra', 'Workflow para aprovação de horas extras',
'[
  {"level": 1, "role": "manager", "sla": 12, "name": "Aprovação do Gestor"}
]'::jsonb,
'{
  "autoApprove": {"field": "hours", "operator": "<", "value": 2},
  "requireAll": false
}'::jsonb),

-- Workflow de Ajuste de Ponto
('time_adjustment', 'Ajuste de Ponto', 'Workflow para aprovação de ajustes de registro de ponto',
'[
  {"level": 1, "role": "manager", "sla": 24, "name": "Aprovação do Gestor"},
  {"level": 2, "role": "hr_manager", "sla": 48, "name": "Aprovação do RH"}
]'::jsonb,
'{
  "requireAll": true,
  "autoApprove": null
}'::jsonb),

-- Workflow de Documento
('document_approval', 'Aprovação de Documento', 'Workflow para aprovação de documentos de funcionários',
'[
  {"level": 1, "role": "hr_analyst", "sla": 24, "name": "Validação do RH"}
]'::jsonb,
'{
  "requireAll": false,
  "autoApprove": null
}'::jsonb),

-- Workflow de Mudança de Dados
('data_change', 'Mudança de Dados Cadastrais', 'Workflow para aprovação de mudanças em dados cadastrais',
'[
  {"level": 1, "role": "hr_analyst", "sla": 24, "name": "Validação do RH"}
]'::jsonb,
'{
  "requireAll": false,
  "autoApprove": null
}'::jsonb)

ON CONFLICT (type) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE workflow_definitions IS 'Definições de tipos de workflow com configurações de steps e regras';
COMMENT ON TABLE workflow_instances IS 'Instâncias de workflow em execução para aprovações';
COMMENT ON TABLE workflow_approvals IS 'Aprovações individuais de cada step do workflow';
COMMENT ON TABLE workflow_delegations IS 'Delegações temporárias de aprovações entre usuários';
COMMENT ON TABLE workflow_history IS 'Histórico de todas as ações realizadas em workflows para auditoria';

COMMENT ON COLUMN workflow_instances.sla_due_at IS 'Data/hora limite para completar o step atual (SLA)';
COMMENT ON COLUMN workflow_approvals.delegated_from IS 'Se a aprovação foi delegada, ID do aprovador original';
COMMENT ON COLUMN workflow_delegations.active IS 'Se a delegação está ativa (pode ser desativada manualmente)';
