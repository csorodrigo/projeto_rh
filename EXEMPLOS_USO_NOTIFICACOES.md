# 📚 Exemplos de Uso - Sistema de Notificações

Exemplos práticos e copy-paste prontos para usar o sistema de notificações.

---

## 🎯 Casos de Uso Comuns

### 1. Notificar Aprovação de Férias

```typescript
// src/app/api/ausencias/[id]/approve/route.ts
import { NotificationEngine } from '@/lib/notifications';

export async function POST(request: Request) {
  const engine = new NotificationEngine();

  // ... lógica de aprovação ...

  // Buscar dados da ausência e funcionário
  const absence = await getAbsence(absenceId);
  const employee = await getEmployee(absence.employee_id);
  const profile = await getProfileByEmployeeId(employee.id);

  // Enviar notificação
  await engine.sendNotification({
    companyId: employee.company_id,
    userId: profile.id,
    type: 'absence_approved',
    priority: 'medium',
    title: 'Suas férias foram aprovadas! 🎉',
    message: `Suas férias de ${formatDate(absence.start_date)} a ${formatDate(absence.end_date)} foram aprovadas.`,
    link: `/ausencias/${absence.id}`,
    actionText: 'Ver detalhes',
    metadata: {
      employeeName: employee.name,
      absenceType: 'Férias',
      startDate: absence.start_date,
      endDate: absence.end_date,
      days: calculateDays(absence.start_date, absence.end_date),
    },
    sendEmail: true,
    emailTo: employee.email,
  });

  return Response.json({ success: true });
}
```

---

### 2. Notificar Nova Admissão para RH

```typescript
// src/app/api/funcionarios/route.ts (POST)
import { NotificationEngine } from '@/lib/notifications';

export async function POST(request: Request) {
  const engine = new NotificationEngine();

  // ... criar funcionário ...

  // Buscar todos os usuários do RH
  const hrUsers = await supabase
    .from('profiles')
    .select('id, email, name')
    .eq('company_id', companyId)
    .in('role', ['company_admin', 'hr_manager', 'hr_analyst']);

  // Notificar cada um
  for (const hrUser of hrUsers.data || []) {
    await engine.sendNotification({
      companyId,
      userId: hrUser.id,
      type: 'new_employee',
      priority: 'low',
      title: 'Novo funcionário cadastrado',
      message: `${newEmployee.name} foi admitido como ${newEmployee.position}`,
      link: `/funcionarios/${newEmployee.id}`,
      actionText: 'Ver perfil',
      metadata: {
        employeeName: newEmployee.name,
        employeePosition: newEmployee.position,
        date: new Date(),
      },
      sendEmail: true,
      emailTo: hrUser.email,
    });
  }

  return Response.json({ success: true, employee: newEmployee });
}
```

---

### 3. Alerta de Documento Vencendo (Cron Job Customizado)

```typescript
// src/app/api/cron/check-documents/route.ts
import { NotificationEngine } from '@/lib/notifications';
import { addDays, differenceInDays } from 'date-fns';

export async function GET(request: Request) {
  // Verificar auth
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const engine = new NotificationEngine();
  const thirtyDaysFromNow = addDays(new Date(), 30);

  // Buscar documentos vencendo
  const { data: documents } = await supabase
    .from('employee_documents')
    .select(`
      *,
      employee:employees(id, name, email, company_id)
    `)
    .not('expires_at', 'is', null)
    .lte('expires_at', thirtyDaysFromNow.toISOString())
    .eq('status', 'approved');

  for (const doc of documents || []) {
    const daysUntilExpiry = differenceInDays(
      new Date(doc.expires_at),
      new Date()
    );

    if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
      // Buscar perfil do funcionário
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('employee_id', doc.employee.id)
        .single();

      if (profile) {
        await engine.sendNotification({
          companyId: doc.employee.company_id,
          userId: profile.id,
          type: 'document_expiring',
          priority: daysUntilExpiry <= 7 ? 'high' : 'medium',
          title: `Documento vencendo em ${daysUntilExpiry} dias`,
          message: `Seu ${doc.type} vence em ${daysUntilExpiry} dias. Por favor, providencie a renovação.`,
          link: `/documentos`,
          actionText: 'Atualizar documento',
          metadata: {
            employeeName: doc.employee.name,
            documentType: doc.type,
            days: daysUntilExpiry,
          },
          sendEmail: true,
          emailTo: doc.employee.email,
        });
      }
    }
  }

  return Response.json({ success: true, checked: documents?.length || 0 });
}
```

---

### 4. Notificação Customizada de Folha Pronta

