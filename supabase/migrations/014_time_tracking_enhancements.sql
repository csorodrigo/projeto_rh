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
