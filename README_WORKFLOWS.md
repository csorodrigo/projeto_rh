# Sistema de Workflows de Aprovação Multi-nível

Sistema completo e flexível para gerenciar processos de aprovação de ausências, horas extras, ajustes de ponto e outros processos que necessitem de aprovação.

## Arquitetura

### 1. Motor de Workflow (`src/lib/workflows/engine.ts`)

O `WorkflowEngine` é o coração do sistema, responsável por:

- **Criar instâncias de workflow** para cada solicitação
- **Gerenciar aprovações** em múltiplos níveis
- **Calcular e monitorar SLA** de cada step
- **Auto-aprovar** baseado em regras configuráveis
- **Escalar** workflows atrasados
- **Delegar** aprovações temporariamente

#### Principais Métodos

```typescript
// Criar workflow
const engine = new WorkflowEngine(companyId);
const instance = await engine.createWorkflowInstance('absence', {
  entityType: 'absence',
  entityId: absenceId,
  requesterId: userId,
  metadata: { days: 10 }
});

// Aprovar step
await engine.approveStep(instanceId, approverId, { comments: 'Aprovado!' });

// Rejeitar step
await engine.rejectStep(instanceId, approverId, 'Documentação incompleta');

// Delegar aprovações
await engine.delegateApproval(fromUserId, toUserId, startDate, endDate);

// Verificar SLA
const overdueInstances = await engine.checkSLA();
```

### 2. Definições de Workflow

Workflows são configuráveis via tabela `workflow_definitions`:

```typescript
{
  type: 'absence',
  name: 'Aprovação de Ausência',
  steps: [
    { level: 1, role: 'manager', sla: 24, name: 'Aprovação do Gestor' },
    { level: 2, role: 'hr_manager', sla: 48, name: 'Aprovação do RH' }
  ],
  rules: {
    skipIfAmount: { field: 'days', operator: '<', value: 2 },
    requireAll: false,
    autoApprove: null
  }
}
```

#### Tipos de Workflow Disponíveis

| Tipo | Descrição | Steps |
|------|-----------|-------|
| `absence` | Ausências e férias | Gestor → RH |
| `overtime` | Horas extras | Gestor |
| `time_adjustment` | Ajustes de ponto | Gestor → RH (ambos obrigatórios) |
| `document_approval` | Aprovação de documentos | Analista RH |
| `data_change` | Mudanças cadastrais | Analista RH |

#### Regras Configuráveis

**Auto-aprovação**:
```typescript
autoApprove: { field: 'hours', operator: '<', value: 2 }
// Aprova automaticamente se horas < 2
```

**Pular steps**:
```typescript
skipIfAmount: { field: 'days', operator: '<', value: 2 }
// Pula step 2 se dias < 2
```

**Exigir todos os aprovadores**:
```typescript
requireAll: true
// Todos os aprovadores do nível devem aprovar
```

### 3. Estrutura de Dados

#### WorkflowInstance

```typescript
{
  id: string;
  company_id: string;
  workflow_type: 'absence' | 'overtime' | 'time_adjustment' | ...;
  entity_type: string;    // 'absence', 'time_tracking_daily', etc.
  entity_id: string;      // ID da entidade relacionada
  requester_id: string;
  current_step: number;
  total_steps: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  sla_due_at: string;     // Prazo do step atual
  metadata: object;       // Dados adicionais
}
```

#### WorkflowApproval

```typescript
{
  id: string;
  instance_id: string;
  step_level: number;
  approver_id: string;
  decision: 'approved' | 'rejected' | 'skipped' | null;
  comments: string;
  decided_at: string;
  sla_due_at: string;
  delegated_from: string; // Se foi delegado
}
```

#### WorkflowDelegation

```typescript
{
  id: string;
  from_user_id: string;
  to_user_id: string;
  start_date: string;
  end_date: string;
  active: boolean;
  reason: string;
}
```

### 4. Componentes React

#### ApprovalCard

