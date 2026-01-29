# Página de Configurações de Produtividade

## Visão Geral

Página centralizada para configurar todas as features de produtividade da Fase 6, incluindo importação, notificações, workflows e relatórios.

## Estrutura de Arquivos

```
src/
├── app/(dashboard)/
│   └── configuracoes/
│       └── produtividade/
│           └── page.tsx                 # Página principal com tabs
│
├── components/
│   ├── settings/
│   │   ├── ImportSettings.tsx          # Configurações de importação
│   │   ├── NotificationSettings.tsx    # Preferências de notificação
│   │   ├── WorkflowSettings.tsx        # Regras de workflow
│   │   └── ReportSettings.tsx          # Configurações de relatórios
│   │
│   └── ui/
│       └── radio-group.tsx             # Componente RadioGroup (criado)
│
└── lib/
    └── supabase/
        └── queries/
            └── settings.ts              # Queries do Supabase
```

## Componentes

### 1. ImportSettings

**Localização**: `src/components/settings/ImportSettings.tsx`

**Funcionalidades**:
- Mapeamento de colunas com nomes alternativos
- Regras de validação (CPF, email, duplicados)
- Configuração de auto-aprovação

**Características**:
- TagInput para adicionar nomes alternativos
- Switches para ativar/desativar regras
- Validação inline com feedback visual
- Auto-save com debounce

**Estado**:
```typescript
interface ImportSettings {
  columnMappings: ColumnMapping[]
  validationRules: ValidationRules
  autoApprove: AutoApproveConfig
}
```

### 2. NotificationSettings

**Localização**: `src/components/settings/NotificationSettings.tsx`

**Funcionalidades**:
- Preferências por tipo de notificação (in-app, email)
- Modo "Não incomodar" com horários
- Digest de notificações (agrupamento)
- Teste de notificações

**Tipos de Notificação**:
- Importação concluída
- Aprovação necessária
- Aprovação concedida/rejeitada
- Tarefa atribuída
- Alerta de SLA
- Relatório pronto

**Características**:
- Tabela interativa com switches
- Seleção de horários
- Dropdown de frequência
- Botão de teste

### 3. WorkflowSettings

**Localização**: `src/components/settings/WorkflowSettings.tsx`

**Funcionalidades**:
- Regras de aprovação por departamento
- Configuração de SLA
- Escalonamento automático
- Visualização de delegações ativas

**Características**:
- Tabela com selects para aprovadores
- Input numérico para SLA (horas)
- Switches para alertas e escalonamento
- Lista de delegações com botão de revogação

**Estado**:
```typescript
interface WorkflowRules {
  companyId: string
  rules: Record<string, DepartmentRule>
  sla: SLAConfig
}
```

### 4. ReportSettings

**Localização**: `src/components/settings/ReportSettings.tsx`

**Funcionalidades**:
- Destino padrão (download, email, storage)
- Formato padrão (CSV, Excel, PDF)
- Templates favoritos
- Agendamentos ativos

**Características**:
- RadioGroup para destino
- Select para formato
- Cards de templates com ações
- Tabela de agendamentos

## Queries Supabase

**Localização**: `src/lib/supabase/queries/settings.ts`

### Funções Principais

#### Import Settings
```typescript
getImportSettings(companyId: string): Promise<ImportSettings>
saveImportSettings(companyId: string, settings: ImportSettings): Promise<void>
```

#### Notification Preferences
```typescript
getNotificationPreferences(userId: string): Promise<NotificationPreferences>
saveNotificationPreferences(userId: string, prefs: NotificationPreferences): Promise<void>
```

#### Workflow Rules
```typescript
getWorkflowRules(companyId: string): Promise<WorkflowRules>
saveWorkflowRules(companyId: string, rules: WorkflowRules): Promise<void>
getActiveDelegations(companyId: string): Promise<Delegation[]>
revokeDelegation(delegationId: string): Promise<void>
```

#### Report Defaults
```typescript
getReportDefaults(userId: string): Promise<ReportDefaults>
saveReportDefaults(userId: string, defaults: ReportDefaults): Promise<void>
getFavoriteTemplates(userId: string): Promise<Template[]>
getActiveSchedules(userId: string): Promise<Schedule[]>
disableSchedule(scheduleId: string): Promise<void>
```

## Página Principal

**Localização**: `src/app/(dashboard)/configuracoes/produtividade/page.tsx`

### Features

#### Auto-save com Debounce
```typescript
const debouncedSave = useMemo(
  () =>
    debounce(async (settings) => {
      await saveSettings(settings)
      toast.success('Configurações salvas')
    }, 1000),
  []
)
```

#### Tabs
- Import (Importação)
- Notifications (Notificações)
- Workflows (Workflows)
- Reports (Relatórios)