```typescript
// src/app/api/folha/[id]/finalize/route.ts
import { NotificationEngine } from '@/lib/notifications';

export async function POST(request: Request) {
  const engine = new NotificationEngine();

  // ... finalizar folha ...

  // Buscar todos os funcionários da folha
  const { data: employees } = await supabase
    .from('employee_payrolls')
    .select(`
      employee_id,
      employee:employees(id, name, email, company_id)
    `)
    .eq('period_id', periodId);

  // Notificar cada funcionário
  for (const emp of employees || []) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('employee_id', emp.employee_id)
      .single();

    if (profile) {
      await engine.sendNotification({
        companyId: emp.employee.company_id,
        userId: profile.id,
        type: 'payroll_ready',
        priority: 'medium',
        title: 'Holerite disponível 💰',
        message: `Seu holerite de ${month}/${year} já está disponível para consulta.`,
        link: `/folha/holerite/${periodId}`,
        actionText: 'Ver holerite',
        metadata: {
          employeeName: emp.employee.name,
        },
        sendEmail: true,
        emailTo: emp.employee.email,
      });
    }
  }

  return Response.json({ success: true });
}
```

---

### 5. Notificação de Sistema (Manutenção)

```typescript
// src/app/api/admin/notify-maintenance/route.ts
import { NotificationEngine } from '@/lib/notifications';

export async function POST(request: Request) {
  const engine = new NotificationEngine();
  const { maintenanceDate, duration } = await request.json();

  // Buscar todos os usuários ativos
  const { data: users } = await supabase
    .from('profiles')
    .select('id, email, name, company_id')
    .neq('role', 'employee'); // Apenas admins e RH

  for (const user of users || []) {
    await engine.sendNotification({
      companyId: user.company_id,
      userId: user.id,
      type: 'system',
      priority: 'high',
      title: 'Manutenção programada do sistema',
      message: `O sistema ficará indisponível em ${maintenanceDate} por aproximadamente ${duration}.`,
      metadata: {
        employeeName: user.name,
      },
      sendEmail: true,
      emailTo: user.email,
    });
  }

  return Response.json({ success: true, notified: users?.length || 0 });
}
```

---

## 🔔 Usar NotificationBell

### No Header do Dashboard

```tsx
// src/components/layout/header.tsx
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useAuth } from '@/hooks/use-auth'; // ou seu hook de auth

export function Header() {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between p-4">
      <Logo />

      <div className="flex items-center gap-4">
        {/* Outros componentes */}

        {/* Notification Bell */}
        {user?.id && <NotificationBell userId={user.id} />}

        <UserMenu />
      </div>
    </header>
  );
}
```

---

## 📊 Queries Úteis

### Buscar Notificações de um Usuário

```typescript
import { getAllNotifications, getUnreadCount } from '@/lib/notifications';

async function loadUserNotifications(userId: string) {
  // Buscar não lidas
  const unreadCount = await getUnreadCount(userId);
  console.log(`${unreadCount} notificações não lidas`);

  // Buscar todas com paginação
  const result = await getAllNotifications(userId, 1, 20, 'all');
  console.log(`Total: ${result.total}`);
  console.log(`Página: ${result.page} de ${result.totalPages}`);
  console.log('Notificações:', result.notifications);
}
```

### Marcar Como Lida ao Clicar

```typescript
import { markAsRead } from '@/lib/notifications';

function NotificationItem({ notification }) {
  async function handleClick() {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navegar para o link
    if (notification.link) {
      router.push(notification.link);
    }
  }

  return (
    <div onClick={handleClick} className="cursor-pointer">
      {notification.title}
    </div>
  );
}
```

### Subscrever a Notificações Realtime

```typescript
import { subscribeToNotifications } from '@/lib/notifications';
import { toast } from 'sonner';

function MyComponent() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribeToNotifications(user.id, (notification) => {
      // Nova notificação recebida!
      console.log('Nova notificação:', notification);

      // Mostrar toast
      toast.info(notification.title, {
        description: notification.message,
        action: notification.link ? {
          label: notification.action_text || 'Ver',
          onClick: () => router.push(notification.link),
        } : undefined,
      });

      // Atualizar estado local
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  // ... resto do componente
}
```

---

## ⚙️ Atualizar Preferências

### Permitir Usuário Desabilitar Emails

```typescript
import { updateNotificationPreferences } from '@/lib/notifications';

async function handleToggleEmail(userId: string, enabled: boolean) {
  await updateNotificationPreferences(userId, {
    enable_email: enabled,
  });

  toast.success(
    enabled
      ? 'Notificações por email ativadas'
      : 'Notificações por email desativadas'
  );
}
```

### Configurar Digest Diário

```typescript
import { updateNotificationPreferences } from '@/lib/notifications';

async function setupDailyDigest(userId: string) {
  await updateNotificationPreferences(userId, {
    email_digest: true,
    email_digest_frequency: 'daily',
    email_digest_time: '09:00:00', // 9h da manhã
  });

  toast.success('Você receberá um resumo diário às 9h');
}
```

### Ativar Não Incomodar

```typescript
import { updateNotificationPreferences } from '@/lib/notifications';

async function enableDoNotDisturb(userId: string) {
  await updateNotificationPreferences(userId, {
    do_not_disturb_enabled: true,
    do_not_disturb_start: '22:00:00', // 22h
    do_not_disturb_end: '08:00:00',   // 8h
  });

  toast.success('Modo "Não Incomodar" ativo das 22h às 8h');
}
```

---

## 📧 Templates Customizados

### Criar Novo Template