Exibe uma solicitação de aprovação com:
- Avatar e dados do solicitante
- Badge de SLA (verde/laranja/vermelho)
- Informações da entidade (datas, motivo, etc.)
- Botões de ação (Aprovar/Rejeitar/Detalhes)
- Suporte a seleção múltipla

```tsx
<ApprovalCard
  approval={approval}
  selected={isSelected}
  onSelect={toggleSelection}
  onApprove={handleApprove}
  onReject={handleReject}
  showCheckbox
/>
```

#### ApprovalTimeline

Timeline visual mostrando o progresso do workflow:

```tsx
<ApprovalTimeline instance={instanceWithDetails} />
```

Exibe:
- ✅ Steps completados (verde)
- ❌ Steps rejeitados (vermelho)
- ⏳ Steps pendentes (azul)
- 👤 Avatar e nome de cada aprovador
- 💬 Comentários de aprovação/rejeição
- 📅 Data/hora de cada decisão

#### DelegationModal

Modal para delegar aprovações temporariamente:

```tsx
<DelegationModal
  open={isOpen}
  onOpenChange={setIsOpen}
  userId={currentUserId}
  eligibleUsers={users}
  onSuccess={reload}
/>
```

### 5. Página de Aprovações (`/aprovacoes`)

Dashboard completo com 4 tabs:

#### 1. Pendentes
- Aprovações aguardando decisão
- Badges de SLA
- Filtros por tipo e solicitante
- Seleção múltipla
- Bulk actions (aprovar/rejeitar vários)

#### 2. Aprovadas
- Histórico de aprovações realizadas
- Somente visualização

#### 3. Rejeitadas
- Histórico de rejeições
- Exibe motivo da rejeição

#### 4. Com Atraso
- Aprovações com SLA vencido
- Destaque vermelho

#### Features

**Filtros**:
- Por tipo de workflow
- Por nome do solicitante
- Por status de SLA

**Bulk Actions**:
- Selecionar múltiplas aprovações
- Aprovar todas selecionadas
- Rejeitar todas com motivo global

**Delegação**:
- Botão "Delegar Aprovações"
- Escolher usuário e período
- Todas as aprovações são redirecionadas

**Estatísticas**:
- Cards com contadores
- Pendentes, Atrasadas, Aprovadas, Rejeitadas

### 6. Integração com Ausências

Quando uma ausência é criada, automaticamente:

1. Cria a ausência com `status: 'pending'`
2. Cria uma instância de workflow do tipo `absence`
3. Cria aprovações para o primeiro step (gestor)
4. Calcula SLA baseado nas regras
5. Notifica os aprovadores (se integrado com notificações)

```typescript
// Em absences-management.ts
const absence = await createAbsenceRequest(data);

// Workflow é criado automaticamente
const engine = new WorkflowEngine(companyId);
await engine.createWorkflowInstance('absence', {
  entityType: 'absence',
  entityId: absence.id,
  requesterId: userId,
  metadata: { days: totalDays, ... }
});
```

### 7. SLA e Alertas

#### Cálculo de SLA

Cada step tem um SLA definido em horas:
- `sla: 24` = 24 horas para aprovar
- `sla: 48` = 48 horas para aprovar

O SLA é calculado a partir da criação do step:
```typescript
sla_due_at = created_at + sla_hours
```

#### Badges Visuais

- **Verde**: Mais de 4 horas restantes
- **Laranja**: Menos de 4 horas restantes
- **Vermelho**: SLA vencido

#### Cron Job

`/api/cron/check-sla` deve ser executado periodicamente (ex: a cada hora):

```bash
# Vercel Cron (vercel.json)
{
  "crons": [{
    "path": "/api/cron/check-sla",
    "schedule": "0 * * * *"
  }]
}
```

O cron job:
1. Busca workflows com SLA vencido
2. Cria notificações para os aprovadores
3. Escalona workflows atrasados por >24h
4. Registra no histórico

#### Escalonamento

