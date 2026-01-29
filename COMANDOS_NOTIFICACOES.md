# 🛠️ Comandos Úteis - Sistema de Notificações

Cheat sheet com comandos úteis para trabalhar com o sistema de notificações.

## 🚀 Setup Inicial

```bash
# 1. Instalar dependências (já feito)
npm install resend date-fns-tz @radix-ui/react-scroll-area

# 2. Gerar CRON_SECRET
openssl rand -base64 32

# 3. Copiar .env.example para .env.local
cp .env.example .env.local

# 4. Editar .env.local com suas credenciais
code .env.local
```

## 🗄️ Database / Supabase

```bash
# Conectar ao projeto Supabase
supabase link --project-ref your-project-ref

# Aplicar migration
supabase db push

# Verificar status
supabase db status

# Reset database (cuidado!)
supabase db reset

# Rodar migration específica
supabase db push supabase/migrations/014_notifications.sql
```

## 🧪 Testes

### Testar Cron Job Local

```bash
# Método 1: cURL
curl -X GET "http://localhost:3000/api/cron/notifications" \
  -H "Authorization: Bearer your-cron-secret-here"

# Método 2: HTTPie (mais bonito)
http GET localhost:3000/api/cron/notifications \
  Authorization:"Bearer your-cron-secret-here"

# Método 3: Com jq para formatar JSON
curl -X GET "http://localhost:3000/api/cron/notifications" \
  -H "Authorization: Bearer your-cron-secret" | jq
```

### Testar Envio de Email

```bash
# Criar arquivo de teste
cat > test-email.ts << 'EOF'
import { NotificationEngine } from './src/lib/notifications';

async function test() {
  const engine = new NotificationEngine();

  await engine.sendNotification({
    companyId: 'test-company',
    userId: 'test-user',
    type: 'birthday',
    priority: 'low',
    title: 'Teste de Email',
    message: 'Email de teste do sistema',
    metadata: {
      employeeName: 'João Silva',
      employeePosition: 'Desenvolvedor',
    },
    sendEmail: true,
    emailTo: 'seu-email@teste.com',
  });

  console.log('✅ Email enviado!');
}

test();
EOF

# Executar teste
npx tsx test-email.ts
```

### Testar Verificação Específica

```typescript
// Criar test-check.ts
import { NotificationEngine } from './src/lib/notifications';

async function testCheck() {
  const engine = new NotificationEngine();

  // Escolher verificação para testar
  await engine.checkBirthdays();
  // await engine.checkAnniversaries();
  // await engine.checkVacationExpiring();
  // await engine.checkPendingAbsences();
  // await engine.checkMissingTimeRecords();
  // await engine.checkComplianceViolations();

  console.log('✅ Verificação completa!');
}

testCheck();
```

```bash
npx tsx test-check.ts
```

## 🔍 Debugging

### Ver Logs em Desenvolvimento

```bash
# Terminal 1: Rodar Next.js com logs
npm run dev

# Terminal 2: Fazer request
curl http://localhost:3000/api/cron/notifications \
  -H "Authorization: Bearer your-cron-secret"

# Logs aparecem no Terminal 1
```

### Ver Logs no Vercel (Produção)

```bash
# Via CLI
vercel logs

# Logs em tempo real
vercel logs --follow

# Logs de deployment específico
vercel logs [deployment-url]

# Filtrar por função
vercel logs --function api/cron/notifications
```

### Inspecionar Banco de Dados

```sql
-- Ver todas as notificações
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;

-- Ver notificações não lidas
SELECT * FROM notifications WHERE read = false;

-- Contar por tipo
SELECT type, COUNT(*) as total
FROM notifications
GROUP BY type
ORDER BY total DESC;

-- Ver preferências
SELECT * FROM notification_preferences;

-- Ver logs de envio
SELECT * FROM notification_logs ORDER BY sent_at DESC LIMIT 10;

-- Estatísticas por usuário
SELECT * FROM notification_stats;

-- Ver notificações de hoje
SELECT * FROM notifications
WHERE created_at >= CURRENT_DATE;

-- Limpar notificações antigas
DELETE FROM notifications
WHERE read = true
AND created_at < NOW() - INTERVAL '30 days';
```

## 📊 Queries Úteis

### SQL para Troubleshooting

```sql
-- Verificar se RLS está ativo
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('notifications', 'notification_preferences');

-- Ver policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'notifications';

-- Verificar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'notifications';

-- Ver triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'notifications';

-- Estatísticas de performance
SELECT
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables
WHERE tablename IN ('notifications', 'notification_preferences');
```

## 🔧 Manutenção

### Arquivar Notificações Antigas

```sql
-- Via função (recomendado)
SELECT archive_old_notifications();

-- Manual
UPDATE notifications
SET archived = true, archived_at = NOW()
WHERE read = true
AND created_at < NOW() - INTERVAL '30 days';
```

### Limpar Logs Antigos

```sql
-- Deletar logs com mais de 90 dias
DELETE FROM notification_logs
WHERE sent_at < NOW() - INTERVAL '90 days';

-- Ou manter apenas últimos 10000 registros
DELETE FROM notification_logs
WHERE id NOT IN (
  SELECT id FROM notification_logs
  ORDER BY sent_at DESC
  LIMIT 10000
);
```

### Reset de Preferências

