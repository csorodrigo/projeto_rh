"use client"

import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  FileText,
  Ban,
  PlayCircle
} from "lucide-react"
import type { AbsenceStatus } from "@/types/database"

interface AbsenceStatusBadgeProps {
  status: AbsenceStatus
  showIcon?: boolean
  size?: "sm" | "default" | "lg"
}

const statusConfig: Record<
  AbsenceStatus,
  {
    label: string
    variant: "default" | "secondary" | "destructive" | "outline"
    icon: typeof CheckCircle
    className?: string
  }
> = {
  draft: {
    label: "Rascunho",
    variant: "secondary",
    icon: FileText,
    className: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  },
  pending: {
    label: "Pendente",
    variant: "outline",
    icon: AlertCircle,
    className: "border-yellow-500 text-yellow-600 hover:bg-yellow-50",
  },
  approved: {
    label: "Aprovada",
    variant: "default",
    icon: CheckCircle,
    className: "bg-green-500 hover:bg-green-600",
  },
  rejected: {
    label: "Rejeitada",
    variant: "destructive",
    icon: XCircle,
    className: "",
  },
  cancelled: {
    label: "Cancelada",
    variant: "secondary",
    icon: Ban,
    className: "bg-gray-100 text-gray-500 hover:bg-gray-100",
  },
  in_progress: {
    label: "Em Andamento",
    variant: "default",
    icon: PlayCircle,
    className: "bg-blue-500 hover:bg-blue-600",
  },
  completed: {
    label: "Concluída",
    variant: "secondary",
    icon: Clock,
    className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  },
}

export function AbsenceStatusBadge({
  status,
  showIcon = true,
  size = "default"
}: AbsenceStatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    default: "text-xs px-2.5 py-0.5",
    lg: "text-sm px-3 py-1",
  }

  const iconSizes = {
    sm: "size-3",
    default: "size-3.5",
    lg: "size-4",
  }

  return (
    <Badge
      variant={config.variant}
      className={`gap-1 ${config.className} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </Badge>
  )
}
