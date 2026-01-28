# Módulo de Controle de Ponto - RLS e Funções SQL

## Visão Geral

Migration `015_time_tracking_rls_and_functions.sql` implementa políticas RLS completas, funções SQL e triggers para o módulo de controle de ponto eletrônico.

## Estruturas Criadas

### 1. Tabela: `signing_corrections`

Gerencia solicitações de correção de batidas de ponto.

**Campos principais:**
- `correction_type`: Tipo de correção (missed_clock_in, wrong_time, etc)
- `correction_date`, `correction_time`: Data/hora da correção
- `reason`: Motivo da solicitação
- `original_values`: JSONB com valores originais
- `status`: pending/approved/rejected

**Use cases:**
- Funcionário esqueceu de bater ponto
- Batida registrada com horário errado
- Erro de sistema precisa ser corrigido

### 2. Funções SQL

#### `calculate_worked_hours(employee_id, date)`

Calcula horas trabalhadas no dia.

**Retorna:**
```sql
{
  worked_minutes: INTEGER,     -- Minutos efetivamente trabalhados
  break_minutes: INTEGER,      -- Minutos de intervalo
  total_minutes: INTEGER,      -- Total (trabalho + intervalo)
  is_complete: BOOLEAN         -- Dia completo (tem entrada e saída)
}
```

**Exemplo:**
```sql
SELECT * FROM calculate_worked_hours(
  '123e4567-e89b-12d3-a456-426614174000',
  '2024-01-27'
);

-- Resultado:
-- worked_minutes: 480 (8 horas)
-- break_minutes: 60 (1 hora)
-- total_minutes: 540
-- is_complete: true
```

#### `get_overtime_hours(employee_id, start_date, end_date)`

Calcula horas extras em um período.

**Retorna:**
```sql
{
  total_overtime_minutes: INTEGER,     -- Total de horas extras
  total_missing_minutes: INTEGER,      -- Total de horas faltantes
  net_balance_minutes: INTEGER,        -- Saldo líquido
  days_worked: INTEGER,                -- Dias trabalhados
  days_with_overtime: INTEGER,         -- Dias com hora extra
  days_with_missing: INTEGER           -- Dias com falta
}
```

**Exemplo:**
```sql
SELECT * FROM get_overtime_hours(
  '123e4567-e89b-12d3-a456-426614174000',
  '2024-01-01',
  '2024-01-31'
);

-- Resultado:
-- total_overtime_minutes: 300 (5 horas extras no mês)
-- total_missing_minutes: 120 (2 horas faltantes)
-- net_balance_minutes: 180 (saldo positivo de 3 horas)
-- days_worked: 22
-- days_with_overtime: 8
-- days_with_missing: 3
```

#### `validate_signing(employee_id, signing_time)`

Valida se uma batida de ponto é permitida.

**Retorna:**
```sql
{
  is_valid: BOOLEAN,           -- Se a batida é válida
  error_code: TEXT,            -- Código do erro (se houver)
  error_message: TEXT,         -- Mensagem de erro
  last_action: clock_type,     -- Última ação registrada
  expected_action: clock_type  -- Próxima ação esperada
}
```

**Códigos de erro:**
- `EMPLOYEE_NOT_FOUND`: Funcionário não existe
- `EMPLOYEE_INACTIVE`: Funcionário inativo
- `MIN_INTERVAL_NOT_MET`: Intervalo mínimo de 1 minuto não cumprido

**Exemplo:**
```sql
SELECT * FROM validate_signing(
  '123e4567-e89b-12d3-a456-426614174000',
  now()
);

-- Resultado (válido):
-- is_valid: true
-- error_code: NULL
-- error_message: NULL
-- last_action: 'clock_in'
-- expected_action: 'break_start'

-- Resultado (inválido):
-- is_valid: false
-- error_code: 'MIN_INTERVAL_NOT_MET'
-- error_message: 'Aguarde pelo menos 1 minuto entre registros'
-- last_action: 'clock_in'
-- expected_action: NULL
```

#### `get_monthly_summary(employee_id, month, year)`

Retorna resumo mensal completo.

