-- Sistema de Templates de Relatórios Customizáveis
-- Created: 2026-01-29

-- Habilitar UUID se ainda não estiver habilitado
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Templates de Relatórios
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- employees, time_records, absences, payroll, etc
  config JSONB NOT NULL, -- { columns, filters, sort, groupBy, etc }
  format VARCHAR(10) DEFAULT 'csv', -- csv, pdf, xlsx
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_type CHECK (type IN (
    'employees',
    'time_records',
    'absences',
    'payroll',
    'evaluations',
    'health',
    'documents',
    'pdi',
    'custom'
  )),

  CONSTRAINT valid_format CHECK (format IN ('csv', 'pdf', 'xlsx'))
);

-- Agendamentos de Relatórios
CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
  frequency VARCHAR(20) NOT NULL, -- daily, weekly, monthly, custom
  cron_expression VARCHAR(100), -- Para agendamentos customizados
  time TIME, -- Horário de execução
  day_of_week INT, -- 1-7 (Segunda a Domingo)
  day_of_month INT, -- 1-31
  date_period VARCHAR(50) DEFAULT 'last_month', -- last_week, last_month, current_month, last_quarter, etc
  recipients TEXT[] DEFAULT '{}', -- Array de emails
  next_run TIMESTAMP WITH TIME ZONE,
  last_run TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_frequency CHECK (frequency IN ('daily', 'weekly', 'monthly', 'custom')),
  CONSTRAINT valid_day_of_week CHECK (day_of_week IS NULL OR (day_of_week BETWEEN 1 AND 7)),
  CONSTRAINT valid_day_of_month CHECK (day_of_month IS NULL OR (day_of_month BETWEEN 1 AND 31)),
  CONSTRAINT valid_date_period CHECK (date_period IN (
    'today',
    'yesterday',
    'last_week',
    'last_month',
    'current_week',
    'current_month',
    'last_quarter',
    'current_quarter',
    'last_year',
    'current_year',
    'custom'
  ))
);

-- Histórico de Relatórios Gerados
CREATE TABLE IF NOT EXISTS report_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES report_schedules(id) ON DELETE SET NULL,
  generated_by UUID REFERENCES auth.users(id),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  format VARCHAR(10) NOT NULL,
  file_url VARCHAR(500),
  file_size INT, -- Tamanho em bytes
  record_count INT, -- Número de registros no relatório
  date_range_start DATE,
  date_range_end DATE,
  status VARCHAR(20) DEFAULT 'success', -- success, error, processing
  error_message TEXT,
  processing_time_ms INT, -- Tempo de processamento em milissegundos

  CONSTRAINT valid_format CHECK (format IN ('csv', 'pdf', 'xlsx')),
  CONSTRAINT valid_status CHECK (status IN ('success', 'error', 'processing'))
);

-- Favoritos de Templates
CREATE TABLE IF NOT EXISTS report_favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  PRIMARY KEY (user_id, template_id)
);

-- Compartilhamento de Templates
CREATE TABLE IF NOT EXISTS report_template_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id),
  shared_with UUID NOT NULL REFERENCES auth.users(id),
  permission VARCHAR(10) DEFAULT 'view', -- view, edit, execute
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_permission CHECK (permission IN ('view', 'edit', 'execute')),
  CONSTRAINT no_self_share CHECK (shared_by != shared_with),
  UNIQUE (template_id, shared_with)
);

-- Categorias de Templates
CREATE TABLE IF NOT EXISTS report_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7), -- Hex color
  icon VARCHAR(50), -- Icon name
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE (company_id, name)
);

-- Relacionamento Templates-Categorias
CREATE TABLE IF NOT EXISTS report_template_categories (
  template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES report_categories(id) ON DELETE CASCADE,

  PRIMARY KEY (template_id, category_id)
);

