# Guia Rápido de Deploy - Configurações de Produtividade

## Checklist Pré-Deploy

### 1. Verificar Arquivos ✅
```bash
# Verificar se todos os arquivos foram criados
ls -la src/app/\(dashboard\)/configuracoes/produtividade/page.tsx
ls -la src/components/settings/*.tsx
ls -la src/lib/supabase/queries/settings.ts
ls -la src/lib/utils/debounce.ts
ls -la src/components/ui/radio-group.tsx

# Todos devem existir
```

### 2. Instalar Dependências ✅
```bash
# Já instalado
npm list @radix-ui/react-radio-group
# Deve mostrar: @radix-ui/react-radio-group@1.3.8
```

### 3. Build Local
```bash
# Testar build
npm run build

# Se houver erros de TypeScript, revisar os arquivos
# Não deve haver erros
```

---

## Passo 1: Criar Hook de Autenticação (30 min)

### Arquivo: `src/hooks/useAuth.ts`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthData {
  user: User | null
  userId: string | null
  companyId: string | null
  loading: boolean
}

export function useAuth(): AuthData {
  const [data, setData] = useState<AuthData>({
    user: null,
    userId: null,
    companyId: null,
    loading: true,
  })

  useEffect(() => {
    const supabase = createClient()

    async function loadUser() {
      // Buscar usuário autenticado
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setData({ user: null, userId: null, companyId: null, loading: false })
        return
      }

      // Buscar company_id do usuário
      const { data: userData } = await supabase
        .from('usuarios')
        .select('company_id')
        .eq('id', user.id)
        .single()

      setData({
        user,
        userId: user.id,
        companyId: userData?.company_id || null,
        loading: false,
      })
    }

    loadUser()

    // Escutar mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUser()
    })

    return () => subscription.unsubscribe()
  }, [])

  return data
}
```

### Atualizar Página Principal

```typescript
// src/app/(dashboard)/configuracoes/produtividade/page.tsx
// SUBSTITUIR:
const userId = 'current-user-id'
const companyId = 'current-company-id'

// POR:
import { useAuth } from '@/hooks/useAuth'

export default function ProductivitySettingsPage() {
  const { userId, companyId, loading: authLoading } = useAuth()

  // Adicionar guard
  if (authLoading) {
    return <LoadingSkeleton />
  }

  if (!userId || !companyId) {
    return <AccessDenied />
  }

  // ... resto do código
}
```

---

## Passo 2: Migrations Supabase (30 min)

### Acessar Supabase Dashboard
1. Ir para: https://app.supabase.com
2. Selecionar seu projeto
3. SQL Editor > New Query

### Executar Migration

```sql
-- ============================================
-- MIGRATION: Configurações de Produtividade
-- Data: 2024-01-29
-- ============================================

-- 1. Tabela company_settings
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  import_settings JSONB DEFAULT '{
    "columnMappings": [],
    "validationRules": {
      "cpfRequired": true,
      "emailRequired": true,
      "blockDuplicates": true
    },
    "autoApprove": {
      "enabled": false,
      "threshold": 10
    }
  }'::jsonb,
  workflow_rules JSONB DEFAULT '{
    "rules": {},
    "sla": {
      "alertsEnabled": true,
      "escalateEnabled": false,
      "escalateAfter": 24
    }
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id)
);

-- 2. Tabela user_settings
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  notification_preferences JSONB DEFAULT '{
    "preferences": {},
    "doNotDisturb": {
      "enabled": false,
      "start": "22:00",
      "end": "08:00"
    },
    "digest": {
      "frequency": "realtime"
    }
  }'::jsonb,
  report_defaults JSONB DEFAULT '{
    "destination": "download",
    "format": "xlsx"
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 3. Tabela workflow_delegations
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

-- 4. Tabela report_templates
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

-- 5. Tabela report_schedules
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

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_company_settings_company_id
  ON company_settings(company_id);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id
  ON user_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_workflow_delegations_company_id
  ON workflow_delegations(company_id);

