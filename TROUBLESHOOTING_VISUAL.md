# 🔧 Troubleshooting Visual - Sistema de Notificações

Guia visual para diagnóstico rápido de problemas.

---

## 🚨 Problema: "Emails não estão sendo enviados"

### Diagnóstico

```
┌─────────────────────────────────────┐
│ 1. RESEND_API_KEY configurada?     │
└─────────────────────────────────────┘
          │
          ├─ SIM ──→ ┌───────────────────────────┐
          │          │ 2. API Key válida?        │
          │          └───────────────────────────┘
          │                    │
          │                    ├─ SIM ──→ ┌─────────────────────────┐
          │                    │          │ 3. Domínio verificado?  │
          │                    │          │ (apenas produção)       │
          │                    │          └─────────────────────────┘
          │                    │                    │
          │                    │                    ├─ SIM ──→ ✅ Deve funcionar
          │                    │                    │
          │                    │                    └─ NÃO ──→ ⚠️ Verificar domínio no Resend
          │                    │
          │                    └─ NÃO ──→ ❌ Gerar nova API Key
          │
          └─ NÃO ──→ ❌ Adicionar RESEND_API_KEY ao .env.local
```

### Solução Passo a Passo

```bash
# Passo 1: Verificar se existe
echo $RESEND_API_KEY

# Se vazio:
# 1. Acessar https://resend.com/api-keys
# 2. Criar nova API Key
# 3. Copiar e adicionar ao .env.local:
RESEND_API_KEY=re_xxxxxxxxxxxxx

# 4. Reiniciar servidor
npm run dev
```

### Teste Rápido

```bash
# Testar diretamente via cURL
curl -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "seu-email@teste.com",
    "subject": "Teste",
    "html": "<p>Funciona!</p>"
  }'

# Se retornar 200 OK → API Key válida ✅
# Se retornar 401 → API Key inválida ❌
```

---

## 🚨 Problema: "Cron job retorna 401 Unauthorized"

### Diagnóstico

```
┌─────────────────────────────────────┐
│ 1. CRON_SECRET existe?              │
└─────────────────────────────────────┘
          │
          ├─ SIM ──→ ┌─────────────────────────────────┐
          │          │ 2. Mesmo valor no .env.local    │
          │          │    e na request?                │
          │          └─────────────────────────────────┘
          │                    │
          │                    ├─ SIM ──→ ✅ Deve funcionar
          │                    │
          │                    └─ NÃO ──→ ⚠️ Sincronizar valores
          │
          └─ NÃO ──→ ❌ Gerar CRON_SECRET
```

### Solução

```bash
# Passo 1: Gerar secret seguro
CRON_SECRET=$(openssl rand -base64 32)
echo $CRON_SECRET

# Passo 2: Adicionar ao .env.local
echo "CRON_SECRET=$CRON_SECRET" >> .env.local

# Passo 3: Adicionar ao Vercel (produção)
vercel env add CRON_SECRET production
# Colar o mesmo valor quando solicitado

# Passo 4: Testar
curl http://localhost:3000/api/cron/notifications \
  -H "Authorization: Bearer $CRON_SECRET"

# Deve retornar:
# { "success": true, "message": "Notification checks completed", ... }
```

---

## 🚨 Problema: "Notificações não aparecem no sino"

### Diagnóstico

```
┌────────────────────────────────────┐
│ 1. Migration aplicada?             │
└────────────────────────────────────┘
          │
          ├─ SIM ──→ ┌────────────────────────────────┐
          │          │ 2. Notificações existem no DB? │
          │          └────────────────────────────────┘
          │                    │
          │                    ├─ SIM ──→ ┌──────────────────────────┐
          │                    │          │ 3. userId correto?       │
          │                    │          └──────────────────────────┘
          │                    │                    │
          │                    │                    ├─ SIM ──→ ┌─────────────────┐
          │                    │                    │          │ 4. RLS ativo?   │
          │                    │                    │          └─────────────────┘
          │                    │                    │                    │
          │                    │                    │                    ├─ SIM ──→ ✅ Verificar policies
          │                    │                    │                    │
          │                    │                    │                    └─ NÃO ──→ ⚠️ Ativar RLS
          │                    │                    │
          │                    │                    └─ NÃO ──→ ❌ Passar userId correto
          │                    │
          │                    └─ NÃO ──→ ❌ Criar notificações de teste
          │
          └─ NÃO ──→ ❌ Aplicar migration
```

