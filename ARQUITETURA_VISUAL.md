# 🏗️ Arquitetura Visual - Sistema de Notificações

Diagramas visuais ASCII da arquitetura do sistema.

---

## 📊 Visão Geral do Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SISTEMA DE NOTIFICAÇÕES                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Notification  │────────▶│  Email Sender    │────────▶│   Resend    │
│     Engine      │         │   (Resend)       │         │   API       │
└────────┬────────┘         └──────────────────┘         └─────────────┘
         │
         │ cria
         │
         ▼
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│  Supabase DB    │◀────────│  Supabase        │────────▶│  Frontend   │
│  (notifications)│         │  Realtime        │ updates │  (React)    │
└─────────────────┘         └──────────────────┘         └─────────────┘
```

---

## 🔄 Fluxo de Execução do Cron Job

```
┌────────────────────────────────────────────────────────────────────────┐
│                         VERCEL CRON JOB                                │
│                      Executa: 8h e 18h diários                         │
└────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ trigger
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│              GET /api/cron/notifications                               │
│              Authorization: Bearer {CRON_SECRET}                       │
└────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ verifica auth
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     NotificationEngine                                 │
│                                                                        │
│  ┌──────────────────────┐  ┌──────────────────────┐                  │
│  │ checkBirthdays()     │  │ checkAnniversaries() │                  │
│  └──────────────────────┘  └──────────────────────┘                  │
│                                                                        │
│  ┌──────────────────────┐  ┌──────────────────────┐                  │
│  │checkVacationExpiring│  │checkPendingAbsences()│                  │
│  └──────────────────────┘  └──────────────────────┘                  │
│                                                                        │
│  ┌──────────────────────┐  ┌──────────────────────┐                  │
│  │checkMissingTimeRec() │  │checkCompliance()     │                  │
│  └──────────────────────┘  └──────────────────────┘                  │
└────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ para cada verificação
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      sendNotification()                                │
│                                                                        │
│  1. Verificar preferências do usuário                                 │
│  2. Criar notificação in-app no Supabase                             │
│  3. (Opcional) Enviar email via Resend                               │
│  4. Registrar log de envio                                           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📧 Fluxo de Envio de Email

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. PREPARAÇÃO                                                          │
└────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │ Buscar dados do evento   │
                    │ (funcionário, datas,     │
                    │ motivos, etc)            │
                    └──────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. TEMPLATE SELECTION                                                  │
└────────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │ getEmailTemplate(type, data)│
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
        ┌──────────────────┐        ┌──────────────────┐
        │ Template Função  │        │ Base Template    │
        │ (específico)     │───────▶│ (layout HTML)    │
        └──────────────────┘        └──────────────────┘
                                             │
                                             ▼
                              ┌──────────────────────────┐
                              │ HTML Final Renderizado   │
                              │ (responsivo, bonito)     │
                              └──────────────────────────┘
                                             │
                                             ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. ENVIO                                                               │
└────────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │ sendEmail({                 │
                    │   to: email,                │
                    │   subject: subject,         │
                    │   html: html                │
                    │ })                          │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │ Resend API               │
                    │ POST /emails             │
                    └──────────────┬───────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
        ┌──────────────────┐        ┌──────────────────┐
        │ ✅ Success       │        │ ❌ Error         │
        │ messageId: xyz   │        │ error: message   │
        └──────────────────┘        └──────────────────┘
                    │                             │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 4. LOGGING                                                             │
└────────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │ INSERT INTO                 │
                    │ notification_logs (          │
                    │   channel: 'email',         │
                    │   status: 'sent'/'failed',  │
                    │   email_to: email,          │
                    │   email_subject: subject    │
                    │ )                           │
                    └─────────────────────────────┘
