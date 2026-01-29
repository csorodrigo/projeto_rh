# Setup Guide - Fase 8: Diferenciação

Este guia contém instruções passo a passo para configurar todos os módulos da Fase 8.

## Pré-requisitos

- Node.js 18+ instalado
- Conta Supabase ativa
- Conta OpenAI (para chatbot com IA)
- Domínio com HTTPS (para PWA em produção)

## 1. Instalação de Dependências

### 1.1 Dependências Principais

As dependências já devem estar no `package.json`. Instale com:

```bash
npm install
```

### 1.2 Dependências Específicas da Fase 8

Verifique se estas estão instaladas:

```json
{
  "@xyflow/react": "^12.10.0",       // Organogram
  "recharts": "^2.15.0",              // Analytics charts
  "jspdf": "^4.0.0",                  // PDF export
  "jspdf-autotable": "^5.0.7",        // Tables in PDF
  "xlsx": "^0.18.5"                   // Excel export
}
```

Se faltar alguma:

```bash
npm install @xyflow/react recharts jspdf jspdf-autotable xlsx
```

### 1.3 Dependências de Desenvolvimento

```bash
npm install -D @types/node
```

## 2. Configuração de Variáveis de Ambiente

### 2.1 Copiar arquivo de exemplo

```bash
cp .env.example .env.local
```

### 2.2 Configurar variáveis existentes

```env
# Supabase (já deve estar configurado)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2.3 Adicionar variáveis da Fase 8

```env
# ============================================
# FASE 8 - DIFERENCIAÇÃO
# ============================================

# PWA Configuration
NEXT_PUBLIC_PWA_ENABLED=true

# AI/Chatbot Configuration
OPENAI_API_KEY=sk-proj-...
AI_MODEL=gpt-4
CHATBOT_ENABLED=true
NEXT_PUBLIC_CHATBOT_ENABLED=true

# Analytics Configuration
ANALYTICS_ENABLED=true
NEXT_PUBLIC_ANALYTICS_ENABLED=true

# Push Notifications (opcional - pode deixar desabilitado)
NEXT_PUBLIC_PUSH_NOTIFICATIONS_ENABLED=false
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Feature Flags
NEXT_PUBLIC_ORGANOGRAM_ENABLED=true
NEXT_PUBLIC_PREDICTIONS_ENABLED=true

# Benchmark API (opcional)
BENCHMARK_API_KEY=
```

### 2.4 Obter OpenAI API Key

1. Acesse https://platform.openai.com/api-keys
2. Crie uma nova API key
3. Copie a chave (começa com `sk-`)
4. Cole em `OPENAI_API_KEY`

**Importante**: A OpenAI cobra por uso. Configure limites de gastos!

### 2.5 Gerar VAPID Keys (Opcional)

Se quiser habilitar push notifications:

```bash
# Instalar web-push globalmente
npm install -g web-push

# Gerar VAPID keys
web-push generate-vapid-keys
```

Copie as chaves geradas para as variáveis `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY`.

## 3. Configuração do Supabase

### 3.1 Storage Buckets

Criar buckets para exports:

1. Acesse o Supabase Dashboard
2. Vá em Storage
3. Crie os seguintes buckets:

**Bucket: analytics-exports**
```sql
-- Configurar política de acesso
CREATE POLICY "Usuários podem fazer upload de exports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'analytics-exports' AND auth.uid() = owner);

CREATE POLICY "Usuários podem baixar seus exports"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'analytics-exports' AND auth.uid() = owner);
```

**Bucket: organogram-exports**
```sql
CREATE POLICY "Usuários podem fazer upload de organogramas"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'organogram-exports' AND auth.uid() = owner);

CREATE POLICY "Usuários podem baixar seus organogramas"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'organogram-exports' AND auth.uid() = owner);
```

### 3.2 Índices para Performance

Execute no SQL Editor do Supabase:

```sql
-- Índices para Analytics (melhorar performance de queries)

