# Componentes de Configurações de Produtividade

## Visão Geral

Componentes React para a página de Configurações de Produtividade, permitindo configurar importações, notificações, workflows e relatórios.

## Componentes

### ImportSettings.tsx
Configurações de importação de dados.

**Props**:
```typescript
{
  settings: ImportSettings
  onChange: (settings: ImportSettings) => void
}
```

**Features**:
- Mapeamento de colunas com nomes alternativos
- Regras de validação (CPF, email, duplicados)
- Auto-aprovação configurável

### NotificationSettings.tsx
Preferências de notificações.

**Props**:
```typescript
{
  preferences: NotificationPreferences
  onChange: (preferences: NotificationPreferences) => void
}
```

**Features**:
- Controle de canais (in-app, email)
- Modo "Não incomodar"
- Digest de notificações
- Teste de notificação

### WorkflowSettings.tsx
Configurações de workflows e aprovações.

**Props**:
```typescript
{
  rules: WorkflowRules
  onChange: (rules: WorkflowRules) => void
  departments: Array<{ id: string; name: string }>
  managers: Array<{ id: string; name: string }>
  hrManagers: Array<{ id: string; name: string }>
  activeDelegations: any[]
  onRevokeDelegation: (id: string) => Promise<void>
}
```

**Features**:
- Regras de aprovação por departamento
- Configuração de SLA
- Escalonamento automático
- Visualização de delegações ativas

### ReportSettings.tsx
Configurações de relatórios.

**Props**:
```typescript
{
  defaults: ReportDefaults
  onChange: (defaults: ReportDefaults) => void
  favoriteTemplates: any[]
  activeSchedules: any[]
  onGenerateReport: (templateId: string) => void
  onUnfavorite: (templateId: string) => void
  onDisableSchedule: (scheduleId: string) => Promise<void>
}
```

**Features**:
- Destino padrão (download, email, storage)
- Formato padrão (CSV, Excel, PDF)
- Templates favoritos
- Agendamentos ativos

## Uso

```tsx
import { ImportSettings } from '@/components/settings/ImportSettings'
import { NotificationSettings } from '@/components/settings/NotificationSettings'
import { WorkflowSettings } from '@/components/settings/WorkflowSettings'
import { ReportSettings } from '@/components/settings/ReportSettings'

// Exemplo
<ImportSettings
  settings={importSettings}
  onChange={handleImportChange}
/>
```

## Auto-save

Todos os componentes emitem eventos `onChange` que devem ser tratados com debounce na página principal:

```tsx
const debouncedSave = useMemo(
  () => debounce(async (settings) => {
    await saveSettings(settings)
    toast.success('Configurações salvas')
  }, 1000),
  []
)

const handleChange = (settings) => {
  setState(settings)
  debouncedSave(settings)
}
```

## Validações

Cada componente possui validações inline:
- Inputs não podem ser vazios
- Ranges numéricos validados
- Feedback visual imediato

## Acessibilidade

- Labels associados a inputs
- ARIA labels em componentes interativos
- Keyboard navigation
- Focus states visíveis

## Documentação Completa

Para documentação completa, consulte:
- [README_SETTINGS.md](../../README_SETTINGS.md) - Documentação técnica
- [USAGE_SETTINGS.md](../../USAGE_SETTINGS.md) - Manual do usuário
- [INDEX_SETTINGS.md](../../INDEX_SETTINGS.md) - Índice de toda documentação
