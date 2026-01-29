# Migration 019: Fix RLS for JOINs

## Problema Resolvido

### Sintomas
- ✅ Queries diretas em `employees` funcionam (HTTP 200)
- ❌ JOINs de `absences → employees` retornam HTTP 400
- ❌ JOINs de `asos → employees` retornam HTTP 400
- ✅ JOINs de `time_tracking_daily → employees` funcionam (HTTP 200)

### Causa Raiz
As RLS policies de `employees` não contemplavam acesso via JOIN quando o usuário tem permissão para ver a tabela origem (`absences`/`asos`) mas não tem permissão direta sobre o `employee_id` referenciado.

Por exemplo:
```sql
-- ❌ FALHA com HTTP 400
SELECT a.*, e.full_name
FROM absences a
JOIN employees e ON e.id = a.employee_id
WHERE a.employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid());
```

A query de `absences` é permitida pela policy, mas o JOIN com `employees` é bloqueado pelo RLS.

## Solução Implementada

### Novas Policies Criadas

1. **`employees_readable_via_absences_join`**
   - Permite SELECT em `employees` quando acessado via JOIN com `absences`
   - Respeita as permissões do usuário em `absences`

2. **`employees_readable_via_asos_join`**
   - Permite SELECT em `employees` quando acessado via JOIN com `asos`
   - Respeita as permissões do usuário em `asos`

3. **`employees_readable_via_medical_certificates_join`**
   - Permite SELECT em `employees` quando acessado via JOIN com `medical_certificates`
   - Respeita as permissões do usuário em `medical_certificates`

4. **`employees_readable_via_vacation_balances_join`**
   - Permite SELECT em `employees` quando acessado via JOIN com `vacation_balances`
   - Respeita as permissões do usuário em `vacation_balances`

### Índices de Performance

Adicionados índices compostos para otimizar as subqueries nas policies:
- `idx_absences_employee_company`
- `idx_asos_employee_company`
- `idx_medical_certificates_employee_company`
- `idx_vacation_balances_employee_company`

## Como Aplicar

### Opção 1: Via Supabase Dashboard

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Crie uma nova query
4. Cole o conteúdo de `019_fix_rls_joins.sql`
5. Execute a query
6. Verifique se não há erros

### Opção 2: Via CLI

```bash
# No diretório raiz do projeto
supabase db push
```

### Opção 3: Aplicação Manual (para produção)

```bash
# 1. Backup do banco de dados (IMPORTANTE!)
pg_dump -h your-db-host -U postgres -d postgres > backup_pre_019.sql

# 2. Aplicar migração
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/019_fix_rls_joins.sql

# 3. Verificar aplicação
psql -h your-db-host -U postgres -d postgres -c "
  SELECT COUNT(*)
  FROM pg_policies
  WHERE tablename = 'employees'
  AND policyname LIKE '%_via_%_join'
"
# Deve retornar 4
```

## Testes de Validação

Após aplicar a migração, execute os seguintes testes:

### 1. Teste de Ausências
```sql
-- Como usuário comum
SELECT a.id, a.start_date, a.end_date, e.full_name, e.photo_url
FROM absences a
JOIN employees e ON e.id = a.employee_id
WHERE a.employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
LIMIT 5;
-- ✅ Deve retornar HTTP 200 com dados
```

### 2. Teste de ASOs
```sql
-- Como usuário comum
SELECT aso.id, aso.exam_date, aso.result, e.full_name, e.photo_url
FROM asos aso
JOIN employees e ON e.id = aso.employee_id
WHERE aso.employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
LIMIT 5;
-- ✅ Deve retornar HTTP 200 com dados
```

### 3. Teste de Certificados Médicos
```sql
-- Como usuário comum
SELECT mc.id, mc.start_date, mc.end_date, e.full_name, e.photo_url
FROM medical_certificates mc
JOIN employees e ON e.id = mc.employee_id
WHERE mc.employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
LIMIT 5;
-- ✅ Deve retornar HTTP 200 com dados
```

