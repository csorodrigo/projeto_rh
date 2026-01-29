"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { EmploymentType } from "@/lib/recruitment/constants"
import { EMPLOYMENT_TYPE_CONFIG } from "@/lib/recruitment/constants"

export interface EmploymentTypeBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Employment type
   */
  type: EmploymentType
  /**
   * Size variant
   * @default "md"
   */
  size?: "sm" | "md" | "lg"
}

/**
 * EmploymentTypeBadge Component
 *
 * Displays a badge indicating the employment/contract type.
 * Each type has a distinct color for quick visual identification.
 *
 * @example
 * ```tsx
 * <EmploymentTypeBadge type="clt" />
 * <EmploymentTypeBadge type="pj" size="sm" />
 * <EmploymentTypeBadge type="estagio" />
 * ```
 */
export function EmploymentTypeBadge({
  type,
  size = "md",
  className,
  ...props
}: EmploymentTypeBadgeProps) {
  const config = EMPLOYMENT_TYPE_CONFIG[type]

  if (!config) {
    return null
  }

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  }

  return (
    <Badge
      variant={config.variant}
      className={cn(sizeClasses[size], className)}
      {...props}
    >
      {config.label}
    </Badge>
  )
}
