# Quick Start - Sistema de Workflows

Guia rápido para começar a usar o sistema de workflows de aprovação.

## 1. Executar Migration

```bash
# Aplicar migration do banco de dados
npm run db:migrate

# Ou via Supabase CLI
supabase db push
```

Isso cria:
- 5 tabelas de workflow
- Funções SQL auxiliares
- Policies RLS
- 5 tipos de workflow pré-configurados

## 2. Configurar Variável de Ambiente

Adicione ao `.env.local`:

```env
CRON_SECRET=seu-token-secreto-aqui
```

## 3. Configurar Cron Job (Vercel)

Crie ou edite `vercel.json`:

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

## 4. Acessar Dashboard

Navegue para `/aprovacoes` para ver:
- Aprovações pendentes
- Histórico de aprovações
- Aprovações rejeitadas
- Aprovações atrasadas

## 5. Testar Fluxo Básico

### A. Criar uma Ausência

```typescript
import { createAbsenceRequest } from '@/lib/supabase/queries/absences-management';

const result = await createAbsenceRequest({
  company_id: 'company-id',
  employee_id: 'employee-id',
  type: 'vacation',
  start_date: '2026-02-15',
  end_date: '2026-02-28',
  reason: 'Férias em família',
});

// Workflow criado automaticamente!
```

### B. Aprovar como Gestor

1. Acesse `/aprovacoes`
2. Veja a solicitação na tab "Pendentes"
3. Clique em "Aprovar"
4. (Opcional) Adicione comentário
5. Confirme

### C. Aprovar como RH

1. Após aprovação do gestor, solicitação aparece para RH
2. RH acessa `/aprovacoes`
3. Aprova a solicitação
4. Workflow completo!

## 6. Delegar Aprovações

### Durante Férias/Viagem

1. Acesse `/aprovacoes`
2. Clique em "Delegar Aprovações"
3. Selecione usuário
4. Escolha período (data início e fim)
5. (Opcional) Informe motivo
6. Confirme

Durante o período:
- Todas suas aprovações vão para o delegado
- Você não recebe notificações
- Delegado pode aprovar/rejeitar em seu nome

## 7. Bulk Actions

### Aprovar Múltiplas

1. Na tab "Pendentes"
2. Marque checkbox de cada aprovação desejada
3. Clique "Aprovar Selecionados"
4. Confirme

### Rejeitar Múltiplas

1. Selecione as aprovações
2. Clique "Rejeitar Selecionados"
3. Informe motivo (obrigatório)
4. Confirme

## 8. Filtros

### Por Tipo

Use o dropdown para filtrar:
- Ausências
- Horas Extras
- Ajustes de Ponto
- Documentos
- Alterações de Dados

### Por Solicitante

Use a barra de busca para encontrar por nome.

## 9. Monitorar SLA

### Badges Coloridos

- 🟢 **Verde**: Mais de 4h restantes
- 🟠 **Laranja**: Menos de 4h restantes
- 🔴 **Vermelho**: SLA vencido

### Tab "Com Atraso"

Veja apenas aprovações atrasadas ordenadas por urgência.

## 10. Ver Timeline

Clique em "Detalhes" em qualquer aprovação para ver:
- Timeline completa do workflow
- Quem aprovou/rejeitou em cada step
- Comentários de cada decisão
- Data/hora de cada ação

## Código de Exemplo

### Criar Workflow Manualmente

```typescript
import { WorkflowEngine } from '@/lib/workflows/engine';

const engine = new WorkflowEngine(companyId);

// Criar instância
const instance = await engine.createWorkflowInstance('overtime', {
  entityType: 'overtime',
  entityId: overtimeId,
  requesterId: userId,
  metadata: {
    hours: 3,
    date: '2026-02-01',
    reason: 'Projeto urgente',
  },
});

console.log('Workflow criado:', instance.id);
```

### Aprovar Programaticamente

```typescript
import { WorkflowEngine } from '@/lib/workflows/engine';

const engine = new WorkflowEngine(companyId);

await engine.approveStep(
  instanceId,
  approverId,
  { comments: 'Aprovado. Bom trabalho!' }
);
```

### Rejeitar Programaticamente

```typescript
await engine.rejectStep(
  instanceId,
  approverId,
  'Documentação incompleta. Por favor, anexe o comprovante.'
);
```

### Verificar Aprovações Pendentes

```typescript
import { getPendingApprovals } from '@/lib/supabase/queries/workflows';

const pending = await getPendingApprovals(userId);

console.log(`Você tem ${pending.length} aprovações pendentes`);
```

### Verificar Estatísticas

```typescript
import { getApprovalStats } from '@/lib/supabase/queries/workflows';

const stats = await getApprovalStats(userId);

console.log(`
  Pendentes: ${stats.pending}
  Aprovadas: ${stats.approved}
  Rejeitadas: ${stats.rejected}
  Atrasadas: ${stats.overdue}
`);
```

## Customização

### Adicionar Novo Tipo de Workflow

```sql
INSERT INTO workflow_definitions (type, name, description, steps, rules)
VALUES (
  'custom_type',
  'Meu Workflow Customizado',
  'Descrição do workflow',
  '[
    {"level": 1, "role": "manager", "sla": 24, "name": "Aprovação Gestor"},
    {"level": 2, "role": "hr_manager", "sla": 48, "name": "Aprovação RH"}
  ]'::jsonb,
  '{
    "requireAll": false,
    "autoApprove": {"field": "amount", "operator": "<", "value": 100}
  }'::jsonb
);
```

### Modificar SLA

```sql
UPDATE workflow_definitions
SET steps = jsonb_set(
  steps,
  '{0,sla}',
  '12'::jsonb
)
WHERE type = 'overtime';
```

### Desativar Workflow

```sql
UPDATE workflow_definitions
SET active = false
WHERE type = 'document_approval';
```

## Troubleshooting

### Aprovação não aparece

1. Verificar se usuário tem role correto
2. Confirmar que não há delegação ativa
3. Verificar RLS policies

### SLA não calcula

1. Confirmar que `sla` está definido no step
2. Verificar se cron job está rodando
3. Checar logs do cron

### Workflow não avança

1. Verificar regra `requireAll`
2. Confirmar que todos aprovaram
3. Checar logs do `approveStep()`

## Recursos Úteis

- 📖 **Documentação Completa**: `README_WORKFLOWS.md`
- 🔧 **Implementação**: `IMPLEMENTACAO_WORKFLOWS.md`
- 🧪 **Testes**: `src/lib/workflows/__tests__/engine.test.ts`
- 💡 **Utils**: `src/lib/workflows/utils.ts`

## Suporte

Para dúvidas ou problemas:
1. Consulte `README_WORKFLOWS.md` (seção Troubleshooting)
2. Revise `IMPLEMENTACAO_WORKFLOWS.md` (seção Fluxo de Uso)
3. Verifique logs do console
4. Inspecione tabelas no Supabase

---

**Pronto!** 🎉

Seu sistema de workflows está configurado e pronto para uso.
