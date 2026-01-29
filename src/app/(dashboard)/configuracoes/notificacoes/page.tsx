"use client"

/**
 * Notification Settings Page
 * Configurações de preferências de notificações
 */

import { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, Clock, Save } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/lib/supabase/queries/notifications';
import { NotificationPreferences } from '@/types/database';

export default function NotificationSettingsPage() {
  // TODO: Get real user ID from auth
  const userId = 'user-id-placeholder';
  const companyId = 'company-id-placeholder';

  const [preferences, setPreferences] = useState<Partial<NotificationPreferences>>({
    enable_in_app: true,
    enable_email: true,
    enable_push: false,
    notify_birthdays: true,
    notify_work_anniversaries: true,
    notify_vacation_expiring: true,
    notify_absences: true,
    notify_time_tracking: true,
    notify_compliance: true,
    notify_documents: true,
    notify_payroll: true,
    notify_system: true,
    email_digest: false,
    email_digest_frequency: 'daily',
    email_digest_time: '09:00:00',
    do_not_disturb_enabled: false,
    do_not_disturb_start: null,
    do_not_disturb_end: null,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    try {
      setLoading(true);
      const data = await getNotificationPreferences(userId);
      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast.error('Erro ao carregar preferências');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      await updateNotificationPreferences(userId, {
        ...preferences,
        company_id: companyId,
      });
      toast.success('Preferências salvas com sucesso!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Erro ao salvar preferências');
    } finally {
      setSaving(false);
    }
  }

  function updatePreference<K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Preferências de Notificações</h1>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Preferências de Notificações</h1>
        <p className="text-muted-foreground">
          Configure como e quando você deseja receber notificações
        </p>
      </div>

      {/* Canais de Notificação */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Canais de Notificação</h2>
            <p className="text-sm text-muted-foreground">
              Escolha como você deseja receber notificações
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Bell className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                </div>
                <div>
                  <Label htmlFor="in-app" className="font-medium">Notificações In-App</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações dentro do sistema
                  </p>
                </div>
              </div>
              <Switch
                id="in-app"
                checked={preferences.enable_in_app}
                onCheckedChange={(checked) => updatePreference('enable_in_app', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Mail className="h-5 w-5 text-purple-700 dark:text-purple-300" />
                </div>
                <div>
                  <Label htmlFor="email" className="font-medium">Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber emails com notificações importantes
                  </p>
                </div>
              </div>
              <Switch
                id="email"
                checked={preferences.enable_email}
                onCheckedChange={(checked) => updatePreference('enable_email', checked)}
              />
            </div>

            <div className="flex items-center justify-between opacity-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Smartphone className="h-5 w-5 text-green-700 dark:text-green-300" />
                </div>
                <div>
                  <Label htmlFor="push" className="font-medium">Notificações Push</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber push notifications no navegador (em breve)
                  </p>
                </div>
              </div>
              <Switch
                id="push"
                checked={preferences.enable_push}
                onCheckedChange={(checked) => updatePreference('enable_push', checked)}
                disabled
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Tipos de Notificação */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Tipos de Notificação</h2>
            <p className="text-sm text-muted-foreground">
              Escolha quais tipos de notificação você deseja receber
            </p>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <NotificationToggle
              label="Aniversários"
              description="Notificações de aniversários de funcionários"
              checked={preferences.notify_birthdays ?? true}
              onChange={(checked) => updatePreference('notify_birthdays', checked)}
            />

            <NotificationToggle
              label="Aniversários de Empresa"
              description="Notificações de tempo de empresa"
              checked={preferences.notify_work_anniversaries ?? true}
              onChange={(checked) => updatePreference('notify_work_anniversaries', checked)}
            />

            <NotificationToggle
              label="Férias Vencendo"
              description="Alertas de férias próximas ao vencimento"
              checked={preferences.notify_vacation_expiring ?? true}
              onChange={(checked) => updatePreference('notify_vacation_expiring', checked)}
            />

            <NotificationToggle
              label="Ausências"
              description="Solicitações e atualizações de ausências"
              checked={preferences.notify_absences ?? true}
              onChange={(checked) => updatePreference('notify_absences', checked)}
            />

            <NotificationToggle
              label="Ponto Eletrônico"
              description="Registros de ponto e alertas"
              checked={preferences.notify_time_tracking ?? true}
              onChange={(checked) => updatePreference('notify_time_tracking', checked)}
            />

            <NotificationToggle
              label="Compliance"
              description="Violações e alertas de conformidade"
              checked={preferences.notify_compliance ?? true}
              onChange={(checked) => updatePreference('notify_compliance', checked)}
            />

            <NotificationToggle
              label="Documentos"
              description="Documentos vencendo ou pendentes"
              checked={preferences.notify_documents ?? true}
              onChange={(checked) => updatePreference('notify_documents', checked)}
            />

            <NotificationToggle
              label="Folha de Pagamento"
              description="Atualizações sobre folha de pagamento"
              checked={preferences.notify_payroll ?? true}
              onChange={(checked) => updatePreference('notify_payroll', checked)}
            />

            <NotificationToggle
              label="Sistema"
              description="Notificações do sistema"
              checked={preferences.notify_system ?? true}
              onChange={(checked) => updatePreference('notify_system', checked)}
            />
          </div>
        </div>
      </Card>

      {/* Email Digest */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Email Digest</h2>
            <p className="text-sm text-muted-foreground">
              Agrupar notificações em um email resumo
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="digest" className="font-medium">Ativar Email Digest</Label>
              <p className="text-sm text-muted-foreground">
                Receber resumo de notificações ao invés de emails individuais
              </p>
            </div>
            <Switch
              id="digest"
              checked={preferences.email_digest}
              onCheckedChange={(checked) => updatePreference('email_digest', checked)}
            />
          </div>

          {preferences.email_digest && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequência</Label>
                <Select
                  value={preferences.email_digest_frequency}
                  onValueChange={(value) =>
                    updatePreference('email_digest_frequency', value as any)
                  }
                >
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instant">Instantâneo</SelectItem>
                    <SelectItem value="hourly">A cada hora</SelectItem>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {preferences.email_digest_frequency === 'daily' && (
                <div className="space-y-2">
                  <Label htmlFor="time">Horário</Label>
                  <Input
                    id="time"
                    type="time"
                    value={preferences.email_digest_time?.slice(0, 5) || '09:00'}
                    onChange={(e) =>
                      updatePreference('email_digest_time', `${e.target.value}:00`)
                    }
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Não Incomodar */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Não Incomodar</h2>
            <p className="text-sm text-muted-foreground">
              Definir horário em que não deseja receber notificações
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Clock className="h-5 w-5 text-orange-700 dark:text-orange-300" />
              </div>
              <div>
                <Label htmlFor="dnd" className="font-medium">Ativar Não Incomodar</Label>
                <p className="text-sm text-muted-foreground">
                  Silenciar notificações em horários específicos
                </p>
              </div>
            </div>
            <Switch
              id="dnd"
              checked={preferences.do_not_disturb_enabled}
              onCheckedChange={(checked) => updatePreference('do_not_disturb_enabled', checked)}
            />
          </div>

          {preferences.do_not_disturb_enabled && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start-time">Início</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={preferences.do_not_disturb_start?.slice(0, 5) || '22:00'}
                  onChange={(e) =>
                    updatePreference('do_not_disturb_start', `${e.target.value}:00`)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-time">Fim</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={preferences.do_not_disturb_end?.slice(0, 5) || '08:00'}
                  onChange={(e) =>
                    updatePreference('do_not_disturb_end', `${e.target.value}:00`)
                  }
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Preferências'}
        </Button>
      </div>
    </div>
  );
}

interface NotificationToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function NotificationToggle({ label, description, checked, onChange }: NotificationToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 border rounded-lg">
      <div className="flex-1">
        <Label className="font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
