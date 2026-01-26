-- =====================================================
-- Migration 006: Work Schedules (Jornadas e Escalas)
-- Sistema SaaS de RH Multi-tenant
-- =====================================================

-- ENUM para tipo de escala
CREATE TYPE schedule_type AS ENUM (
  'fixed',          -- Jornada fixa (segunda a sexta)
  'shift',          -- Turno (6x1, 5x2, etc)
  'flexible',       -- Horario flexivel
  'intermittent',   -- Intermitente
  'remote',         -- Home office / remoto
  'hybrid'          -- Hibrido
);

-- ENUM para dias da semana
CREATE TYPE weekday AS ENUM (
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
);

-- =====================================================
-- Tabela de modelos de jornada
-- =====================================================

CREATE TABLE work_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Identificacao
  name TEXT NOT NULL,
  description TEXT,
  code VARCHAR(20), -- Codigo interno

  -- Tipo de jornada
  schedule_type schedule_type DEFAULT 'fixed' NOT NULL,

  -- Carga horaria
  weekly_hours NUMERIC(5,2) DEFAULT 44 NOT NULL, -- Horas semanais
  daily_hours NUMERIC(5,2) DEFAULT 8 NOT NULL, -- Horas diarias padrao

  -- Intervalo
  break_duration_minutes INTEGER DEFAULT 60 NOT NULL, -- Duracao do intervalo
  break_start_time TIME, -- Inicio padrao do intervalo
  break_end_time TIME, -- Fim padrao do intervalo
  is_break_flexible BOOLEAN DEFAULT false, -- Intervalo flexivel
  min_break_minutes INTEGER DEFAULT 60, -- Minimo de intervalo (CLT)

  -- Tolerancia
  tolerance_minutes INTEGER DEFAULT 10, -- Tolerancia para atraso/saida antecipada

  -- Configuracoes de hora extra
  overtime_rules JSONB DEFAULT '{}'::jsonb,
  -- Estrutura:
  -- {
  --   "daily_limit_minutes": 120,    -- Limite diario de HE
  --   "weekly_limit_minutes": 600,   -- Limite semanal de HE
  --   "multiplier_50": 1.5,          -- Multiplicador 50%
  --   "multiplier_100": 2.0,         -- Multiplicador 100% (domingos/feriados)
  --   "requires_approval": true,     -- Requer aprovacao previa
  --   "auto_approve_limit": 30       -- Auto aprovar ate X minutos
  -- }

  -- Adicional noturno
  night_shift_config JSONB DEFAULT '{}'::jsonb,
  -- Estrutura:
  -- {
  --   "start_time": "22:00",
  --   "end_time": "05:00",
  --   "multiplier": 1.2,
  --   "hour_reduction": true    -- Hora noturna = 52min30s
  -- }

  -- Configuracoes de flexibilidade
  flexibility_config JSONB DEFAULT '{}'::jsonb,
  -- Estrutura:
  -- {
  --   "core_hours_start": "10:00",  -- Horario nucleo inicio
  --   "core_hours_end": "16:00",    -- Horario nucleo fim
  --   "flex_window_start": "07:00", -- Pode comecar a partir de
  --   "flex_window_end": "10:00",   -- Deve comecar ate
  --   "min_daily_hours": 6          -- Minimo de horas por dia
  -- }

  -- Banco de horas
  time_bank_enabled BOOLEAN DEFAULT true,
  time_bank_config JSONB DEFAULT '{}'::jsonb,
  -- Estrutura:
  -- {
  --   "expiry_months": 6,           -- Validade dos creditos
  --   "max_balance_hours": 40,      -- Saldo maximo permitido
  --   "min_balance_hours": -10,     -- Debito maximo permitido
  --   "compensation_rules": {
  --     "min_hours": 4,             -- Minimo de horas para folga
  --     "requires_approval": true
  --   }
  -- }

  -- Status
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_default BOOLEAN DEFAULT false, -- Jornada padrao da empresa

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- Tabela de horarios por dia da semana
-- =====================================================

