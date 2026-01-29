# 🚀 Quick Start - Sistema de Notificações

Guia rápido para começar a usar o sistema de notificações em 5 minutos.

## 📦 Instalação

As dependências já foram instaladas:

```bash
✅ resend - Email service
✅ date-fns-tz - Timezone support
✅ @radix-ui/react-scroll-area - Scroll component
```

## ⚙️ Configuração Mínima

### 1. Configurar Resend (Email)

```bash
# 1. Criar conta em https://resend.com
# 2. Obter API Key no dashboard
# 3. Adicionar ao .env.local

RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=RH Sistema <noreply@seu-dominio.com>
```

### 2. Configurar Cron Secret

```bash
# Gerar secret seguro
openssl rand -base64 32

# Adicionar ao .env.local
CRON_SECRET=o_secret_gerado_aqui
```

### 3. Aplicar Migration

**Opção A: Via Supabase CLI**
```bash
supabase link
supabase db push
```

**Opção B: Via Dashboard**
1. Abrir Supabase Dashboard → SQL Editor
2. Copiar conteúdo de `supabase/migrations/014_notifications.sql`
3. Colar e executar

### 4. Verificar Instalação

```bash
# Testar cron job localmente
curl -X GET "http://localhost:3000/api/cron/notifications" \
  -H "Authorization: Bearer your-cron-secret"

# Deve retornar:
# { "success": true, "message": "Notification checks completed", ... }
```

## 🎯 Uso Básico

### 1. Adicionar Sino de Notificações ao Header

O componente já foi integrado em `src/components/layout/header.tsx`.

Certifique-se de passar o `userId`:

```tsx
// No layout ou header
import { NotificationBell } from '@/components/notifications/NotificationBell';

export function Header({ user }) {
  return (
    <header>
      {/* ... outros componentes ... */}

      {user?.id && <NotificationBell userId={user.id} />}
    </header>
  );
}
```

### 2. Enviar Notificação Programaticamente

```typescript
import { NotificationEngine } from '@/lib/notifications';

const engine = new NotificationEngine();

// Exemplo: Notificar sobre nova admissão
await engine.sendNotification({
  companyId: 'company-123',
  userId: 'user-456',
  type: 'new_employee',
  priority: 'medium',
  title: 'Novo funcionário cadastrado',
  message: 'João Silva foi admitido como Desenvolvedor',
  link: '/funcionarios/789',
  actionText: 'Ver perfil',
  sendEmail: true,
  emailTo: 'gestor@empresa.com',
});
```

### 3. Acessar Páginas

As páginas já estão criadas e acessíveis:

- **Centro de Notificações**: `/notificacoes`
- **Preferências**: `/configuracoes/notificacoes`

## 🔄 Executar Verificações Automáticas

### Desenvolvimento (Manual)

```bash
# Executar todas as verificações
curl http://localhost:3000/api/cron/notifications \
  -H "Authorization: Bearer your-cron-secret"
```

### Produção (Automático via Vercel Cron)

Já configurado em `vercel.json`:
- **8h**: Verificações matinais (aniversários, férias)
- **18h**: Verificações noturnas (ponto não registrado)

Após deploy no Vercel, o cron será executado automaticamente.

## 📧 Testar Envio de Email

Criar arquivo `test-notification.ts`:

```typescript
import { NotificationEngine } from '@/lib/notifications';

async function testEmail() {
  const engine = new NotificationEngine();

  await engine.sendNotification({
    companyId: 'test-company',
    userId: 'test-user',
    type: 'birthday',
    priority: 'low',
    title: 'Teste de Email',
    message: 'Este é um email de teste do sistema de notificações',
    metadata: {
      employeeName: 'João Silva',
      employeePosition: 'Desenvolvedor',
    },
    sendEmail: true,
    emailTo: 'seu-email@teste.com',
  });

  console.log('Email enviado com sucesso!');
}

testEmail();
```

Execute:
```bash
npx tsx test-notification.ts
```

## 🎨 Personalizar Templates

Templates estão em `src/lib/notifications/templates/notification-templates.ts`.

Exemplo de customização:

```typescript
// Adicionar novo template
function customTemplate(data: NotificationTemplateData) {
  return {
    subject: `Seu título aqui`,
    html: baseEmailTemplate({
      title: 'Título do Email',
      content: `
        <p>Olá, <strong>${data.employeeName}</strong>!</p>
        <p>Seu conteúdo personalizado aqui.</p>
      `,
      actionUrl: data.link,
      actionText: 'Seu botão',
    }),
  };
}

// Adicionar ao switch em getEmailTemplate()
case 'custom_type':
  return customTemplate(data);
```

## 🔍 Verificar Logs

### Desenvolvimento
```bash
# Logs aparecem no terminal do Next.js
npm run dev

# Buscar por:
# [NotificationEngine] Checking birthdays...
# [Cron] Starting notification checks...
```

### Produção (Vercel)
```bash
# Via CLI
vercel logs

# Ou via Dashboard
# https://vercel.com/your-project/deployments/[deployment-id]/logs
```

## 🐛 Troubleshooting Rápido

### Email não envia
```bash
# Verificar API Key
echo $RESEND_API_KEY

# Se vazio, adicionar ao .env.local
# Reiniciar servidor Next.js
```

### Notificações não aparecem
```bash
# Verificar migration aplicada
# Supabase Dashboard → Database → Tables
# Deve existir: notifications, notification_preferences

# Verificar RLS policies ativas
# Table Editor → notifications → RLS enabled ✓
```

### Cron retorna 401
```bash
# Verificar CRON_SECRET
# Deve ser o mesmo no .env.local e na request

# Regenerar se necessário
openssl rand -base64 32
```

## 📱 Próximos Passos

1. **Configurar Domínio no Resend**
   - Production: Verificar domínio para enviar emails reais
   - Development: Emails enviados apenas para seu email Resend

2. **Customizar Templates**
   - Adicionar logo da empresa
   - Personalizar cores
   - Ajustar copy

3. **Testar Todos os Tipos**
   - Criar dados de teste
   - Executar cada verificação
   - Validar emails recebidos

4. **Configurar Preferências Padrão**
   - Definir quais notificações enviar por padrão
   - Ajustar horários de digest
   - Configurar não incomodar

5. **Monitorar Performance**
   - Verificar logs de envio
   - Analisar taxa de entrega
   - Ajustar frequência se necessário

## 🎓 Recursos Adicionais

- **Documentação Completa**: `README_NOTIFICATIONS.md`
- **Schema do Banco**: `supabase/migrations/014_notifications.sql`
- **Tipos TypeScript**: `src/types/database.ts`
- **Queries**: `src/lib/supabase/queries/notifications.ts`

## 💡 Dicas

1. **Desenvolvimento**: Use email pessoal para testar
2. **Staging**: Configure domínio de teste no Resend
3. **Produção**: Use domínio real verificado
4. **Logs**: Sempre verificar logs após deploy
5. **Rate Limits**: Resend tem limite gratuito de 3000 emails/mês

---

**Pronto para começar! 🚀**

Em caso de dúvidas, consulte a documentação completa em `README_NOTIFICATIONS.md`.