```typescript
// src/lib/notifications/templates/notification-templates.ts

function customWelcomeTemplate(data: NotificationTemplateData) {
  return {
    subject: `Bem-vindo ao ${data.companyName}! 🎉`,
    html: baseEmailTemplate({
      title: 'Bem-vindo ao Time!',
      preheader: `Estamos felizes em ter você conosco`,
      content: `
        <p>Olá, <strong>${data.employeeName}</strong>!</p>

        <p>É um prazer tê-lo(a) em nossa equipe como <strong>${data.employeePosition}</strong>!</p>

        <p>Aqui estão alguns recursos para começar:</p>

        <ul style="line-height: 2;">
          <li>📚 <a href="${data.link}/manual">Manual do Funcionário</a></li>
          <li>👥 <a href="${data.link}/equipe">Conheça a Equipe</a></li>
          <li>💼 <a href="${data.link}/beneficios">Seus Benefícios</a></li>
        </ul>

        <p>Se tiver qualquer dúvida, não hesite em nos contatar!</p>

        <p>Sucesso em sua jornada conosco! 🚀</p>
      `,
      actionUrl: data.link,
      actionText: 'Acessar Portal',
      companyName: data.companyName,
    }),
  };
}

// Adicionar ao switch em getEmailTemplate()
export function getEmailTemplate(type: NotificationType, data: NotificationTemplateData) {
  switch (type) {
    // ... outros casos ...
    case 'welcome': // Adicionar novo tipo em database.ts
      return customWelcomeTemplate(data);
    // ...
  }
}
```

### Usar Template Customizado

```typescript
const engine = new NotificationEngine();

await engine.sendNotification({
  companyId: 'company-id',
  userId: 'user-id',
  type: 'welcome', // Seu novo tipo
  priority: 'medium',
  title: 'Bem-vindo ao time!',
  message: 'Estamos felizes em ter você conosco',
  link: '/portal',
  actionText: 'Acessar Portal',
  metadata: {
    employeeName: 'João Silva',
    employeePosition: 'Desenvolvedor',
    companyName: 'TechCorp',
  },
  sendEmail: true,
  emailTo: 'joao@techcorp.com',
});
```

---

## 🎨 Customizar Cores e Ícones

### Adicionar Novo Tipo com Cor e Ícone

```typescript
// src/components/notifications/NotificationBell.tsx

const notificationIcons: Record<NotificationType, string> = {
  // ... existentes ...
  welcome: '👋',
  achievement: '🏆',
  training: '📖',
};

const notificationColors: Record<NotificationType, string> = {
  // ... existentes ...
  welcome: 'text-purple-600',
  achievement: 'text-yellow-600',
  training: 'text-blue-600',
};
```

---

## 🧪 Testes Automatizados

### Teste de Notificação

```typescript
// __tests__/notifications.test.ts
import { NotificationEngine } from '@/lib/notifications';

describe('NotificationEngine', () => {
  it('should send birthday notification', async () => {
    const engine = new NotificationEngine();

    await engine.sendNotification({
      companyId: 'test-company',
      userId: 'test-user',
      type: 'birthday',
      priority: 'low',
      title: 'Test Birthday',
      message: 'Test message',
      sendEmail: false, // Não enviar email em teste
    });

    // Verificar se foi criada no banco
    const { data } = await supabase
      .from('notifications')
      .select()
      .eq('title', 'Test Birthday')
      .single();

    expect(data).toBeTruthy();
    expect(data.type).toBe('birthday');
  });
});
```

---

## 📱 Integração com Mobile (Futuro)

### Preparar para Push Notifications

```typescript
// src/lib/notifications/push-sender.ts
export async function sendPushNotification(
  token: string,
  notification: Notification
) {
  // TODO: Implementar quando tiver app mobile
  // Usar Firebase Cloud Messaging ou similar

  const payload = {
    to: token,
    title: notification.title,
    body: notification.message,
    data: {
      link: notification.link,
      notificationId: notification.id,
    },
  };

  // await sendToFCM(payload);
}
```

---

## 💡 Dicas e Boas Práticas

### ✅ Fazer

- Sempre validar `userId` antes de criar notificação
- Usar `sendEmail: true` apenas para notificações importantes
- Incluir `link` e `actionText` quando possível
- Usar prioridades corretas (low/medium/high/urgent)
- Testar templates antes de enviar para produção
- Monitorar taxa de entrega de emails
- Arquivar notificações antigas regularmente

### ❌ Evitar

- Enviar emails demais (spam)
- Criar notificações sem metadados úteis
- Ignorar preferências do usuário
- Usar HTML inline em vez de templates
- Deixar notificações acumularem sem arquivar
- Ignorar erros de envio de email
- Criar notificações sem link de ação

---

## 🔗 Referências

- Documentação completa: `README_NOTIFICATIONS.md`
- Quick Start: `QUICK_START_NOTIFICATIONS.md`
- Comandos: `COMANDOS_NOTIFICACOES.md`
- Troubleshooting: `TROUBLESHOOTING_VISUAL.md`

---

**Copie, cole e adapte estes exemplos para seu caso de uso! 🚀**
