-- =====================================================
-- Migration 008: Health (Saude Ocupacional - ASO e Atestados)
-- Sistema SaaS de RH Multi-tenant
-- =====================================================

-- ENUM para tipos de ASO
CREATE TYPE aso_type AS ENUM (
  'admission',    -- Admissional
  'periodic',     -- Periodico
  'return',       -- Retorno ao trabalho
  'job_change',   -- Mudanca de funcao
  'dismissal'     -- Demissional
);

-- ENUM para resultado do ASO
CREATE TYPE aso_result AS ENUM (
  'fit',              -- Apto
  'unfit',            -- Inapto
  'fit_restrictions', -- Apto com restricoes
  'pending'           -- Pendente de exames
);

-- ENUM para status do exame
CREATE TYPE exam_status AS ENUM (
  'scheduled',    -- Agendado
  'completed',    -- Realizado
  'cancelled',    -- Cancelado
  'expired',      -- Vencido
  'pending'       -- Pendente
);

-- =====================================================
-- Tabela de ASOs (Atestado de Saude Ocupacional)
-- =====================================================

CREATE TABLE asos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Funcionario
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Tipo de ASO
  type aso_type NOT NULL,

  -- Datas
  exam_date DATE NOT NULL,
  next_exam_date DATE, -- Proximo exame periodico
  expiry_date DATE, -- Data de validade

  -- Resultado
  result aso_result DEFAULT 'pending' NOT NULL,
  restrictions TEXT, -- Restricoes (se apto com restricoes)

  -- Clinica/Medico
  clinic_name TEXT,
  clinic_address TEXT,
  doctor_name TEXT NOT NULL,
  crm VARCHAR(20) NOT NULL,
  crm_state VARCHAR(2),

  -- Exames realizados
  exams_performed JSONB DEFAULT '[]'::jsonb,
  -- Estrutura:
  -- [
  --   {
  --     "name": "Hemograma completo",
  --     "code": "HEM001",
  --     "date": "2024-01-15",
  --     "result": "Normal",
  --     "reference_values": "...",
  --     "observations": "..."
  --   }
  -- ]

  -- Riscos ocupacionais avaliados
  occupational_risks JSONB DEFAULT '[]'::jsonb,
  -- Estrutura:
  -- [
  --   {
  --     "risk_type": "fisico" | "quimico" | "biologico" | "ergonomico" | "acidente",
  --     "description": "Ruido acima de 85dB",
  --     "exposure_level": "alto",
  --     "protective_measures": "EPI auricular"
  --   }
  -- ]

  -- Observacoes
  medical_observations TEXT,
  recommendations TEXT,

  -- Arquivo
  file_url TEXT,
  file_name TEXT,

  -- Status
  status exam_status DEFAULT 'completed' NOT NULL,

  -- Integracao com ausencias (para retorno ao trabalho)
  absence_id UUID REFERENCES absences(id),

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- Tabela de Atestados Medicos
-- =====================================================

CREATE TABLE medical_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Funcionario
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Periodo de afastamento
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER GENERATED ALWAYS AS (end_date - start_date + 1) STORED,

  -- CID (opcional por questoes de privacidade)
  cid_code VARCHAR(10), -- Codigo CID-10
  cid_description TEXT,
  show_cid BOOLEAN DEFAULT false, -- Exibir CID nos relatorios

  -- Medico
  doctor_name TEXT NOT NULL,
  crm VARCHAR(20) NOT NULL,
  crm_state VARCHAR(2),

  -- Local de atendimento
  healthcare_facility TEXT,
  facility_type VARCHAR(50), -- hospital, clinica, ups, consultorio

  -- Tipo de atestado
  certificate_type VARCHAR(50) DEFAULT 'medical_leave',
  -- medical_leave, accident, surgery, maternity, psychiatric

  -- Observacoes
  medical_notes TEXT,
  internal_notes TEXT, -- Notas internas do RH

  -- Arquivo
  file_url TEXT,
  file_name TEXT,

  -- Validacao
  is_validated BOOLEAN DEFAULT false,
  validated_by UUID REFERENCES profiles(id),
  validated_at TIMESTAMPTZ,
  validation_notes TEXT,

  -- Integracao
  absence_id UUID REFERENCES absences(id), -- Link com ausencia criada

  -- INSS (para afastamentos > 15 dias)
  requires_inss BOOLEAN DEFAULT false,
  inss_protocol VARCHAR(50),
  inss_start_date DATE, -- Quando INSS assume
  inss_status VARCHAR(50), -- pending, approved, denied

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  submitted_by UUID REFERENCES profiles(id),

  -- Constraints
  CONSTRAINT valid_certificate_dates CHECK (end_date >= start_date)
);

-- =====================================================
-- Tabela de Exames Periodicos Agendados
-- =====================================================