**Retorna:**
```sql
{
  employee_id: UUID,
  employee_name: TEXT,
  month: INTEGER,
  year: INTEGER,
  total_days: INTEGER,              -- Dias do mês
  worked_days: INTEGER,             -- Dias trabalhados
  absent_days: INTEGER,             -- Dias ausentes
  total_worked_minutes: INTEGER,    -- Total trabalhado
  total_overtime_minutes: INTEGER,  -- Total hora extra
  total_missing_minutes: INTEGER,   -- Total falta
  net_balance_minutes: INTEGER,     -- Saldo líquido
  time_bank_balance: INTEGER,       -- Saldo banco de horas
  average_daily_hours: NUMERIC,     -- Média diária
  on_time_percentage: NUMERIC,      -- % pontualidade
  pending_approvals: INTEGER,       -- Pendentes aprovação
  pending_corrections: INTEGER      -- Correções pendentes
}
```

**Exemplo:**
```sql
SELECT * FROM get_monthly_summary(
  '123e4567-e89b-12d3-a456-426614174000',
  1,
  2024
);

-- Resultado:
-- employee_name: 'João Silva'
-- total_days: 31
-- worked_days: 22
-- absent_days: 0
-- total_worked_minutes: 10560 (176 horas)
-- average_daily_hours: 8.00
-- on_time_percentage: 95.45
-- time_bank_balance: 180 (3 horas positivas)
```

#### `get_expected_hours(employee_id, date)`

Retorna horas esperadas para um dia específico baseado na jornada.

**Retorna:** `NUMERIC` (horas esperadas)

**Exemplo:**
```sql
SELECT get_expected_hours(
  '123e4567-e89b-12d3-a456-426614174000',
  '2024-01-27'
);

-- Resultado: 8.00 (8 horas)
```

### 3. Triggers

#### `validate_signing_sequence`

**Propósito:** Garante sequência lógica de batidas.

**Regras:**
1. Primeira ação do dia deve ser `clock_in`
2. Após `clock_in` → permitido `break_start` ou `clock_out`
3. Após `break_start` → apenas `break_end`
4. Após `break_end` → permitido novo `break_start` ou `clock_out`
5. Após `clock_out` → apenas novo `clock_in` (novo dia)

**Erros lançados:**
- "Já existe entrada registrada hoje. Registre saída primeiro"
- "Registre entrada antes de iniciar intervalo"
- "Não há intervalo ativo para finalizar"
- "Finalize o intervalo antes de registrar saída"
- "Primeira ação do dia deve ser entrada (clock_in)"

#### `prevent_duplicate_signings`

**Propósito:** Previne batidas duplicadas em menos de 1 minuto.

**Regra:** Intervalo mínimo de 60 segundos entre batidas.

**Erro lançado:**
- "Aguarde pelo menos 1 minuto entre registros"

#### `auto_update_tracking_status`

**Propósito:** Atualiza status automaticamente quando dia está completo.

**Lógica:**
- Se tem `clock_in` e `clock_out` → muda para `approved` (se configurado)
- Senão → mantém `pending`

## Políticas RLS

### Modelo de Segurança

#### 1. Funcionários (role: employee)

**Permissões:**
- ✅ Ver próprios registros de ponto
- ✅ Criar próprios registros de ponto
- ✅ Ver status atual dos colegas (dashboard hoje)
- ✅ Ver próprio banco de horas
- ✅ Criar solicitações de correção
- ❌ Ver histórico detalhado de outros

#### 2. Gestores (role: manager)

**Permissões:**
- ✅ Tudo que funcionário pode
- ✅ Ver todos os registros da equipe
- ✅ Aprovar/rejeitar resumos diários da equipe
- ✅ Aprovar/rejeitar correções da equipe
- ✅ Ver banco de horas da equipe
- ❌ Editar registros diretamente

#### 3. RH/Admin (role: hr, admin)

**Permissões:**
- ✅ Ver todos os registros da empresa
- ✅ Criar/editar/deletar qualquer registro
- ✅ Aprovar/rejeitar qualquer solicitação
- ✅ Gerenciar banco de horas
- ✅ Ajustes manuais

### Tabelas com RLS

#### `time_records`

```sql
-- Funcionário vê próprios registros
"employees_view_own_records"

-- Funcionário cria próprios registros
"employees_insert_own_records"

-- Funcionário vê status atual de colegas
"employees_view_colleagues_today"

-- Gestor vê registros da equipe
"managers_view_team_records"

-- Admin gerencia todos
"admins_manage_all_records"
```