Workflows atrasados por mais de 24 horas são escalonados:
- Registra ação de "escalated" no histórico
- Pode notificar gerente superior ou HR manager
- (Implementação customizável na função `escalate()`)

### 8. Queries

#### Principais Funções

```typescript
// Aprovações pendentes do usuário
const pending = await getPendingApprovals(userId);

// Histórico de aprovações
const approved = await getApprovalHistory(userId, 'approved');
const rejected = await getApprovalHistory(userId, 'rejected');

// Aprovações atrasadas
const overdue = await getOverdueApprovals(userId);

// Detalhes de um workflow
const instance = await getWorkflowInstance(instanceId);

// Workflows de uma entidade
const workflows = await getWorkflowsByEntity('absence', absenceId);

// Delegações do usuário
const delegations = await getMyDelegations(userId);
const active = await getActiveDelegation(userId);

// Estatísticas
const stats = await getApprovalStats(userId);
// { pending: 5, approved: 120, rejected: 3, overdue: 2 }
```

### 9. Segurança (RLS)

As políticas RLS garantem que:

**workflow_instances**:
- Usuários só veem workflows da sua empresa
- Apenas o solicitante pode criar workflows

**workflow_approvals**:
- Usuários veem aprovações da sua empresa
- Apenas o aprovador (ou delegado) pode decidir

**workflow_delegations**:
- Usuários veem apenas suas próprias delegações
- Apenas o dono pode criar/modificar delegações

### 10. Testes

#### Fluxo Completo de Aprovação

```typescript
// 1. Criar ausência
const absence = await createAbsenceRequest({
  employee_id: employeeId,
  type: 'vacation',
  start_date: '2026-02-15',
  end_date: '2026-02-28',
  reason: 'Férias em família',
});

// 2. Verificar workflow criado
const workflow = await getLatestWorkflowForEntity('absence', absence.id);
expect(workflow.status).toBe('pending');
expect(workflow.current_step).toBe(1);

// 3. Buscar aprovações pendentes do gestor
const pending = await getPendingApprovals(managerId);
expect(pending.length).toBeGreaterThan(0);

// 4. Aprovar como gestor
await engine.approveStep(workflow.id, managerId, {
  comments: 'Aprovado. Boas férias!'
});

// 5. Verificar avançou para step 2
const updated = await getWorkflowInstance(workflow.id);
expect(updated.current_step).toBe(2);

// 6. Aprovar como HR
await engine.approveStep(workflow.id, hrManagerId);

// 7. Verificar workflow completo
const final = await getWorkflowInstance(workflow.id);
expect(final.status).toBe('approved');
expect(final.completed_at).toBeTruthy();
```

#### Teste de Delegação

```typescript
// Criar delegação
await engine.delegateApproval(
  userId,
  delegateId,
  new Date(),
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
);

// Verificar delegação ativa
const active = await getActiveDelegation(userId);
expect(active.to_user_id).toBe(delegateId);

// Aprovações aparecem para o delegado
const pending = await getPendingApprovals(delegateId);
// Inclui aprovações delegadas
```

#### Teste de SLA

```typescript
// Criar workflow com SLA curto
const instance = await engine.createWorkflowInstance('overtime', {
  entityType: 'overtime',
  entityId: overtimeId,
  requesterId: userId,
  metadata: { hours: 3 }
});

// Simular passagem do tempo (ou aguardar)
await new Promise(resolve => setTimeout(resolve, slaHours * 60 * 60 * 1000));

// Verificar SLA vencido
const overdue = await engine.checkSLA();
expect(overdue.some(i => i.id === instance.id)).toBe(true);
```

#### Teste de Auto-aprovação

```typescript
// Criar workflow que deve ser auto-aprovado
const instance = await engine.createWorkflowInstance('overtime', {
  entityType: 'overtime',
  entityId: overtimeId,
  requesterId: userId,
  metadata: { hours: 1 } // < 2 horas, auto-aprova
});

// Verificar já está aprovado
expect(instance.status).toBe('approved');
expect(instance.completed_at).toBeTruthy();
```

