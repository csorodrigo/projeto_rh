/**
 * ApprovalCard - Card para exibir uma solicitação de aprovação
 */

'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  XCircle,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { PendingApproval } from '@/types/database';
import { cn } from '@/lib/utils';

interface ApprovalCardProps {
  approval: PendingApproval;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  onApprove?: (approvalId: string) => void;
  onReject?: (approvalId: string) => void;
  onViewDetails?: (approvalId: string) => void;
  showCheckbox?: boolean;
}

export function ApprovalCard({
  approval,
  selected = false,
  onSelect,
  onApprove,
  onReject,
  onViewDetails,
  showCheckbox = false,
}: ApprovalCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const instance = approval.instance;
  const requester = instance.requester;

  // Calcular SLA
  const slaDueAt = approval.sla_due_at ? new Date(approval.sla_due_at) : null;
  const now = new Date();
  const isOverdue = slaDueAt ? slaDueAt < now : false;

  const getSLABadge = () => {
    if (!slaDueAt) return null;

    const hoursRemaining = Math.floor(
      (slaDueAt.getTime() - now.getTime()) / (1000 * 60 * 60)
    );

    if (isOverdue) {
      const hoursOverdue = Math.abs(hoursRemaining);
      return (
        <Badge variant="destructive">
          Atrasado {hoursOverdue}h
        </Badge>
      );
    }

    if (hoursRemaining <= 4) {
      return (
        <Badge variant="warning" className="bg-orange-100 text-orange-800">
          {hoursRemaining}h restantes
        </Badge>
      );
    }

    return (
      <Badge variant="outline">
        {hoursRemaining}h restantes
      </Badge>
    );
  };

  const getWorkflowTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      absence: 'Ausência',
      overtime: 'Hora Extra',
      time_adjustment: 'Ajuste de Ponto',
      document_approval: 'Documento',
      data_change: 'Alteração de Dados',
    };
    return labels[type] || type;
  };

  const renderEntityData = () => {
    if (!approval.entity_data) return null;

    const data = approval.entity_data;

    // Ausência
    if (instance.entity_type === 'absence') {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {data.start_date && data.end_date
                ? `${format(new Date(data.start_date as string), 'dd/MM/yyyy')} a ${format(new Date(data.end_date as string), 'dd/MM/yyyy')} (${data.total_days || 0} dias)`
                : 'Datas não especificadas'}
            </span>
          </div>
          {data.reason && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Motivo: {data.reason as string}</span>
            </div>
          )}
        </div>
      );
    }

    // Hora Extra
    if (instance.entity_type === 'overtime') {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {data.hours || 0}h de hora extra em{' '}
              {data.date ? format(new Date(data.date as string), 'dd/MM/yyyy') : '-'}
            </span>
          </div>
          {data.reason && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Motivo: {data.reason as string}</span>
            </div>
          )}
        </div>
      );
    }

    // Ajuste de Ponto
    if (instance.entity_type === 'time_adjustment') {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Ajuste em{' '}
              {data.date ? format(new Date(data.date as string), 'dd/MM/yyyy') : '-'}
            </span>
          </div>
          {data.adjustment_reason && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Motivo: {data.adjustment_reason as string}
              </span>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const handleApprove = async () => {
    if (!onApprove) return;
    setIsLoading(true);
    try {
      await onApprove(approval.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!onReject) return;
    setIsLoading(true);
    try {
      await onReject(approval.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={cn('transition-colors', selected && 'ring-2 ring-primary')}>
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3 flex-1">
            {showCheckbox && onSelect && (
              <Checkbox
                checked={selected}
                onCheckedChange={onSelect}
                aria-label="Selecionar aprovação"
              />
            )}

            <Avatar>
              <AvatarImage
                src={requester.avatar_url || undefined}
                alt={requester.name}
              />
              <AvatarFallback>
                {requester.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h3 className="font-semibold">{requester.name}</h3>
              <p className="text-sm text-muted-foreground">
                {requester.department || 'Sem departamento'}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {getSLABadge()}
            <Badge variant="secondary">
              {getWorkflowTypeLabel(instance.workflow_type)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Dados da entidade */}
          {renderEntityData()}

          {/* Tempo desde a solicitação */}
          <p className="text-xs text-muted-foreground">
            Solicitado{' '}
            {formatDistanceToNow(new Date(instance.created_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>

          {/* Ações */}
          <div className="flex gap-2">
            <Button
              onClick={handleApprove}
              disabled={isLoading}
              className="flex-1"
              size="sm"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Aprovar
            </Button>

            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isLoading}
              className="flex-1"
              size="sm"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Rejeitar
            </Button>

            {onViewDetails && (
              <Button
                variant="outline"
                onClick={() => onViewDetails(approval.id)}
                disabled={isLoading}
                size="sm"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