-- Time entries por empresa e data
CREATE INDEX IF NOT EXISTS idx_time_entries_analytics
ON time_entries(company_id, entry_date DESC)
WHERE deleted_at IS NULL;

-- Absences por empresa e período
CREATE INDEX IF NOT EXISTS idx_absences_analytics
ON absences(company_id, start_date, end_date, status)
WHERE deleted_at IS NULL;

-- Employees por empresa e status
CREATE INDEX IF NOT EXISTS idx_employees_analytics
ON employees(company_id, status, hire_date)
WHERE deleted_at IS NULL;

-- Employees por manager (para organograma)
CREATE INDEX IF NOT EXISTS idx_employees_manager
ON employees(company_id, manager_id)
WHERE deleted_at IS NULL AND status = 'active';
```

### 3.3 Funções de Banco (opcional)

Funções auxiliares para analytics:

```sql
-- Função para calcular headcount em uma data
CREATE OR REPLACE FUNCTION get_headcount_at_date(
  p_company_id UUID,
  p_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM employees
    WHERE company_id = p_company_id
      AND hire_date <= p_date
      AND (termination_date IS NULL OR termination_date > p_date)
      AND deleted_at IS NULL
  );
END;
$$;

-- Função para calcular taxa de turnover
CREATE OR REPLACE FUNCTION calculate_turnover_rate(
  p_company_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_terminations INTEGER;
  v_avg_headcount DECIMAL;
  v_rate DECIMAL;
BEGIN
  -- Contar demissões no período
  SELECT COUNT(*) INTO v_terminations
  FROM employees
  WHERE company_id = p_company_id
    AND termination_date BETWEEN p_start_date AND p_end_date
    AND deleted_at IS NULL;

  -- Calcular headcount médio
  SELECT AVG(headcount)::DECIMAL INTO v_avg_headcount
  FROM (
    SELECT get_headcount_at_date(p_company_id, date) as headcount
    FROM generate_series(p_start_date, p_end_date, '1 month'::interval) date
  ) monthly_headcount;

  -- Calcular taxa
  IF v_avg_headcount > 0 THEN
    v_rate := (v_terminations / v_avg_headcount) * 100;
  ELSE
    v_rate := 0;
  END IF;

  RETURN ROUND(v_rate, 2);
END;
$$;
```

## 4. Configuração do PWA

### 4.1 Verificar Arquivos PWA

Certifique-se de que existem na pasta `public/`:

```
public/
├── manifest.json       ✓
├── sw.js              ✓
├── icon-192.png       ✓
├── icon-512.png       ✓
└── favicon.ico        ✓
```

### 4.2 Registrar Service Worker

O Service Worker é registrado automaticamente no layout principal.

Verificar se existe em `src/app/layout.tsx`:

```typescript
// Registrar Service Worker
useEffect(() => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => console.log('SW registered'))
      .catch(err => console.error('SW registration failed', err))
  }
}, [])
```

### 4.3 Configurar Headers (next.config.ts)

Adicionar headers para PWA:

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ]
  },
}
```

## 5. Teste de Instalação Local

### 5.1 Iniciar servidor de desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

### 5.2 Verificar PWA (Chrome DevTools)

1. Abrir DevTools (F12)
2. Ir em "Application"
3. Verificar:
   - [ ] Manifest aparece
   - [ ] Service Worker registrado
   - [ ] Cache storage criado
   - [ ] IndexedDB criado

### 5.3 Testar Chatbot

1. Verificar se widget aparece no canto inferior direito
2. Clicar no ícone de chat
3. Enviar mensagem de teste
4. Verificar resposta

**Troubleshooting**:
- Se não responder: verificar OPENAI_API_KEY
- Se erro de CORS: verificar configuração do Supabase
- Se timeout: verificar rate limits da OpenAI

### 5.4 Testar Analytics

1. Ir em `/analytics` ou criar a rota
2. Verificar KPIs carregando
3. Verificar gráficos renderizando
4. Testar filtros de período