```

---

## 🔔 Fluxo de Notificação In-App

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. CRIAÇÃO DA NOTIFICAÇÃO                                              │
└────────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │ INSERT INTO notifications   │
                    │ (user_id, type, title,      │
                    │  message, link, ...)        │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. SUPABASE REALTIME                                                   │
└────────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │ postgres_changes trigger    │
                    │ event: INSERT               │
                    │ filter: user_id=eq.${userId}│
                    └──────────────┬──────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │ WebSocket Push           │
                    │ to Client                │
                    └──────────────┬───────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. FRONTEND REACT                                                      │
└────────────────────────────────────────────────────────────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        ▼                          ▼                          ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ NotificationBell│    │ subscribeToNot() │    │ Toast Message   │
│ Badge Atualiza  │    │ callback fires   │    │ Aparece         │
│ 3 → 4           │    │                  │    │ "Nova notif!"   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                          │                          │
        └──────────────────────────┴──────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │ Estado Local Atualizado  │
                    │ notifications: [...new]  │
                    │ unreadCount: count + 1   │
                    └──────────────────────────┘
```

---

## 💾 Estrutura do Banco de Dados

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SUPABASE DATABASE                            │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ notifications                                                        │
├──────────────────────────────────────────────────────────────────────┤
│ id                    UUID PRIMARY KEY                               │
│ company_id            UUID → companies(id)                           │
│ user_id               UUID → auth.users(id)                          │
│ type                  notification_type (enum)                       │
│ priority              notification_priority (enum)                   │
│ title                 VARCHAR(255)                                   │
│ message               TEXT                                           │
│ link                  VARCHAR(500)                                   │
│ action_text           VARCHAR(100)                                   │
│ metadata              JSONB                                          │
│ read                  BOOLEAN DEFAULT FALSE                          │
│ read_at               TIMESTAMP                                      │
│ archived              BOOLEAN DEFAULT FALSE                          │
│ archived_at           TIMESTAMP                                      │
│ email_sent            BOOLEAN DEFAULT FALSE                          │
│ email_sent_at         TIMESTAMP                                      │
│ email_error           TEXT                                           │
│ created_at            TIMESTAMP DEFAULT NOW()                        │
│ updated_at            TIMESTAMP DEFAULT NOW()                        │
├──────────────────────────────────────────────────────────────────────┤
│ INDEXES:                                                             │
│  - idx_notifications_user_read (user_id, read)                      │
│  - idx_notifications_company (company_id, created_at)               │
│  - idx_notifications_type (type, created_at)                        │
│  - idx_notifications_unread (user_id) WHERE NOT read               │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ notification_preferences                                             │
├──────────────────────────────────────────────────────────────────────┤
│ id                        UUID PRIMARY KEY                           │
│ user_id                   UUID → auth.users(id) UNIQUE               │
│ company_id                UUID → companies(id)                       │
│ enable_in_app             BOOLEAN DEFAULT TRUE                       │
│ enable_email              BOOLEAN DEFAULT TRUE                       │
│ enable_push               BOOLEAN DEFAULT FALSE                      │
│ notify_birthdays          BOOLEAN DEFAULT TRUE                       │
│ notify_work_anniversaries BOOLEAN DEFAULT TRUE                       │
│ notify_vacation_expiring  BOOLEAN DEFAULT TRUE                       │
│ notify_absences           BOOLEAN DEFAULT TRUE                       │
│ notify_time_tracking      BOOLEAN DEFAULT TRUE                       │
│ notify_compliance         BOOLEAN DEFAULT TRUE                       │
│ notify_documents          BOOLEAN DEFAULT TRUE                       │
│ notify_payroll            BOOLEAN DEFAULT TRUE                       │
│ notify_system             BOOLEAN DEFAULT TRUE                       │
│ email_digest              BOOLEAN DEFAULT FALSE                      │
│ email_digest_frequency    VARCHAR(20) DEFAULT 'daily'                │
│ email_digest_time         TIME DEFAULT '09:00:00'                    │
│ do_not_disturb_enabled    BOOLEAN DEFAULT FALSE                      │
│ do_not_disturb_start      TIME                                       │
│ do_not_disturb_end        TIME                                       │
│ created_at                TIMESTAMP DEFAULT NOW()                    │
│ updated_at                TIMESTAMP DEFAULT NOW()                    │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ notification_logs                                                    │
├──────────────────────────────────────────────────────────────────────┤
│ id                    UUID PRIMARY KEY                               │
│ notification_id       UUID → notifications(id)                       │
│ company_id            UUID → companies(id)                           │
│ user_id               UUID                                           │
│ channel               VARCHAR(20) ('in_app', 'email', 'push')        │
│ status                VARCHAR(20) ('sent', 'failed', 'bounced')      │
│ error_message         TEXT                                           │
│ email_to              VARCHAR(255)                                   │
│ email_subject         VARCHAR(500)                                   │
│ provider_response     JSONB                                          │
│ sent_at               TIMESTAMP DEFAULT NOW()                        │
├──────────────────────────────────────────────────────────────────────┤
│ INDEXES:                                                             │
│  - idx_notification_logs_notification (notification_id)             │
│  - idx_notification_logs_user (user_id, sent_at)                   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Row Level Security (RLS)

