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
