-- =====================================================
-- Migration 000: Setup Inicial
-- Sistema SaaS de RH Multi-tenant
-- =====================================================
-- Este arquivo deve ser executado PRIMEIRO para configurar
-- extensoes e funcoes base necessarias para as demais migrations

-- =====================================================
-- EXTENSOES
-- =====================================================

-- Extensao para busca por similaridade (fuzzy search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Extensao para UUIDs (geralmente ja habilitada no Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extensao para dados geograficos (geofencing)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Extensao para criptografia (senhas, dados sensiveis)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Extensao para estatisticas de queries (monitoramento)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- =====================================================
-- CONFIGURACOES DE SEGURANCA
-- =====================================================

-- Revogar acesso publico ao schema public
REVOKE ALL ON SCHEMA public FROM public;

-- Conceder acesso ao schema para usuarios autenticados
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- =====================================================
-- FUNCOES UTILITARIAS BASE
-- =====================================================

-- Funcao generica para updated_at (usada em todas as tabelas)
-- Nota: Esta funcao eh criada aqui e referenciada nas migrations seguintes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funcao para gerar slug a partir de texto
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        unaccent(input_text),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Funcao para validar CPF
CREATE OR REPLACE FUNCTION validate_cpf(cpf TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  cpf_numbers TEXT;
  sum1 INTEGER := 0;
  sum2 INTEGER := 0;
  digit1 INTEGER;
  digit2 INTEGER;
  i INTEGER;
BEGIN
  -- Remover caracteres nao numericos
  cpf_numbers := regexp_replace(cpf, '[^0-9]', '', 'g');

  -- Verificar tamanho
  IF length(cpf_numbers) != 11 THEN
    RETURN FALSE;
  END IF;

  -- Verificar CPFs invalidos conhecidos
  IF cpf_numbers IN (
    '00000000000', '11111111111', '22222222222', '33333333333',
    '44444444444', '55555555555', '66666666666', '77777777777',
    '88888888888', '99999999999'
  ) THEN
    RETURN FALSE;
  END IF;

  -- Calcular primeiro digito verificador
  FOR i IN 1..9 LOOP
    sum1 := sum1 + (substring(cpf_numbers, i, 1)::INTEGER * (11 - i));
  END LOOP;
  digit1 := (sum1 * 10) % 11;
  IF digit1 = 10 THEN digit1 := 0; END IF;

  -- Verificar primeiro digito
  IF digit1 != substring(cpf_numbers, 10, 1)::INTEGER THEN
    RETURN FALSE;
  END IF;

  -- Calcular segundo digito verificador
  FOR i IN 1..10 LOOP
    sum2 := sum2 + (substring(cpf_numbers, i, 1)::INTEGER * (12 - i));
  END LOOP;
  digit2 := (sum2 * 10) % 11;
  IF digit2 = 10 THEN digit2 := 0; END IF;

  -- Verificar segundo digito
  RETURN digit2 = substring(cpf_numbers, 11, 1)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Funcao para validar CNPJ
CREATE OR REPLACE FUNCTION validate_cnpj(cnpj TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  cnpj_numbers TEXT;
  sum1 INTEGER := 0;
  sum2 INTEGER := 0;
  weights1 INTEGER[] := ARRAY[5,4,3,2,9,8,7,6,5,4,3,2];
  weights2 INTEGER[] := ARRAY[6,5,4,3,2,9,8,7,6,5,4,3,2];
  digit1 INTEGER;
  digit2 INTEGER;
  i INTEGER;
BEGIN
  -- Remover caracteres nao numericos
  cnpj_numbers := regexp_replace(cnpj, '[^0-9]', '', 'g');

  -- Verificar tamanho
  IF length(cnpj_numbers) != 14 THEN
    RETURN FALSE;
  END IF;

  -- Calcular primeiro digito verificador
  FOR i IN 1..12 LOOP
    sum1 := sum1 + (substring(cnpj_numbers, i, 1)::INTEGER * weights1[i]);
  END LOOP;
  digit1 := sum1 % 11;
  IF digit1 < 2 THEN digit1 := 0; ELSE digit1 := 11 - digit1; END IF;

  -- Verificar primeiro digito
  IF digit1 != substring(cnpj_numbers, 13, 1)::INTEGER THEN
    RETURN FALSE;
  END IF;

  -- Calcular segundo digito verificador
  FOR i IN 1..13 LOOP
    sum2 := sum2 + (substring(cnpj_numbers, i, 1)::INTEGER * weights2[i]);
  END LOOP;
  digit2 := sum2 % 11;
  IF digit2 < 2 THEN digit2 := 0; ELSE digit2 := 11 - digit2; END IF;

  -- Verificar segundo digito
  RETURN digit2 = substring(cnpj_numbers, 14, 1)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Funcao para formatar CPF
CREATE OR REPLACE FUNCTION format_cpf(cpf TEXT)
RETURNS TEXT AS $$
DECLARE
  cpf_numbers TEXT;
BEGIN
  cpf_numbers := regexp_replace(cpf, '[^0-9]', '', 'g');
  IF length(cpf_numbers) = 11 THEN
    RETURN substring(cpf_numbers, 1, 3) || '.' ||
           substring(cpf_numbers, 4, 3) || '.' ||
           substring(cpf_numbers, 7, 3) || '-' ||
           substring(cpf_numbers, 10, 2);
  END IF;
  RETURN cpf;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Funcao para formatar CNPJ
CREATE OR REPLACE FUNCTION format_cnpj(cnpj TEXT)
RETURNS TEXT AS $$
DECLARE
  cnpj_numbers TEXT;
BEGIN
  cnpj_numbers := regexp_replace(cnpj, '[^0-9]', '', 'g');
  IF length(cnpj_numbers) = 14 THEN
    RETURN substring(cnpj_numbers, 1, 2) || '.' ||
           substring(cnpj_numbers, 3, 3) || '.' ||
           substring(cnpj_numbers, 6, 3) || '/' ||
           substring(cnpj_numbers, 9, 4) || '-' ||
           substring(cnpj_numbers, 13, 2);
  END IF;
  RETURN cnpj;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Funcao para calcular dias uteis entre duas datas
CREATE OR REPLACE FUNCTION count_business_days(
  start_date DATE,
  end_date DATE
)
RETURNS INTEGER AS $$
DECLARE
  total_days INTEGER := 0;
  current_date DATE := start_date;
BEGIN
  WHILE current_date <= end_date LOOP
    -- Excluir sabados (6) e domingos (0)
    IF EXTRACT(DOW FROM current_date) NOT IN (0, 6) THEN
      total_days := total_days + 1;
    END IF;
    current_date := current_date + 1;
  END LOOP;
  RETURN total_days;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Funcao para obter idade em anos
CREATE OR REPLACE FUNCTION get_age_years(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date))::INTEGER;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- CONFIGURACOES DE STORAGE (Supabase)
-- =====================================================

-- Criar buckets para arquivos
-- Nota: No Supabase, isso eh feito via dashboard ou API
-- Aqui documentamos a estrutura esperada

-- Bucket: employee-documents (documentos dos funcionarios)
-- Bucket: company-assets (logos, arquivos da empresa)
-- Bucket: profile-avatars (fotos de perfil)
-- Bucket: payroll-exports (exportacoes de folha)

-- =====================================================
-- COMENTARIOS GERAIS
-- =====================================================

COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function para atualizar updated_at automaticamente';
COMMENT ON FUNCTION validate_cpf(TEXT) IS 'Valida CPF brasileiro';
COMMENT ON FUNCTION validate_cnpj(TEXT) IS 'Valida CNPJ brasileiro';
COMMENT ON FUNCTION format_cpf(TEXT) IS 'Formata CPF no padrao XXX.XXX.XXX-XX';
COMMENT ON FUNCTION format_cnpj(TEXT) IS 'Formata CNPJ no padrao XX.XXX.XXX/XXXX-XX';
COMMENT ON FUNCTION count_business_days(DATE, DATE) IS 'Conta dias uteis entre duas datas (exclui sabados e domingos)';
COMMENT ON FUNCTION get_age_years(DATE) IS 'Retorna idade em anos a partir da data de nascimento';