#### Loading State
- Skeleton placeholders durante carregamento
- Feedback visual imediato

#### Error Handling
- Toast notifications para sucesso/erro
- Fallback para configurações padrão

## Schemas Supabase Necessários

### company_settings
```sql
CREATE TABLE company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  import_settings JSONB,
  workflow_rules JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id)
);
```

### user_settings
```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES usuarios(id),
  notification_preferences JSONB,
  report_defaults JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### workflow_delegations
```sql
CREATE TABLE workflow_delegations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  from_user_id UUID REFERENCES usuarios(id),
  to_user_id UUID REFERENCES usuarios(id),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### report_templates
```sql
CREATE TABLE report_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  config JSONB,
  favorite_by_users UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### report_schedules
```sql
CREATE TABLE report_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES usuarios(id),
  template_id UUID REFERENCES report_templates(id),
  frequency VARCHAR NOT NULL,
  next_run TIMESTAMPTZ NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Fluxo de Uso

### 1. Acesso à Página
```
/configuracoes/produtividade
```

### 2. Carregamento
1. Página faz loading de todas as configurações
2. Exibe skeleton durante carregamento
3. Popula tabs com dados carregados

### 3. Edição
1. Usuário altera configuração
2. onChange dispara update local
3. Debounce aguarda 1s
4. Salva no Supabase
5. Toast de sucesso

### 4. Tabs
- **Import**: Configure mapeamento e validações
- **Notifications**: Ajuste preferências de canal
- **Workflows**: Defina aprovadores e SLAs
- **Reports**: Configure destino e templates

## Validações

### Import Settings
- Nomes alternativos não podem ser vazios
- Threshold de auto-aprovação: 1-100 linhas

### Notification Settings
- Horários devem ser válidos (HH:mm)
- Pelo menos um canal deve estar ativo

### Workflow Settings
- SLA mínimo: 1 hora
- SLA máximo: 168 horas (1 semana)
- Escalonamento após: 1-168 horas

### Report Settings
- Formato deve ser CSV, XLSX ou PDF
- Destino deve ser download, email ou storage

## Feedback Visual

### Toast Messages
- **Sucesso**: Configurações salvas
- **Erro**: Erro ao salvar configurações
- **Info**: Notificação de teste enviada

### States
- **Loading**: Skeleton placeholders
- **Empty**: Mensagens "Nenhum item"
- **Active**: Dados carregados e interativos

## Acessibilidade

- Labels associados a inputs
- Keyboard navigation
- ARIA labels
- Focus states
- Color contrast

## Performance

### Otimizações
- Debounce de 1s para auto-save
- useMemo para callbacks
- Carregamento paralelo de dados
- Lazy loading de tabs

### Métricas
- FCP < 1.5s
- LCP < 2.5s
- CLS < 0.1

## Testes Recomendados

### Unitários
- [ ] Validação de formulários
- [ ] Debounce de save
- [ ] Transformação de dados

### Integração
- [ ] Carregamento de configurações
- [ ] Salvamento de configurações
- [ ] Navegação entre tabs

### E2E
- [ ] Fluxo completo de configuração
- [ ] Auto-save funciona
- [ ] Toast messages aparecem

## Próximos Passos

1. **Integração com Auth Real**
   - Substituir userId e companyId mock
   - Usar contexto de autenticação

2. **Validações Backend**
   - Implementar RLS no Supabase
   - Validar permissões

3. **Histórico de Alterações**
   - Criar tabela de audit log
   - Exibir histórico de mudanças

4. **Import/Export**
   - Exportar configurações
   - Importar de outra empresa

5. **Bulk Operations**
   - Copiar configurações entre departamentos
   - Reset para padrões

## Dependências

```json
{
  "lodash": "^4.17.21",
  "date-fns": "^3.0.0",
  "sonner": "^1.0.0",
  "@radix-ui/react-tabs": "^1.0.4",
  "@radix-ui/react-switch": "^1.0.3",
  "@radix-ui/react-select": "^2.0.0",
  "@radix-ui/react-radio-group": "^1.1.3"
}
```

## Troubleshooting

### Auto-save não funciona
- Verificar se debounce está configurado
- Conferir se onChange está sendo chamado
- Checar logs do console

### Dados não carregam
- Verificar credenciais do Supabase
- Conferir se tabelas existem
- Validar RLS policies

### Toast não aparece
- Verificar se Toaster está no layout
- Conferir imports do sonner

## Conclusão

A página de configurações de produtividade fornece uma interface centralizada e intuitiva para gerenciar todas as configurações avançadas do sistema. Com auto-save, validação inline e feedback visual, oferece uma experiência de usuário fluida e eficiente.