#### `signing_corrections`

```sql
-- Funcionário vê próprias correções
"employees_view_own_corrections"

-- Funcionário cria correções
"employees_create_corrections"

-- Gestor gerencia correções da equipe
"managers_manage_team_corrections"

-- Admin gerencia todas
"admins_manage_all_corrections"
```

#### `time_tracking_daily`

```sql
-- Funcionário vê próprio resumo
"employees_view_own_daily"

-- Gestor gerencia resumos da equipe
"managers_manage_team_daily"

-- Admin gerencia todos
"admins_manage_all_daily"
```

#### `time_bank`

```sql
-- Funcionário vê próprio banco
"employees_view_own_timebank"

-- Gestor vê banco da equipe
"managers_view_team_timebank"

-- Admin gerencia todos
"admins_manage_all_timebank"
```

## Views

### `v_pending_corrections`

Lista correções pendentes de aprovação com informações consolidadas.

**Campos:**
- Todos de `signing_corrections`
- `employee_name`: Nome do funcionário
- `department`: Departamento
- `reviewer_name`: Nome do revisor (se houver)
- `days_pending`: Dias desde a criação

**Uso:**
```sql
SELECT * FROM v_pending_corrections
WHERE department = 'TI'
ORDER BY days_pending DESC;
```

### `v_time_bank_current`

Saldo atual do banco de horas por funcionário ativo.

**Campos:**
- `employee_id`, `employee_name`, `department`
- `current_balance`: Saldo atual em minutos
- `last_update`: Data da última atualização
- `balance_status`: 'credit', 'debit' ou 'zero'

**Uso:**
```sql
SELECT * FROM v_time_bank_current
WHERE balance_status = 'debit'
ORDER BY current_balance ASC;
```

## Índices de Performance

### Índices criados para otimização:

1. **idx_time_records_employee_today**
   - Consultas de validação de batidas do dia atual
   - Filtro: `DATE(recorded_at) = CURRENT_DATE`

2. **idx_time_tracking_employee_month**
   - Consultas de resumo mensal
   - Filtro: `date >= DATE_TRUNC('month', CURRENT_DATE)`

3. **idx_corrections_employee_pending**
   - Consultas de correções pendentes
   - Filtro: `status = 'pending'`

4. **idx_time_bank_employee_latest**
   - Consultas de saldo atual do banco de horas
   - Ordenação por `created_at DESC`

## Fluxos de Uso

### Fluxo 1: Registro de Ponto Normal

```sql
-- 1. Validar se pode bater ponto
SELECT * FROM validate_signing(employee_id, now());

-- 2. Se válido, registrar através da função clock_in_out
SELECT * FROM clock_in_out(
  employee_id,
  company_id,
  'clock_in'::clock_type,
  'mobile_app'::record_source,
  '{"device_id": "ABC123"}'::jsonb,
  POINT(lng, lat),
  'Rua ABC, 123',
  NULL, -- photo_url
  NULL  -- notes
);

-- 3. Consolidação automática via trigger
-- (já ocorre internamente na função clock_in_out)
```

### Fluxo 2: Solicitação de Correção

```sql
-- 1. Funcionário cria solicitação
INSERT INTO signing_corrections (
  company_id,
  employee_id,
  correction_type,
  correction_date,
  correction_time,
  reason,
  created_by
) VALUES (
  company_id,
  employee_id,
  'missed_clock_in'::signing_correction_type,
  '2024-01-27',
  '08:00:00',
  'Esqueci de bater o ponto de entrada',
  auth.uid()
);

-- 2. Gestor/RH visualiza pendências
SELECT * FROM v_pending_corrections
WHERE employee_id IN (SELECT id FROM employees WHERE manager_id = current_manager);

-- 3. Gestor aprova
UPDATE signing_corrections
SET
  status = 'approved',
  reviewed_by = auth.uid(),
  reviewed_at = now(),
  review_notes = 'Aprovado - justificativa válida'
WHERE id = correction_id;

-- 4. Sistema cria registro corrigido
-- (implementar trigger ou função separada se necessário)
```

### Fluxo 3: Consulta de Horas Extras

