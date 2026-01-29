# Sistema de Notificações Automáticas

Sistema completo de notificações automáticas por email e in-app implementado com arquitetura escalável e robusta.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Funcionalidades](#funcionalidades)
- [Configuração](#configuração)
- [Uso](#uso)
- [API Reference](#api-reference)
- [Testes](#testes)
- [Troubleshooting](#troubleshooting)

## 🎯 Visão Geral

O sistema de notificações automatiza o envio de alertas importantes para usuários através de múltiplos canais:

- **In-App**: Notificações em tempo real dentro do sistema
- **Email**: Emails HTML personalizados e responsivos
- **Push Notifications**: (Planejado para futuro)

### Tipos de Notificações

1. **Aniversários** - Lembretes de aniversários de funcionários
2. **Aniversários de Empresa** - Celebrações de tempo de empresa
3. **Férias Vencendo** - Alertas de férias próximas ao vencimento
4. **Ausências Pendentes** - Solicitações aguardando aprovação
5. **Ausências Aprovadas/Rejeitadas** - Feedback de solicitações
6. **Ponto Não Registrado** - Alertas de registros faltantes
7. **Violações de Compliance** - Alertas críticos de conformidade
8. **Documentos Vencendo** - Alertas de documentos expirando
9. **ASO Vencendo** - Lembretes de exames médicos

## 🏗️ Arquitetura

```
src/
├── lib/
│   └── notifications/
│       ├── engine.ts                    # Engine principal de notificações
│       ├── email-sender.ts              # Serviço de envio de emails (Resend)
│       └── templates/
│           ├── base-template.ts         # Template HTML base
│           └── notification-templates.ts # Templates específicos
│
├── components/
│   └── notifications/
│       └── NotificationBell.tsx         # Componente sino no header
│
├── app/
│   ├── (dashboard)/
│   │   ├── notificacoes/
│   │   │   └── page.tsx                # Centro de notificações
│   │   └── configuracoes/
│   │       └── notificacoes/
│   │           └── page.tsx            # Página de preferências
│   └── api/
│       └── cron/
│           └── notifications/
│               └── route.ts            # Cron job API
│
└── lib/
    └── supabase/
        └── queries/
            └── notifications.ts         # Queries Supabase

supabase/
└── migrations/
    └── 014_notifications.sql           # Schema do banco
```

## ✨ Funcionalidades

### 1. Notification Engine

**Arquivo**: `src/lib/notifications/engine.ts`

Engine responsável por verificar e enviar notificações automaticamente:

```typescript
const engine = new NotificationEngine();

// Verificações disponíveis
await engine.checkBirthdays();           // Aniversários amanhã
await engine.checkAnniversaries();       // Aniversários de empresa hoje
await engine.checkVacationExpiring();    // Férias vencendo em 30 dias
await engine.checkPendingAbsences();     // Ausências pendentes há mais de 1 dia
await engine.checkMissingTimeRecords();  // Pontos não registrados (18h)
await engine.checkComplianceViolations(); // Violações críticas
```

**Lógica de cada verificação**:

#### Aniversários (dia anterior)
- Busca funcionários ativos com aniversário amanhã
- Notifica gestores e RH
- Email personalizado com link para perfil

#### Aniversário de Admissão
- Busca funcionários com data de admissão hoje
- Calcula anos de empresa
- Notifica o próprio funcionário
- Email comemorativo

#### Férias Vencendo (30 dias antes)
- Busca saldos de férias com vencimento em até 30 dias
- Notifica funcionário e gestor
- Alerta de urgência se < 15 dias

#### Ausências Pendentes
- Busca ausências em status 'pending'
- Notifica aprovador responsável
- Inclui detalhes completos da solicitação

#### Ponto Não Registrado (18h)
- Verifica registros do dia sem clock_out
- Notifica o funcionário
- Enviado às 18h via cron job

#### Violações de Compliance
- Busca alertas críticos não resolvidos
- Notifica RH e gestores
- Prioridade urgente

### 2. Email Sender

**Arquivo**: `src/lib/notifications/email-sender.ts`

Serviço de envio de emails usando Resend:

```typescript
import { sendEmail } from '@/lib/notifications/email-sender';

const result = await sendEmail({
  to: 'usuario@empresa.com',
  subject: 'Título do Email',
  html: '<html>...</html>',
  replyTo: 'rh@empresa.com',
});

if (result.success) {
  console.log('Email enviado:', result.messageId);
} else {
  console.error('Erro:', result.error);
}
```

**Funcionalidades**:
- Rate limiting automático (100ms entre emails)
- Validação de email
- Tratamento de erros
- Suporte a múltiplos destinatários

### 3. Email Templates

**Arquivo**: `src/lib/notifications/templates/`

Templates HTML responsivos e bonitos:

```typescript
import { getEmailTemplate } from '@/lib/notifications/templates/notification-templates';

const { subject, html } = getEmailTemplate('birthday', {
  employeeName: 'João Silva',
  employeePosition: 'Desenvolvedor',
  date: new Date(),
  link: 'https://app.com/funcionarios/123',
});
```

**Templates disponíveis**:
- `birthday` - Aniversário
- `work_anniversary` - Aniversário de empresa
- `vacation_expiring` - Férias vencendo
- `absence_pending` - Ausência pendente
- `absence_approved` - Ausência aprovada
- `absence_rejected` - Ausência rejeitada
- `time_missing` - Ponto faltante
- `compliance_violation` - Violação de compliance
- E mais...

### 4. Notification Bell

**Arquivo**: `src/components/notifications/NotificationBell.tsx`

Componente React para o sino de notificações no header:

```tsx
import { NotificationBell } from '@/components/notifications/NotificationBell';

<NotificationBell userId={currentUser.id} />
```

**Funcionalidades**:
- Badge com contador de não lidas
- Dropdown com últimas notificações
- Realtime updates via Supabase
- Toast notifications
- Ações inline (marcar como lida, excluir)

### 5. Centro de Notificações

**Arquivo**: `src/app/(dashboard)/notificacoes/page.tsx`

Página completa de notificações:

- Tabs: Todas / Não lidas / Lidas
- Busca de notificações
- Estatísticas (não lidas, total, hoje)
- Paginação (20 por página)
- Ações em massa (marcar todas como lidas)
- Cards visuais por tipo
- Links de ação
- Empty states

### 6. Preferências de Notificações

**Arquivo**: `src/app/(dashboard)/configuracoes/notificacoes/page.tsx`

Interface completa de configurações:

**Canais**:
- In-App
- Email
- Push (futuro)

**Tipos**:
- Toggles individuais para cada tipo de notificação
- Granularidade total

**Email Digest**:
- Agrupar notificações em resumo
- Frequências: instantâneo, horária, diária, semanal
- Horário customizado

**Não Incomodar**:
- Horário de início e fim
- Silencia notificações no período

### 7. Cron Job

**Arquivo**: `src/app/api/cron/notifications/route.ts`

API endpoint para execução automática via Vercel Cron:

```typescript
GET /api/cron/notifications
Authorization: Bearer {CRON_SECRET}
```

**Configuração** (`vercel.json`):
```json
{
  "crons": [{
    "path": "/api/cron/notifications",
    "schedule": "0 8,18 * * *"
  }]
}
```

Executa 2x ao dia:
- **8h** - Verificações matinais (aniversários, férias vencendo)
- **18h** - Verificações noturnas (ponto não registrado)

### 8. Realtime Notifications

Implementado com Supabase Realtime:

```typescript
import { subscribeToNotifications } from '@/lib/supabase/queries/notifications';

const unsubscribe = subscribeToNotifications(userId, (notification) => {
  // Nova notificação recebida
  console.log(notification);
  toast.info(notification.title);
});

// Cleanup
return () => unsubscribe();
```

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Adicione ao `.env.local`:

```bash
# Resend API Key (obrigatório para emails)
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=RH Sistema <noreply@seu-dominio.com>

# Cron Job Secret (obrigatório para segurança)
CRON_SECRET=your-random-secure-secret-here
```

### 2. Configurar Resend

1. Criar conta em [resend.com](https://resend.com)
2. Verificar domínio (necessário para produção)
3. Gerar API Key
4. Adicionar ao `.env.local`

**Desenvolvimento**: Emails são enviados para seu email cadastrado no Resend

**Produção**: Verificar domínio para enviar para qualquer email

### 3. Migration do Banco

Executar migration no Supabase:

```bash
# Conectar ao Supabase
supabase link

# Aplicar migration
supabase db push

# Ou via Dashboard
# Copiar conteúdo de supabase/migrations/014_notifications.sql
# Colar em SQL Editor e executar
```

### 4. Configurar Cron Secret

1. Gerar secret seguro:
```bash
openssl rand -base64 32
```

2. Adicionar no Vercel:
```bash
vercel env add CRON_SECRET
```

3. Ou via Dashboard Vercel:
- Settings → Environment Variables
- Add: CRON_SECRET = {seu-secret}

### 5. Deploy

```bash
# Deploy para Vercel
vercel --prod
```

O cron job será configurado automaticamente via `vercel.json`.

## 🚀 Uso

### Enviar Notificação Manual

```typescript
import { NotificationEngine } from '@/lib/notifications/engine';

const engine = new NotificationEngine();

await engine.sendNotification({
  companyId: 'company-id',
  userId: 'user-id',
  type: 'system',
  priority: 'medium',
  title: 'Título da Notificação',
  message: 'Mensagem completa aqui',
  link: '/caminho/destino',
  actionText: 'Ver detalhes',
  metadata: {
    customField: 'valor',
  },
  sendEmail: true,
  emailTo: 'usuario@empresa.com',
});
```

### Buscar Notificações

```typescript
import {
  getAllNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '@/lib/supabase/queries/notifications';

// Buscar com paginação
const result = await getAllNotifications(userId, page, 20, 'unread');
console.log(result.notifications);

// Contar não lidas
const count = await getUnreadCount(userId);

// Marcar como lida
await markAsRead(notificationId);

// Marcar todas como lidas
await markAllAsRead(userId);
```

### Atualizar Preferências

```typescript
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/lib/supabase/queries/notifications';

// Buscar preferências
const prefs = await getNotificationPreferences(userId);

// Atualizar
await updateNotificationPreferences(userId, {
  enable_email: true,
  notify_birthdays: false,
  email_digest: true,
  email_digest_frequency: 'daily',
});
```

## 📚 API Reference

### NotificationEngine

```typescript
class NotificationEngine {
  // Verificações automáticas
  checkBirthdays(): Promise<void>
  checkAnniversaries(): Promise<void>
  checkVacationExpiring(): Promise<void>
  checkPendingAbsences(): Promise<void>
  checkMissingTimeRecords(): Promise<void>
  checkComplianceViolations(): Promise<void>

  // Enviar notificação
  sendNotification(data: NotificationData): Promise<void>
}
```

### Email Sender

```typescript
// Enviar email único
sendEmail(params: EmailParams): Promise<EmailResult>

// Enviar batch (com rate limiting)
sendBatchEmails(emails: EmailParams[]): Promise<EmailResult[]>

// Validar email
isValidEmail(email: string): boolean
```

### Queries

```typescript
// Buscar
getUnreadNotifications(userId: string): Promise<Notification[]>
getAllNotifications(userId, page, limit, filter): Promise<PaginatedResult>
getUnreadCount(userId: string): Promise<number>
getNotificationStats(userId: string): Promise<Stats>

// Ações
markAsRead(notificationId: string): Promise<void>
markAllAsRead(userId: string): Promise<void>
archiveNotification(notificationId: string): Promise<void>
deleteNotification(notificationId: string): Promise<void>

// Preferências
getNotificationPreferences(userId: string): Promise<NotificationPreferences>
updateNotificationPreferences(userId, prefs): Promise<NotificationPreferences>

// Realtime
subscribeToNotifications(userId, callback): () => void
```

## 🧪 Testes

### Testar Cron Job Localmente

```bash
# Com cURL
curl -X GET "http://localhost:3000/api/cron/notifications" \
  -H "Authorization: Bearer your-cron-secret"

# Ou via Postman/Insomnia
GET http://localhost:3000/api/cron/notifications
Header: Authorization: Bearer your-cron-secret
```

### Testar Envio de Email

```typescript
// Criar arquivo test-email.ts
import { sendEmail } from '@/lib/notifications/email-sender';
import { getEmailTemplate } from '@/lib/notifications/templates/notification-templates';

const { subject, html } = getEmailTemplate('birthday', {
  employeeName: 'João Silva',
  employeePosition: 'Desenvolvedor',
  date: new Date(),
  link: 'https://app.com',
});

const result = await sendEmail({
  to: 'seu-email@teste.com',
  subject,
  html,
});

console.log(result);
```

### Testar Notificações In-App

1. Abrir console do navegador
2. Executar:
```javascript
// Criar notificação de teste
const { data, error } = await supabase
  .from('notifications')
  .insert({
    user_id: 'seu-user-id',
    company_id: 'company-id',
    type: 'system',
    priority: 'medium',
    title: 'Teste',
    message: 'Notificação de teste',
  });
```

## 🐛 Troubleshooting

### Emails não estão sendo enviados

**Problema**: `RESEND_API_KEY not configured`
- **Solução**: Adicionar `RESEND_API_KEY` no `.env.local`

**Problema**: Emails só chegam para seu email
- **Solução**: Verificar domínio no Resend (produção)

**Problema**: Erro 401 no Resend
- **Solução**: API Key inválida, gerar nova no dashboard

### Cron Job não executa

**Problema**: 401 Unauthorized
- **Solução**: Verificar `CRON_SECRET` nas env vars do Vercel

**Problema**: Cron não aparece no Vercel
- **Solução**: Verificar `vercel.json`, fazer novo deploy

**Problema**: Execução apenas em produção
- **Nota**: Vercel Cron só funciona em produção, testar localmente via API

### Notificações não aparecem

**Problema**: Componente não atualiza
- **Solução**: Verificar se `userId` está sendo passado corretamente

**Problema**: Realtime não funciona
- **Solução**: Verificar RLS policies no Supabase

**Problema**: Contador errado
- **Solução**: Limpar cache, recarregar preferências

### Performance

**Problema**: Muitas notificações, página lenta
- **Solução**: Paginação já implementada (20 por página)
- **Otimização**: Implementar virtual scrolling se necessário

**Problema**: Realtime causando muitos re-renders
- **Solução**: Debounce dos updates, usar React.memo

## 📝 Próximos Passos

### Melhorias Futuras

1. **Push Notifications**
   - Implementar Web Push API
   - Service Worker para notificações offline
   - Suporte a mobile apps

2. **Analytics**
   - Taxa de abertura de emails
   - Taxa de cliques
   - Engajamento por tipo

3. **A/B Testing**
   - Testar diferentes templates
   - Testar horários de envio
   - Otimizar copy

4. **Integrações**
   - Slack notifications
   - WhatsApp Business
   - SMS via Twilio

5. **Machine Learning**
   - Sugestão de horário ideal por usuário
   - Priorização inteligente
   - Detecção de spam

## 🔐 Segurança

- **RLS**: Row Level Security ativo em todas as tabelas
- **Auth**: Verificação de usuário em todas as queries
- **Cron Secret**: Proteção do endpoint de cron
- **Email Validation**: Validação de emails antes de envio
- **Rate Limiting**: Limite de envios para evitar spam

## 📄 Licença

Propriedade da empresa. Todos os direitos reservados.

---

**Desenvolvido com ❤️ para otimizar a gestão de RH**