CREATE TABLE schedule_weekdays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Vinculo com jornada
  schedule_id UUID NOT NULL REFERENCES work_schedules(id) ON DELETE CASCADE,

  -- Dia da semana
  weekday weekday NOT NULL,

  -- E dia de trabalho?
  is_workday BOOLEAN DEFAULT true NOT NULL,

  -- Horarios
  start_time TIME, -- Entrada
  end_time TIME, -- Saida

  -- Intervalo (pode ser diferente do padrao)
  break_start TIME,
  break_end TIME,
  break_duration_minutes INTEGER,

  -- Horas do dia
  expected_hours NUMERIC(5,2),

  -- Constraint de unicidade
  CONSTRAINT unique_schedule_weekday UNIQUE (schedule_id, weekday)
);

-- =====================================================
-- Tabela de escalas de revezamento
-- =====================================================

CREATE TABLE rotation_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Vinculo com jornada
  schedule_id UUID NOT NULL REFERENCES work_schedules(id) ON DELETE CASCADE,

  -- Identificacao
  name TEXT NOT NULL, -- Ex: "Turno A", "Turno B"

  -- Ciclo de revezamento
  cycle_days INTEGER NOT NULL, -- Tamanho do ciclo em dias
  work_days INTEGER NOT NULL, -- Dias de trabalho no ciclo
  off_days INTEGER NOT NULL, -- Dias de folga no ciclo

  -- Padrao do ciclo (array de booleans)
  cycle_pattern BOOLEAN[] NOT NULL, -- [true, true, true, true, true, true, false] = 6x1

  -- Horarios do turno
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration_minutes INTEGER DEFAULT 60,

  -- Data de inicio do ciclo (para calculo)
  cycle_start_date DATE NOT NULL,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- Tabela de vinculo funcionario-jornada
-- =====================================================

CREATE TABLE employee_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Funcionario e jornada
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES work_schedules(id) ON DELETE CASCADE,

  -- Para escalas de revezamento
  rotation_schedule_id UUID REFERENCES rotation_schedules(id),

  -- Vigencia
  start_date DATE NOT NULL,
  end_date DATE, -- NULL = vigente

  -- Motivo da alteracao
  change_reason TEXT,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- Tabela de feriados
-- =====================================================

CREATE TABLE holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy (NULL = feriado nacional)
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Dados do feriado
  name TEXT NOT NULL,
  date DATE NOT NULL,

  -- Tipo
  is_national BOOLEAN DEFAULT false,
  is_state BOOLEAN DEFAULT false,
  is_municipal BOOLEAN DEFAULT false,
  is_company BOOLEAN DEFAULT false, -- Feriado da empresa

  -- Local (para feriados estaduais/municipais)
  state VARCHAR(2),
  city TEXT,

  -- Recorrencia
  is_recurring BOOLEAN DEFAULT true, -- Repete todo ano

  -- Configuracao
  is_optional BOOLEAN DEFAULT false, -- Ponto facultativo

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- Adicionar FK na tabela employees
-- =====================================================

ALTER TABLE employees
  ADD CONSTRAINT fk_employees_work_schedule
  FOREIGN KEY (work_schedule_id)
  REFERENCES work_schedules(id);

-- =====================================================
-- INDICES
-- =====================================================

-- work_schedules
CREATE INDEX idx_work_schedules_company ON work_schedules (company_id);
CREATE INDEX idx_work_schedules_active ON work_schedules (company_id, is_active)
  WHERE is_active = true;
CREATE INDEX idx_work_schedules_type ON work_schedules (schedule_type);

-- schedule_weekdays
CREATE INDEX idx_schedule_weekdays_schedule ON schedule_weekdays (schedule_id);

-- rotation_schedules
CREATE INDEX idx_rotation_schedules_schedule ON rotation_schedules (schedule_id);

