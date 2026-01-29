'use client';

import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import type { ImportProgress as ImportProgressType } from '@/lib/import/types';

interface ImportProgressProps {
  progress: ImportProgressType;
}

export function ImportProgress({ progress }: ImportProgressProps) {
  const getStatusIcon = () => {
    switch (progress.status) {
      case 'parsing':
      case 'validating':
      case 'importing':
        return <Loader2 className="h-6 w-6 animate-spin text-primary" />;
      case 'completed':
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case 'error':
        return <XCircle className="h-6 w-6 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    if (progress.message) {
      return progress.message;
    }

    switch (progress.status) {
      case 'parsing':
        return 'Processando arquivo...';
      case 'validating':
        return 'Validando dados...';
      case 'importing':
        return 'Importando funcionários...';
      case 'completed':
        return 'Concluído!';
      case 'error':
        return 'Erro durante o processo';
      default:
        return 'Aguardando...';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center">
        {getStatusIcon()}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{getStatusMessage()}</span>
          <span className="text-muted-foreground">
            {progress.percentage}%
          </span>
        </div>

        <Progress value={progress.percentage} />

        {progress.total > 0 && (
          <p className="text-sm text-muted-foreground text-center">
            {progress.current} de {progress.total}
          </p>
        )}
      </div>
    </div>
  );
}
