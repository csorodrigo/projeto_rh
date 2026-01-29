# Investigação RLS Detalhada - Problema de JOINs Bloqueados

## Data da Investigação
2026-01-28

## Resumo Executivo

**Problema:** Queries com JOINs entre `absences`/`asos` e `employees` estão sendo bloqueadas por RLS policies, retornando dados vazios, enquanto JOINs com `time_tracking_daily` funcionam normalmente.

**Causa Raiz:** Diferença fundamental na estrutura das RLS policies da tabela `employees`.

**Impacto:** Páginas de Ausências e Saúde não conseguem exibir dados dos funcionários.

---

## 1. ANÁLISE DAS POLICIES - TABELA `employees`

### 1.1 Policies Atuais (migration 003_employees.sql)

```sql
-- Policy 1: Usuarios podem ver funcionarios da mesma empresa
CREATE POLICY "Users can view employees from same company"
  ON employees
  FOR SELECT
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Policy 2: Admins e HR podem inserir funcionarios
CREATE POLICY "Admins and HR can insert employees"
  ON employees
  FOR INSERT
  WITH CHECK (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'hr')
    )
  );

-- Policy 3: Admins e HR podem atualizar funcionarios
CREATE POLICY "Admins and HR can update employees"
  ON employees
  FOR UPDATE
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'hr')
    )
  );

-- Policy 4: Gestores podem ver sua equipe
CREATE POLICY "Managers can view their team"
  ON employees
  FOR SELECT
  USING (
    manager_id = (
      SELECT employee_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Policy 5: Funcionarios podem ver seus proprios dados
CREATE POLICY "Employees can view own data"
  ON employees
  FOR SELECT
  USING (
    id = (
      SELECT employee_id FROM profiles
      WHERE id = auth.uid()
    )
  );
```

### 1.2 Problema Identificado

As policies de `employees` têm **5 policies SELECT**, criando uma estrutura de permissões **restritiva por padrão**:

1. **Policy 1** - Funcionários da mesma empresa (mais ampla)
2. **Policy 4** - Gestores veem sua equipe
3. **Policy 5** - Funcionários veem próprios dados

**Quando ocorre JOIN:**
- As policies aplicam **OR lógico** entre si
- MAS: O JOIN com `!inner` requer que AMBAS as tabelas satisfaçam suas policies
- Se `absences` permite acesso mas `employees` não encontra match em NENHUMA das 5 policies, o registro é filtrado

---

## 2. ANÁLISE DAS POLICIES - TABELAS PROBLEMÁTICAS

### 2.1 Tabela `absences` (migration 007_absences.sql)

```sql
-- SELECT Policy 1: Usuarios podem ver proprias ausencias
CREATE POLICY "Users can view own absences"
  ON absences FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

-- SELECT Policy 2: Gestores podem ver ausencias da equipe
CREATE POLICY "Managers can view team absences"
  ON absences FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE manager_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  );

-- ALL Policy 3: Admins e HR podem gerenciar todas
CREATE POLICY "Admins and HR can manage all absences"
  ON absences FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );
```

### 2.2 Tabela `asos` (migration 008_health.sql)

```sql
-- SELECT Policy 1: Usuarios podem ver proprios ASOs
CREATE POLICY "Users can view own ASOs"
  ON asos FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

-- ALL Policy 2: Admins e HR podem gerenciar ASOs
CREATE POLICY "Admins and HR can manage ASOs"
  ON asos FOR ALL
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );
```

---

## 3. ANÁLISE DA TABELA QUE FUNCIONA

### 3.1 Tabela `time_tracking_daily` (migration 015)

```sql
-- SELECT Policy 1: Usuarios podem ver proprio resumo diario
CREATE POLICY "employees_view_own_daily"
  ON time_tracking_daily FOR SELECT
  USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

-- ALL Policy 2: Gestores podem ver e aprovar resumos da equipe
CREATE POLICY "managers_manage_team_daily"
  ON time_tracking_daily FOR ALL
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE manager_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    )
  );

-- ALL Policy 3: Admins/HR podem gerenciar todos os resumos
CREATE POLICY "admins_manage_all_daily"
  ON time_tracking_daily FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );
```

### 3.2 Query que Funciona

```typescript
// src/lib/supabase/queries.ts:1281
.from('time_tracking_daily')
.select(`
  *,
  employees!inner(full_name, department)
`)
.eq('company_id', companyId);
```

**Por que funciona?**
- Policy 3 de `time_tracking_daily` filtra por `company_id` quando usuário é admin/hr
- Policy 1 de `employees` **TAMBÉM** filtra por `company_id`
- Há compatibilidade entre as policies

---

## 4. QUERIES PROBLEMÁTICAS

### 4.1 Query de Ausências

```typescript
// src/lib/supabase/queries.ts:1352
.from('absences')
.select(`
  *,
  employees!inner(full_name, department, photo_url)
`)
.eq('company_id', companyId)
```