```sql
-- Resetar preferências de um usuário
UPDATE notification_preferences
SET
  enable_in_app = true,
  enable_email = true,
  notify_birthdays = true,
  notify_work_anniversaries = true,
  notify_vacation_expiring = true,
  notify_absences = true,
  notify_time_tracking = true,
  notify_compliance = true,
  notify_documents = true,
  notify_payroll = true,
  notify_system = true
WHERE user_id = 'user-id-here';
```

## 🚀 Deploy

### Vercel

```bash
# Deploy para preview
vercel

# Deploy para produção
vercel --prod

# Ver deployments
vercel ls

# Ver logs do último deployment
vercel logs

# Adicionar variável de ambiente
vercel env add RESEND_API_KEY
vercel env add CRON_SECRET
vercel env add EMAIL_FROM

# Listar variáveis
vercel env ls
```

### Variáveis de Ambiente no Vercel

```bash
# Via CLI
vercel env add RESEND_API_KEY production
# Cole o valor quando solicitado

# Ou via Dashboard:
# 1. Acessar projeto no Vercel
# 2. Settings → Environment Variables
# 3. Add new: RESEND_API_KEY, CRON_SECRET, EMAIL_FROM
```

## 📧 Resend

### Comandos Resend CLI (opcional)

```bash
# Instalar CLI
npm install -g resend

# Login
resend login

# Listar emails enviados
resend emails list

# Ver detalhes de um email
resend emails get <email-id>

# Testar API Key
resend test
```

### cURL para Resend API

```bash
# Enviar email de teste direto via API
curl -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer re_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "seu-email@teste.com",
    "subject": "Teste Resend",
    "html": "<strong>Funciona!</strong>"
  }'
```

## 🔄 Git

```bash
# Commit das mudanças
git add .
git commit -m "feat: Implementar sistema completo de notificações

- NotificationEngine com 6 verificações automáticas
- Email sender com Resend
- 9+ templates HTML responsivos
- NotificationBell component com realtime
- Centro de notificações completo
- Página de preferências
- Cron job para execução automática
- Database schema com RLS
- Documentação completa"

# Push
git push origin main

# Criar tag de release
git tag -a v1.0.0-notifications -m "Sistema de notificações v1.0.0"
git push origin v1.0.0-notifications
```

## 📦 NPM Scripts Personalizados

Adicionar ao `package.json`:

```json
{
  "scripts": {
    "test:email": "tsx scripts/test-email.ts",
    "test:cron": "tsx scripts/test-cron.ts",
    "db:migrate": "supabase db push",
    "db:reset": "supabase db reset",
    "logs:dev": "npm run dev | grep -i notification",
    "logs:prod": "vercel logs --function api/cron/notifications"
  }
}
```

Usar:
```bash
npm run test:email
npm run test:cron
npm run db:migrate
npm run logs:dev
```

## 🎯 Checklist Diário

```bash
# Manhã: Verificar execução do cron das 8h
vercel logs --function api/cron/notifications --since 8h

# Ver notificações enviadas hoje
# SQL no Supabase Dashboard
SELECT type, COUNT(*) as sent_today
FROM notifications
WHERE created_at >= CURRENT_DATE
GROUP BY type;

# Verificar erros de email
SELECT * FROM notification_logs
WHERE status = 'failed'
AND sent_at >= CURRENT_DATE;

# Tarde: Verificar execução do cron das 18h
vercel logs --function api/cron/notifications --since 18h
```

## 🐛 Debug Common Issues

```bash
# Email não envia - Verificar API Key
echo $RESEND_API_KEY
# Se vazio, adicionar ao .env.local

# Cron retorna 401
echo $CRON_SECRET
# Deve existir e ser o mesmo no .env.local e Vercel

# Notificações não aparecem - Verificar migration
supabase db status
# Deve mostrar migration 014_notifications aplicada

# Realtime não funciona - Testar conexão
# No browser console:
const { data, error } = await supabase
  .channel('test')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'notifications'
  }, console.log)
  .subscribe()

# Ver status do canal
console.log(data)
```

## 📱 Comandos Mobile

```bash
# Testar em dispositivo móvel (ngrok)
ngrok http 3000
# Usar URL gerada para acessar do celular

# Ou usar IP local
# 1. Descobrir IP local
ipconfig getifaddr en0  # Mac
# ou
hostname -I  # Linux

# 2. Acessar de dispositivo na mesma rede
# http://192.168.x.x:3000
```

## 🎨 Customização Rápida

```bash
# Alterar cores de um tipo de notificação
# Editar: src/components/notifications/NotificationBell.tsx
# Linha ~15-30: notificationColors

# Adicionar novo template de email
# Editar: src/lib/notifications/templates/notification-templates.ts
# Adicionar nova função + adicionar no switch

# Mudar horário do cron
# Editar: vercel.json
# Linha 5: schedule
# Formato cron: "minuto hora dia mês dia-da-semana"
# Exemplo: "0 9,17 * * *" = 9h e 17h todos os dias
```

---

## 📚 Recursos Adicionais

- **Cron Format**: https://crontab.guru/
- **Resend API**: https://resend.com/docs/api-reference/emails/send-email
- **Supabase SQL**: https://supabase.com/docs/guides/database
- **Vercel Logs**: https://vercel.com/docs/observability/runtime-logs

---

**Dica**: Salve este arquivo nos seus favoritos para acesso rápido! 🔖
