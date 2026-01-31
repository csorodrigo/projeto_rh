-- =====================================================
-- Migration 023: Fix Payroll RPC Security
-- Adiciona SECURITY DEFINER para bypassar RLS
-- =====================================================

-- Funcao para calcular folha de um funcionario
-- SECURITY DEFINER permite que a funcao execute com as permissoes do owner (postgres)
-- SET search_path = public evita ataques de search_path
CREATE OR REPLACE FUNCTION calculate_employee_payroll(
  p_employee_id UUID,
  p_period_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee RECORD;
  v_period RECORD;
  v_payroll_id UUID;
  v_earnings JSONB := '[]'::jsonb;
  v_deductions JSONB := '[]'::jsonb;
  v_inss_value NUMERIC;
  v_irrf_value NUMERIC;
  v_dependents INTEGER;
BEGIN
  -- Pegar dados do funcionario
  SELECT * INTO v_employee
  FROM employees WHERE id = p_employee_id;

  -- Pegar dados do periodo
  SELECT * INTO v_period
  FROM payroll_periods WHERE id = p_period_id;

  -- Calcular INSS
  v_inss_value := calculate_inss(v_employee.base_salary, v_period.reference_date);

  -- Contar dependentes
  SELECT jsonb_array_length(COALESCE(v_employee.dependents, '[]'::jsonb))
  INTO v_dependents;

  -- Calcular IRRF (base = salario - INSS)
  v_irrf_value := calculate_irrf(
    v_employee.base_salary - v_inss_value,
    v_dependents,
    v_period.reference_date
  );

  -- Montar proventos
  v_earnings := jsonb_build_array(
    jsonb_build_object(
      'code', '001',
      'name', 'Salario Base',
      'value', v_employee.base_salary,
      'reference', 30
    )
  );

  -- Montar descontos
  v_deductions := jsonb_build_array(
    jsonb_build_object(
      'code', '101',
      'name', 'INSS',
      'value', v_inss_value,
      'base', v_employee.base_salary
    ),
    jsonb_build_object(
      'code', '102',
      'name', 'IRRF',
      'value', v_irrf_value,
      'base', v_employee.base_salary - v_inss_value
    )
  );

  -- Inserir ou atualizar folha
  INSERT INTO employee_payrolls (
    company_id, period_id, employee_id,
    base_salary, earnings, deductions,
    inss_base, inss_value, irrf_base, irrf_value,
    fgts_base, fgts_value,
    employee_data, bank_data,
    status
  )
  VALUES (
    v_employee.company_id, p_period_id, p_employee_id,
    v_employee.base_salary, v_earnings, v_deductions,
    v_employee.base_salary, v_inss_value,
    v_employee.base_salary - v_inss_value, v_irrf_value,
    v_employee.base_salary, ROUND(v_employee.base_salary * 0.08, 2),
    jsonb_build_object(
      'name', v_employee.name,
      'cpf', v_employee.cpf,
      'position', v_employee."position",
      'department', v_employee.department
    ),
    jsonb_build_object(
      'bank', v_employee.bank_name,
      'agency', v_employee.agency,
      'account', v_employee.account,
      'pix', v_employee.pix_key
    ),
    'calculated'
  )
  ON CONFLICT (period_id, employee_id)
  DO UPDATE SET
    base_salary = EXCLUDED.base_salary,
    earnings = EXCLUDED.earnings,
    deductions = EXCLUDED.deductions,
    inss_base = EXCLUDED.inss_base,
    inss_value = EXCLUDED.inss_value,
    irrf_base = EXCLUDED.irrf_base,
    irrf_value = EXCLUDED.irrf_value,
    fgts_base = EXCLUDED.fgts_base,
    fgts_value = EXCLUDED.fgts_value,
    employee_data = EXCLUDED.employee_data,
    bank_data = EXCLUDED.bank_data,
    status = 'calculated',
    updated_at = now()
  RETURNING id INTO v_payroll_id;

  RETURN v_payroll_id;
END;
$$;

-- Tambem adicionar SECURITY DEFINER nas funcoes auxiliares de calculo
-- para garantir que elas possam acessar as tabelas de INSS/IRRF

CREATE OR REPLACE FUNCTION calculate_inss(
  p_base NUMERIC,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_table RECORD;
  v_bracket RECORD;
  v_inss NUMERIC := 0;
  v_remaining NUMERIC;
  v_prev_max NUMERIC := 0;
BEGIN
  -- Pegar tabela vigente
  SELECT * INTO v_table
  FROM inss_tables
  WHERE is_active = true
  AND start_date <= p_date
  AND (end_date IS NULL OR end_date >= p_date)
  ORDER BY start_date DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Calcular progressivamente
  v_remaining := LEAST(p_base, v_table.ceiling);

  FOR v_bracket IN
    SELECT * FROM jsonb_to_recordset(v_table.brackets)
    AS x(min NUMERIC, max NUMERIC, rate NUMERIC, deduction NUMERIC)
    ORDER BY min
  LOOP
    IF v_remaining > 0 THEN
      v_inss := v_inss + (
        LEAST(v_remaining, COALESCE(v_bracket.max, v_remaining) - v_prev_max) *
        v_bracket.rate / 100
      );
      v_prev_max := COALESCE(v_bracket.max, v_remaining);
      v_remaining := v_remaining - v_bracket.max;
    END IF;
  END LOOP;

  RETURN ROUND(v_inss, 2);
END;
$$;

CREATE OR REPLACE FUNCTION calculate_irrf(
  p_base NUMERIC,
  p_dependents INTEGER DEFAULT 0,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_table RECORD;
  v_bracket RECORD;
  v_taxable_base NUMERIC;
  v_irrf NUMERIC := 0;
BEGIN
  -- Pegar tabela vigente
  SELECT * INTO v_table
  FROM irrf_tables
  WHERE is_active = true
  AND start_date <= p_date
  AND (end_date IS NULL OR end_date >= p_date)
  ORDER BY start_date DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Calcular base tributavel (deducao de dependentes)
  v_taxable_base := p_base - (p_dependents * v_table.dependent_deduction);

  IF v_taxable_base <= 0 THEN
    RETURN 0;
  END IF;

  -- Encontrar faixa e calcular
  FOR v_bracket IN
    SELECT * FROM jsonb_to_recordset(v_table.brackets)
    AS x(min NUMERIC, max NUMERIC, rate NUMERIC, deduction NUMERIC)
    ORDER BY min DESC
  LOOP
    IF v_taxable_base >= v_bracket.min THEN
      v_irrf := (v_taxable_base * v_bracket.rate / 100) - v_bracket.deduction;
      EXIT;
    END IF;
  END LOOP;

  RETURN GREATEST(ROUND(v_irrf, 2), 0);
END;
$$;

-- Comentarios
COMMENT ON FUNCTION calculate_employee_payroll(UUID, UUID) IS
  'Calcula a folha de pagamento de um funcionario. Usa SECURITY DEFINER para bypassar RLS.';
COMMENT ON FUNCTION calculate_inss(NUMERIC, DATE) IS
  'Calcula o valor do INSS baseado na tabela progressiva vigente.';
COMMENT ON FUNCTION calculate_irrf(NUMERIC, INTEGER, DATE) IS
  'Calcula o valor do IRRF baseado na tabela progressiva vigente.';
