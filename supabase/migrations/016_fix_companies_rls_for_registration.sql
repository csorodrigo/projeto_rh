-- Migration 016: Fix Companies RLS for User Registration
-- Permite que usuários authenticated criem suas próprias empresas durante o registro

-- Remove a policy antiga que só permitia service_role
DROP POLICY IF EXISTS "Service role can insert companies" ON companies;

-- Policy: Authenticated users podem criar sua própria empresa
CREATE POLICY "Authenticated users can create their own company"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Policy: Users can view their own company
CREATE POLICY "Users can view their own company"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Company owners can update their company
CREATE POLICY "Company owners can update their company"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Policy: Service role can do everything (para admin)
CREATE POLICY "Service role full access"
  ON companies
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Tornar CNPJ nullable temporariamente (será preenchido depois)
ALTER TABLE companies ALTER COLUMN cnpj DROP NOT NULL;

-- Adicionar índice para owner_id
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON companies(owner_id);

-- Comentários
COMMENT ON POLICY "Authenticated users can create their own company" ON companies IS
  'Permite que usuários registrem uma nova empresa durante signup';
COMMENT ON POLICY "Users can view their own company" ON companies IS
  'Usuários podem ver a empresa que possuem ou estão vinculados';
COMMENT ON POLICY "Company owners can update their company" ON companies IS
  'Proprietários podem atualizar os dados da sua empresa';
