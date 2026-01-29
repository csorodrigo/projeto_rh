'use client';

import { useState, useEffect } from 'react';
import { Clock, Mail, Calendar, Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { ReportSchedule, ReportFrequency, DatePeriod } from '@/types/reports';

interface ScheduleConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule?: ReportSchedule | null;
  onSave: (data: Partial<ReportSchedule>) => Promise<void>;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
];

const DATE_PERIODS: Array<{ value: DatePeriod; label: string }> = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'last_week', label: 'Última semana' },
  { value: 'current_week', label: 'Semana atual' },
  { value: 'last_month', label: 'Último mês' },
  { value: 'current_month', label: 'Mês atual' },
  { value: 'last_quarter', label: 'Último trimestre' },
  { value: 'current_quarter', label: 'Trimestre atual' },
  { value: 'last_year', label: 'Último ano' },
  { value: 'current_year', label: 'Ano atual' },
];

export function ScheduleConfig({ open, onOpenChange, schedule, onSave }: ScheduleConfigProps) {
  const [frequency, setFrequency] = useState<ReportFrequency>(schedule?.frequency || 'daily');
  const [time, setTime] = useState(schedule?.time || '09:00');
  const [dayOfWeek, setDayOfWeek] = useState(schedule?.day_of_week || 1);
  const [dayOfMonth, setDayOfMonth] = useState(schedule?.day_of_month || 1);
  const [cronExpression, setCronExpression] = useState(schedule?.cron_expression || '');
  const [datePeriod, setDatePeriod] = useState<DatePeriod>(schedule?.date_period || 'last_month');
  const [recipients, setRecipients] = useState<string[]>(schedule?.recipients || []);
  const [emailInput, setEmailInput] = useState('');
  const [active, setActive] = useState(schedule?.active ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (schedule) {
      setFrequency(schedule.frequency);
      setTime(schedule.time || '09:00');
      setDayOfWeek(schedule.day_of_week || 1);
      setDayOfMonth(schedule.day_of_month || 1);
      setCronExpression(schedule.cron_expression || '');
      setDatePeriod(schedule.date_period);
      setRecipients(schedule.recipients || []);
      setActive(schedule.active);
    }
  }, [schedule]);

  const handleAddEmail = () => {
    const email = emailInput.trim();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (!recipients.includes(email)) {
        setRecipients([...recipients, email]);
      }
      setEmailInput('');
    }
  };

  const handleRemoveEmail = (email: string) => {
    setRecipients(recipients.filter(e => e !== email));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const data: Partial<ReportSchedule> = {
        frequency,
        time: frequency !== 'custom' ? time : undefined,
        day_of_week: frequency === 'weekly' ? dayOfWeek : undefined,
        day_of_month: frequency === 'monthly' ? dayOfMonth : undefined,
        cron_expression: frequency === 'custom' ? cronExpression : undefined,
        date_period: datePeriod,
        recipients,
        active,
      };

      await onSave(data);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {schedule ? 'Editar Agendamento' : 'Agendar Relatório'}
          </DialogTitle>
          <DialogDescription>
            Configure a frequência e os destinatários para geração automática do relatório
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Frequência */}
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequência</Label>
            <Select value={frequency} onValueChange={value => setFrequency(value as ReportFrequency)}>
              <SelectTrigger id="frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diário</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="custom">Personalizado (Cron)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Horário (exceto custom) */}
          {frequency !== 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="time">Horário de Execução</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            </div>
          )}

          {/* Dia da semana (weekly) */}
          {frequency === 'weekly' && (
            <div className="space-y-2">
              <Label htmlFor="day-of-week">Dia da Semana</Label>
              <Select
                value={dayOfWeek.toString()}
                onValueChange={value => setDayOfWeek(parseInt(value))}
              >
                <SelectTrigger id="day-of-week">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map(day => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Dia do mês (monthly) */}
          {frequency === 'monthly' && (
            <div className="space-y-2">
              <Label htmlFor="day-of-month">Dia do Mês</Label>
              <Input
                id="day-of-month"
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={e => setDayOfMonth(parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">
                Para meses com menos dias, será executado no último dia do mês
              </p>
            </div>
          )}

          {/* Expressão Cron (custom) */}
          {frequency === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="cron">Expressão Cron</Label>
              <Input
                id="cron"
                placeholder="0 9 * * 1-5"
                value={cronExpression}
                onChange={e => setCronExpression(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Exemplo: 0 9 * * 1-5 (Segunda a Sexta às 9h)
              </p>
              <a
                href="https://crontab.guru/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                Ajuda com expressões cron
              </a>
            </div>
          )}

          {/* Período dos dados */}
          <div className="space-y-2">
            <Label htmlFor="date-period">Período dos Dados</Label>
            <Select value={datePeriod} onValueChange={value => setDatePeriod(value as DatePeriod)}>
              <SelectTrigger id="date-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_PERIODS.map(period => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Define qual período de dados será incluído no relatório
            </p>
          </div>

          {/* Destinatários (emails) */}
          <div className="space-y-2">
            <Label htmlFor="email-input">
              <Mail className="inline h-4 w-4 mr-1" />
              Destinatários (Email)
            </Label>
            <div className="flex gap-2">
              <Input
                id="email-input"
                type="email"
                placeholder="email@exemplo.com"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddEmail();
                  }
                }}
              />
              <Button type="button" onClick={handleAddEmail} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Lista de emails */}
            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {recipients.map(email => (
                  <Badge key={email} variant="secondary" className="pr-1">
                    {email}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-2"
                      onClick={() => handleRemoveEmail(email)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Os relatórios serão enviados automaticamente para estes emails
            </p>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="active"
              checked={active}
              onChange={e => setActive(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="active" className="cursor-pointer">
              Agendamento ativo
            </Label>
          </div>

          {/* Preview */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <h4 className="font-medium mb-2 text-sm">Resumo do Agendamento</h4>
            <div className="text-sm space-y-1 text-muted-foreground">
              <p>
                <strong>Frequência:</strong>{' '}
                {frequency === 'daily' && 'Todos os dias'}
                {frequency === 'weekly' &&
                  `Toda ${DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label}`}
                {frequency === 'monthly' && `Todo dia ${dayOfMonth} do mês`}
                {frequency === 'custom' && `Customizado: ${cronExpression || '(não definido)'}`}
              </p>
              {frequency !== 'custom' && (
                <p>
                  <strong>Horário:</strong> {time}
                </p>
              )}
              <p>
                <strong>Período:</strong>{' '}
                {DATE_PERIODS.find(p => p.value === datePeriod)?.label}
              </p>
              <p>
                <strong>Destinatários:</strong> {recipients.length || 'Nenhum'}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Agendamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
