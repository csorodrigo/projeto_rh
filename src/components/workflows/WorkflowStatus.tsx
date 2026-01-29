/**
 * WorkflowStatus - Badge de status do workflow
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Ban } from 'lucide-react';
import type { WorkflowStatus } from '@/types/database';

interface WorkflowStatusBadgeProps {
  status: WorkflowStatus;
  showIcon?: boolean;
}

export function WorkflowStatusBadge({
  status,
  showIcon = true,
}: WorkflowStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pendente',
          variant: 'outline' as const,
          icon: <Clock className="h-3 w-3" />,
        };
      case 'approved':
        return {
          label: 'Aprovado',
          variant: 'default' as const,
          icon: <CheckCircle className="h-3 w-3" />,
          className: 'bg-green-100 text-green-800 border-green-200',
        };
      case 'rejected':
        return {
          label: 'Rejeitado',
          variant: 'destructive' as const,
          icon: <XCircle className="h-3 w-3" />,
        };
      case 'cancelled':
        return {
          label: 'Cancelado',
          variant: 'secondary' as const,
          icon: <Ban className="h-3 w-3" />,
        };
      default:
        return {
          label: status,
          variant: 'outline' as const,
          icon: <Clock className="h-3 w-3" />,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge variant={config.variant} className={config.className}>
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  );
}