```
┌──────────────────────────────────────────────────────────────────────┐
│ TABELA: notifications                                                │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ SELECT:                                                              │
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │ Users can view their own notifications                         │  │
│ │ USING (auth.uid() = user_id)                                   │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ UPDATE:                                                              │
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │ Users can update their own notifications                       │  │
│ │ USING (auth.uid() = user_id)                                   │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ INSERT:                                                              │
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │ System can insert notifications                                │  │
│ │ WITH CHECK (true)                                              │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ DELETE:                                                              │
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │ Users can delete their own notifications                       │  │
│ │ USING (auth.uid() = user_id)                                   │  │
│ └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Componentes React

```
┌──────────────────────────────────────────────────────────────────────┐
│                      HIERARQUIA DE COMPONENTES                       │
└──────────────────────────────────────────────────────────────────────┘

Header
  ├── Logo
  ├── Navigation
  ├── NotificationBell ◄─────┐ COMPONENTE PRINCIPAL
  │   ├── Badge              │
  │   │   └── unreadCount    │
  │   └── DropdownMenu       │
  │       ├── Header         │
  │       ├── ScrollArea     │
  │       │   └── NotificationItem[] (últimas 5)
  │       │       ├── Icon
  │       │       ├── Title
  │       │       ├── Message
  │       │       ├── Time
  │       │       └── Actions
  │       │           ├── Mark as Read
  │       │           └── Delete
  │       └── Footer
  │           └── Link "Ver todas"
  └── UserMenu

/notificacoes
  ├── Header
  │   ├── Title
  │   └── Description
  ├── Stats Cards
  │   ├── Unread Count
  │   ├── Total Count
  │   └── Today Count
  ├── Actions Bar
  │   ├── Search Input
  │   ├── Preferences Button
  │   └── Mark All Button
  ├── Tabs
  │   ├── All
  │   ├── Unread
  │   └── Read
  └── Notifications List
      ├── NotificationCard[]
      │   ├── Icon
      │   ├── Title + Badges
      │   ├── Message
      │   ├── Metadata
      │   └── Actions
      └── Pagination

/configuracoes/notificacoes
  ├── Header
  ├── Channels Card
  │   ├── In-App Toggle
  │   ├── Email Toggle
  │   └── Push Toggle (disabled)
  ├── Types Card
  │   └── NotificationToggle[] (9 tipos)
  ├── Email Digest Card
  │   ├── Enable Toggle
  │   ├── Frequency Select
  │   └── Time Input
  ├── Do Not Disturb Card
  │   ├── Enable Toggle
  │   ├── Start Time
  │   └── End Time
  └── Save Button
```

---

## 🔄 Ciclo de Vida de uma Notificação

```
┌──────────────────────────────────────────────────────────────────────┐
│ FASE 1: CRIAÇÃO                                                      │
└──────────────────────────────────────────────────────────────────────┘
         │
         │ Evento acontece (ex: férias aprovadas)
         ▼
┌────────────────────┐
│ sendNotification() │
└────────┬───────────┘
         │
         ├─ Verificar preferências do usuário
         ├─ Criar registro no DB (read: false)
         └─ (Opcional) Enviar email

