"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
  maxItems?: number
}

export function Breadcrumb({
  items,
  className,
  maxItems = 3
}: BreadcrumbProps) {
  const displayItems = React.useMemo(() => {
    if (items.length <= maxItems) return items

    // Em mobile ou quando excede maxItems, mostra: Home ... último item
    return [
      items[0],
      { label: "...", href: "#" },
      items[items.length - 1]
    ]
  }, [items, maxItems])

  return (
    <nav
      className={cn("flex items-center gap-1 text-sm", className)}
      aria-label="Breadcrumb"
    >
      {displayItems.map((item, index) => {
        const isFirst = index === 0
        const isLast = index === displayItems.length - 1
        const isEllipsis = item.label === "..."

        return (
          <React.Fragment key={`${item.href}-${index}`}>
            {index > 0 && (
              <ChevronRight className="size-4 text-muted-foreground shrink-0" />
            )}

            {isEllipsis ? (
              <span className="text-muted-foreground px-1">...</span>
            ) : isLast ? (
              <span className="font-medium text-foreground truncate max-w-[150px] md:max-w-none">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  "text-muted-foreground hover:text-foreground transition-colors truncate",
                  "flex items-center gap-1",
                  isFirst && "max-w-[80px] md:max-w-none"
                )}
              >
                {isFirst && <Home className="size-4 shrink-0" />}
                <span className={cn(
                  "hidden sm:inline",
                  isFirst && "sr-only sm:not-sr-only"
                )}>
                  {item.label}
                </span>
              </Link>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