-- employee_schedules
CREATE INDEX idx_employee_schedules_company ON employee_schedules (company_id);
CREATE INDEX idx_employee_schedules_employee ON employee_schedules (employee_id);
CREATE INDEX idx_employee_schedules_schedule ON employee_schedules (schedule_id);
CREATE INDEX idx_employee_schedules_active ON employee_schedules (employee_id, end_date)
  WHERE end_date IS NULL;

-- holidays
CREATE INDEX idx_holidays_company ON holidays (company_id);
CREATE INDEX idx_holidays_date ON holidays (date);
CREATE INDEX idx_holidays_national ON holidays (date) WHERE is_national = true;

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER trigger_work_schedules_updated_at
  BEFORE UPDATE ON work_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_rotation_schedules_updated_at
  BEFORE UPDATE ON rotation_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Funcao para garantir apenas uma jornada default
CREATE OR REPLACE FUNCTION ensure_single_default_schedule()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE work_schedules
    SET is_default = false
    WHERE company_id = NEW.company_id
    AND id != NEW.id
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_default_schedule
  BEFORE INSERT OR UPDATE ON work_schedules
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_schedule();

-- Funcao para encerrar vinculo anterior ao criar novo
CREATE OR REPLACE FUNCTION end_previous_employee_schedule()
RETURNS TRIGGER AS $$
BEGIN
  -- Encerrar vinculo anterior
  UPDATE employee_schedules
  SET end_date = NEW.start_date - INTERVAL '1 day'
  WHERE employee_id = NEW.employee_id
  AND end_date IS NULL
  AND id != NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_end_previous_schedule
  BEFORE INSERT ON employee_schedules
  FOR EACH ROW
  EXECUTE FUNCTION end_previous_employee_schedule();

-- =====================================================
-- FUNCOES AUXILIARES
-- =====================================================