┌──────────────────────────────────────────────────────────────────────┐
│ FASE 2: ENTREGA                                                      │
└──────────────────────────────────────────────────────────────────────┘
         │
         ├─ In-App: Realtime push para NotificationBell
         │           └─ Toast aparece
         │           └─ Badge atualiza (3 → 4)
         │
         └─ Email: Enviado via Resend
                   └─ Log criado (sent/failed)

┌──────────────────────────────────────────────────────────────────────┐
│ FASE 3: LEITURA                                                      │
└──────────────────────────────────────────────────────────────────────┘
         │
         │ Usuário clica na notificação
         ▼
┌──────────────────┐
│ markAsRead()     │
└────────┬─────────┘
         │
         ├─ UPDATE: read = true, read_at = NOW()
         ├─ Badge atualiza (4 → 3)
         └─ Navega para link

┌──────────────────────────────────────────────────────────────────────┐
│ FASE 4: ARQUIVAMENTO (após 30 dias de lida)                         │
└──────────────────────────────────────────────────────────────────────┘
         │
         │ Cron job mensal executa
         ▼
┌────────────────────────────┐
│ archive_old_notifications()│
└────────┬───────────────────┘
         │
         └─ UPDATE: archived = true, archived_at = NOW()

┌──────────────────────────────────────────────────────────────────────┐
│ FASE 5: LIMPEZA (opcional - após 90 dias arquivada)                 │
└──────────────────────────────────────────────────────────────────────┘
         │
         │ Cleanup manual
         ▼
┌──────────────────┐
│ DELETE           │
└──────────────────┘
```

---

## 📈 Fluxo de Performance

```
QUERY OTIMIZADA:
┌─────────────────────────────────────────────────────────────────────┐
│ SELECT * FROM notifications                                         │
│ WHERE user_id = $1                                                  │
│ AND read = false            ◄─── Usa idx_notifications_user_read   │
│ AND archived = false                                                │
│ ORDER BY created_at DESC                                            │
│ LIMIT 20;                                                           │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                   ┌──────────────────┐
                   │ Index Scan       │
                   │ Cost: 0.42..8.44 │
                   │ Rows: 20         │
                   │ Time: < 1ms      │
                   └──────────────────┘

VS

QUERY NÃO OTIMIZADA:
┌─────────────────────────────────────────────────────────────────────┐
│ SELECT * FROM notifications                                         │
│ -- Sem WHERE user_id (busca tudo!)                                  │
│ ORDER BY created_at DESC;                                           │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                   ┌──────────────────┐
                   │ Seq Scan         │
                   │ Cost: 0..1000    │
                   │ Rows: 100000     │
                   │ Time: > 100ms    │
                   └──────────────────┘
```

---

## 🌐 Deploy Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                            VERCEL CLOUD                              │
└──────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐
│ Edge Network (CDN)  │
│ - Static Assets     │
│ - Client JS         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐         ┌─────────────────────┐
│ Serverless Funcs    │────────▶│ API Routes          │
│ - SSR Pages         │         │ /api/cron/notif     │
│ - ISR               │         └──────────┬──────────┘
└─────────────────────┘                    │
                                           │
┌─────────────────────┐                    │
│ Cron Jobs           │◀───────────────────┘
│ - 8h, 18h daily     │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐          ┌──────────────────┐                │
│  │ Supabase         │          │ Resend           │                │
│  │ - PostgreSQL     │          │ - Email Delivery │                │
│  │ - Realtime       │          │ - Templates      │                │
│  │ - Auth           │          │ - Analytics      │                │
│  └──────────────────┘          └──────────────────┘                │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

**Arquivos de Referência**:

- Documentação: `README_NOTIFICATIONS.md`
- Quick Start: `QUICK_START_NOTIFICATIONS.md`
- Comandos: `COMANDOS_NOTIFICACOES.md`
- Exemplos: `EXEMPLOS_USO_NOTIFICACOES.md`
- Troubleshooting: `TROUBLESHOOTING_VISUAL.md`

---

**Use estes diagramas para entender rapidamente a arquitetura! 📐**
