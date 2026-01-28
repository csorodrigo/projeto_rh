-- =====================================================
-- BATCH_08_ENHANCEMENTS
-- Files: 014_time_tracking_enhancements.sql, 015_time_tracking_rls_and_functions.sql
-- =====================================================


-- FILE: 014_time_tracking_enhancements.sql
-- =====================================================

-- =====================================================
-- Migration 014: Time Tracking Enhancements
-- Sistema SaaS de RH Multi-tenant
-- =====================================================
-- Adiciona funcoes para dashboard em tempo real e melhorias
-- nas operacoes de ponto eletronico
-- =====================================================

-- =====================================================
-- FUNCAO: get_whos_in
-- Retorna lista de funcionarios no momento (trabalhando/intervalo/remoto)
-- =====================================================

CREATE OR REPLACE FUNCTION get_whos_in(p_company_id UUID)
RETURNS TABLE (
  employee_id UUID,
  employee_name TEXT,
  department TEXT,
  avatar_url TEXT,
  current_status TEXT,
  clock_in TIMESTAMPTZ,
  last_action TIMESTAMPTZ,
  last_action_type clock_type,
  location_address TEXT,
  is_remote BOOLEAN,
  worked_minutes INTEGER,
  schedule_start TIME,
  schedule_end TIME
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_records AS (
    SELECT DISTINCT ON (tr.employee_id)
      tr.employee_id,
      tr.record_type,
      tr.recorded_at,
      tr.location_address,
      tr.source
    FROM time_records tr
    WHERE tr.company_id = p_company_id
    AND DATE(tr.recorded_at AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
    ORDER BY tr.employee_id, tr.recorded_at DESC
  ),
  todays_summary AS (
    SELECT
      ttd.employee_id,
      ttd.clock_in,
      ttd.worked_minutes
    FROM time_tracking_daily ttd
    WHERE ttd.company_id = p_company_id
    AND ttd.date = CURRENT_DATE
  ),
  employee_schedules_today AS (
    SELECT
      es.employee_id,
      sw.start_time,
      sw.end_time
    FROM employee_schedules es
    JOIN work_schedules ws ON ws.id = es.schedule_id
    LEFT JOIN schedule_weekdays sw ON sw.schedule_id = ws.id
      AND sw.weekday = LOWER(to_char(CURRENT_DATE, 'FMDay'))::weekday
    WHERE es.company_id = p_company_id
    AND es.start_date <= CURRENT_DATE
    AND (es.end_date IS NULL OR es.end_date >= CURRENT_DATE)
  )
  SELECT
    e.id AS employee_id,
    e.name AS employee_name,
    e.department,
    p.avatar_url,
    CASE
      WHEN lr.record_type IS NULL THEN 'not_clocked_in'
      WHEN lr.record_type = 'clock_in' THEN 'working'
      WHEN lr.record_type = 'break_start' THEN 'on_break'
      WHEN lr.record_type = 'break_end' THEN 'working'
      WHEN lr.record_type = 'clock_out' THEN 'clocked_out'
      ELSE 'unknown'
    END AS current_status,
    ts.clock_in,
    lr.recorded_at AS last_action,
    lr.record_type AS last_action_type,
    lr.location_address,
    COALESCE(
      lr.source IN ('remote', 'web') AND lr.location_address IS NULL,
      false
    ) AS is_remote,
    COALESCE(ts.worked_minutes, 0) AS worked_minutes,
    est.start_time AS schedule_start,
    est.end_time AS schedule_end
  FROM employees e
  LEFT JOIN profiles p ON p.employee_id = e.id
  LEFT JOIN latest_records lr ON lr.employee_id = e.id
  LEFT JOIN todays_summary ts ON ts.employee_id = e.id
  LEFT JOIN employee_schedules_today est ON est.employee_id = e.id
  WHERE e.company_id = p_company_id
  AND e.status = 'active'
  AND (
    lr.record_type IN ('clock_in', 'break_start', 'break_end')
    OR (lr.record_type IS NULL AND est.start_time IS NOT NULL)
  )
  ORDER BY e.name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_whos_in IS 'Retorna lista de funcionarios ativos no momento para dashboard em tempo real';

-- =====================================================
-- FUNCAO: get_employee_time_summary
-- Retorna resumo detalhado do dia para um funcionario
-- =====================================================

CREATE OR REPLACE FUNCTION get_employee_time_summary(
  p_employee_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  employee_id UUID,
  employee_name TEXT,
  date DATE,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  break_start TIMESTAMPTZ,
  break_end TIMESTAMPTZ,
  worked_minutes INTEGER,
  break_minutes INTEGER,
  overtime_minutes INTEGER,
  missing_minutes INTEGER,
  expected_hours NUMERIC,
  schedule_start TIME,
  schedule_end TIME,
  status time_record_status,
  is_workday BOOLEAN,
  is_holiday BOOLEAN,
  time_bank_balance INTEGER,
  all_records JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH employee_info AS (
    SELECT
      e.id,
      e.name,
      e.company_id
    FROM employees e
    WHERE e.id = p_employee_id
  ),
  daily_tracking AS (
    SELECT
      ttd.*
    FROM time_tracking_daily ttd
    WHERE ttd.employee_id = p_employee_id
    AND ttd.date = p_date
  ),
  schedule_info AS (
    SELECT
      sw.start_time,
      sw.end_time,
      ws.daily_hours
    FROM employee_schedules es
    JOIN work_schedules ws ON ws.id = es.schedule_id
    LEFT JOIN schedule_weekdays sw ON sw.schedule_id = ws.id
      AND sw.weekday = LOWER(to_char(p_date, 'FMDay'))::weekday
    WHERE es.employee_id = p_employee_id
    AND es.start_date <= p_date
    AND (es.end_date IS NULL OR es.end_date >= p_date)
    LIMIT 1
  ),
  time_bank_info AS (
    SELECT
      COALESCE(tb.balance_after, 0) AS balance
    FROM time_bank tb
    WHERE tb.employee_id = p_employee_id
    ORDER BY tb.created_at DESC
    LIMIT 1
  ),
  all_records_json AS (
    SELECT
      jsonb_agg(
        jsonb_build_object(
          'id', tr.id,
          'record_type', tr.record_type,
          'recorded_at', tr.recorded_at,
          'location_address', tr.location_address,
          'is_within_geofence', tr.is_within_geofence,
          'source', tr.source,
          'notes', tr.notes
        ) ORDER BY tr.recorded_at
      ) AS records
    FROM time_records tr
    WHERE tr.employee_id = p_employee_id
    AND DATE(tr.recorded_at) = p_date
  )
  SELECT
    ei.id AS employee_id,
    ei.name AS employee_name,
    p_date AS date,
    dt.clock_in,
    dt.clock_out,
    dt.break_start,
    dt.break_end,
    COALESCE(dt.worked_minutes, 0) AS worked_minutes,
    COALESCE(dt.break_minutes, 0) AS break_minutes,
    COALESCE(dt.overtime_minutes, 0) AS overtime_minutes,
    COALESCE(dt.missing_minutes, 0) AS missing_minutes,
    COALESCE(si.daily_hours, 8) AS expected_hours,
    si.start_time AS schedule_start,
    si.end_time AS schedule_end,
    COALESCE(dt.status, 'pending'::time_record_status) AS status,
    COALESCE(dt.is_workday, true) AS is_workday,
    COALESCE(dt.is_holiday, false) AS is_holiday,
    COALESCE(tbi.balance, 0) AS time_bank_balance,
    COALESCE(arj.records, '[]'::jsonb) AS all_records
  FROM employee_info ei
  LEFT JOIN daily_tracking dt ON true
  LEFT JOIN schedule_info si ON true
  LEFT JOIN time_bank_info tbi ON true
  LEFT JOIN all_records_json arj ON true;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_employee_time_summary IS 'Retorna resumo completo do dia de trabalho de um funcionario';

-- =====================================================
-- FUNCAO: clock_in_out
-- Registra ponto com validacoes automaticas
-- =====================================================

CREATE OR REPLACE FUNCTION clock_in_out(
  p_employee_id UUID,
  p_company_id UUID,
  p_action clock_type,
  p_source record_source DEFAULT 'web',
  p_device_info JSONB DEFAULT '{}'::jsonb,
  p_location POINT DEFAULT NULL,
  p_location_address TEXT DEFAULT NULL,
  p_photo_url TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  record_id UUID,
  next_expected_action clock_type,
  validation_warnings JSONB
) AS $$
DECLARE
  v_record_id UUID;
  v_last_action clock_type;
  v_last_action_time TIMESTAMPTZ;
  v_is_within_geofence BOOLEAN := NULL;
  v_warnings JSONB := '[]'::jsonb;
  v_today_date DATE := CURRENT_DATE;
  v_employee_status TEXT;
  v_schedule_id UUID;
  v_geofence_required BOOLEAN := false;
  v_next_action clock_type;
BEGIN
  -- Validacao: Funcionario existe e esta ativo
  SELECT status INTO v_employee_status
  FROM employees
  WHERE id = p_employee_id AND company_id = p_company_id;

  IF v_employee_status IS NULL THEN
    RETURN QUERY SELECT false, 'Funcionario nao encontrado', NULL::UUID, NULL::clock_type, '[]'::jsonb;
    RETURN;
  END IF;

  IF v_employee_status != 'active' THEN
    RETURN QUERY SELECT false, 'Funcionario nao esta ativo', NULL::UUID, NULL::clock_type, '[]'::jsonb;
    RETURN;
  END IF;

  -- Pegar ultima acao do dia
  SELECT record_type, recorded_at
  INTO v_last_action, v_last_action_time
  FROM time_records
  WHERE employee_id = p_employee_id
  AND DATE(recorded_at) = v_today_date
  ORDER BY recorded_at DESC
  LIMIT 1;

  -- Validacao: Sequencia logica de acoes
  IF v_last_action IS NOT NULL THEN
    CASE p_action
      WHEN 'clock_in' THEN
        IF v_last_action != 'clock_out' AND v_last_action IS NOT NULL THEN
          RETURN QUERY SELECT false, 'Ja existe entrada registrada hoje. Registre saida primeiro', NULL::UUID, NULL::clock_type, '[]'::jsonb;
          RETURN;
        END IF;
      WHEN 'break_start' THEN
        IF v_last_action NOT IN ('clock_in', 'break_end') THEN
          RETURN QUERY SELECT false, 'Registre entrada antes de iniciar intervalo', NULL::UUID, NULL::clock_type, '[]'::jsonb;
          RETURN;
        END IF;
      WHEN 'break_end' THEN
        IF v_last_action != 'break_start' THEN
          RETURN QUERY SELECT false, 'Nao ha intervalo ativo para finalizar', NULL::UUID, NULL::clock_type, '[]'::jsonb;
          RETURN;
        END IF;
      WHEN 'clock_out' THEN
        IF v_last_action = 'break_start' THEN
          RETURN QUERY SELECT false, 'Finalize o intervalo antes de registrar saida', NULL::UUID, NULL::clock_type, '[]'::jsonb;
          RETURN;
        END IF;
        IF v_last_action NOT IN ('clock_in', 'break_end') THEN
          RETURN QUERY SELECT false, 'Registre entrada antes de registrar saida', NULL::UUID, NULL::clock_type, '[]'::jsonb;
          RETURN;
        END IF;
    END CASE;
  ELSE
    -- Primeira acao do dia deve ser clock_in
    IF p_action != 'clock_in' THEN
      RETURN QUERY SELECT false, 'Primeira acao do dia deve ser entrada (clock_in)', NULL::UUID, NULL::clock_type, '[]'::jsonb;
      RETURN;
    END IF;
  END IF;

  -- Validacao: Tempo minimo entre acoes (evitar registros duplicados)
  IF v_last_action_time IS NOT NULL THEN
    IF EXTRACT(EPOCH FROM (now() - v_last_action_time)) < 60 THEN
      RETURN QUERY SELECT false, 'Aguarde pelo menos 1 minuto entre registros', NULL::UUID, NULL::clock_type, '[]'::jsonb;
      RETURN;
    END IF;
  END IF;

  -- Validacao de geofence (se localizacao fornecida)
  IF p_location IS NOT NULL THEN
    SELECT
      CASE
        WHEN COUNT(*) = 0 THEN NULL
        WHEN COUNT(*) FILTER (WHERE
          ST_DWithin(
            center::geography,
            p_location::geography,
            radius_meters
          )
        ) > 0 THEN true
        ELSE false
      END,
      BOOL_OR(is_required)
    INTO v_is_within_geofence, v_geofence_required
    FROM geofences
    WHERE company_id = p_company_id
    AND is_active = true;

    -- Aviso se fora da geofence permitida
    IF v_is_within_geofence = false THEN
      v_warnings := v_warnings || jsonb_build_object(
        'type', 'geofence',
        'message', 'Registro realizado fora das areas permitidas',
        'severity', CASE WHEN v_geofence_required THEN 'error' ELSE 'warning' END
      );

      -- Se geofence e obrigatoria, bloquear
      IF v_geofence_required THEN
        RETURN QUERY SELECT false, 'Registro deve ser feito dentro das areas permitidas pela empresa', NULL::UUID, NULL::clock_type, v_warnings;
        RETURN;
      END IF;
    END IF;
  END IF;

  -- Inserir registro
  INSERT INTO time_records (
    company_id,
    employee_id,
    record_type,
    recorded_at,
    location,
    location_address,
    is_within_geofence,
    device_info,
    source,
    photo_url,
    notes,
    created_by
  )
  VALUES (
    p_company_id,
    p_employee_id,
    p_action,
    now(),
    p_location,
    p_location_address,
    v_is_within_geofence,
    p_device_info,
    p_source,
    p_photo_url,
    p_notes,
    (SELECT id FROM profiles WHERE employee_id = p_employee_id LIMIT 1)
  )
  RETURNING id INTO v_record_id;

  -- Consolidar registros do dia
  PERFORM consolidate_daily_records(p_employee_id, v_today_date);

  -- Determinar proxima acao esperada
  CASE p_action
    WHEN 'clock_in' THEN v_next_action := 'break_start';
    WHEN 'break_start' THEN v_next_action := 'break_end';
    WHEN 'break_end' THEN v_next_action := 'clock_out';
    WHEN 'clock_out' THEN v_next_action := NULL;
  END CASE;

  -- Retornar sucesso
  RETURN QUERY SELECT true, 'Ponto registrado com sucesso', v_record_id, v_next_action, v_warnings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION clock_in_out IS 'Registra ponto com validacoes automaticas de sequencia, tempo e geofence';

-- =====================================================
-- VIEW: v_whos_in_today
-- View materializada para dashboard em tempo real
-- =====================================================

CREATE MATERIALIZED VIEW v_whos_in_today AS
WITH latest_records AS (
  SELECT DISTINCT ON (tr.employee_id)
    tr.employee_id,
    tr.company_id,
    tr.record_type,
    tr.recorded_at,
    tr.location_address,
    tr.source,
    tr.is_within_geofence
  FROM time_records tr
  WHERE DATE(tr.recorded_at AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
  ORDER BY tr.employee_id, tr.recorded_at DESC
),
todays_summary AS (
  SELECT
    ttd.employee_id,
    ttd.company_id,
    ttd.clock_in,
    ttd.worked_minutes,
    ttd.break_minutes
  FROM time_tracking_daily ttd
  WHERE ttd.date = CURRENT_DATE
),
employee_schedules_today AS (
  SELECT
    es.employee_id,
    es.company_id,
    sw.start_time,
    sw.end_time,
    ws.name AS schedule_name
  FROM employee_schedules es
  JOIN work_schedules ws ON ws.id = es.schedule_id
  LEFT JOIN schedule_weekdays sw ON sw.schedule_id = ws.id
    AND sw.weekday = LOWER(to_char(CURRENT_DATE, 'FMDay'))::weekday
  WHERE es.start_date <= CURRENT_DATE
  AND (es.end_date IS NULL OR es.end_date >= CURRENT_DATE)
)
SELECT
  e.company_id,
  e.id AS employee_id,
  e.name AS employee_name,
  e.department,
  p.avatar_url,
  p.email,
  CASE
    WHEN lr.record_type IS NULL THEN 'not_clocked_in'
    WHEN lr.record_type = 'clock_in' THEN 'working'
    WHEN lr.record_type = 'break_start' THEN 'on_break'
    WHEN lr.record_type = 'break_end' THEN 'working'
    WHEN lr.record_type = 'clock_out' THEN 'clocked_out'
    ELSE 'unknown'
  END AS current_status,
  ts.clock_in,
  lr.recorded_at AS last_action,
  lr.record_type AS last_action_type,
  lr.location_address,
  lr.is_within_geofence,
  COALESCE(
    lr.source IN ('remote', 'web') AND lr.location_address IS NULL,
    false
  ) AS is_remote,
  COALESCE(ts.worked_minutes, 0) AS worked_minutes,
  COALESCE(ts.break_minutes, 0) AS break_minutes,
  est.schedule_name,
  est.start_time AS schedule_start,
  est.end_time AS schedule_end,
  now() AS refreshed_at
FROM employees e
LEFT JOIN profiles p ON p.employee_id = e.id
LEFT JOIN latest_records lr ON lr.employee_id = e.id
LEFT JOIN todays_summary ts ON ts.employee_id = e.id
LEFT JOIN employee_schedules_today est ON est.employee_id = e.id
WHERE e.status = 'active'
AND (
  lr.record_type IN ('clock_in', 'break_start', 'break_end')
  OR (lr.record_type IS NULL AND est.start_time IS NOT NULL)
);

-- Indices para a view materializada
CREATE INDEX idx_v_whos_in_company ON v_whos_in_today (company_id);
CREATE INDEX idx_v_whos_in_status ON v_whos_in_today (current_status);
CREATE INDEX idx_v_whos_in_employee ON v_whos_in_today (employee_id);

COMMENT ON MATERIALIZED VIEW v_whos_in_today IS 'Dashboard em tempo real de quem esta trabalhando';

-- Funcao para refresh automatico da view
CREATE OR REPLACE FUNCTION refresh_whos_in_today()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY v_whos_in_today;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION refresh_whos_in_today IS 'Atualiza view materializada de funcionarios trabalhando';

-- =====================================================
-- INDICES ADICIONAIS PARA PERFORMANCE
-- =====================================================

-- Indice composto para consultas de dashboard
CREATE INDEX idx_time_records_company_date_employee
  ON time_records (company_id, DATE(recorded_at), employee_id);

-- Indice para consultas de ultimo registro do dia
-- Nota: Removido filtro com CURRENT_DATE pois nao e IMMUTABLE
CREATE INDEX idx_time_records_employee_date_desc
  ON time_records (employee_id, recorded_at DESC);

-- Indice para validacao de geofence
CREATE INDEX idx_geofences_company_active_required
  ON geofences (company_id, is_active, is_required)
  WHERE is_active = true;

-- Indice espacial otimizado para geofences
CREATE INDEX idx_geofences_geography ON geofences
  USING GIST ((center::geography));

-- Indice para consultas de jornada vigente
-- Nota: Removido filtro com CURRENT_DATE pois nao e IMMUTABLE
CREATE INDEX idx_employee_schedules_current
  ON employee_schedules (employee_id, start_date, end_date);

-- Indice para banco de horas - saldo atual
CREATE INDEX idx_time_bank_employee_balance
  ON time_bank (employee_id, created_at DESC, balance_after);

-- =====================================================
-- MELHORIAS NAS RLS POLICIES
-- =====================================================

-- Adicionar policy para usuarios verem status de colegas (dashboard)
CREATE POLICY "Users can view colleagues current status"
  ON time_records FOR SELECT
  USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    AND DATE(recorded_at) = CURRENT_DATE
    AND record_type IN ('clock_in', 'break_start', 'break_end', 'clock_out')
  );

-- Policy para HR/Admin bulk operations
CREATE POLICY "Admins can bulk manage records"
  ON time_records FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- =====================================================
-- FUNCAO AUXILIAR: Validar horas esperadas
-- =====================================================

CREATE OR REPLACE FUNCTION validate_expected_hours()
RETURNS TRIGGER AS $$
DECLARE
  v_expected_hours NUMERIC;
  v_worked_hours NUMERIC;
BEGIN
  -- Pegar horas esperadas
  v_expected_hours := get_expected_hours(NEW.employee_id, NEW.date);
  v_worked_hours := NEW.worked_minutes / 60.0;

  -- Calcular overtime ou falta
  IF v_worked_hours > v_expected_hours THEN
    NEW.overtime_minutes := ROUND((v_worked_hours - v_expected_hours) * 60);
    NEW.missing_minutes := 0;
  ELSIF v_worked_hours < v_expected_hours THEN
    NEW.overtime_minutes := 0;
    NEW.missing_minutes := ROUND((v_expected_hours - v_worked_hours) * 60);
  ELSE
    NEW.overtime_minutes := 0;
    NEW.missing_minutes := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Substituir trigger existente
DROP TRIGGER IF EXISTS trigger_calculate_worked_hours ON time_tracking_daily;

CREATE TRIGGER trigger_calculate_worked_hours
  BEFORE INSERT OR UPDATE ON time_tracking_daily
  FOR EACH ROW
  EXECUTE FUNCTION calculate_worked_hours();

CREATE TRIGGER trigger_validate_expected_hours
  BEFORE INSERT OR UPDATE ON time_tracking_daily
  FOR EACH ROW
  WHEN (NEW.worked_minutes IS NOT NULL)
  EXECUTE FUNCTION validate_expected_hours();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Conceder acesso as funcoes para usuarios autenticados
GRANT EXECUTE ON FUNCTION get_whos_in TO authenticated;
GRANT EXECUTE ON FUNCTION get_employee_time_summary TO authenticated;
GRANT EXECUTE ON FUNCTION clock_in_out TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_whos_in_today TO authenticated;

-- Conceder acesso a view materializada
GRANT SELECT ON v_whos_in_today TO authenticated;

-- =====================================================
-- COMENTARIOS FINAIS
-- =====================================================

COMMENT ON INDEX idx_time_records_company_date_employee IS 'Otimiza consultas de dashboard por empresa e data';
COMMENT ON INDEX idx_time_records_employee_date_desc IS 'Otimiza busca de ultimo registro do dia';
COMMENT ON INDEX idx_geofences_company_active_required IS 'Otimiza validacao de geofence obrigatoria';



-- FILE: 015_time_tracking_rls_and_functions.sql
-- =====================================================

-- =====================================================
-- Migration 015: Time Tracking RLS Policies & SQL Functions
-- Sistema SaaS de RH Multi-tenant
-- =====================================================
-- Implementa politicas RLS completas, funcoes SQL e triggers
-- para o modulo de controle de ponto eletronico
-- =====================================================

-- =====================================================
-- ENUM para tipo de correcao de ponto
-- =====================================================

CREATE TYPE signing_correction_type AS ENUM (
  'missed_clock_in',
  'missed_clock_out',
  'missed_break_start',
  'missed_break_end',
  'wrong_time',
  'system_error',
  'other'
);

-- =====================================================
-- Tabela de solicitacoes de correcao de ponto
-- =====================================================

CREATE TABLE IF NOT EXISTS signing_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Funcionario solicitante
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Referencia ao registro original (se existir)
  time_record_id UUID REFERENCES time_records(id) ON DELETE SET NULL,
  time_tracking_daily_id UUID REFERENCES time_tracking_daily(id) ON DELETE SET NULL,

  -- Tipo de correcao
  correction_type signing_correction_type NOT NULL,

  -- Data e horario da correcao
  correction_date DATE NOT NULL,
  correction_time TIME NOT NULL,

  -- Motivo da solicitacao
  reason TEXT NOT NULL,
  justification_file_url TEXT,

  -- Valores originais (se for alteracao)
  original_values JSONB,
  -- Estrutura:
  -- {
  --   "original_time": "14:30:00",
  --   "original_date": "2024-01-15",
  --   "original_type": "clock_in"
  -- }

  -- Status da solicitacao
  status time_record_status DEFAULT 'pending' NOT NULL,

  -- Aprovacao/Rejeicao
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- Indices para signing_corrections
CREATE INDEX idx_signing_corrections_company ON signing_corrections (company_id);
CREATE INDEX idx_signing_corrections_employee ON signing_corrections (employee_id);
CREATE INDEX idx_signing_corrections_status ON signing_corrections (status);
CREATE INDEX idx_signing_corrections_date ON signing_corrections (correction_date);
CREATE INDEX idx_signing_corrections_pending ON signing_corrections (company_id, status)
  WHERE status = 'pending';

-- Trigger para updated_at
CREATE TRIGGER trigger_signing_corrections_updated_at
  BEFORE UPDATE ON signing_corrections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCAO: calculate_worked_hours_detail
-- Calcula horas trabalhadas no dia para um funcionario
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_worked_hours_detail(
  p_employee_id UUID,
  p_date DATE
)
RETURNS TABLE (
  worked_minutes INTEGER,
  break_minutes INTEGER,
  total_minutes INTEGER,
  is_complete BOOLEAN
) AS $$
DECLARE
  v_clock_in TIMESTAMPTZ;
  v_clock_out TIMESTAMPTZ;
  v_break_start TIMESTAMPTZ;
  v_break_end TIMESTAMPTZ;
  v_worked INTEGER := 0;
  v_break INTEGER := 0;
  v_complete BOOLEAN := false;
BEGIN
  -- Pegar registros do dia
  SELECT
    MAX(CASE WHEN record_type = 'clock_in' THEN recorded_at END),
    MAX(CASE WHEN record_type = 'clock_out' THEN recorded_at END),
    MAX(CASE WHEN record_type = 'break_start' THEN recorded_at END),
    MAX(CASE WHEN record_type = 'break_end' THEN recorded_at END)
  INTO v_clock_in, v_clock_out, v_break_start, v_break_end
  FROM time_records
  WHERE employee_id = p_employee_id
  AND DATE(recorded_at) = p_date;

  -- Calcular minutos trabalhados
  IF v_clock_in IS NOT NULL AND v_clock_out IS NOT NULL THEN
    v_worked := EXTRACT(EPOCH FROM (v_clock_out - v_clock_in))::INTEGER / 60;
    v_complete := true;

    -- Subtrair intervalo se existir
    IF v_break_start IS NOT NULL AND v_break_end IS NOT NULL THEN
      v_break := EXTRACT(EPOCH FROM (v_break_end - v_break_start))::INTEGER / 60;
      v_worked := v_worked - v_break;
    END IF;
  ELSIF v_clock_in IS NOT NULL THEN
    -- Calcular ate o momento atual (para dias incompletos)
    v_worked := EXTRACT(EPOCH FROM (now() - v_clock_in))::INTEGER / 60;

    IF v_break_start IS NOT NULL THEN
      IF v_break_end IS NOT NULL THEN
        v_break := EXTRACT(EPOCH FROM (v_break_end - v_break_start))::INTEGER / 60;
      ELSE
        v_break := EXTRACT(EPOCH FROM (now() - v_break_start))::INTEGER / 60;
      END IF;
      v_worked := v_worked - v_break;
    END IF;
  END IF;

  RETURN QUERY SELECT
    v_worked AS worked_minutes,
    v_break AS break_minutes,
    (v_worked + v_break) AS total_minutes,
    v_complete AS is_complete;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION calculate_worked_hours IS 'Calcula horas trabalhadas no dia para um funcionario especifico';

-- =====================================================
-- FUNCAO: get_overtime_hours
-- Calcula horas extras em um periodo
-- =====================================================

CREATE OR REPLACE FUNCTION get_overtime_hours(
  p_employee_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_overtime_minutes INTEGER,
  total_missing_minutes INTEGER,
  net_balance_minutes INTEGER,
  days_worked INTEGER,
  days_with_overtime INTEGER,
  days_with_missing INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(ttd.overtime_minutes), 0)::INTEGER AS total_overtime_minutes,
    COALESCE(SUM(ttd.missing_minutes), 0)::INTEGER AS total_missing_minutes,
    COALESCE(SUM(ttd.overtime_minutes - ttd.missing_minutes), 0)::INTEGER AS net_balance_minutes,
    COUNT(*)::INTEGER AS days_worked,
    COUNT(*) FILTER (WHERE ttd.overtime_minutes > 0)::INTEGER AS days_with_overtime,
    COUNT(*) FILTER (WHERE ttd.missing_minutes > 0)::INTEGER AS days_with_missing
  FROM time_tracking_daily ttd
  WHERE ttd.employee_id = p_employee_id
  AND ttd.date BETWEEN p_start_date AND p_end_date
  AND ttd.clock_in IS NOT NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_overtime_hours IS 'Calcula horas extras e faltas em um periodo especifico';

-- =====================================================
-- FUNCAO: validate_signing
-- Valida se uma batida de ponto eh permitida
-- =====================================================

CREATE OR REPLACE FUNCTION validate_signing(
  p_employee_id UUID,
  p_signing_time TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE (
  is_valid BOOLEAN,
  error_code TEXT,
  error_message TEXT,
  last_action clock_type,
  expected_action clock_type
) AS $$
DECLARE
  v_last_action clock_type;
  v_last_time TIMESTAMPTZ;
  v_employee_status TEXT;
  v_signing_date DATE;
BEGIN
  v_signing_date := DATE(p_signing_time);

  -- Verificar se funcionario existe e esta ativo
  SELECT status INTO v_employee_status
  FROM employees
  WHERE id = p_employee_id;

  IF v_employee_status IS NULL THEN
    RETURN QUERY SELECT
      false AS is_valid,
      'EMPLOYEE_NOT_FOUND'::TEXT AS error_code,
      'Funcionario nao encontrado'::TEXT AS error_message,
      NULL::clock_type AS last_action,
      NULL::clock_type AS expected_action;
    RETURN;
  END IF;

  IF v_employee_status != 'active' THEN
    RETURN QUERY SELECT
      false AS is_valid,
      'EMPLOYEE_INACTIVE'::TEXT AS error_code,
      'Funcionario nao esta ativo'::TEXT AS error_message,
      NULL::clock_type AS last_action,
      NULL::clock_type AS expected_action;
    RETURN;
  END IF;

  -- Pegar ultima acao do dia
  SELECT record_type, recorded_at
  INTO v_last_action, v_last_time
  FROM time_records
  WHERE employee_id = p_employee_id
  AND DATE(recorded_at) = v_signing_date
  ORDER BY recorded_at DESC
  LIMIT 1;

  -- Validar intervalo minimo entre batidas (1 minuto)
  IF v_last_time IS NOT NULL THEN
    IF EXTRACT(EPOCH FROM (p_signing_time - v_last_time)) < 60 THEN
      RETURN QUERY SELECT
        false AS is_valid,
        'MIN_INTERVAL_NOT_MET'::TEXT AS error_code,
        'Aguarde pelo menos 1 minuto entre registros'::TEXT AS error_message,
        v_last_action AS last_action,
        NULL::clock_type AS expected_action;
      RETURN;
    END IF;
  END IF;

  -- Determinar proxima acao esperada
  RETURN QUERY SELECT
    true AS is_valid,
    NULL::TEXT AS error_code,
    NULL::TEXT AS error_message,
    v_last_action AS last_action,
    CASE v_last_action
      WHEN 'clock_in' THEN 'break_start'::clock_type
      WHEN 'break_start' THEN 'break_end'::clock_type
      WHEN 'break_end' THEN 'clock_out'::clock_type
      WHEN 'clock_out' THEN 'clock_in'::clock_type
      ELSE 'clock_in'::clock_type
    END AS expected_action;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION validate_signing IS 'Valida se uma batida de ponto eh permitida no momento atual';

-- =====================================================
-- FUNCAO: get_monthly_summary
-- Retorna resumo mensal completo de um funcionario
-- =====================================================

CREATE OR REPLACE FUNCTION get_monthly_summary(
  p_employee_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS TABLE (
  employee_id UUID,
  employee_name TEXT,
  month INTEGER,
  year INTEGER,
  total_days INTEGER,
  worked_days INTEGER,
  absent_days INTEGER,
  total_worked_minutes INTEGER,
  total_overtime_minutes INTEGER,
  total_missing_minutes INTEGER,
  net_balance_minutes INTEGER,
  time_bank_balance INTEGER,
  average_daily_hours NUMERIC,
  on_time_percentage NUMERIC,
  pending_approvals INTEGER,
  pending_corrections INTEGER
) AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_employee_name TEXT;
BEGIN
  -- Calcular range de datas
  v_start_date := make_date(p_year, p_month, 1);
  v_end_date := (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  -- Pegar nome do funcionario
  SELECT name INTO v_employee_name
  FROM employees
  WHERE id = p_employee_id;

  RETURN QUERY
  WITH daily_stats AS (
    SELECT
      COUNT(*) AS worked_days,
      COUNT(*) FILTER (WHERE ttd.clock_in IS NULL) AS absent_days,
      COALESCE(SUM(ttd.worked_minutes), 0) AS total_worked,
      COALESCE(SUM(ttd.overtime_minutes), 0) AS total_overtime,
      COALESCE(SUM(ttd.missing_minutes), 0) AS total_missing,
      COUNT(*) FILTER (WHERE ttd.status = 'pending') AS pending_approvals,
      COUNT(*) FILTER (WHERE ttd.missing_minutes = 0 AND ttd.clock_in IS NOT NULL) AS on_time_days
    FROM time_tracking_daily ttd
    WHERE ttd.employee_id = p_employee_id
    AND ttd.date BETWEEN v_start_date AND v_end_date
  ),
  corrections_pending AS (
    SELECT COUNT(*) AS pending_count
    FROM signing_corrections
    WHERE employee_id = p_employee_id
    AND correction_date BETWEEN v_start_date AND v_end_date
    AND status = 'pending'
  ),
  time_bank_current AS (
    SELECT COALESCE(balance_after, 0) AS balance
    FROM time_bank
    WHERE employee_id = p_employee_id
    ORDER BY created_at DESC
    LIMIT 1
  )
  SELECT
    p_employee_id AS employee_id,
    v_employee_name AS employee_name,
    p_month AS month,
    p_year AS year,
    EXTRACT(DAY FROM v_end_date)::INTEGER AS total_days,
    ds.worked_days::INTEGER,
    ds.absent_days::INTEGER,
    ds.total_worked::INTEGER AS total_worked_minutes,
    ds.total_overtime::INTEGER AS total_overtime_minutes,
    ds.total_missing::INTEGER AS total_missing_minutes,
    (ds.total_overtime - ds.total_missing)::INTEGER AS net_balance_minutes,
    tb.balance::INTEGER AS time_bank_balance,
    ROUND((ds.total_worked::NUMERIC / NULLIF(ds.worked_days, 0) / 60), 2) AS average_daily_hours,
    ROUND((ds.on_time_days::NUMERIC / NULLIF(ds.worked_days, 0) * 100), 2) AS on_time_percentage,
    ds.pending_approvals::INTEGER,
    cp.pending_count::INTEGER AS pending_corrections
  FROM daily_stats ds
  CROSS JOIN corrections_pending cp
  CROSS JOIN time_bank_current tb;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_monthly_summary IS 'Retorna resumo completo mensal de um funcionario';

-- =====================================================
-- FUNCAO: get_expected_hours
-- Retorna horas esperadas para um dia especifico
-- =====================================================

CREATE OR REPLACE FUNCTION get_expected_hours(
  p_employee_id UUID,
  p_date DATE
)
RETURNS NUMERIC AS $$
DECLARE
  v_daily_hours NUMERIC;
  v_weekday TEXT;
BEGIN
  v_weekday := LOWER(to_char(p_date, 'FMDay'));

  SELECT ws.daily_hours INTO v_daily_hours
  FROM employee_schedules es
  JOIN work_schedules ws ON ws.id = es.schedule_id
  WHERE es.employee_id = p_employee_id
  AND es.start_date <= p_date
  AND (es.end_date IS NULL OR es.end_date >= p_date)
  LIMIT 1;

  RETURN COALESCE(v_daily_hours, 8); -- Default 8 horas
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_expected_hours IS 'Retorna horas esperadas de trabalho para uma data especifica';

-- =====================================================
-- TRIGGER: Validar sequencia de batidas
-- Garante ordem logica: entrada → intervalo → saida
-- =====================================================

CREATE OR REPLACE FUNCTION validate_signing_sequence()
RETURNS TRIGGER AS $$
DECLARE
  v_last_action clock_type;
  v_today_date DATE;
BEGIN
  v_today_date := DATE(NEW.recorded_at);

  -- Pegar ultima acao do dia
  SELECT record_type INTO v_last_action
  FROM time_records
  WHERE employee_id = NEW.employee_id
  AND DATE(recorded_at) = v_today_date
  AND id != NEW.id
  ORDER BY recorded_at DESC
  LIMIT 1;

  -- Validar sequencia
  IF v_last_action IS NOT NULL THEN
    CASE NEW.record_type
      WHEN 'clock_in' THEN
        IF v_last_action != 'clock_out' THEN
          RAISE EXCEPTION 'Ja existe entrada registrada hoje. Registre saida primeiro';
        END IF;
      WHEN 'break_start' THEN
        IF v_last_action NOT IN ('clock_in', 'break_end') THEN
          RAISE EXCEPTION 'Registre entrada antes de iniciar intervalo';
        END IF;
      WHEN 'break_end' THEN
        IF v_last_action != 'break_start' THEN
          RAISE EXCEPTION 'Nao ha intervalo ativo para finalizar';
        END IF;
      WHEN 'clock_out' THEN
        IF v_last_action = 'break_start' THEN
          RAISE EXCEPTION 'Finalize o intervalo antes de registrar saida';
        END IF;
        IF v_last_action NOT IN ('clock_in', 'break_end') THEN
          RAISE EXCEPTION 'Registre entrada antes de registrar saida';
        END IF;
    END CASE;
  ELSE
    -- Primeira acao do dia deve ser clock_in
    IF NEW.record_type != 'clock_in' THEN
      RAISE EXCEPTION 'Primeira acao do dia deve ser entrada (clock_in)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_signing_sequence
  BEFORE INSERT ON time_records
  FOR EACH ROW
  EXECUTE FUNCTION validate_signing_sequence();

COMMENT ON FUNCTION validate_signing_sequence IS 'Valida sequencia logica de batidas de ponto';

-- =====================================================
-- TRIGGER: Prevenir batidas duplicadas
-- Intervalo minimo de 1 minuto entre batidas
-- =====================================================

CREATE OR REPLACE FUNCTION prevent_duplicate_signings()
RETURNS TRIGGER AS $$
DECLARE
  v_last_time TIMESTAMPTZ;
BEGIN
  -- Pegar horario da ultima batida
  SELECT recorded_at INTO v_last_time
  FROM time_records
  WHERE employee_id = NEW.employee_id
  ORDER BY recorded_at DESC
  LIMIT 1;

  -- Validar intervalo minimo
  IF v_last_time IS NOT NULL THEN
    IF EXTRACT(EPOCH FROM (NEW.recorded_at - v_last_time)) < 60 THEN
      RAISE EXCEPTION 'Aguarde pelo menos 1 minuto entre registros';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_duplicate_signings
  BEFORE INSERT ON time_records
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_signings();

COMMENT ON FUNCTION prevent_duplicate_signings IS 'Previne batidas de ponto duplicadas em menos de 1 minuto';

-- =====================================================
-- TRIGGER: Atualizar status automaticamente
-- Muda status baseado em horarios completos
-- =====================================================

CREATE OR REPLACE FUNCTION auto_update_tracking_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Se tem entrada e saida, pode ser aprovado automaticamente (depende da config)
  IF NEW.clock_in IS NOT NULL AND NEW.clock_out IS NOT NULL THEN
    -- Verificar se funcionario tem aprovacao automatica
    IF EXISTS (
      SELECT 1 FROM employees
      WHERE id = NEW.employee_id
      AND status = 'active'
      -- Adicionar campo auto_approve_timesheet se necessario
    ) THEN
      NEW.status := 'approved';
      NEW.approved_at := now();
    ELSE
      NEW.status := 'pending';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_update_tracking_status
  BEFORE INSERT OR UPDATE ON time_tracking_daily
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_tracking_status();

COMMENT ON FUNCTION auto_update_tracking_status IS 'Atualiza status automaticamente baseado em completude de horarios';

-- =====================================================
-- RLS POLICIES MELHORADAS
-- =====================================================

-- Remover policies existentes se houver conflito
DROP POLICY IF EXISTS "Users can view colleagues current status" ON time_records;
DROP POLICY IF EXISTS "Admins can bulk manage records" ON time_records;

-- =====================================================
-- POLICIES: time_records
-- =====================================================

-- Usuarios podem ver seus proprios registros
CREATE POLICY "employees_view_own_records"
  ON time_records FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

-- Usuarios podem criar seus proprios registros
CREATE POLICY "employees_insert_own_records"
  ON time_records FOR INSERT
  WITH CHECK (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- Usuarios podem ver status atual de colegas (dashboard)
CREATE POLICY "employees_view_colleagues_today"
  ON time_records FOR SELECT
  USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    AND DATE(recorded_at AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
  );

-- Gestores podem ver registros da equipe
CREATE POLICY "managers_view_team_records"
  ON time_records FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE manager_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Admins/HR podem gerenciar todos os registros
CREATE POLICY "admins_manage_all_records"
  ON time_records FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- =====================================================
-- POLICIES: signing_corrections
-- =====================================================

ALTER TABLE signing_corrections ENABLE ROW LEVEL SECURITY;

-- Funcionarios podem ver e criar suas proprias solicitacoes
CREATE POLICY "employees_view_own_corrections"
  ON signing_corrections FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "employees_create_corrections"
  ON signing_corrections FOR INSERT
  WITH CHECK (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- Gestores podem ver e aprovar solicitacoes da equipe
CREATE POLICY "managers_manage_team_corrections"
  ON signing_corrections FOR ALL
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE manager_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Admins/HR podem gerenciar todas as solicitacoes
CREATE POLICY "admins_manage_all_corrections"
  ON signing_corrections FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- =====================================================
-- POLICIES: time_tracking_daily
-- =====================================================

-- Usuarios podem ver seu proprio resumo diario
CREATE POLICY "employees_view_own_daily"
  ON time_tracking_daily FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

-- Gestores podem ver e aprovar resumos da equipe
CREATE POLICY "managers_manage_team_daily"
  ON time_tracking_daily FOR ALL
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE manager_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Admins/HR podem gerenciar todos os resumos
CREATE POLICY "admins_manage_all_daily"
  ON time_tracking_daily FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- =====================================================
-- POLICIES: time_bank
-- =====================================================

-- Usuarios podem ver seu proprio banco de horas
CREATE POLICY "employees_view_own_timebank"
  ON time_bank FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

-- Gestores podem ver banco de horas da equipe
CREATE POLICY "managers_view_team_timebank"
  ON time_bank FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE manager_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Admins/HR podem gerenciar todos os bancos de horas
CREATE POLICY "admins_manage_all_timebank"
  ON time_bank FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- =====================================================
-- INDICES ADICIONAIS PARA PERFORMANCE
-- =====================================================

-- Indice para consultas de validacao de batidas (sem predicado de data)
CREATE INDEX IF NOT EXISTS idx_time_records_employee_recent
  ON time_records (employee_id, recorded_at DESC);

-- Indice para consultas de resumo mensal (sem predicado de data)
CREATE INDEX IF NOT EXISTS idx_time_tracking_employee_month
  ON time_tracking_daily (employee_id, date DESC);

-- Indice para consultas de correcoes pendentes
CREATE INDEX IF NOT EXISTS idx_corrections_employee_pending
  ON signing_corrections (employee_id, status, correction_date DESC)
  WHERE status = 'pending';

-- Indice para consultas de banco de horas atual
CREATE INDEX IF NOT EXISTS idx_time_bank_employee_latest
  ON time_bank (employee_id, created_at DESC);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Conceder acesso as novas funcoes
GRANT EXECUTE ON FUNCTION calculate_worked_hours TO authenticated;
GRANT EXECUTE ON FUNCTION get_overtime_hours TO authenticated;
GRANT EXECUTE ON FUNCTION validate_signing TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_expected_hours TO authenticated;

-- =====================================================
-- VIEWS ADICIONAIS
-- =====================================================

-- View para correcoes pendentes de aprovacao
CREATE OR REPLACE VIEW v_pending_corrections AS
SELECT
  sc.*,
  e.name AS employee_name,
  e.department,
  p.name AS reviewer_name,
  EXTRACT(DAY FROM (now() - sc.created_at)) AS days_pending
FROM signing_corrections sc
JOIN employees e ON e.id = sc.employee_id
LEFT JOIN profiles p ON p.id = sc.reviewed_by
WHERE sc.status = 'pending'
ORDER BY sc.created_at ASC;

COMMENT ON VIEW v_pending_corrections IS 'View de correcoes de ponto pendentes de aprovacao';

-- View para banco de horas consolidado
CREATE OR REPLACE VIEW v_time_bank_current AS
SELECT DISTINCT ON (tb.employee_id)
  tb.employee_id,
  e.name AS employee_name,
  e.department,
  tb.balance_after AS current_balance,
  tb.created_at AS last_update,
  CASE
    WHEN tb.balance_after > 0 THEN 'credit'
    WHEN tb.balance_after < 0 THEN 'debit'
    ELSE 'zero'
  END AS balance_status
FROM time_bank tb
JOIN employees e ON e.id = tb.employee_id
WHERE e.status = 'active'
ORDER BY tb.employee_id, tb.created_at DESC;

COMMENT ON VIEW v_time_bank_current IS 'View do saldo atual do banco de horas por funcionario';

-- =====================================================
-- COMENTARIOS FINAIS
-- =====================================================

COMMENT ON TABLE signing_corrections IS 'Solicitacoes de correcao de batidas de ponto';
COMMENT ON COLUMN signing_corrections.correction_type IS 'Tipo de correcao solicitada';
COMMENT ON COLUMN signing_corrections.original_values IS 'Valores originais antes da correcao (JSONB)';

-- =====================================================
-- FIM DA MIGRATION 015
-- =====================================================