### Solução

```sql
-- Passo 1: Verificar se tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'notifications'
);
-- Deve retornar: true

-- Passo 2: Verificar se há notificações
SELECT COUNT(*) FROM notifications;
-- Se 0, criar notificação de teste

-- Passo 3: Criar notificação de teste
INSERT INTO notifications (
  company_id,
  user_id,
  type,
  priority,
  title,
  message
) VALUES (
  'your-company-id',
  'your-user-id',
  'system',
  'medium',
  'Teste de Notificação',
  'Esta é uma notificação de teste'
);

-- Passo 4: Verificar RLS
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'notifications';
-- rowsecurity deve ser TRUE

-- Passo 5: Verificar policies
SELECT policyname
FROM pg_policies
WHERE tablename = 'notifications';
-- Deve ter pelo menos 3 policies
```

---

## 🚨 Problema: "Realtime não funciona"

### Diagnóstico

```
┌────────────────────────────────────┐
│ 1. Supabase Realtime habilitado?   │
└────────────────────────────────────┘
          │
          ├─ SIM ──→ ┌────────────────────────────────┐
          │          │ 2. Canal subscrito?            │
          │          └────────────────────────────────┘
          │                    │
          │                    ├─ SIM ──→ ┌──────────────────────────┐
          │                    │          │ 3. Filter correto?       │
          │                    │          └──────────────────────────┘
          │                    │                    │
          │                    │                    └─ SIM ──→ ✅ Deve funcionar
          │                    │
          │                    └─ NÃO ──→ ⚠️ Verificar subscription
          │
          └─ NÃO ──→ ❌ Habilitar no Supabase Dashboard
```

### Teste no Console do Browser

```javascript
// Testar conexão Realtime
const channel = supabase
  .channel('test-notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('✅ Nova notificação:', payload);
  })
  .subscribe((status) => {
    console.log('Status do canal:', status);
  });

// Status esperado: 'SUBSCRIBED'

// Criar notificação de teste
const { data, error } = await supabase
  .from('notifications')
  .insert({
    user_id: userId,
    company_id: companyId,
    type: 'system',
    priority: 'medium',
    title: 'Teste Realtime',
    message: 'Se você viu isto no console, funciona!'
  });

// Deve aparecer no console: ✅ Nova notificação: {...}
```

---

## 🚨 Problema: "Cron não executa automaticamente"

### Diagnóstico (Produção)

```
┌────────────────────────────────────┐
│ 1. Deployed na Vercel?             │
└────────────────────────────────────┘
          │
          ├─ SIM ──→ ┌────────────────────────────────┐
          │          │ 2. vercel.json configurado?    │
          │          └────────────────────────────────┘
          │                    │
          │                    ├─ SIM ──→ ┌──────────────────────────┐
          │                    │          │ 3. Cron visível no dash? │
          │                    │          └──────────────────────────┘
          │                    │                    │
          │                    │                    ├─ SIM ──→ ✅ Aguardar horário
          │                    │                    │
          │                    │                    └─ NÃO ──→ ⚠️ Redeploy
          │                    │
          │                    └─ NÃO ──→ ❌ Verificar vercel.json
          │
          └─ NÃO ──→ ❌ Fazer deploy
```

### Verificação

```bash
# 1. Verificar vercel.json
cat vercel.json
# Deve conter:
# {
#   "crons": [{
#     "path": "/api/cron/notifications",
#     "schedule": "0 8,18 * * *"
#   }]
# }

# 2. Verificar se está no dashboard
# Acessar: https://vercel.com/your-team/your-project/settings/cron
# Deve aparecer: /api/cron/notifications - Every day at 8am and 6pm

# 3. Ver última execução
vercel logs --function api/cron/notifications --limit 1

# 4. Forçar execução manual (teste)
curl https://your-app.vercel.app/api/cron/notifications \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## 🚨 Problema: "Performance lenta na página de notificações"

### Diagnóstico

```
┌────────────────────────────────────┐
│ Quantas notificações existem?      │
└────────────────────────────────────┘
          │
          ├─ < 1000 ──→ ✅ Performance normal
          │
          ├─ 1000-10000 ──→ ⚠️ Considerar arquivamento
          │
          └─ > 10000 ──→ ❌ URGENTE: Arquivar antigas