## Configuração

### 1. Migrations

Execute a migration:
```bash
npm run db:migrate
```

A migration cria:
- `workflow_definitions` (com dados iniciais)
- `workflow_instances`
- `workflow_approvals`
- `workflow_delegations`
- `workflow_history`

### 2. Variáveis de Ambiente

```env
# Para o cron job
CRON_SECRET=your-secret-token-here
```

### 3. Cron Job (Vercel)

Adicione em `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-sla",
      "schedule": "0 * * * *"
    }
  ]
}
```

## Extensibilidade

### Adicionar Novo Tipo de Workflow

1. **Adicionar tipo no enum**:
```typescript
// database.ts
export type WorkflowType = 'absence' | 'overtime' | 'my_new_type';
```

2. **Criar definição no banco**:
```sql
INSERT INTO workflow_definitions (type, name, steps, rules) VALUES
('my_new_type', 'Meu Novo Workflow',
  '[{"level": 1, "role": "manager", "sla": 24, "name": "Aprovação"}]',
  '{"requireAll": false}');
```

3. **Usar no código**:
```typescript
await engine.createWorkflowInstance('my_new_type', {
  entityType: 'my_entity',
  entityId: entityId,
  requesterId: userId,
  metadata: { ... }
});
```

### Customizar Regras de Auto-aprovação

Modifique o método `shouldAutoApprove()` no `WorkflowEngine`:

```typescript
private async shouldAutoApprove(
  definition: WorkflowDefinition,
  metadata: Record<string, unknown>
): Promise<boolean> {
  // Adicione lógica customizada aqui

  // Exemplo: auto-aprovar se for sexta-feira
  if (new Date().getDay() === 5) {
    return true;
  }

  // Lógica padrão
  const { autoApprove } = definition.rules;
  // ...
}
```

### Customizar Escalonamento

Modifique o método `escalate()` no `WorkflowEngine`:

```typescript
async escalate(instanceId: string): Promise<void> {
  const instance = await getWorkflowInstance(instanceId);

  // Notificar gerente superior
  const { data: manager } = await supabase
    .from('employees')
    .select('manager_id')
    .eq('id', instance.requester.employee_id)
    .single();

  if (manager?.manager_id) {
    await createNotification({
      user_id: manager.manager_id,
      type: 'workflow_escalated',
      title: 'Workflow Escalonado',
      message: `Aprovação atrasada de ${instance.requester.name}`,
    });
  }

  // Registrar
  await this.addHistory(instanceId, 'escalated', null, null, null);
}
```

## Boas Práticas

1. **Sempre use o WorkflowEngine** para modificar workflows
2. **Não modifique diretamente** as tabelas de workflow
3. **Registre no histórico** toda ação importante
4. **Configure SLA realista** para cada tipo de workflow
5. **Teste delegações** antes de implementar em produção
6. **Monitore workflows atrasados** regularmente
7. **Documente regras customizadas** no metadata

## Troubleshooting

### Aprovação não aparece para o aprovador

- Verificar RLS da tabela `workflow_approvals`
- Confirmar que o usuário tem o role correto
- Verificar se há delegação ativa

### SLA não está sendo calculado

- Confirmar que `sla` está definido no step
- Verificar função `calculateSLA()`
- Confirmar que o cron job está rodando

### Workflow não avança após aprovação

- Verificar regra `requireAll`
- Confirmar que todos os aprovadores decidiram
- Verificar logs do método `isStepComplete()`

### Auto-aprovação não funciona

- Verificar regra `autoApprove` na definição
- Confirmar que o metadata contém o campo correto
- Testar método `shouldAutoApprove()`

## Roadmap

- [ ] Notificações push
- [ ] Webhooks para eventos de workflow
- [ ] Métricas de performance de aprovadores
- [ ] Templates de comentários
- [ ] Aprovação por email
- [ ] Workflow designer visual
- [ ] Aprovações condicionais complexas
- [ ] Relatórios de tempo médio de aprovação