-- Funcao para verificar se uma data eh dia util
CREATE OR REPLACE FUNCTION is_workday(
  p_company_id UUID,
  p_employee_id UUID,
  p_date DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  v_schedule_id UUID;
  v_weekday weekday;
  v_is_workday BOOLEAN;
  v_is_holiday BOOLEAN;
BEGIN
  -- Pegar jornada do funcionario
  SELECT schedule_id INTO v_schedule_id
  FROM employee_schedules
  WHERE employee_id = p_employee_id
  AND start_date <= p_date
  AND (end_date IS NULL OR end_date >= p_date)
  ORDER BY start_date DESC
  LIMIT 1;

  IF v_schedule_id IS NULL THEN
    -- Sem jornada definida, usar padrao
    SELECT id INTO v_schedule_id
    FROM work_schedules
    WHERE company_id = p_company_id
    AND is_default = true;
  END IF;

  -- Verificar dia da semana
  v_weekday := LOWER(to_char(p_date, 'FMDay'))::weekday;

  SELECT COALESCE(sw.is_workday, true) INTO v_is_workday
  FROM schedule_weekdays sw
  WHERE sw.schedule_id = v_schedule_id
  AND sw.weekday = v_weekday;

  -- Verificar se eh feriado
  SELECT EXISTS (
    SELECT 1 FROM holidays
    WHERE date = p_date
    AND (company_id = p_company_id OR is_national = true)
  ) INTO v_is_holiday;

  RETURN v_is_workday AND NOT v_is_holiday;
END;
$$ LANGUAGE plpgsql;

-- Funcao para calcular horas esperadas do dia
CREATE OR REPLACE FUNCTION get_expected_hours(
  p_employee_id UUID,
  p_date DATE
)
RETURNS NUMERIC AS $$
DECLARE
  v_schedule_id UUID;
  v_weekday weekday;
  v_hours NUMERIC;
BEGIN
  -- Pegar jornada do funcionario
  SELECT schedule_id INTO v_schedule_id
  FROM employee_schedules
  WHERE employee_id = p_employee_id
  AND start_date <= p_date
  AND (end_date IS NULL OR end_date >= p_date)
  ORDER BY start_date DESC
  LIMIT 1;

  IF v_schedule_id IS NULL THEN
    RETURN 8; -- Padrao 8 horas
  END IF;

  -- Verificar dia da semana
  v_weekday := LOWER(to_char(p_date, 'FMDay'))::weekday;

  SELECT COALESCE(sw.expected_hours, ws.daily_hours)
  INTO v_hours
  FROM work_schedules ws
  LEFT JOIN schedule_weekdays sw ON sw.schedule_id = ws.id AND sw.weekday = v_weekday
  WHERE ws.id = v_schedule_id;

  RETURN COALESCE(v_hours, 8);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_weekdays ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotation_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- work_schedules policies
CREATE POLICY "Users can view company schedules"
  ON work_schedules FOR SELECT
  USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage schedules"
  ON work_schedules FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- schedule_weekdays policies
CREATE POLICY "Users can view schedule weekdays"
  ON schedule_weekdays FOR SELECT
  USING (
    schedule_id IN (
      SELECT id FROM work_schedules
      WHERE company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage schedule weekdays"
  ON schedule_weekdays FOR ALL
  USING (
    schedule_id IN (
      SELECT id FROM work_schedules
      WHERE company_id = (
        SELECT company_id FROM profiles
        WHERE id = auth.uid() AND role IN ('admin', 'hr')
      )
    )
  );

-- rotation_schedules policies
CREATE POLICY "Users can view rotation schedules"
  ON rotation_schedules FOR SELECT
  USING (
    schedule_id IN (
      SELECT id FROM work_schedules
      WHERE company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage rotation schedules"
  ON rotation_schedules FOR ALL
  USING (
    schedule_id IN (
      SELECT id FROM work_schedules
      WHERE company_id = (
        SELECT company_id FROM profiles
        WHERE id = auth.uid() AND role IN ('admin', 'hr')
      )
    )
  );

-- employee_schedules policies
CREATE POLICY "Users can view own schedule"
  ON employee_schedules FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage employee schedules"
  ON employee_schedules FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- holidays policies
CREATE POLICY "Users can view holidays"
  ON holidays FOR SELECT
  USING (
    company_id IS NULL
    OR company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage company holidays"
  ON holidays FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- =====================================================
-- DADOS INICIAIS - Feriados nacionais
-- =====================================================

INSERT INTO holidays (name, date, is_national, is_recurring) VALUES
  ('Confraternizacao Universal', '2024-01-01', true, true),
  ('Carnaval', '2024-02-12', true, false), -- Data variavel
  ('Carnaval', '2024-02-13', true, false),
  ('Sexta-feira Santa', '2024-03-29', true, false), -- Data variavel
  ('Tiradentes', '2024-04-21', true, true),
  ('Dia do Trabalho', '2024-05-01', true, true),
  ('Corpus Christi', '2024-05-30', true, false), -- Data variavel
  ('Independencia do Brasil', '2024-09-07', true, true),
  ('Nossa Senhora Aparecida', '2024-10-12', true, true),
  ('Finados', '2024-11-02', true, true),
  ('Proclamacao da Republica', '2024-11-15', true, true),
  ('Natal', '2024-12-25', true, true);

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE work_schedules IS 'Modelos de jornada de trabalho da empresa';
COMMENT ON TABLE schedule_weekdays IS 'Configuracao de horarios por dia da semana';
COMMENT ON TABLE rotation_schedules IS 'Escalas de revezamento (turnos)';
COMMENT ON TABLE employee_schedules IS 'Vinculo entre funcionario e sua jornada';
COMMENT ON TABLE holidays IS 'Feriados nacionais, estaduais, municipais e da empresa';
COMMENT ON COLUMN work_schedules.flexibility_config IS 'Configuracoes para jornada flexivel';
COMMENT ON COLUMN work_schedules.time_bank_config IS 'Regras do banco de horas';
COMMENT ON COLUMN rotation_schedules.cycle_pattern IS 'Array de booleans representando dias de trabalho (true) e folga (false)';
