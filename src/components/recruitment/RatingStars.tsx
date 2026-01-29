"use client"

import * as React from "react"
import { Star } from "lucide-react"

import { cn } from "@/lib/utils"

export interface RatingStarsProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Current rating value (1-5)
   */
  value: number
  /**
   * Callback when rating changes
   */
  onChange?: (value: number) => void
  /**
   * Whether the component is read-only
   * @default false
   */
  readOnly?: boolean
  /**
   * Size of stars
   * @default "md"
   */
  size?: "sm" | "md" | "lg"
  /**
   * Maximum number of stars
   * @default 5
   */
  maxStars?: number
}

const sizeClasses = {
  sm: "size-3",
  md: "size-4",
  lg: "size-5",
}

/**
 * RatingStars Component
 *
 * Displays a star rating component that can be used in read-only mode
 * to display ratings or in interactive mode to collect ratings.
 *
 * Features:
 * - Supports 1-5 star ratings (configurable max)
 * - Interactive mode with hover effects
 * - Read-only display mode
 * - Multiple sizes
 * - Keyboard accessible
 *
 * @example
 * ```tsx
 * // Display mode
 * <RatingStars value={4} readOnly />
 *
 * // Input mode
 * <RatingStars value={rating} onChange={setRating} />
 *
 * // Custom size
 * <RatingStars value={3} size="lg" readOnly />
 * ```
 */
export function RatingStars({
  value,
  onChange,
  readOnly = false,
  size = "md",
  maxStars = 5,
  className,
  ...props
}: RatingStarsProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null)

  const handleClick = (rating: number) => {
    if (!readOnly && onChange) {
      onChange(rating)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent, rating: number) => {
    if (!readOnly && onChange) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        onChange(rating)
      }
      // Arrow key navigation
      if (event.key === "ArrowRight" && rating < maxStars) {
        event.preventDefault()
        onChange(rating + 1)
      }
      if (event.key === "ArrowLeft" && rating > 1) {
        event.preventDefault()
        onChange(rating - 1)
      }
    }
  }

  const displayValue = hoverValue !== null ? hoverValue : value

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5",
        !readOnly && "cursor-pointer",
        className
      )}
      onMouseLeave={() => setHoverValue(null)}
      role="radiogroup"
      aria-label="Rating"
      {...props}
    >
      {Array.from({ length: maxStars }, (_, i) => i + 1).map((rating) => {
        const isFilled = rating <= displayValue
        const isHovered = hoverValue !== null && rating <= hoverValue

        return (
          <button
            key={rating}
            type="button"
            onClick={() => handleClick(rating)}
            onMouseEnter={() => !readOnly && setHoverValue(rating)}
            onKeyDown={(e) => handleKeyDown(e, rating)}
            disabled={readOnly}
            className={cn(
              "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded",
              !readOnly && "hover:scale-110 transform transition-transform"
            )}
            aria-label={`Rate ${rating} out of ${maxStars}`}
            aria-checked={rating === value}
            role="radio"
            tabIndex={readOnly ? -1 : 0}
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-all duration-150",
                isFilled
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-transparent text-muted-foreground/50",
                isHovered && "fill-yellow-300 text-yellow-300 scale-110"
              )}
            />
          </button>
        )
      })}
      {!readOnly && (
        <span className="sr-only">
          {value} out of {maxStars} stars
        </span>
      )}
    </div>
  )
}