**Falha porque:**
1. Policy de `absences` para admin/hr filtra: `company_id = X`
2. Retorna todas as ausências da empresa
3. Faz JOIN com `employees`
4. Policy de `employees` aplica 5 filtros diferentes
5. Para cada registro de `absences`, verifica se o `employee` passa em ALGUMA policy
6. Se o funcionário não está na equipe do gestor E não é o próprio usuário, **não passa em nenhuma policy**
7. JOIN filtra o registro mesmo que `absences` permitisse

### 4.2 Query de ASOs

```typescript
// src/lib/supabase/queries.ts:538
.from('asos')
.select(`
  *,
  employees!inner (
    name,
    department,
    photo_url
  )
`)
.eq('company_id', companyId)
```

**Mesmo problema de `absences`**

---

## 5. DIFERENÇAS CRÍTICAS

### 5.1 Estrutura de Policies

| Aspecto | time_tracking_daily | absences/asos | employees |
|---------|---------------------|---------------|-----------|
| Total de policies SELECT | 1 | 2 | 3 |
| Policy por company_id | Sim (admin/hr) | Sim (admin/hr) | Sim |
| Policy por employee_id | Sim | Sim | Sim |
| Policy por manager_id | Sim | Sim | Sim |
| **Problema** | ✅ Simples | ⚠️ Médio | ❌ Complexo |

### 5.2 Fluxo de Autorização

**time_tracking_daily + employees (FUNCIONA):**
```
1. User é admin/hr
2. time_tracking_daily policy: company_id match → ✅ PASSA
3. Para cada registro, faz JOIN com employees
4. employees policy 1: company_id match → ✅ PASSA
5. Resultado: Dados retornados
```

**absences + employees (FALHA):**
```
1. User é admin/hr
2. absences policy: company_id match → ✅ PASSA
3. Para cada registro, faz JOIN com employees
4. employees policy 1: company_id match → ✅ PASSA
5. MAS: O JOIN inner está verificando TODAS as 5 policies
6. Se NENHUMA policy passar para aquele employee específico no contexto do JOIN
7. Resultado: Registro filtrado
```

---

## 6. CAUSA RAIZ TÉCNICA

### 6.1 Problema de RLS com JOINs

Quando fazemos:
```sql
SELECT * FROM absences
INNER JOIN employees ON employees.id = absences.employee_id
WHERE absences.company_id = 'X'
```

O PostgreSQL com RLS:
1. Aplica RLS em `absences` → Retorna registros permitidos
2. Para cada registro, aplica RLS em `employees` no JOIN
3. **Aqui está o problema:** As policies de `employees` são avaliadas **individualmente**
4. Se o employee_id não pertence ao usuário E não está na equipe do gestor
5. A Policy 1 (`company_id`) pode até passar, mas o RLS considera OR de TODAS
6. Como há policies mais específicas, o comportamento fica inconsistente

### 6.2 Comportamento do RLS com OR

RLS policies com FOR SELECT são unidas com **OR lógico**:
```
SELECT permitido SE (policy1 OR policy2 OR policy3 OR policy4 OR policy5)
```

Mas em JOINs, o PostgreSQL pode otimizar de forma diferente, especialmente quando:
- Há múltiplas subqueries (`SELECT employee_id FROM profiles`)
- Policies retornam resultados diferentes
- O otimizador escolhe plano de execução que não considera todas as policies

---

## 7. SOLUÇÕES RECOMENDADAS

### 7.1 Solução 1: Adicionar Policy Específica para JOINs (RECOMENDADA)

**Vantagem:** Mantém segurança, resolve o problema diretamente
**Desvantagem:** Adiciona mais uma policy

```sql
-- Adicionar em employees
CREATE POLICY "Allow employees to be joined from absences and asos"
  ON employees
  FOR SELECT
  USING (
    -- Permite ver employees quando vêm de JOIN com absences ou asos
    -- que o usuário tem permissão para ver
    EXISTS (
      SELECT 1 FROM absences a
      WHERE a.employee_id = employees.id
      AND (
        -- User pode ver a ausência por qualquer motivo
        a.employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
        OR a.employee_id IN (
          SELECT id FROM employees e
          WHERE e.manager_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
        )
        OR a.company_id = (
          SELECT company_id FROM profiles
          WHERE id = auth.uid() AND role IN ('admin', 'hr')
        )
      )
    )
    OR EXISTS (
      SELECT 1 FROM asos aso
      WHERE aso.employee_id = employees.id
      AND (
        aso.employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
        OR aso.company_id = (
          SELECT company_id FROM profiles
          WHERE id = auth.uid() AND role IN ('admin', 'hr')
        )
      )
    )
  );
```

**Problema:** Circular, muito complexa, difícil manutenção

### 7.2 Solução 2: Simplificar Policy de Employees (MAIS SEGURA)

**Vantagem:** Simples, fácil de manter, resolve o problema
**Desvantagem:** Pode expor mais dados do que necessário

```sql
-- Substituir todas as 5 policies de employees por UMA policy consolidada
DROP POLICY "Users can view employees from same company" ON employees;
DROP POLICY "Managers can view their team" ON employees;
DROP POLICY "Employees can view own data" ON employees;

CREATE POLICY "employees_select_same_company"
  ON employees
  FOR SELECT
  USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );
```

