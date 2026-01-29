import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GenericEmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function GenericEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: GenericEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-6">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="bg-purple-600 hover:bg-purple-700">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
