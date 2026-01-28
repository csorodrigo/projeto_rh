-- Migration 018: Schema Compatibility
-- Adiciona colunas photo_url e full_name para compatibilidade com código existente
-- Data: 2026-01-28

BEGIN;

-- 1. Adicionar photo_url para armazenar URLs de fotos do Supabase Storage
ALTER TABLE employees ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Criar índice para melhorar performance de queries que filtram por foto
CREATE INDEX IF NOT EXISTS idx_employees_photo_url
  ON employees(photo_url) WHERE photo_url IS NOT NULL;

-- Adicionar comentário descritivo
COMMENT ON COLUMN employees.photo_url IS
  'URL da foto armazenada no Supabase Storage';

-- 2. Adicionar full_name como generated column (alias de name)
-- Generated column é nativa do PostgreSQL, sempre sincronizada com name
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS full_name TEXT
  GENERATED ALWAYS AS (name) STORED;

-- Criar índice GIN com trigram para buscas textuais eficientes
CREATE INDEX IF NOT EXISTS idx_employees_full_name
  ON employees USING gin (full_name gin_trgm_ops);

-- Adicionar comentário descritivo
COMMENT ON COLUMN employees.full_name IS
  'Generated column - alias de name para compatibilidade com código legado';

COMMIT;
