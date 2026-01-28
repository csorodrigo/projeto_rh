# Análise do Problema - JOINs com full_name

**Data:** 2026-01-28
**Status:** 🔍 PROBLEMA IDENTIFICADO

---

## 🎯 Problema

Queries com JOIN em `absences` e `asos` retornam **HTTP 400** ao tentar acessar `employees!inner(full_name)`.

---

## 📊 Evidências

### ✅ Funcionando (HTTP 200)

```sql
-- Query 1: Direto em employees
GET /rest/v1/employees?select=id,full_name,created_at
→ 200 OK ✅

-- Query 2: JOIN em time_tracking_daily
GET /rest/v1/time_tracking_daily?select=id,employees!inner(full_name)
→ 200 OK ✅
```

### ❌ Falhando (HTTP 400)

```sql
-- Query 3: JOIN em absences
GET /rest/v1/absences?select=id,employees!inner(full_name)
→ 400 Bad Request ❌

-- Query 4: JOIN em asos
GET /rest/v1/asos?select=id,employees!inner(full_name)
→ 400 Bad Request ❌
```

---

## 🔍 Análise Técnica

### Estrutura das Tabelas

Todas as três tabelas têm FK para `employees`:

```sql
-- time_tracking_daily (FUNCIONA)
employee_id UUID NOT NULL REFERENCES employees(id)

-- absences (FALHA)
employee_id UUID NOT NULL REFERENCES employees(id)

-- asos (FALHA)
employee_id UUID NOT NULL REFERENCES employees(id)
```

### Diferença: Row Level Security (RLS)

**time_tracking_daily:**
- Provavelmente tem RLS mais simples
- Permite acesso via SELECT direto

**absences:**
- RLS complexo com múltiplas policies (linhas 557-604):
  - Users can view own absences
  - Managers can view team absences
  - Admins and HR can manage all absences

**asos:**
- Provavelmente tem RLS similar a absences

---

## 💡 Hipótese

O problema **NÃO** é com a coluna `full_name` (que existe e funciona).

O problema é que quando o PostgREST tenta fazer JOIN de `absences` → `employees`, as **RLS policies** de `absences` estão interferindo na capacidade de acessar a coluna `full_name` do `employees`.

### Por Que time_tracking_daily Funciona?

Possíveis razões:
1. RLS policies mais permissivas
2. Diferentes configurações de relacionamento no PostgREST
3. Tabela criada com permissões diferentes

---

## 🛠️ Soluções Propostas

### Solução 1: Verificar RLS Policies (RECOMENDADO)

Executar no Supabase SQL Editor:

```sql
-- Verificar se usuário atual tem acesso a absences com JOIN
SELECT
  a.id,
  a.absence_type,
  e.full_name
FROM absences a
INNER JOIN employees e ON e.id = a.employee_id
WHERE a.company_id = '016aebd3-b2b6-4ef9-997b-49e29108c40f'
LIMIT 3;
```

Se falhar, o problema é RLS.

### Solução 2: Adicionar Policy Explícita para JOINs

Criar migração 019:

```sql
-- Migration 019: Fix RLS para permitir JOINs com employees

BEGIN;

-- Adicionar policy para permitir acesso a employees via JOIN
-- quando vindo de absences ou asos

CREATE POLICY "Allow JOIN from absences/asos to employees"
  ON employees FOR SELECT
  USING (
    -- Permite acesso quando o JOIN vem de tabelas relacionadas
    EXISTS (
      SELECT 1 FROM absences
      WHERE employee_id = employees.id
    )
    OR EXISTS (
      SELECT 1 FROM asos
      WHERE employee_id = employees.id
    )
    OR company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
    )
  );

COMMIT;
```

### Solução 3: Usar View Materializada (Alternativa)

Criar view que já inclui `full_name`:

```sql
-- Criar view que facilita o acesso
CREATE VIEW v_absences_with_employee AS
SELECT
  a.*,
  e.full_name AS employee_name,
  e.photo_url AS employee_photo
FROM absences a
LEFT JOIN employees e ON e.id = a.employee_id;

-- Habilitar RLS na view
ALTER VIEW v_absences_with_employee OWNER TO postgres;
```

### Solução 4: Modificar Query no Frontend (Temporário)

Mudar de:
```typescript
.select('id,absence_type,employees!inner(full_name)')
```

Para:
```typescript
.select('id,absence_type,employee_id')
```

E fazer lookup separado de `full_name`.

---

## 🔬 Teste de Diagnóstico

Execute este script SQL no Supabase para diagnosticar:

```sql
-- Script de Diagnóstico - Problema de JOIN

-- 1. Verificar se full_name existe
SELECT column_name, data_type, is_generated
FROM information_schema.columns
WHERE table_name = 'employees' AND column_name = 'full_name';
-- Esperado: 1 linha

-- 2. Testar query direta
SELECT id, full_name FROM employees LIMIT 1;
-- Esperado: Sucesso

-- 3. Testar JOIN de absences
SELECT a.id, e.full_name
FROM absences a
INNER JOIN employees e ON e.id = a.employee_id
LIMIT 1;
-- Se falhar aqui, problema é RLS

-- 4. Verificar policies de employees que afetam JOINs
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'employees'
ORDER BY policyname;

-- 5. Testar como service_role (bypass RLS)
SET ROLE service_role;
SELECT a.id, e.full_name
FROM absences a
INNER JOIN employees e ON e.id = a.employee_id
LIMIT 1;
SET ROLE authenticator;
-- Se funcionar, confirma que é problema de RLS
```

---

## 📋 Próximas Ações

### Imediato
1. ⚡ Executar script de diagnóstico no Supabase SQL Editor
2. 🔍 Verificar resultado de cada query
3. 📝 Documentar qual query falha exatamente

### Se Confirmar RLS
4. 🛠️ Criar migração 019 com policy corrigida
5. ✅ Aplicar no Supabase
6. 🧪 Re-testar em produção

### Se Não For RLS
7. 🔬 Investigar configuração do PostgREST
8. 📖 Verificar documentação do Supabase sobre JOINs
9. 🎫 Abrir ticket no suporte Supabase

---

## 🎓 Lições Aprendidas

1. **RLS é complexo:** Policies podem bloquear JOINs inesperadamente
2. **Generated columns funcionam:** `full_name` está OK, problema é acesso
3. **Testes incrementais:** time_tracking_daily funciona = problema específico
4. **Logs são essenciais:** Console mostra exatamente quais queries falham

---

## 📊 Resumo Executivo

| Aspecto | Status |
|---------|--------|
| Migração 018 | ✅ Sucesso |
| Coluna full_name | ✅ Criada e funciona |
| Queries diretas employees | ✅ HTTP 200 |
| JOINs time_tracking_daily | ✅ HTTP 200 |
| JOINs absences | ❌ HTTP 400 |
| JOINs asos | ❌ HTTP 400 |
| **Causa provável** | **RLS Policies** |
| **Solução** | **Migração 019 + Policy Fix** |

---

**Próximo passo crítico:** Executar script de diagnóstico no Supabase SQL Editor
