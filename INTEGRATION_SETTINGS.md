# Guia de Integração - Configurações de Produtividade

## 1. Adicionar Rota no Menu de Navegação

### Localização do Componente de Navegação
Encontre o componente de navegação/sidebar, geralmente em:
- `src/components/layout/Sidebar.tsx` ou
- `src/components/navigation/NavMenu.tsx`

### Adicionar Item de Menu

```tsx
import { Settings, FileInput, Bell, Workflow, FileText } from 'lucide-react'

const menuItems = [
  // ... outros itens
  {
    title: 'Configurações',
    icon: Settings,
    items: [
      {
        title: 'Produtividade',
        href: '/configuracoes/produtividade',
        icon: Workflow,
        description: 'Configure importações, notificações e workflows',
      },
      // ... outros subitens
    ],
  },
]
```

### Exemplo Completo de Submenu

```tsx
<DropdownMenu>
  <DropdownMenuTrigger>
    <div className="flex items-center gap-2">
      <Settings className="h-4 w-4" />
      <span>Configurações</span>
    </div>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem asChild>
      <Link href="/configuracoes/produtividade">
        <Workflow className="mr-2 h-4 w-4" />
        Produtividade
      </Link>
    </DropdownMenuItem>
    <DropdownMenuItem asChild>
      <Link href="/configuracoes/geral">
        <Settings className="mr-2 h-4 w-4" />
        Geral
      </Link>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## 2. Permissões e Autenticação

### Verificar Permissões

```tsx
// src/lib/auth/permissions.ts
export const PERMISSIONS = {
  SETTINGS_PRODUCTIVITY: 'settings.productivity',
  SETTINGS_IMPORT: 'settings.import',
  SETTINGS_NOTIFICATIONS: 'settings.notifications',
  SETTINGS_WORKFLOWS: 'settings.workflows',
  SETTINGS_REPORTS: 'settings.reports',
}

// Verificar na página
import { usePermissions } from '@/hooks/usePermissions'

export default function ProductivitySettingsPage() {
  const { hasPermission } = usePermissions()

  if (!hasPermission(PERMISSIONS.SETTINGS_PRODUCTIVITY)) {
    return <AccessDenied />
  }

  // ... resto do código
}
```

### RLS Policies no Supabase

```sql
-- Policy para company_settings
CREATE POLICY "Users can view their company settings"
ON company_settings FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM usuarios WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can update company settings"
ON company_settings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid()
    AND company_id = company_settings.company_id
    AND role IN ('admin', 'manager')
  )
);

-- Policy para user_settings
CREATE POLICY "Users can view their own settings"
ON user_settings FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own settings"
ON user_settings FOR UPDATE
USING (user_id = auth.uid());
```

## 3. Obter User ID e Company ID Real

### Hook de Autenticação

```tsx
// src/hooks/useAuth.ts
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Buscar usuário autenticado
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)

      // Buscar company_id do usuário
      if (user) {
        supabase
          .from('usuarios')
          .select('company_id')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            setCompanyId(data?.company_id || null)
            setLoading(false)
          })
      } else {
        setLoading(false)
      }
    })
  }, [])

  return { user, userId: user?.id, companyId, loading }
}
```

### Usar no Componente

```tsx
import { useAuth } from '@/hooks/useAuth'

export default function ProductivitySettingsPage() {
  const { userId, companyId, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId && companyId && !authLoading) {
      loadSettings()
    }
  }, [userId, companyId, authLoading])

  const loadSettings = async () => {
    // Usar userId e companyId reais
    const importData = await getImportSettings(companyId!)
    // ...
  }

  // ... resto do código
}
```

## 4. Criar Tabelas no Supabase

### Migration SQL

```sql
-- 1. company_settings
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  import_settings JSONB DEFAULT '{}'::jsonb,
  workflow_rules JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id)
);

-- 2. user_settings
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  notification_preferences JSONB DEFAULT '{}'::jsonb,
  report_defaults JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3. workflow_delegations
CREATE TABLE IF NOT EXISTS workflow_delegations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_date > start_date)
);

-- 4. report_templates
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  favorite_by_users UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. report_schedules
CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  template_id UUID REFERENCES report_templates(id) ON DELETE CASCADE,
  frequency VARCHAR NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  next_run TIMESTAMPTZ NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_company_settings_company_id ON company_settings(company_id);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_workflow_delegations_company_id ON workflow_delegations(company_id);