CREATE INDEX IF NOT EXISTS idx_workflow_delegations_dates
  ON workflow_delegations(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_report_templates_company_id
  ON report_templates(company_id);

CREATE INDEX IF NOT EXISTS idx_report_schedules_user_id
  ON report_schedules(user_id);

CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run
  ON report_schedules(next_run) WHERE enabled = TRUE;

-- ============================================
-- TRIGGERS
-- ============================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
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

-- ============================================
-- RLS POLICIES
-- ============================================

-- Habilitar RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;

-- company_settings
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

CREATE POLICY "Admins can insert company settings"
  ON company_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND company_id = company_settings.company_id
      AND role IN ('admin', 'manager')
    )
  );

-- user_settings
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- workflow_delegations
CREATE POLICY "Users can view their company delegations"
  ON workflow_delegations FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- report_templates
CREATE POLICY "Users can view their company templates"
  ON report_templates FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- report_schedules
CREATE POLICY "Users can view their own schedules"
  ON report_schedules FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own schedules"
  ON report_schedules FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- MIGRATION COMPLETA
-- ============================================
```

### Verificar Sucesso
```sql
-- Verificar tabelas criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'company_settings',
  'user_settings',
  'workflow_delegations',
  'report_templates',
  'report_schedules'
);

-- Deve retornar 5 linhas
```

---

## Passo 3: Adicionar ao Menu (15 min)

### Localizar arquivo de navegação
Procurar por um destes:
- `src/components/layout/Sidebar.tsx`
- `src/components/navigation/NavMenu.tsx`
- `src/app/(dashboard)/layout.tsx`

### Adicionar item

```tsx
import { Settings, Workflow } from 'lucide-react'

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
      },
      // ... outros subitens
    ],
  },
]
```

---

## Passo 4: Testar Localmente (15 min)

```bash
# 1. Iniciar dev server
npm run dev

# 2. Abrir navegador
open http://localhost:3000/configuracoes/produtividade

# 3. Verificar:
# - [ ] Página carrega sem erros
# - [ ] Tabs navegam
# - [ ] Pode adicionar nome alternativo
# - [ ] Switches funcionam
# - [ ] Auto-save funciona (toast aparece)
# - [ ] Dados persistem após reload

# 4. Verificar console do navegador
# Não deve ter erros em vermelho
```

---

## Passo 5: Deploy Staging (30 min)

### Vercel

```bash
# 1. Commit
git add .
git commit -m "feat: Adicionar página de configurações de produtividade"

# 2. Push para branch
git push origin feature/productivity-settings

# 3. Criar PR
gh pr create --title "Configurações de Produtividade" --body "Implementação completa"

# 4. Deploy automático no Vercel (staging)
# Aguardar preview deploy

# 5. Testar URL de preview
```

### Manual

```bash
# 1. Build
npm run build

# 2. Verificar sem erros
# Build deve completar com sucesso

# 3. Deploy
npm run deploy # ou comando específico do seu setup
```

---

## Passo 6: Testes E2E (30 min)

```bash
# 1. Atualizar URL no teste
# e2e/settings-productivity.spec.ts
# Linha 6: Alterar para URL de staging

# 2. Rodar testes
npm run test:e2e -- e2e/settings-productivity.spec.ts

# 3. Verificar relatório
npm run test:e2e:report

# 4. Todos os testes devem passar
# Se falhar, revisar e corrigir
```

---

## Passo 7: Deploy Produção (15 min)

### Checklist Final
- [x] Testes E2E passando
- [x] Sem erros no console
- [x] Auto-save funcionando
- [x] Dados persistindo
- [x] RLS policies ativas
- [x] Menu atualizado
- [x] Aprovação do PM/Stakeholder

### Deploy

```bash
# 1. Merge PR
gh pr merge --squash

# 2. Deploy para main
git checkout main
git pull
git push

# 3. Vercel deploy automático
# Ou comando manual de deploy

# 4. Verificar em produção
open https://seu-dominio.com/configuracoes/produtividade
```

---

## Passo 8: Monitoramento (15 min)

### Configurar Alerts

```typescript
// src/lib/monitoring.ts
import * as Sentry from '@sentry/nextjs'

// Adicionar tags para settings
Sentry.setTag('feature', 'productivity-settings')

// Em caso de erro
Sentry.captureException(error, {
  tags: {
    component: 'ImportSettings',
    action: 'save',
  },
})
```

### Analytics

```typescript
// src/lib/analytics.ts
import { analytics } from '@/lib/analytics'

