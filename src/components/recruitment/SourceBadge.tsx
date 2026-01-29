"use client"

import * as React from "react"
import { Globe, Linkedin, Users, HelpCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { CandidateSource } from "@/lib/recruitment/constants"
import { CANDIDATE_SOURCE_CONFIG } from "@/lib/recruitment/constants"

// Icon mapping for candidate sources
const SOURCE_ICONS = {
  portal: Globe,
  linkedin: Linkedin,
  indicacao: Users,
  outro: HelpCircle,
} as const

export interface SourceBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Candidate source
   */
  source: CandidateSource
  /**
   * Whether to show icon
   * @default true
   */
  showIcon?: boolean
  /**
   * Size variant
   * @default "md"
   */
  size?: "sm" | "md" | "lg"
}

/**
 * SourceBadge Component
 *
 * Displays a badge indicating the source/origin of a candidate.
 * Shows appropriate icon and label with consistent styling.
 *
 * @example
 * ```tsx
 * <SourceBadge source="portal" />
 * <SourceBadge source="linkedin" size="sm" />
 * <SourceBadge source="indicacao" showIcon={false} />
 * ```
 */
export function SourceBadge({
  source,
  showIcon = true,
  size = "md",
  className,
  ...props
}: SourceBadgeProps) {
  const config = CANDIDATE_SOURCE_CONFIG[source]
  const Icon = SOURCE_ICONS[source]

  if (!config) {
    return null
  }

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  }

  const iconSizeClasses = {
    sm: "size-3",
    md: "size-3.5",
    lg: "size-4",
  }

  return (
    <Badge
      variant={config.variant}
      className={cn("inline-flex items-center gap-1.5", sizeClasses[size], className)}
      {...props}
    >
      {showIcon && <Icon className={iconSizeClasses[size]} />}
      <span>{config.label}</span>
    </Badge>
  )
}
