# Instruções para Aplicar Migração 018 no Supabase

## URGENTE: Execute esta migração AGORA para corrigir erros 400

A migração 018 adiciona as colunas `full_name` e `photo_url` à tabela `employees`, corrigindo todos os erros 400 em produção.

---

## Passo 1: Acessar SQL Editor do Supabase

1. Acesse: https://supabase.com/dashboard/project/lmpyxqvxzigsusjniarz/sql/new
2. Aguarde o editor carregar

---

## Passo 2: Copiar e Executar o SQL

Copie o conteúdo abaixo e cole no SQL Editor:

```sql
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
```

---

## Passo 3: Executar

1. Clique no botão "Run" (ou pressione `Ctrl+Enter` / `Cmd+Enter`)
2. Aguarde a mensagem: **"Success. No rows returned"**
3. Se aparecer erro, verifique se já foi executada antes

---

## Passo 4: Validar

Execute as queries de validação abaixo no mesmo SQL Editor:

### Validação 1: Verificar Colunas Criadas

```sql
SELECT column_name, is_generated, data_type
FROM information_schema.columns
WHERE table_name = 'employees'
AND column_name IN ('name', 'full_name', 'photo_url')
ORDER BY column_name;
```

**Resultado esperado:**
```
column_name | is_generated | data_type
------------|--------------|----------
full_name   | ALWAYS       | text
name        | NEVER        | text
photo_url   | NEVER        | text
```

### Validação 2: Testar que full_name Reflete name Automaticamente

```sql
SELECT id, name, full_name, photo_url
FROM employees
LIMIT 5;
```

**Resultado esperado:** `full_name` deve ter o mesmo valor de `name` para todos os registros.

### Validação 3: Testar Query com Join (Como o Código Faz)

```sql
SELECT e.id, e.full_name, a.absence_type
FROM employees e
LEFT JOIN absences a ON a.employee_id = e.id
LIMIT 1;
```

**Resultado esperado:** Query executa SEM erro 400.

---

## Passo 5: Verificar em Produção

1. Abra a aplicação em: https://projeto-rh-tau.vercel.app
2. Abra o Console do navegador (F12 → aba Console)
3. Recarregue a página (F5)
4. Verifique: **ZERO erros 400** relacionados a `full_name`

---

## O que Esta Migração Faz?

### Coluna `photo_url`
- Armazena URL da foto do funcionário no Supabase Storage
- Tipo: TEXT (nullable)
- Índice parcial para performance

### Coluna `full_name`
- Generated column (sempre sincronizada com `name`)
- Tipo: TEXT GENERATED ALWAYS AS (name) STORED
- Zero overhead: PostgreSQL mantém automaticamente
- Índice GIN com trigram para buscas eficientes

### Por que Generated Column?
- Compatibilidade com código existente (50+ arquivos)
- Zero mudanças de código necessárias
- Solução nativa do PostgreSQL
- Reversível se necessário

---

## Rollback (Se Necessário)

Se algo der errado, execute:

```sql
ALTER TABLE employees DROP COLUMN IF EXISTS full_name;
ALTER TABLE employees DROP COLUMN IF EXISTS photo_url;
```

---

## Critérios de Sucesso

Após aplicar a migração:
- ✅ Query de validação 1 retorna 3 colunas
- ✅ Query de validação 2 mostra full_name = name
- ✅ Query de validação 3 executa sem erro
- ✅ Console do navegador: ZERO erros 400
- ✅ Dashboard carrega completamente
- ✅ Lista de funcionários exibe nomes
- ✅ Ausências, ASOs e atestados funcionam

---

## Arquivos Relacionados

- Migração original: `supabase/migrations/018_schema_compatibility.sql`
- Tipos TypeScript: `src/types/database.ts` (já correto)
- Queries: `src/lib/supabase/queries.ts` (já usa full_name)

---

**Tempo estimado:** 10-15 minutos
**Impacto:** Corrige TODOS os erros 400 em produção
**Risco:** Baixo (apenas adiciona colunas, não modifica dados)