// Rastrear uso
analytics.track('settings_viewed', {
  tab: 'import',
  user_id: userId,
})

analytics.track('settings_saved', {
  type: 'import',
  user_id: userId,
})
```

---

## Passo 9: Comunicação (30 min)

### Email para Usuários

```
Assunto: 🚀 Nova Feature: Configure tudo em um lugar!

Olá!

Temos uma novidade incrível para você: a página de Configurações de Produtividade!

Agora você pode configurar:
✅ Importações (mapeamento de colunas)
✅ Notificações (quando e como receber)
✅ Workflows (aprovadores e SLAs)
✅ Relatórios (formatos e favoritos)

Tudo em um único lugar!

[Acessar Configurações] → /configuracoes/produtividade

Dúvidas? Assista o vídeo tutorial: [link]

Equipe RH System
```

### Post no Sistema

```markdown
🎉 Nova Feature Disponível!

Configure suas preferências de produtividade em um único lugar.

[Ver Tutorial] [Acessar Agora]
```

---

## Passo 10: Monitorar Primeiros Dias (Ongoing)

### Métricas para Acompanhar

```sql
-- Supabase SQL Editor

-- 1. Quantos usuários acessaram?
SELECT COUNT(DISTINCT user_id) as unique_users
FROM analytics_events
WHERE event_name = 'settings_viewed'
AND created_at > NOW() - INTERVAL '7 days';

-- 2. Quais configurações mais usadas?
SELECT
  properties->>'type' as setting_type,
  COUNT(*) as saves
FROM analytics_events
WHERE event_name = 'settings_saved'
AND created_at > NOW() - INTERVAL '7 days'
GROUP BY setting_type
ORDER BY saves DESC;

-- 3. Algum erro frequente?
SELECT
  error_message,
  COUNT(*) as occurrences
FROM error_logs
WHERE component = 'productivity-settings'
AND created_at > NOW() - INTERVAL '7 days'
GROUP BY error_message
ORDER BY occurrences DESC;
```

### Sentry Dashboard
- Verificar error rate diariamente
- Meta: <0.1% error rate

### Google Analytics
- Pageviews de /configuracoes/produtividade
- Meta: 60% dos usuários ativos em 1 semana

---

## Rollback (Se necessário)

### Rollback Rápido

```bash
# 1. Vercel
# Dashboard → Deployments → Promote previous deployment

# 2. Ou via CLI
vercel rollback

# 3. Verificar
open https://seu-dominio.com
```

### Rollback Completo

```bash
# 1. Revert commit
git revert HEAD
git push

# 2. Deploy automático
# Vercel detecta push e redeploy

# 3. Opcional: Desabilitar via feature flag
# Se implementado
```

---

## Troubleshooting

### Erro: "Cannot read property 'uid' of null"
**Causa**: Auth não configurado
**Solução**: Implementar useAuth() conforme Passo 1

### Erro: "relation 'company_settings' does not exist"
**Causa**: Migration não rodada
**Solução**: Executar SQL do Passo 2

### Erro: "Row level security policy violation"
**Causa**: RLS policies não configuradas
**Solução**: Verificar policies no Passo 2

### Auto-save não funciona
**Causa**: Debounce não importado corretamente
**Solução**: Verificar import em page.tsx

### Toast não aparece
**Causa**: Toaster não adicionado ao layout
**Solução**: Adicionar `<Toaster />` no layout principal

---

## Tempo Total Estimado

- Passo 1 (useAuth): 30 min
- Passo 2 (Migrations): 30 min
- Passo 3 (Menu): 15 min
- Passo 4 (Teste local): 15 min
- Passo 5 (Staging): 30 min
- Passo 6 (E2E): 30 min
- Passo 7 (Produção): 15 min
- Passo 8 (Monitoring): 15 min
- Passo 9 (Comunicação): 30 min
- Passo 10 (Monitorar): Ongoing

**Total: ~3h30min** (sem contar monitoramento)

---

## Suporte

**Dúvidas durante deploy?**
- Consulte README_SETTINGS.md
- Verifique INTEGRATION_SETTINGS.md
- Revise logs do Vercel/Supabase

**Sucesso!** 🎉