```sql
-- Consultar horas extras do mês
SELECT * FROM get_overtime_hours(
  employee_id,
  '2024-01-01',
  '2024-01-31'
);

-- Consultar resumo mensal completo
SELECT * FROM get_monthly_summary(
  employee_id,
  1,  -- janeiro
  2024
);

-- Ver banco de horas atual
SELECT * FROM v_time_bank_current
WHERE employee_id = current_employee_id;
```

## Segurança

### Funções com SECURITY DEFINER

As funções utilizam `SECURITY DEFINER` para executar com privilégios do criador:

- `calculate_worked_hours`
- `get_overtime_hours`
- `validate_signing`
- `get_monthly_summary`

**Motivo:** Permite acesso a dados necessários para cálculos sem expor dados sensíveis.

**Validações internas:** Cada função valida permissões conforme necessário.

### Prevenção de SQL Injection

✅ Todas as funções usam:
- Parâmetros tipados (UUID, DATE, INTEGER)
- Prepared statements implícitos do PostgreSQL
- Sem concatenação de strings SQL

### Auditoria

Todas as tabelas incluem:
- `created_at`: Timestamp de criação
- `created_by`: UUID do usuário que criou
- `updated_at`: Timestamp de última atualização (via trigger)
- `reviewed_by`: UUID do revisor (correções/aprovações)

## Manutenção

### Limpeza de Dados Antigos

```sql
-- Remover registros individuais após 2 anos
-- (manter apenas consolidação diária)
DELETE FROM time_records
WHERE recorded_at < now() - INTERVAL '2 years';

-- Arquivar correções antigas
UPDATE signing_corrections
SET status = 'archived'
WHERE correction_date < now() - INTERVAL '1 year'
AND status IN ('approved', 'rejected');
```

### Recalcular Banco de Horas

```sql
-- Se necessário recalcular banco de horas
-- (executar com cuidado)
TRUNCATE TABLE time_bank;

-- Reprocessar aprovações
UPDATE time_tracking_daily
SET status = 'pending'
WHERE status = 'approved';

-- Reaprovar (trigger irá recalcular)
UPDATE time_tracking_daily
SET status = 'approved',
    approved_by = admin_user_id,
    approved_at = now()
WHERE status = 'pending'
AND clock_in IS NOT NULL
AND clock_out IS NOT NULL;
```

## Testes

### Testes de Validação

```sql
-- Testar sequência inválida
BEGIN;
  -- Inserir clock_in
  INSERT INTO time_records (company_id, employee_id, record_type, recorded_at)
  VALUES (company_id, employee_id, 'clock_in', now());

  -- Tentar clock_out sem break (deve funcionar)
  INSERT INTO time_records (company_id, employee_id, record_type, recorded_at)
  VALUES (company_id, employee_id, 'clock_out', now() + INTERVAL '8 hours');

  -- Tentar break_start após clock_out (deve falhar)
  INSERT INTO time_records (company_id, employee_id, record_type, recorded_at)
  VALUES (company_id, employee_id, 'break_start', now() + INTERVAL '9 hours');
  -- Esperado: EXCEPTION "Registre entrada antes de iniciar intervalo"
ROLLBACK;
```

### Testes de Performance

```sql
-- Testar performance de cálculo mensal
EXPLAIN ANALYZE
SELECT * FROM get_monthly_summary(employee_id, 1, 2024);

-- Testar performance de dashboard
EXPLAIN ANALYZE
SELECT * FROM v_whos_in_today
WHERE company_id = target_company_id;
```

## Próximos Passos

### Melhorias Futuras

1. **Notificações**
   - Trigger para notificar gestor de correções pendentes
   - Alerta de batidas fora do horário esperado

2. **Relatórios**
   - Função para exportar espelho de ponto
   - Relatório de horas extras por departamento

3. **Integração**
   - Webhook para sistemas de folha de pagamento
   - API para dispositivos biométricos

4. **Compliance**
   - Validação de jornada máxima (CLT)
   - Cálculo de adicional noturno
   - Controle de descanso semanal

## Referências

- Migration 005: `/supabase/migrations/005_time_tracking.sql`
- Migration 014: `/supabase/migrations/014_time_tracking_enhancements.sql`
- Migration 015: `/supabase/migrations/015_time_tracking_rls_and_functions.sql`