CREATE TABLE scheduled_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Funcionario
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Tipo de exame
  exam_type aso_type DEFAULT 'periodic' NOT NULL,

  -- Agendamento
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  scheduled_clinic TEXT,
  scheduled_address TEXT,

  -- Exames a realizar
  required_exams JSONB DEFAULT '[]'::jsonb,
  -- ["Hemograma", "Audiometria", "Espirometria"]

  -- Status
  status exam_status DEFAULT 'scheduled' NOT NULL,
  completed_aso_id UUID REFERENCES asos(id), -- ASO gerado apos exame

  -- Notificacoes
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMPTZ,

  -- Observacoes
  notes TEXT,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- Tabela de PCMSO (Programa de Controle Medico)
-- =====================================================

CREATE TABLE pcmso_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Vigencia
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  year INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM start_date)) STORED,

  -- Responsavel
  coordinator_name TEXT NOT NULL, -- Medico coordenador
  coordinator_crm VARCHAR(20) NOT NULL,
  coordinator_specialty TEXT DEFAULT 'Medicina do Trabalho',

  -- Documento
  document_url TEXT,
  document_version VARCHAR(20),

  -- Configuracoes de periodicidade por risco
  periodicity_rules JSONB DEFAULT '{}'::jsonb,
  -- Estrutura:
  -- {
  --   "default_months": 12,
  --   "high_risk_months": 6,
  --   "age_over_45_months": 6,
  --   "specific_risks": {
  --     "ruido": 12,
  --     "poeira": 6,
  --     "quimicos": 6
  --   }
  -- }

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- Tabela de Acidentes de Trabalho
-- =====================================================

CREATE TABLE work_accidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Funcionario
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Data e local
  accident_date DATE NOT NULL,
  accident_time TIME,
  accident_location TEXT NOT NULL,
  was_during_work_hours BOOLEAN DEFAULT true,
  was_commute_accident BOOLEAN DEFAULT false, -- Acidente de trajeto

  -- Descricao
  description TEXT NOT NULL,
  body_parts_affected TEXT[],
  accident_type VARCHAR(50), -- queda, corte, impacto, queimadura, etc

  -- Testemunhas
  witnesses JSONB DEFAULT '[]'::jsonb,
  -- [{ "name": "...", "role": "...", "statement": "..." }]

  -- Gravidade
  severity VARCHAR(20), -- leve, moderado, grave, fatal
  days_away INTEGER DEFAULT 0, -- Dias de afastamento
  is_fatal BOOLEAN DEFAULT false,

  -- CAT (Comunicacao de Acidente de Trabalho)
  cat_number VARCHAR(50),
  cat_date DATE,
  cat_type VARCHAR(20), -- inicial, reabertura, comunicacao_obito
  cat_file_url TEXT,

  -- INSS
  inss_benefit_number VARCHAR(50),
  inss_start_date DATE,

  -- Investigacao
  investigation_status VARCHAR(20) DEFAULT 'pending',
  -- pending, in_progress, completed
  root_cause TEXT,
  corrective_actions TEXT,
  preventive_actions TEXT,
  investigation_completed_at TIMESTAMPTZ,
  investigation_by UUID REFERENCES profiles(id),

  -- Retorno ao trabalho
  return_date DATE,
  return_aso_id UUID REFERENCES asos(id),

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  reported_by UUID REFERENCES profiles(id),

  -- Constraint
  CONSTRAINT valid_return_date CHECK (
    return_date IS NULL OR return_date >= accident_date
  )
);

-- =====================================================
-- INDICES
-- =====================================================

-- asos
CREATE INDEX idx_asos_company ON asos (company_id);
CREATE INDEX idx_asos_employee ON asos (employee_id);
CREATE INDEX idx_asos_type ON asos (type);
CREATE INDEX idx_asos_result ON asos (result);
CREATE INDEX idx_asos_exam_date ON asos (exam_date);
CREATE INDEX idx_asos_next_exam ON asos (next_exam_date)
  WHERE next_exam_date IS NOT NULL;
CREATE INDEX idx_asos_employee_type ON asos (employee_id, type);

-- medical_certificates
CREATE INDEX idx_medical_certificates_company ON medical_certificates (company_id);
CREATE INDEX idx_medical_certificates_employee ON medical_certificates (employee_id);
CREATE INDEX idx_medical_certificates_dates ON medical_certificates (start_date, end_date);
CREATE INDEX idx_medical_certificates_validated ON medical_certificates (is_validated);
CREATE INDEX idx_medical_certificates_inss ON medical_certificates (requires_inss)
  WHERE requires_inss = true;

