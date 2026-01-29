"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckCircle2, XCircle, Clock, FileText, Circle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { JobStatus, ApplicationStatus } from "@/lib/recruitment/constants"
import {
  JOB_STATUS_CONFIG,
  APPLICATION_STATUS_CONFIG,
} from "@/lib/recruitment/constants"

const statusBadgeVariants = cva("inline-flex items-center gap-1.5", {
  variants: {
    size: {
      sm: "text-xs px-2 py-0.5",
      md: "text-sm px-2.5 py-1",
      lg: "text-base px-3 py-1.5",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

// Icon mapping for job statuses
const JOB_STATUS_ICONS = {
  draft: FileText,
  open: CheckCircle2,
  paused: Clock,
  closed: XCircle,
} as const

// Icon mapping for application statuses
const APPLICATION_STATUS_ICONS = {
  active: Circle,
  rejected: XCircle,
  hired: CheckCircle2,
  withdrawn: XCircle,
} as const

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  /**
   * Type of status badge (job or application)
   */
  type: "job" | "application"
  /**
   * Status value
   */
  status: JobStatus | ApplicationStatus
  /**
   * Whether to show icon
   * @default true
   */
  showIcon?: boolean
}

/**
 * StatusBadge Component
 *
 * Displays a badge for job or application status with appropriate color,
 * icon, and label. Supports multiple sizes and custom styling.
 *
 * @example
 * ```tsx
 * <StatusBadge type="job" status="open" />
 * <StatusBadge type="application" status="hired" size="sm" />
 * <StatusBadge type="job" status="draft" showIcon={false} />
 * ```
 */
export function StatusBadge({
  type,
  status,
  size,
  showIcon = true,
  className,
  ...props
}: StatusBadgeProps) {
  const config =
    type === "job"
      ? JOB_STATUS_CONFIG[status as JobStatus]
      : APPLICATION_STATUS_CONFIG[status as ApplicationStatus]

  const Icon =
    type === "job"
      ? JOB_STATUS_ICONS[status as JobStatus]
      : APPLICATION_STATUS_ICONS[status as ApplicationStatus]

  if (!config) {
    return null
  }

  return (
    <Badge
      variant={config.variant}
      className={cn(statusBadgeVariants({ size }), className)}
      {...props}
    >
      {showIcon && <Icon className="size-3" />}
      <span>{config.label}</span>
    </Badge>
  )
}

/**
 * JobStatusBadge - Convenience component for job statuses
 */
export function JobStatusBadge({
  status,
  ...props
}: Omit<StatusBadgeProps, "type">) {
  return <StatusBadge type="job" status={status} {...props} />
}

/**
 * ApplicationStatusBadge - Convenience component for application statuses
 */
export function ApplicationStatusBadge({
  status,
  ...props
}: Omit<StatusBadgeProps, "type">) {
  return <StatusBadge type="application" status={status} {...props} />
}