-- Índices para performance
CREATE INDEX idx_templates_company ON report_templates(company_id);
CREATE INDEX idx_templates_type ON report_templates(type);
CREATE INDEX idx_templates_created_by ON report_templates(created_by);
CREATE INDEX idx_schedules_template ON report_schedules(template_id);
CREATE INDEX idx_schedules_next_run ON report_schedules(next_run) WHERE active = TRUE;
CREATE INDEX idx_schedules_active ON report_schedules(active);
CREATE INDEX idx_history_template ON report_history(template_id);
CREATE INDEX idx_history_generated_at ON report_history(generated_at);
CREATE INDEX idx_history_status ON report_history(status);
CREATE INDEX idx_favorites_user ON report_favorites(user_id);
CREATE INDEX idx_favorites_template ON report_favorites(template_id);
CREATE INDEX idx_shares_template ON report_template_shares(template_id);
CREATE INDEX idx_shares_shared_with ON report_template_shares(shared_with);
CREATE INDEX idx_categories_company ON report_categories(company_id);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_report_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_report_templates_updated_at
  BEFORE UPDATE ON report_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_report_templates_updated_at();

CREATE OR REPLACE FUNCTION update_report_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_report_schedules_updated_at
  BEFORE UPDATE ON report_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_report_schedules_updated_at();

