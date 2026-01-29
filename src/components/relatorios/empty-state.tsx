import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ReportsEmptyStateProps {
  onBack?: () => void
}

export function ReportsEmptyState({ onBack }: ReportsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-full bg-muted p-6 mb-6">
        <FileText className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Nenhum relatório disponível</h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Os relatórios aparecerão aqui assim que houver dados suficientes para gerar.
      </p>
      {onBack && (
        <Button variant="outline" onClick={onBack}>
          Voltar para Relatórios
        </Button>
      )}
    </div>
  )
}
