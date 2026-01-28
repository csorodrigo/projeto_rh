-- =====================================================
-- BATCH_03_TIME
-- Files: 005_time_tracking.sql, 006_work_schedules.sql
-- =====================================================


-- FILE: 005_time_tracking.sql
-- =====================================================

-- =====================================================
-- Migration 005: Time Tracking (Controle de Ponto)
-- Sistema SaaS de RH Multi-tenant
-- =====================================================

-- ENUM para status do ponto
CREATE TYPE time_record_status AS ENUM ('pending', 'approved', 'rejected', 'adjusted');

-- ENUM para tipo de registro
CREATE TYPE clock_type AS ENUM ('clock_in', 'clock_out', 'break_start', 'break_end');

-- ENUM para origem do registro
CREATE TYPE record_source AS ENUM ('mobile_app', 'web', 'biometric', 'manual', 'import');

-- =====================================================
-- Tabela de registros de ponto (individual)
-- =====================================================

CREATE TABLE time_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Funcionario
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Registro
  record_type clock_type NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,

  -- Localizacao (para registro via app)
  location POINT, -- Coordenadas GPS
  location_address TEXT, -- Endereco reverso
  location_accuracy NUMERIC(10,2), -- Precisao em metros
  is_within_geofence BOOLEAN, -- Dentro da area permitida

  -- Dispositivo
  device_info JSONB DEFAULT '{}'::jsonb,
  -- Estrutura:
  -- {
  --   "device_id": "xxx",
  --   "device_type": "mobile" | "desktop" | "biometric",
  --   "os": "iOS 17.0",
  --   "app_version": "1.2.3",
  --   "ip_address": "192.168.1.1",
  --   "user_agent": "..."
  -- }

  -- Biometria (se aplicavel)
  biometric_data JSONB, -- Hash ou referencia, nunca dado bruto

  -- Origem
  source record_source DEFAULT 'web' NOT NULL,

  -- Foto (se exigido)
  photo_url TEXT,

  -- Observacoes
  notes TEXT,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- Tabela de resumo diario de ponto
-- =====================================================

CREATE TABLE time_tracking_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Funcionario e data
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Horarios consolidados
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  break_start TIMESTAMPTZ,
  break_end TIMESTAMPTZ,

  -- Horarios adicionais (para jornadas com multiplos intervalos)
  additional_breaks JSONB DEFAULT '[]'::jsonb,
  -- Estrutura:
  -- [
  --   { "start": "...", "end": "...", "type": "break" | "meal" }
  -- ]

  -- Calculo de horas
  worked_minutes INTEGER DEFAULT 0, -- Minutos trabalhados
  break_minutes INTEGER DEFAULT 0, -- Minutos de intervalo
  overtime_minutes INTEGER DEFAULT 0, -- Horas extras em minutos
  night_shift_minutes INTEGER DEFAULT 0, -- Adicional noturno em minutos
  missing_minutes INTEGER DEFAULT 0, -- Minutos faltantes

  -- Classificacao do dia
  is_workday BOOLEAN DEFAULT true, -- Dia util
  is_holiday BOOLEAN DEFAULT false, -- Feriado
  is_compensated BOOLEAN DEFAULT false, -- Dia de compensacao (banco de horas)

  -- Justificativas
  absence_type VARCHAR(50), -- vacation, sick_leave, etc (se ausente)
  absence_id UUID, -- Referencia para tabela de ausencias
  justification TEXT,
  justification_file_url TEXT,

  -- Status e aprovacao
  status time_record_status DEFAULT 'pending' NOT NULL,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Ajustes manuais
  is_manually_adjusted BOOLEAN DEFAULT false,
  adjustment_reason TEXT,
  adjusted_by UUID REFERENCES profiles(id),
  adjusted_at TIMESTAMPTZ,
  original_values JSONB, -- Valores antes do ajuste

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Constraint de unicidade
  CONSTRAINT unique_employee_date UNIQUE (employee_id, date)
);

-- =====================================================
-- Tabela de banco de horas
-- =====================================================

CREATE TABLE time_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Funcionario
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Periodo
  reference_date DATE NOT NULL, -- Data de referencia

  -- Tipo de movimentacao
  movement_type VARCHAR(20) NOT NULL, -- credit, debit, adjustment, expiry

  -- Valores (em minutos)
  minutes INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,

  -- Referencia
  time_tracking_id UUID REFERENCES time_tracking_daily(id),
  description TEXT,

  -- Validade
  expires_at DATE, -- Data de expiracao do credito

  -- Aprovacao
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- Tabela de geofences (areas permitidas)
-- =====================================================

