-- Corrigir recursao infinita nas politicas RLS de profiles
-- Passo 1: Criar funcao SECURITY DEFINER para obter company_id do usuario atual

CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Passo 2: Criar funcao para verificar role do usuario
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Passo 3: Remover politicas problematicas
DROP POLICY IF EXISTS "Users can view profiles from same company" ON profiles;
DROP POLICY IF EXISTS "Admins and HR can update company profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

-- Passo 4: Recriar politicas sem recursao

-- Usuarios podem ver seu proprio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Usuarios podem ver perfis da mesma empresa (usando funcao SECURITY DEFINER)
CREATE POLICY "Users can view company profiles"
  ON profiles FOR SELECT
  USING (company_id = get_user_company_id());

-- Admins e HR podem atualizar perfis da empresa
CREATE POLICY "Admins and HR can update company profiles"
  ON profiles FOR UPDATE
  USING (
    company_id = get_user_company_id()
    AND get_user_role() IN ('admin', 'hr')
  );

-- Admins podem inserir perfis
CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    company_id = get_user_company_id()
    AND get_user_role() IN ('admin', 'hr')
  );