CREATE INDEX idx_workflow_delegations_dates ON workflow_delegations(start_date, end_date);
CREATE INDEX idx_report_templates_company_id ON report_templates(company_id);
CREATE INDEX idx_report_schedules_user_id ON report_schedules(user_id);
CREATE INDEX idx_report_schedules_next_run ON report_schedules(next_run) WHERE enabled = TRUE;

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON company_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_delegations_updated_at
  BEFORE UPDATE ON workflow_delegations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_templates_updated_at
  BEFORE UPDATE ON report_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_schedules_updated_at
  BEFORE UPDATE ON report_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 5. Testar a Implementação

### Checklist de Testes

- [ ] Página carrega sem erros
- [ ] Tabs navegam corretamente
- [ ] Import Settings
  - [ ] Adicionar nome alternativo funciona
  - [ ] Remover nome alternativo funciona
  - [ ] Switches alteram estado
  - [ ] Auto-aprovação ativa/desativa
  - [ ] Threshold atualiza
- [ ] Notification Settings
  - [ ] Switches de canal funcionam
  - [ ] Modo "Não incomodar" ativa/desativa
  - [ ] Horários podem ser alterados
  - [ ] Frequência de digest atualiza
  - [ ] Botão de teste envia notificação
- [ ] Workflow Settings
  - [ ] Selects de aprovador funcionam
  - [ ] SLA atualiza
  - [ ] Escalonamento ativa/desativa
  - [ ] Delegações aparecem
  - [ ] Revogar delegação funciona
- [ ] Report Settings
  - [ ] RadioGroup de destino funciona
  - [ ] Select de formato funciona
  - [ ] Templates favoritos aparecem
  - [ ] Gerar relatório funciona
  - [ ] Desfavoritar funciona
  - [ ] Agendamentos aparecem
  - [ ] Desativar agendamento funciona
- [ ] Auto-save
  - [ ] Debounce de 1s funciona
  - [ ] Toast de sucesso aparece
  - [ ] Dados salvam no Supabase
- [ ] Loading States
  - [ ] Skeleton aparece no carregamento
  - [ ] Dados aparecem após carregar
- [ ] Error Handling
  - [ ] Erro de rede exibe toast
  - [ ] Fallback para configurações padrão

### Comandos de Teste

```bash
# Rodar em dev
npm run dev

# Abrir página
open http://localhost:3000/configuracoes/produtividade

# Verificar console para erros
# Verificar Network tab para requisições

# Testar build
npm run build
npm run start
```

## 6. Monitoramento e Logs

### Adicionar Logs

```tsx
// No início das funções de save
console.log('[Settings] Saving import settings:', settings)

// Em caso de erro
console.error('[Settings] Error saving:', error)

// Sucesso
console.log('[Settings] Saved successfully')
```

### Sentry (Opcional)

```tsx
import * as Sentry from '@sentry/nextjs'

try {
  await saveImportSettings(companyId, settings)
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      feature: 'settings',
      type: 'import',
    },
  })
  throw error
}
```

## 7. Documentação para Usuários

### Tooltip de Ajuda

```tsx
import { HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

<div className="flex items-center gap-2">
  <Label>CPF obrigatório</Label>
  <Tooltip>
    <TooltipTrigger>
      <HelpCircle className="h-4 w-4 text-muted-foreground" />
    </TooltipTrigger>
    <TooltipContent>
      <p>Quando ativado, importações sem CPF serão rejeitadas</p>
    </TooltipContent>
  </Tooltip>
</div>
```

### Link para Documentação

```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>Mapeamento de Colunas</CardTitle>
      <Button variant="ghost" size="sm" asChild>
        <a href="/docs/settings/import" target="_blank">
          Ver documentação
        </a>
      </Button>
    </div>
  </CardHeader>
  {/* ... */}
</Card>
```

## 8. Próximos Passos

1. **Implementar hook useAuth**
2. **Criar migrations no Supabase**
3. **Configurar RLS policies**
4. **Adicionar item no menu**
5. **Testar todas as funcionalidades**
6. **Documentar para equipe**
7. **Deploy em staging**
8. **Testes E2E**
9. **Deploy em produção**

## 9. Recursos Úteis

- [Radix UI Docs](https://www.radix-ui.com/)
- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React Hook Form](https://react-hook-form.com/)

## 10. Contato

Em caso de dúvidas sobre a implementação, consulte:
- README_SETTINGS.md (documentação técnica)
- Este arquivo (guia de integração)
- Equipe de desenvolvimento
