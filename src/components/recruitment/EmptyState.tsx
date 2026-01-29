"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { Briefcase } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Title of the empty state
   */
  title: string
  /**
   * Description text
   */
  description?: string
  /**
   * Icon to display
   * @default Briefcase
   */
  icon?: LucideIcon
  /**
   * Primary action button
   */
  action?: {
    label: string
    onClick: () => void
  }
  /**
   * Secondary action button
   */
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

/**
 * EmptyState Component
 *
 * A reusable empty state component for displaying when no data is available.
 * Includes an icon, title, description, and optional action buttons.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={Briefcase}
 *   title="Nenhuma vaga cadastrada"
 *   description="Comece criando sua primeira vaga de emprego"
 *   action={{
 *     label: "Criar Vaga",
 *     onClick: () => router.push("/recrutamento/vagas/nova")
 *   }}
 * />
 * ```
 */
export function EmptyState({
  title,
  description,
  icon: Icon = Briefcase,
  action,
  secondaryAction,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center",
        "rounded-lg border border-dashed border-border",
        "min-h-[400px]",
        className
      )}
      {...props}
    >
      {/* Icon */}
      <div className="mb-4 rounded-full bg-muted p-6">
        <Icon className="size-12 text-muted-foreground" />
      </div>

      {/* Title */}
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>

      {/* Description */}
      {description && (
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col gap-2 sm:flex-row">
          {action && (
            <Button onClick={action.onClick} size="lg">
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              size="lg"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