CREATE TABLE geofences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Identificacao
  name TEXT NOT NULL,
  description TEXT,

  -- Localizacao
  center POINT NOT NULL, -- Centro da area
  radius_meters INTEGER NOT NULL, -- Raio em metros

  -- Ou poligono para areas irregulares
  polygon POLYGON,

  -- Endereco
  address TEXT,

  -- Configuracao
  is_active BOOLEAN DEFAULT true,
  is_required BOOLEAN DEFAULT false, -- Registro obrigatorio dentro da area

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- INDICES
-- =====================================================

-- time_records
CREATE INDEX idx_time_records_company ON time_records (company_id);
CREATE INDEX idx_time_records_employee ON time_records (employee_id);
CREATE INDEX idx_time_records_date ON time_records (recorded_at);
CREATE INDEX idx_time_records_employee_date ON time_records (employee_id, recorded_at);
CREATE INDEX idx_time_records_type ON time_records (record_type);

-- time_tracking_daily
CREATE INDEX idx_time_tracking_company ON time_tracking_daily (company_id);
CREATE INDEX idx_time_tracking_employee ON time_tracking_daily (employee_id);
CREATE INDEX idx_time_tracking_date ON time_tracking_daily (date);
CREATE INDEX idx_time_tracking_status ON time_tracking_daily (status);
CREATE INDEX idx_time_tracking_employee_date ON time_tracking_daily (employee_id, date);
CREATE INDEX idx_time_tracking_company_date ON time_tracking_daily (company_id, date);
CREATE INDEX idx_time_tracking_pending ON time_tracking_daily (company_id, status)
  WHERE status = 'pending';

-- time_bank
CREATE INDEX idx_time_bank_company ON time_bank (company_id);
CREATE INDEX idx_time_bank_employee ON time_bank (employee_id);
CREATE INDEX idx_time_bank_date ON time_bank (reference_date);
CREATE INDEX idx_time_bank_expires ON time_bank (expires_at)
  WHERE expires_at IS NOT NULL;

-- geofences
CREATE INDEX idx_geofences_company ON geofences (company_id);
CREATE INDEX idx_geofences_active ON geofences (company_id, is_active)
  WHERE is_active = true;

-- Indice espacial para geofences
CREATE INDEX idx_geofences_location ON geofences USING gist (center);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Triggers para updated_at
CREATE TRIGGER trigger_time_tracking_daily_updated_at
  BEFORE UPDATE ON time_tracking_daily
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_geofences_updated_at
  BEFORE UPDATE ON geofences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Funcao para calcular horas trabalhadas
CREATE OR REPLACE FUNCTION calculate_worked_hours()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular minutos trabalhados
  IF NEW.clock_in IS NOT NULL AND NEW.clock_out IS NOT NULL THEN
    NEW.worked_minutes := EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in)) / 60;

    -- Subtrair intervalo
    IF NEW.break_start IS NOT NULL AND NEW.break_end IS NOT NULL THEN
      NEW.break_minutes := EXTRACT(EPOCH FROM (NEW.break_end - NEW.break_start)) / 60;
      NEW.worked_minutes := NEW.worked_minutes - NEW.break_minutes;
    END IF;

    -- Calcular adicional noturno (22h - 5h)
    -- Simplificado - implementacao completa requer logica mais complexa
    NEW.night_shift_minutes := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_worked_hours
  BEFORE INSERT OR UPDATE ON time_tracking_daily
  FOR EACH ROW
  EXECUTE FUNCTION calculate_worked_hours();

-- Funcao para consolidar registros do dia
CREATE OR REPLACE FUNCTION consolidate_daily_records(
  p_employee_id UUID,
  p_date DATE
)
RETURNS UUID AS $$
DECLARE
  v_daily_id UUID;
  v_clock_in TIMESTAMPTZ;
  v_clock_out TIMESTAMPTZ;
  v_break_start TIMESTAMPTZ;
  v_break_end TIMESTAMPTZ;
  v_company_id UUID;
