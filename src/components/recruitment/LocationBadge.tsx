"use client"

import * as React from "react"
import { Building2, Home, Users2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { LocationType } from "@/lib/recruitment/constants"
import { LOCATION_TYPE_CONFIG } from "@/lib/recruitment/constants"

// Icon mapping for location types
const LOCATION_ICONS = {
  presencial: Building2,
  remoto: Home,
  hibrido: Users2,
} as const

export interface LocationBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Location type
   */
  type: LocationType
  /**
   * City name (shown for presencial type)
   */
  city?: string
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
 * LocationBadge Component
 *
 * Displays a badge indicating the work location type.
 * For presencial jobs, can optionally show the city.
 *
 * Features:
 * - Type-specific icons (building, home, hybrid)
 * - City display for presencial
 * - Multiple sizes
 * - Consistent with design system
 *
 * @example
 * ```tsx
 * <LocationBadge type="remoto" />
 * <LocationBadge type="presencial" city="São Paulo" />
 * <LocationBadge type="hibrido" size="sm" />
 * ```
 */
export function LocationBadge({
  type,
  city,
  showIcon = true,
  size = "md",
  className,
  ...props
}: LocationBadgeProps) {
  const config = LOCATION_TYPE_CONFIG[type]
  const Icon = LOCATION_ICONS[type]

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

  // Build label with city if applicable
  const label =
    type === "presencial" && city ? `${config.label} - ${city}` : config.label

  return (
    <Badge
      variant={config.variant}
      className={cn("inline-flex items-center gap-1.5", sizeClasses[size], className)}
      {...props}
    >
      {showIcon && <Icon className={iconSizeClasses[size]} />}
      <span>{label}</span>
    </Badge>
  )
}