```

### Solução

```sql
-- Ver total de notificações
SELECT COUNT(*) FROM notifications;

-- Ver por usuário
SELECT user_id, COUNT(*) as total
FROM notifications
GROUP BY user_id
ORDER BY total DESC
LIMIT 10;

-- Arquivar notificações antigas (lidas há mais de 30 dias)
UPDATE notifications
SET archived = true, archived_at = NOW()
WHERE read = true
AND read_at < NOW() - INTERVAL '30 days'
AND archived = false;

-- Ou deletar permanentemente (cuidado!)
DELETE FROM notifications
WHERE archived = true
AND archived_at < NOW() - INTERVAL '90 days';

-- Verificar índices
EXPLAIN ANALYZE
SELECT * FROM notifications
WHERE user_id = 'test-user'
AND read = false
AND archived = false
ORDER BY created_at DESC
LIMIT 20;

-- Deve usar índice: idx_notifications_user_read
```

---

## 📊 Dashboard de Saúde do Sistema

### SQL para Status Geral

```sql
-- DASHBOARD DE SAÚDE
SELECT
  '📊 Total de Notificações' as metric,
  COUNT(*)::text as value
FROM notifications

UNION ALL

SELECT
  '📧 Emails Enviados Hoje',
  COUNT(*)::text
FROM notification_logs
WHERE channel = 'email'
AND sent_at >= CURRENT_DATE

UNION ALL

SELECT
  '✅ Taxa de Sucesso Email',
  ROUND(
    COUNT(*) FILTER (WHERE status = 'sent') * 100.0 /
    NULLIF(COUNT(*), 0),
    2
  )::text || '%'
FROM notification_logs
WHERE channel = 'email'
AND sent_at >= CURRENT_DATE

UNION ALL

SELECT
  '🔔 Notificações Não Lidas',
  COUNT(*)::text
FROM notifications
WHERE read = false
AND archived = false

UNION ALL

SELECT
  '👥 Usuários Ativos',
  COUNT(DISTINCT user_id)::text
FROM notifications
WHERE created_at >= NOW() - INTERVAL '7 days'

UNION ALL

SELECT
  '⚡ Notificações por Hora (hoje)',
  ROUND(
    COUNT(*)::numeric /
    NULLIF(EXTRACT(HOUR FROM NOW())::numeric, 0),
    2
  )::text
FROM notifications
WHERE created_at >= CURRENT_DATE;
```

### Gráfico de Performance (ASCII)

```sql
-- Notificações por hora nas últimas 24h
SELECT
  to_char(created_at, 'HH24:00') as hour,
  COUNT(*) as total,
  REPEAT('█', (COUNT(*) / 10)::int) as graph
FROM notifications
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY to_char(created_at, 'HH24:00')
ORDER BY hour;

-- Exemplo de output:
-- hour  | total | graph
-- ------|-------|----------
-- 08:00 |   45  | ████
-- 09:00 |   32  | ███
-- 10:00 |   28  | ██
-- ...
```

---

## 🎯 Checklist de Saúde

### ✅ Sistema Saudável

- [ ] Emails sendo enviados (taxa de sucesso > 95%)
- [ ] Cron executando nos horários corretos
- [ ] Notificações aparecendo no sino
- [ ] Realtime funcionando
- [ ] Performance < 2s na página
- [ ] < 10 notificações não lidas por usuário em média
- [ ] Taxa de erro de email < 5%

### ⚠️ Atenção Necessária

- [ ] Taxa de sucesso email entre 80-95%
- [ ] 10-50 notificações não lidas por usuário
- [ ] Performance 2-5s
- [ ] Alguns erros no log (< 10%)

### 🚨 Ação Urgente

- [ ] Taxa de sucesso email < 80%
- [ ] Cron não executou nas últimas 24h
- [ ] > 50 notificações não lidas por usuário
- [ ] Performance > 5s
- [ ] Muitos erros no log (> 10%)

---

## 📞 Suporte

Se nenhuma solução funcionou:

1. Verificar logs completos: `vercel logs`
2. Testar cada componente individualmente
3. Consultar documentação: `README_NOTIFICATIONS.md`
4. Verificar issues do GitHub do Resend/Supabase
5. Contatar suporte:
   - Resend: support@resend.com
   - Supabase: support@supabase.com
   - Vercel: support@vercel.com

---

**Mantenha este guia sempre à mão para diagnóstico rápido! 🔧**