**Troubleshooting**:
- Se lento: criar índices no banco
- Se vazio: adicionar dados de teste
- Se erro: verificar permissões RLS

### 5.5 Testar Organograma

1. Ir em `/funcionarios/organograma`
2. Verificar estrutura renderizando
3. Testar drag & drop (se implementado)
4. Testar export (PNG/PDF)

## 6. Dados de Teste

### 6.1 Criar Funcionários de Teste

```sql
-- Inserir CEO
INSERT INTO employees (
  company_id, first_name, last_name, email, position,
  department, hire_date, status, manager_id
) VALUES (
  'sua-company-uuid',
  'Ana',
  'Silva',
  'ana.silva@empresa.com',
  'CEO',
  'Diretoria',
  '2020-01-01',
  'active',
  NULL
);

-- Inserir Gerentes (reportam ao CEO)
INSERT INTO employees (
  company_id, first_name, last_name, email, position,
  department, hire_date, status, manager_id
) VALUES
(
  'sua-company-uuid',
  'Carlos',
  'Santos',
  'carlos.santos@empresa.com',
  'CTO',
  'Tecnologia',
  '2020-03-01',
  'active',
  (SELECT id FROM employees WHERE email = 'ana.silva@empresa.com')
),
(
  'sua-company-uuid',
  'Maria',
  'Costa',
  'maria.costa@empresa.com',
  'CFO',
  'Financeiro',
  '2020-02-01',
  'active',
  (SELECT id FROM employees WHERE email = 'ana.silva@empresa.com')
);

-- Inserir Funcionários (reportam aos gerentes)
INSERT INTO employees (
  company_id, first_name, last_name, email, position,
  department, hire_date, status, manager_id
) VALUES
(
  'sua-company-uuid',
  'João',
  'Oliveira',
  'joao.oliveira@empresa.com',
  'Desenvolvedor Senior',
  'Tecnologia',
  '2021-01-15',
  'active',
  (SELECT id FROM employees WHERE email = 'carlos.santos@empresa.com')
),
(
  'sua-company-uuid',
  'Paula',
  'Ferreira',
  'paula.ferreira@empresa.com',
  'Analista Financeiro',
  'Financeiro',
  '2021-06-01',
  'active',
  (SELECT id FROM employees WHERE email = 'maria.costa@empresa.com')
);
```

### 6.2 Criar Registros de Ponto de Teste

```sql
-- Inserir registros dos últimos 7 dias
INSERT INTO time_entries (
  company_id, employee_id, entry_date, clock_in, clock_out,
  total_hours, status
)
SELECT
  e.company_id,
  e.id,
  date,
  date + time '09:00',
  date + time '18:00',
  8.0,
  'approved'
FROM employees e
CROSS JOIN generate_series(
  CURRENT_DATE - interval '7 days',
  CURRENT_DATE - interval '1 day',
  '1 day'::interval
) date
WHERE e.status = 'active'
  AND EXTRACT(DOW FROM date) NOT IN (0, 6); -- Não criar em fins de semana
```

### 6.3 Criar Ausências de Teste

```sql
INSERT INTO absences (
  company_id, employee_id, type, start_date, end_date,
  days, status, reason
)
SELECT
  e.company_id,
  e.id,
  'vacation',
  CURRENT_DATE + interval '15 days',
  CURRENT_DATE + interval '25 days',
  10,
  'approved',
  'Férias programadas'
FROM employees e
WHERE e.status = 'active'
LIMIT 3;
```

## 7. Deploy em Produção

### 7.1 Build

```bash
npm run build
```

Verificar se build completa sem erros.

### 7.2 Configurar Variáveis de Ambiente na Vercel

1. Ir em Project Settings > Environment Variables
2. Adicionar todas as variáveis do `.env.local`
3. Especialmente importante:
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_PWA_ENABLED=true`
   - URLs corretas de produção

### 7.3 Deploy

```bash
# Se usando Vercel
vercel --prod

