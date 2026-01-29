"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CANDIDATE_SOURCE_CONFIG } from "@/lib/recruitment/constants"

export interface SourceData {
  source: "portal" | "linkedin" | "indicacao" | "outro"
  count: number
}

export interface SourceChartProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Source data
   */
  data: SourceData[]
  /**
   * Chart type
   * @default "bar"
   */
  type?: "bar" | "pie"
}

/**
 * SourceChart Component
 *
 * Displays a chart showing the distribution of candidates by source.
 * Helps identify which recruitment channels are most effective.
 *
 * @example
 * ```tsx
 * <SourceChart
 *   data={[
 *     { source: "portal", count: 45 },
 *     { source: "linkedin", count: 30 },
 *     { source: "indicacao", count: 20 },
 *     { source: "outro", count: 5 },
 *   ]}
 * />
 * ```
 */
export function SourceChart({
  data,
  type = "bar",
  className,
  ...props
}: SourceChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0)

  // Sort by count descending
  const sortedData = [...data].sort((a, b) => b.count - a.count)

  const maxCount = Math.max(...data.map((d) => d.count), 1)

  // Color mapping
  const colors = {
    portal: "bg-blue-500",
    linkedin: "bg-blue-700",
    indicacao: "bg-green-500",
    outro: "bg-gray-500",
  }

  if (type === "pie") {
    return (
      <Card className={cn(className)} {...props}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5 text-primary" />
            Origem dos Candidatos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center mb-6">
            {/* Simple pie representation using flex */}
            <div className="flex h-4 w-full rounded-full overflow-hidden">
              {sortedData.map((item) => {
                const percentage = (item.count / total) * 100
                return (
                  <div
                    key={item.source}
                    className={cn(colors[item.source])}
                    style={{ width: `${percentage}%` }}
                    title={`${CANDIDATE_SOURCE_CONFIG[item.source].label}: ${percentage.toFixed(1)}%`}
                  />
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            {sortedData.map((item) => {
              const percentage = ((item.count / total) * 100).toFixed(1)
              return (
                <div
                  key={item.source}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn("size-3 rounded-full", colors[item.source])}
                    />
                    <span className="font-medium">
                      {CANDIDATE_SOURCE_CONFIG[item.source].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{item.count}</span>
                    <span className="text-xs">({percentage}%)</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(className)} {...props}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-5 text-primary" />
          Origem dos Candidatos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedData.map((item) => {
            const percentage = (item.count / maxCount) * 100
            const totalPercentage = ((item.count / total) * 100).toFixed(1)

            return (
              <div key={item.source}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">
                    {CANDIDATE_SOURCE_CONFIG[item.source].label}
                  </span>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{item.count}</span>
                    <span className="text-xs">({totalPercentage}%)</span>
                  </div>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      colors[item.source]
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Total */}
        <div className="mt-4 pt-4 border-t flex justify-between text-sm">
          <span className="font-medium">Total de Candidatos</span>
          <span className="text-muted-foreground">{total}</span>
        </div>
      </CardContent>
    </Card>
  )
}