-- scheduled_exams
CREATE INDEX idx_scheduled_exams_company ON scheduled_exams (company_id);
CREATE INDEX idx_scheduled_exams_employee ON scheduled_exams (employee_id);
CREATE INDEX idx_scheduled_exams_date ON scheduled_exams (scheduled_date);
CREATE INDEX idx_scheduled_exams_status ON scheduled_exams (status);
CREATE INDEX idx_scheduled_exams_pending ON scheduled_exams (company_id, scheduled_date)
  WHERE status = 'scheduled';

-- pcmso_programs
CREATE INDEX idx_pcmso_company ON pcmso_programs (company_id);
CREATE INDEX idx_pcmso_active ON pcmso_programs (company_id, is_active)
  WHERE is_active = true;

-- work_accidents
CREATE INDEX idx_work_accidents_company ON work_accidents (company_id);
CREATE INDEX idx_work_accidents_employee ON work_accidents (employee_id);
CREATE INDEX idx_work_accidents_date ON work_accidents (accident_date);
CREATE INDEX idx_work_accidents_severity ON work_accidents (severity);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER trigger_asos_updated_at
  BEFORE UPDATE ON asos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_medical_certificates_updated_at
  BEFORE UPDATE ON medical_certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_scheduled_exams_updated_at
  BEFORE UPDATE ON scheduled_exams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_pcmso_updated_at
  BEFORE UPDATE ON pcmso_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_work_accidents_updated_at
  BEFORE UPDATE ON work_accidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Funcao para criar ausencia automatica ao validar atestado
CREATE OR REPLACE FUNCTION create_absence_from_certificate()
RETURNS TRIGGER AS $$
DECLARE
  v_absence_id UUID;
BEGIN
  -- Apenas quando validado e sem ausencia vinculada
  IF NEW.is_validated = true AND OLD.is_validated = false AND NEW.absence_id IS NULL THEN
    INSERT INTO absences (
      company_id, employee_id, type,
      start_date, end_date, reason,
      document_url, cid_code,
      status, approved_by, approved_at
    )
    VALUES (
      NEW.company_id, NEW.employee_id, 'sick_leave',
      NEW.start_date, NEW.end_date, 'Atestado medico',
      NEW.file_url, NEW.cid_code,
      'approved', NEW.validated_by, now()
    )
    RETURNING id INTO v_absence_id;

    -- Vincular ausencia ao atestado
    NEW.absence_id := v_absence_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_absence_from_certificate
  BEFORE UPDATE ON medical_certificates
  FOR EACH ROW
  EXECUTE FUNCTION create_absence_from_certificate();

-- Funcao para calcular proximo exame periodico
CREATE OR REPLACE FUNCTION calculate_next_exam_date()
RETURNS TRIGGER AS $$
DECLARE
  v_months INTEGER := 12;
  v_employee_age INTEGER;
  v_has_high_risk BOOLEAN;
BEGIN
  -- Apenas para ASOs periodicos ou admissionais
  IF NEW.type IN ('periodic', 'admission') AND NEW.result = 'fit' THEN
    -- Calcular idade do funcionario
    SELECT EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date))
    INTO v_employee_age
    FROM employees WHERE id = NEW.employee_id;

    -- Ajustar periodicidade
    IF v_employee_age >= 45 OR v_employee_age < 18 THEN
      v_months := 6;
    END IF;

    -- Verificar riscos (simplificado)
    IF jsonb_array_length(NEW.occupational_risks) > 0 THEN
      v_months := LEAST(v_months, 6);
    END IF;

    -- Definir proxima data
    NEW.next_exam_date := NEW.exam_date + (v_months || ' months')::INTERVAL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_next_exam
  BEFORE INSERT OR UPDATE ON asos
  FOR EACH ROW
  EXECUTE FUNCTION calculate_next_exam_date();