### 4. Teste de Admin/HR
```sql
-- Como admin ou HR
SELECT a.id, a.start_date, a.end_date, e.full_name, e.department
FROM absences a
JOIN employees e ON e.id = a.employee_id
WHERE a.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
LIMIT 20;
-- ✅ Deve retornar HTTP 200 com todos os dados da empresa
```

## Segurança

### Princípio de Least Privilege Mantido

- ✅ Usuários só veem `employees` que já têm permissão via tabelas relacionadas
- ✅ Admins/HR continuam tendo acesso total
- ✅ Gestores continuam vendo apenas sua equipe
- ✅ Funcionários continuam vendo apenas seus próprios dados

### Não Há Vazamento de Dados

As novas policies **NÃO** permitem:
- Ver dados de employees de outras empresas
- Ver dados de employees sem relação com ausências/asos do usuário
- Burlar permissões existentes

### Exemplo de Segurança

```sql
-- ❌ Usuário NÃO pode ver employees de outras ausências
SELECT e.*
FROM employees e
WHERE e.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  AND e.id NOT IN (
    SELECT employee_id FROM absences
    WHERE employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  )
LIMIT 1;
-- Retorna vazio (bloqueado por RLS)

-- ✅ Mas pode ver via JOIN de suas ausências
SELECT e.full_name
FROM absences a
JOIN employees e ON e.id = a.employee_id
WHERE a.employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
LIMIT 1;
-- Retorna dados (permitido)
```

## Rollback (se necessário)

Se precisar reverter a migração:

```sql
BEGIN;

-- Remover policies
DROP POLICY IF EXISTS "employees_readable_via_absences_join" ON employees;
DROP POLICY IF EXISTS "employees_readable_via_asos_join" ON employees;
DROP POLICY IF EXISTS "employees_readable_via_medical_certificates_join" ON employees;
DROP POLICY IF EXISTS "employees_readable_via_vacation_balances_join" ON employees;

-- Remover índices
DROP INDEX IF EXISTS idx_absences_employee_company;
DROP INDEX IF EXISTS idx_asos_employee_company;
DROP INDEX IF EXISTS idx_medical_certificates_employee_company;
DROP INDEX IF EXISTS idx_vacation_balances_employee_company;

COMMIT;
```

## Impacto de Performance

### Antes da Migração
- Queries diretas: Rápidas
- JOINs: Bloqueadas (HTTP 400)

### Depois da Migração
- Queries diretas: Rápidas (sem mudança)
- JOINs: **Funcionais** e otimizadas com índices compostos
- Overhead estimado: < 5ms por query (devido às subqueries de policy)

### Otimizações Futuras (se necessário)

Se houver problemas de performance, considere:

1. **Materialized View** para employees acessíveis
2. **Function-based policy** com cache
3. **Particionamento** de tabelas grandes (absences, asos)

## Questões Frequentes

### Por que time_tracking_daily funcionava antes?
A migração 015 (`015_time_tracking_rls_and_functions.sql`) já tinha policies similares implícitas nas policies de `time_tracking_daily`, o que permitia os JOINs.

### Isso afeta queries existentes?
Não. As novas policies são **aditivas** (OR implícito). Queries que funcionavam antes continuarão funcionando.

### Preciso atualizar o código da aplicação?
Não. O código pode continuar usando os mesmos JOINs que estavam retornando HTTP 400. Agora retornarão HTTP 200.

### Isso resolve o problema de full_name e photo_url?
Sim! As colunas `full_name` e `photo_url` (adicionadas na migração 018) agora são acessíveis via JOINs.

## Logs de Mudanças

- **2026-01-28**: Criação da migração 019
- **Próximos passos**: Monitorar performance em produção

## Suporte

Se encontrar problemas:
1. Verifique os logs do PostgreSQL
2. Execute os testes de validação acima
3. Verifique se auth.uid() retorna valor válido
4. Confirme que o usuário tem role correto em profiles