BEGIN
  -- Pegar company_id
  SELECT company_id INTO v_company_id
  FROM employees WHERE id = p_employee_id;

  -- Pegar registros do dia
  SELECT recorded_at INTO v_clock_in
  FROM time_records
  WHERE employee_id = p_employee_id
  AND DATE(recorded_at) = p_date
  AND record_type = 'clock_in'
  ORDER BY recorded_at
  LIMIT 1;

  SELECT recorded_at INTO v_clock_out
  FROM time_records
  WHERE employee_id = p_employee_id
  AND DATE(recorded_at) = p_date
  AND record_type = 'clock_out'
  ORDER BY recorded_at DESC
  LIMIT 1;

  SELECT recorded_at INTO v_break_start
  FROM time_records
  WHERE employee_id = p_employee_id
  AND DATE(recorded_at) = p_date
  AND record_type = 'break_start'
  ORDER BY recorded_at
  LIMIT 1;

  SELECT recorded_at INTO v_break_end
  FROM time_records
  WHERE employee_id = p_employee_id
  AND DATE(recorded_at) = p_date
  AND record_type = 'break_end'
  ORDER BY recorded_at
  LIMIT 1;

  -- Inserir ou atualizar resumo diario
  INSERT INTO time_tracking_daily (
    company_id, employee_id, date,
    clock_in, clock_out, break_start, break_end
  )
  VALUES (
    v_company_id, p_employee_id, p_date,
    v_clock_in, v_clock_out, v_break_start, v_break_end
  )
  ON CONFLICT (employee_id, date)
  DO UPDATE SET
    clock_in = EXCLUDED.clock_in,
    clock_out = EXCLUDED.clock_out,
    break_start = EXCLUDED.break_start,
    break_end = EXCLUDED.break_end,
    updated_at = now()
  RETURNING id INTO v_daily_id;

  RETURN v_daily_id;
END;
$$ LANGUAGE plpgsql;

-- Funcao para atualizar banco de horas
CREATE OR REPLACE FUNCTION update_time_bank()
RETURNS TRIGGER AS $$
DECLARE
  v_current_balance INTEGER;
  v_overtime INTEGER;
BEGIN
  -- Apenas quando aprovado
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Pegar saldo atual
    SELECT COALESCE(balance_after, 0) INTO v_current_balance
    FROM time_bank
    WHERE employee_id = NEW.employee_id
    ORDER BY created_at DESC
    LIMIT 1;

    -- Calcular overtime (positivo) ou falta (negativo)
    v_overtime := NEW.overtime_minutes - NEW.missing_minutes;

    -- Registrar no banco de horas se houver diferenca
    IF v_overtime != 0 THEN
      INSERT INTO time_bank (
        company_id, employee_id, reference_date,
        movement_type, minutes, balance_before, balance_after,
        time_tracking_id, approved_by, approved_at
      )
      VALUES (
        NEW.company_id, NEW.employee_id, NEW.date,
        CASE WHEN v_overtime > 0 THEN 'credit' ELSE 'debit' END,
        ABS(v_overtime), v_current_balance, v_current_balance + v_overtime,
        NEW.id, NEW.approved_by, now()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_time_bank
  AFTER UPDATE ON time_tracking_daily
  FOR EACH ROW
  EXECUTE FUNCTION update_time_bank();

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

ALTER TABLE time_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_tracking_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;

-- time_records policies
CREATE POLICY "Users can view own time records"
  ON time_records FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert own time records"
  ON time_records FOR INSERT
  WITH CHECK (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins and HR can view all time records"
  ON time_records FOR SELECT
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Managers can view team time records"
  ON time_records FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE manager_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  );

-- time_tracking_daily policies
CREATE POLICY "Users can view own daily tracking"
  ON time_tracking_daily FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins and HR can manage daily tracking"
  ON time_tracking_daily FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Managers can approve team tracking"
  ON time_tracking_daily FOR UPDATE
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE manager_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  );

-- time_bank policies
CREATE POLICY "Users can view own time bank"
  ON time_bank FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins and HR can manage time bank"
  ON time_bank FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- geofences policies
CREATE POLICY "Users can view company geofences"
  ON geofences FOR SELECT
  USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage geofences"
  ON geofences FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- VIEWS
-- =====================================================

-- View para dashboard de ponto
CREATE VIEW v_time_tracking_dashboard AS
SELECT
  t.company_id,
  t.employee_id,
  e.name AS employee_name,
  e.department,
  t.date,
  t.clock_in,
  t.clock_out,
  t.worked_minutes,
  t.overtime_minutes,
  t.missing_minutes,
  t.status,
  COALESCE(
    (SELECT balance_after FROM time_bank
     WHERE employee_id = t.employee_id
     ORDER BY created_at DESC LIMIT 1),
    0
  ) AS time_bank_balance
FROM time_tracking_daily t
JOIN employees e ON e.id = t.employee_id
WHERE e.status = 'active';

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE time_records IS 'Registros individuais de ponto (batidas)';
COMMENT ON TABLE time_tracking_daily IS 'Consolidacao diaria do ponto com calculos';
COMMENT ON TABLE time_bank IS 'Banco de horas com movimentacoes';
COMMENT ON TABLE geofences IS 'Areas geograficas permitidas para registro de ponto';
COMMENT ON COLUMN time_records.location IS 'Coordenadas GPS no formato POINT(longitude latitude)';
COMMENT ON COLUMN time_tracking_daily.night_shift_minutes IS 'Minutos trabalhados entre 22h e 5h (adicional noturno)';



-- FILE: 006_work_schedules.sql
-- =====================================================

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


