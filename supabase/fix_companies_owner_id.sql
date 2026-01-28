-- Adicionar coluna owner_id na tabela companies
-- Esta coluna referencia o usuario que criou a empresa

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Criar indice para owner_id
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON companies (owner_id);

-- Comentario
COMMENT ON COLUMN companies.owner_id IS 'ID do usuario que criou/possui a empresa';