# Ou via Git (push para main)
git add .
git commit -m "feat: Add Fase 8 - Diferenciação"
git push origin main
```

### 7.4 Verificar PWA em Produção

**IMPORTANTE**: PWA só funciona em HTTPS!

1. Acesse seu domínio (https://...)
2. Abrir DevTools > Application
3. Verificar:
   - [ ] Manifest válido
   - [ ] Service Worker ativo
   - [ ] Installable (deve mostrar botão de instalar)

### 7.5 Testar Instalação

**Desktop (Chrome)**:
1. Clicar no ícone de instalação na barra de endereço
2. Clicar em "Instalar"
3. App abre em janela standalone

**Mobile (Android/iOS)**:
1. Abrir no navegador
2. Menu > "Add to Home Screen"
3. Ícone aparece na home screen

### 7.6 Testar Offline

1. Instalar o app
2. Abrir DevTools > Network
3. Marcar "Offline"
4. Recarregar app
5. Verificar que continua funcionando

## 8. Configurações Avançadas

### 8.1 Rate Limiting

Para evitar abuso do chatbot:

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

export const chatbotRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
})
```

Adicionar ao `.env.local`:
```env
UPSTASH_REDIS_URL=...
UPSTASH_REDIS_TOKEN=...
```

### 8.2 Caching de Analytics

Configurar cache para melhorar performance:

```typescript
// src/lib/cache.ts
import { unstable_cache } from 'next/cache'

export const getCachedAnalytics = unstable_cache(
  async (companyId: string, period: string) => {
    return await calculateAnalytics(companyId, period)
  },
  ['analytics-dashboard'],
  {
    revalidate: 300, // 5 minutos
    tags: ['analytics']
  }
)
```

### 8.3 Background Jobs

Para cálculos pesados de analytics:

```typescript
// src/lib/cron/analytics.ts
import cron from 'node-cron'

// Calcular analytics diariamente às 2h da manhã
cron.schedule('0 2 * * *', async () => {
  console.log('Calculando analytics...')
  await calculateDailyInsights()
  await updateBenchmarks()
})
```

### 8.4 Monitoring

Configurar Sentry (opcional):

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
})
```

## 9. Checklist Final

### Antes de ir para produção:

- [ ] Todas as variáveis de ambiente configuradas
- [ ] OpenAI API key válida e com crédito
- [ ] Índices de banco criados
- [ ] Storage buckets criados
- [ ] Service Worker registrando
- [ ] Manifest válido
- [ ] HTTPS configurado
- [ ] Build sem erros
- [ ] Testes manuais passando
- [ ] Rate limiting configurado
- [ ] Monitoring configurado
- [ ] Backup do banco

### Testes de Produção:

- [ ] PWA instalável
- [ ] PWA funciona offline
- [ ] Push notifications chegando (se habilitado)
- [ ] Chatbot respondendo
- [ ] Analytics carregando rápido (<3s)
- [ ] Organograma renderizando
- [ ] Exports funcionando
- [ ] Mobile responsivo

## 10. Suporte e Troubleshooting

### Logs para verificar:

```bash
# Logs do Vercel
vercel logs

# Logs do Supabase
# Ir em Dashboard > Logs > API
```

### Comandos úteis:

```bash
# Limpar cache do Next.js
rm -rf .next

# Limpar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install

# Verificar Service Worker
# DevTools > Application > Service Workers > Unregister
```

### Contatos:

- Suporte Supabase: https://supabase.com/support
- OpenAI Status: https://status.openai.com
- Vercel Status: https://vercel-status.com

## Conclusão

Após seguir este guia, você terá:

- ✅ PWA instalável e funcional
- ✅ Organograma visual interativo
- ✅ Analytics dashboard completo
- ✅ Chatbot com IA respondendo

**Próximo passo**: Ler o [GUIA_USUARIO_FASE8.md](./GUIA_USUARIO_FASE8.md) para entender como usar as funcionalidades.