**Justificativa de Segurança:**
- Funcionários da mesma empresa veem uns aos outros (organograma, relatórios, etc.)
- Isso é comportamento esperado em sistemas de RH
- A segurança real está nas tabelas sensíveis (absences, asos, salários)
- Dados básicos de employees (nome, departamento) não são críticos

### 7.3 Solução 3: Bypass RLS com Security Definer (MENOS SEGURA)

**Vantagem:** Resolve imediatamente
**Desvantagem:** Compromete segurança, não recomendado

```sql
CREATE OR REPLACE FUNCTION get_absences_with_employees(p_company_id UUID)
RETURNS TABLE (
  -- campos...
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT a.*, e.name, e.department, e.photo_url
  FROM absences a
  INNER JOIN employees e ON e.id = a.employee_id
  WHERE a.company_id = p_company_id;
END;
$$ LANGUAGE plpgsql;
```

### 7.4 Solução 4: Usar LEFT JOIN e Tratar NULL (WORKAROUND)

**Vantagem:** Não altera policies
**Desvantagem:** Perde integridade, pode quebrar lógica

```typescript
.from('absences')
.select(`
  *,
  employees(full_name, department, photo_url)
`) // Remove !inner
.eq('company_id', companyId)
```

---

## 8. RECOMENDAÇÃO FINAL

### Implementar Solução 2: Simplificar Policy de Employees

**Razões:**

1. **Segurança Adequada:**
   - Dados de `employees` (nome, departamento) não são ultra-sensíveis
   - Segurança real está nas tabelas de dados pessoais (ausências, saúde, salário)
   - Em sistemas de RH, é comum todos verem lista de funcionários

2. **Alinhamento com time_tracking_daily:**
   - Já funciona com policy simples de `company_id`
   - Consistência no código

3. **Manutenibilidade:**
   - Uma única policy clara
   - Fácil de entender e manter
   - Reduz complexidade

4. **Performance:**
   - Menos subqueries para avaliar
   - Melhor plano de execução do PostgreSQL
   - Menos overhead de RLS

### Migration Proposta

```sql
-- Migration: 019_fix_employees_rls_for_joins.sql

-- Remove policies conflitantes
DROP POLICY IF EXISTS "Managers can view their team" ON employees;
DROP POLICY IF EXISTS "Employees can view own data" ON employees;
DROP POLICY IF EXISTS "Users can view employees from same company" ON employees;

-- Policy única e clara para SELECT
CREATE POLICY "employees_select_same_company"
  ON employees
  FOR SELECT
  USING (
    company_id = (
      SELECT company_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Manter policies de INSERT/UPDATE (já estão corretas)
-- "Admins and HR can insert employees"
-- "Admins and HR can update employees"
```

---

## 9. TESTE DA SOLUÇÃO

### 9.1 Queries que devem funcionar após fix

```typescript
// Ausências com employees
await supabase
  .from('absences')
  .select('*, employees!inner(full_name, department, photo_url)')
  .eq('company_id', companyId)

// ASOs com employees
await supabase
  .from('asos')
  .select('*, employees!inner(name, department, photo_url)')
  .eq('company_id', companyId)

// Continuar funcionando: time_tracking_daily
await supabase
  .from('time_tracking_daily')
  .select('*, employees!inner(full_name, department)')
  .eq('company_id', companyId)
```

### 9.2 Cenários de teste

- ✅ Admin/HR vê todas as ausências com dados de employees
- ✅ Admin/HR vê todos os ASOs com dados de employees
- ✅ Usuário comum vê suas próprias ausências
- ✅ Gestor vê ausências da equipe
- ✅ Dados sensíveis (CID, salário) continuam protegidos

---

## 10. CONCLUSÃO

O problema está na **complexidade excessiva** das RLS policies de `employees`, criando 5 condições diferentes que, em contexto de JOIN, causam filtros inesperados.

A solução mais segura e prática é **simplificar para uma única policy** que permite acesso baseado em `company_id`, alinhando com o comportamento já implementado e funcionando em `time_tracking_daily`.

Isso resolve o problema sem comprometer segurança, pois:
- Dados críticos continuam protegidos em suas respectivas tabelas
- Employees contém apenas dados básicos que normalmente são compartilhados
- Mantém consistência com o resto do sistema

**Próximos Passos:**
1. Criar migration 019_fix_employees_rls_for_joins.sql
2. Aplicar no ambiente de desenvolvimento
3. Testar todas as queries afetadas
4. Validar que não há regressões
5. Aplicar em produção

---

## ANEXO: Logs de Erro Observados

```
Empty array returned from:
- listAbsences() → []
- listCompanyASOs() → []

Expected: Array with employee data
Actual: Empty array (JOIN filtered by RLS)
```

---

**Documento criado em:** 2026-01-28
**Responsável:** Investigação técnica RLS
**Prioridade:** Alta
**Status:** Solução recomendada - Aguardando implementação