-- Função para calcular próxima execução
CREATE OR REPLACE FUNCTION calculate_next_run(
  p_frequency VARCHAR,
  p_time TIME,
  p_day_of_week INT,
  p_day_of_month INT,
  p_cron_expression VARCHAR,
  p_from_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  v_next_run TIMESTAMP WITH TIME ZONE;
  v_base_date DATE;
BEGIN
  v_base_date := p_from_date::DATE;

  CASE p_frequency
    WHEN 'daily' THEN
      -- Próximo dia no horário especificado
      v_next_run := (v_base_date + INTERVAL '1 day' + p_time::INTERVAL);
      IF v_next_run <= p_from_date THEN
        v_next_run := v_next_run + INTERVAL '1 day';
      END IF;

    WHEN 'weekly' THEN
      -- Próximo dia da semana especificado
      v_next_run := (v_base_date + ((p_day_of_week - EXTRACT(ISODOW FROM v_base_date))::INT % 7 + 7) % 7 * INTERVAL '1 day' + p_time::INTERVAL);
      IF v_next_run <= p_from_date THEN
        v_next_run := v_next_run + INTERVAL '7 days';
      END IF;

    WHEN 'monthly' THEN
      -- Próximo dia do mês especificado
      v_next_run := (DATE_TRUNC('month', v_base_date) + (p_day_of_month - 1) * INTERVAL '1 day' + p_time::INTERVAL);
      IF v_next_run <= p_from_date THEN
        v_next_run := (DATE_TRUNC('month', v_base_date) + INTERVAL '1 month' + (p_day_of_month - 1) * INTERVAL '1 day' + p_time::INTERVAL);
      END IF;

    WHEN 'custom' THEN
      -- Para expressões cron customizadas, retornar NULL
      -- A lógica de cron será tratada no backend
      v_next_run := NULL;

    ELSE
      RAISE EXCEPTION 'Invalid frequency: %', p_frequency;
  END CASE;

  RETURN v_next_run;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular next_run automaticamente
CREATE OR REPLACE FUNCTION set_next_run()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.frequency != 'custom' THEN
    NEW.next_run := calculate_next_run(
      NEW.frequency,
      NEW.time,
      NEW.day_of_week,
      NEW.day_of_month,
      NEW.cron_expression,
      COALESCE(NEW.last_run, NOW())
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_next_run
  BEFORE INSERT OR UPDATE OF frequency, time, day_of_week, day_of_month, last_run ON report_schedules
  FOR EACH ROW
  EXECUTE FUNCTION set_next_run();

-- RLS Policies
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_template_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_template_categories ENABLE ROW LEVEL SECURITY;

-- Policies para report_templates
CREATE POLICY "Users can view templates from their company or shared with them"
  ON report_templates FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
    OR id IN (
      SELECT template_id FROM report_template_shares WHERE shared_with = auth.uid()
    )
  );

CREATE POLICY "Users can create templates in their company"
  ON report_templates FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own templates or templates they have edit permission"
  ON report_templates FOR UPDATE
  USING (
    created_by = auth.uid()
    OR id IN (
      SELECT template_id FROM report_template_shares
      WHERE shared_with = auth.uid() AND permission IN ('edit')
    )
  );

CREATE POLICY "Users can delete their own templates"
  ON report_templates FOR DELETE
  USING (created_by = auth.uid());

-- Policies para report_schedules
CREATE POLICY "Users can view schedules from their company templates"
  ON report_schedules FOR SELECT
  USING (
    template_id IN (
      SELECT id FROM report_templates WHERE company_id IN (
        SELECT company_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create schedules for their templates"
  ON report_schedules FOR INSERT
  WITH CHECK (
    template_id IN (
      SELECT id FROM report_templates WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update schedules for their templates"
  ON report_schedules FOR UPDATE
  USING (
    template_id IN (
      SELECT id FROM report_templates WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete schedules for their templates"
  ON report_schedules FOR DELETE
  USING (
    template_id IN (
      SELECT id FROM report_templates WHERE created_by = auth.uid()
    )
  );

-- Policies para report_history
CREATE POLICY "Users can view history from their company templates"
  ON report_history FOR SELECT
  USING (
    template_id IN (
      SELECT id FROM report_templates WHERE company_id IN (
        SELECT company_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can insert history"
  ON report_history FOR INSERT
  WITH CHECK (true);

-- Policies para report_favorites
CREATE POLICY "Users can manage their own favorites"
  ON report_favorites FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policies para report_template_shares
CREATE POLICY "Users can view shares for their templates or shares with them"
  ON report_template_shares FOR SELECT
  USING (
    shared_by = auth.uid()
    OR shared_with = auth.uid()
    OR template_id IN (
      SELECT id FROM report_templates WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can share their own templates"
  ON report_template_shares FOR INSERT
  WITH CHECK (
    template_id IN (
      SELECT id FROM report_templates WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete shares for their templates"
  ON report_template_shares FOR DELETE
  USING (
    template_id IN (
      SELECT id FROM report_templates WHERE created_by = auth.uid()
    )
  );

-- Policies para report_categories
CREATE POLICY "Users can view categories from their company"
  ON report_categories FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create categories in their company"
  ON report_categories FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update categories in their company"
  ON report_categories FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete categories in their company"
  ON report_categories FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Policies para report_template_categories
CREATE POLICY "Users can view template categories from their company"
  ON report_template_categories FOR SELECT
  USING (
    template_id IN (
      SELECT id FROM report_templates WHERE company_id IN (
        SELECT company_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage template categories for their templates"
  ON report_template_categories FOR ALL
  USING (
    template_id IN (
      SELECT id FROM report_templates WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    template_id IN (
      SELECT id FROM report_templates WHERE created_by = auth.uid()
    )
  );

-- Função auxiliar para buscar agendamentos que devem ser executados
CREATE OR REPLACE FUNCTION get_schedules_due()
RETURNS TABLE (
  schedule_id UUID,
  template_id UUID,
  template_name VARCHAR,
  template_type VARCHAR,
  template_config JSONB,
  format VARCHAR,
  frequency VARCHAR,
  date_period VARCHAR,
  recipients TEXT[],
  company_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id as schedule_id,
    t.id as template_id,
    t.name as template_name,
    t.type as template_type,
    t.config as template_config,
    t.format,
    s.frequency,
    s.date_period,
    s.recipients,
    t.company_id
  FROM report_schedules s
  INNER JOIN report_templates t ON s.template_id = t.id
  WHERE s.active = TRUE
    AND s.next_run IS NOT NULL
    AND s.next_run <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_schedules_due() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_next_run(VARCHAR, TIME, INT, INT, VARCHAR, TIMESTAMP WITH TIME ZONE) TO authenticated;

-- Comentários para documentação
COMMENT ON TABLE report_templates IS 'Templates de relatórios customizáveis';
COMMENT ON TABLE report_schedules IS 'Agendamentos de geração automática de relatórios';
COMMENT ON TABLE report_history IS 'Histórico de relatórios gerados';
COMMENT ON TABLE report_favorites IS 'Templates favoritos dos usuários';
COMMENT ON TABLE report_template_shares IS 'Compartilhamento de templates entre usuários';
COMMENT ON TABLE report_categories IS 'Categorias para organização de templates';
COMMENT ON COLUMN report_templates.config IS 'Configuração JSON: {columns: [], filters: [], sort: {}, groupBy: []}';
COMMENT ON COLUMN report_schedules.cron_expression IS 'Expressão cron para agendamentos customizados';
COMMENT ON COLUMN report_history.processing_time_ms IS 'Tempo de processamento em milissegundos';