-- Funcao para agendar exame periodico automaticamente
CREATE OR REPLACE FUNCTION schedule_periodic_exam()
RETURNS TRIGGER AS $$
BEGIN
  -- Ao inserir ASO com proximo exame definido, agendar
  IF NEW.next_exam_date IS NOT NULL THEN
    INSERT INTO scheduled_exams (
      company_id, employee_id, exam_type,
      scheduled_date, required_exams,
      status, created_by
    )
    VALUES (
      NEW.company_id, NEW.employee_id, 'periodic',
      NEW.next_exam_date - INTERVAL '30 days', -- Agendar 30 dias antes
      NEW.exams_performed,
      'scheduled', NEW.created_by
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_schedule_periodic_exam
  AFTER INSERT ON asos
  FOR EACH ROW
  EXECUTE FUNCTION schedule_periodic_exam();

-- =====================================================
-- FUNCOES AUXILIARES
-- =====================================================

-- Funcao para listar exames vencendo
CREATE OR REPLACE FUNCTION get_expiring_exams(
  p_company_id UUID,
  p_days_ahead INTEGER DEFAULT 30
)
RETURNS TABLE (
  employee_id UUID,
  employee_name TEXT,
  department TEXT,
  last_exam_date DATE,
  next_exam_date DATE,
  days_until_due INTEGER,
  exam_type aso_type
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (a.employee_id)
    a.employee_id,
    e.name,
    e.department,
    a.exam_date,
    a.next_exam_date,
    (a.next_exam_date - CURRENT_DATE)::INTEGER,
    a.type
  FROM asos a
  JOIN employees e ON e.id = a.employee_id
  WHERE a.company_id = p_company_id
  AND a.next_exam_date IS NOT NULL
  AND a.next_exam_date <= CURRENT_DATE + p_days_ahead
  AND e.status = 'active'
  ORDER BY a.employee_id, a.exam_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Funcao para verificar aptidao do funcionario
CREATE OR REPLACE FUNCTION check_employee_fitness(
  p_employee_id UUID
)
RETURNS TABLE (
  is_fit BOOLEAN,
  last_aso_date DATE,
  last_aso_result aso_result,
  next_exam_due DATE,
  is_exam_overdue BOOLEAN,
  restrictions TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.result IN ('fit', 'fit_restrictions'),
    a.exam_date,
    a.result,
    a.next_exam_date,
    COALESCE(a.next_exam_date < CURRENT_DATE, false),
    a.restrictions
  FROM asos a
  WHERE a.employee_id = p_employee_id
  AND a.status = 'completed'
  ORDER BY a.exam_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

ALTER TABLE asos ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE pcmso_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_accidents ENABLE ROW LEVEL SECURITY;

-- asos policies
CREATE POLICY "Users can view own ASOs"
  ON asos FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins and HR can manage ASOs"
  ON asos FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- medical_certificates policies
CREATE POLICY "Users can view own certificates"
  ON medical_certificates FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can submit own certificates"
  ON medical_certificates FOR INSERT
  WITH CHECK (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins and HR can manage certificates"
  ON medical_certificates FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- scheduled_exams policies
CREATE POLICY "Users can view own scheduled exams"
  ON scheduled_exams FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins and HR can manage scheduled exams"
  ON scheduled_exams FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- pcmso_programs policies
CREATE POLICY "Users can view company PCMSO"
  ON pcmso_programs FOR SELECT
  USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage PCMSO"
  ON pcmso_programs FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- work_accidents policies
CREATE POLICY "Users can view own accidents"
  ON work_accidents FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can report accidents"
  ON work_accidents FOR INSERT
  WITH CHECK (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins and HR can manage accidents"
  ON work_accidents FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- =====================================================
-- VIEWS
-- =====================================================

-- View de saude ocupacional do funcionario
CREATE VIEW v_employee_health_status AS
SELECT
  e.id AS employee_id,
  e.company_id,
  e.name,
  e.department,
  e.position,
  a.exam_date AS last_aso_date,
  a.type AS last_aso_type,
  a.result AS aso_result,
  a.next_exam_date,
  CASE
    WHEN a.next_exam_date IS NULL THEN 'no_exam'
    WHEN a.next_exam_date < CURRENT_DATE THEN 'overdue'
    WHEN a.next_exam_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'due_soon'
    ELSE 'ok'
  END AS exam_status,
  a.restrictions
FROM employees e
LEFT JOIN LATERAL (
  SELECT * FROM asos
  WHERE employee_id = e.id
  AND status = 'completed'
  ORDER BY exam_date DESC
  LIMIT 1
) a ON true
WHERE e.status = 'active';

-- View de atestados pendentes de validacao
CREATE VIEW v_pending_certificates AS
SELECT
  mc.id,
  mc.company_id,
  mc.employee_id,
  e.name AS employee_name,
  e.department,
  mc.start_date,
  mc.end_date,
  mc.total_days,
  mc.doctor_name,
  mc.crm,
  mc.created_at AS submitted_at
FROM medical_certificates mc
JOIN employees e ON e.id = mc.employee_id
WHERE mc.is_validated = false
ORDER BY mc.created_at;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE asos IS 'Atestados de Saude Ocupacional (ASO) dos funcionarios';
COMMENT ON TABLE medical_certificates IS 'Atestados medicos apresentados pelos funcionarios';
COMMENT ON TABLE scheduled_exams IS 'Exames ocupacionais agendados';
COMMENT ON TABLE pcmso_programs IS 'Programas de Controle Medico de Saude Ocupacional';
COMMENT ON TABLE work_accidents IS 'Registro de acidentes de trabalho e CAT';
COMMENT ON COLUMN asos.occupational_risks IS 'Riscos ocupacionais avaliados no exame';
COMMENT ON COLUMN medical_certificates.cid_code IS 'Codigo CID-10 - protegido por LGPD';
COMMENT ON COLUMN medical_certificates.requires_inss IS 'Afastamento superior a 15 dias';
COMMENT ON COLUMN work_accidents.cat_number IS 'Numero da CAT emitida';
