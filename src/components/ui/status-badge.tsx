"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  Check,
  X,
  Clock,
  AlertCircle,
  Pause,
  Ban,
  Circle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-all will-change-transform",
  {
    variants: {
      variant: {
        success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800 hover:shadow-sm hover:shadow-green-200/50 dark:hover:shadow-green-800/50",
        error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800 hover:shadow-sm hover:shadow-red-200/50 dark:hover:shadow-red-800/50",
        warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800 hover:shadow-sm hover:shadow-yellow-200/50 dark:hover:shadow-yellow-800/50",
        info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:shadow-sm hover:shadow-blue-200/50 dark:hover:shadow-blue-800/50",
        neutral: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:shadow-sm",
        purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800 hover:shadow-sm hover:shadow-purple-200/50 dark:hover:shadow-purple-800/50",
      },
      pulse: {
        true: "animate-pulse-slow",
        false: "",
      },
    },
    defaultVariants: {
      variant: "neutral",
      pulse: false,
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  icon?: LucideIcon
  label: string
  tooltip?: string
  pulse?: boolean
}

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ className, variant, icon: Icon, label, tooltip, pulse = false, ...props }, ref) => {
    const badge = (
      <div
        ref={ref}
        className={cn(statusBadgeVariants({ variant, pulse }), className)}
        {...props}
      >
        {Icon && <Icon className="size-3" />}
        <span>{label}</span>
      </div>
    )

    if (tooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{badge}</TooltipTrigger>
            <TooltipContent>
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return badge
  }
)
StatusBadge.displayName = "StatusBadge"

// Predefined status configurations
export const statusConfigs = {
  // Employee Statuses
  active: {
    variant: "success" as const,
    icon: CheckCircle2,
    label: "Ativo",
    tooltip: "Funcionário ativo no quadro",
  },
  inactive: {
    variant: "neutral" as const,
    icon: Pause,
    label: "Inativo",
    tooltip: "Funcionário temporariamente inativo",
  },
  on_leave: {
    variant: "warning" as const,
    icon: Clock,
    label: "Afastado",
    tooltip: "Funcionário em afastamento",
  },
  terminated: {
    variant: "error" as const,
    icon: XCircle,
    label: "Desligado",
    tooltip: "Funcionário desligado da empresa",
  },

  // Absence Statuses
  pending: {
    variant: "warning" as const,
    icon: Clock,
    label: "Pendente",
    tooltip: "Aguardando aprovação",
    pulse: true,
  },
  approved: {
    variant: "success" as const,
    icon: Check,
    label: "Aprovado",
    tooltip: "Solicitação aprovada",
  },
  rejected: {
    variant: "error" as const,
    icon: X,
    label: "Rejeitado",
    tooltip: "Solicitação rejeitada",
  },
  cancelled: {
    variant: "neutral" as const,
    icon: Ban,
    label: "Cancelado",
    tooltip: "Solicitação cancelada",
  },

  // Payroll Statuses
  draft: {
    variant: "neutral" as const,
    icon: Circle,
    label: "Rascunho",
    tooltip: "Folha em rascunho",
  },
  calculating: {
    variant: "info" as const,
    icon: Clock,
    label: "Calculando",
    tooltip: "Processando cálculos",
    pulse: true,
  },
  calculated: {
    variant: "info" as const,
    icon: CheckCircle2,
    label: "Calculado",
    tooltip: "Cálculos concluídos",
  },
  review: {
    variant: "warning" as const,
    icon: AlertCircle,
    label: "Revisão",
    tooltip: "Em revisão",
  },
  processing: {
    variant: "info" as const,
    icon: Clock,
    label: "Processando",
    tooltip: "Processando pagamento",
    pulse: true,
  },
  paid: {
    variant: "success" as const,
    icon: Check,
    label: "Pago",
    tooltip: "Pagamento realizado",
  },
  exported: {
    variant: "purple" as const,
    icon: CheckCircle2,
    label: "Exportado",
    tooltip: "Dados exportados",
  },

  // Time Tracking Statuses
  in_progress: {
    variant: "info" as const,
    icon: Clock,
    label: "Em andamento",
    tooltip: "Jornada em andamento",
    pulse: true,
  },
  completed: {
    variant: "success" as const,
    icon: Check,
    label: "Completo",
    tooltip: "Jornada completa",
  },
  incomplete: {
    variant: "warning" as const,
    icon: AlertTriangle,
    label: "Incompleto",
    tooltip: "Jornada incompleta",
  },

  // Generic Statuses
  urgent: {
    variant: "error" as const,
    icon: AlertCircle,
    label: "Urgente",
    tooltip: "Requer atenção imediata",
    pulse: true,
  },
} as const

export type StatusKey = keyof typeof statusConfigs

interface QuickStatusBadgeProps {
  status: StatusKey
  className?: string
}

export function QuickStatusBadge({ status, className }: QuickStatusBadgeProps) {
  const config = statusConfigs[status]
  if (!config) return null

  return (
    <StatusBadge
      variant={config.variant}
      icon={config.icon}
      label={config.label}
      tooltip={config.tooltip}
      pulse={'pulse' in config ? config.pulse : undefined}
      className={className}
    />
  )
}

export { StatusBadge, statusBadgeVariants }
