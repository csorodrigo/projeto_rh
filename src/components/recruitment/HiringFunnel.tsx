"use client"

import * as React from "react"
import { TrendingDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface FunnelStage {
  stage: string
  count: number
  conversionRate: number
  dropoffRate?: number
}

export interface HiringFunnelProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Funnel stage data
   */
  stages: FunnelStage[]
  /**
   * Callback when stage is clicked
   */
  onStageClick?: (stage: FunnelStage) => void
}

/**
 * HiringFunnel Component
 *
 * Displays a visual funnel chart showing candidate progression through
 * recruitment stages with conversion and dropoff rates.
 *
 * Features:
 * - Visual funnel representation
 * - Conversion percentage between stages
 * - Dropoff indicators
 * - Interactive stage selection
 *
 * @example
 * ```tsx
 * <HiringFunnel
 *   stages={[
 *     { stage: "Triagem", count: 100, conversionRate: 100 },
 *     { stage: "Entrevista RH", count: 60, conversionRate: 60, dropoffRate: 40 },
 *     { stage: "Técnica", count: 30, conversionRate: 30, dropoffRate: 50 },
 *   ]}
 *   onStageClick={(stage) => console.log(stage)}
 * />
 * ```
 */
export function HiringFunnel({
  stages,
  onStageClick,
  className,
  ...props
}: HiringFunnelProps) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1)

  return (
    <Card className={cn(className)} {...props}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="size-5 text-primary" />
          Funil de Contratação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {stages.map((stage, index) => {
            const widthPercentage = (stage.count / maxCount) * 100
            const isClickable = !!onStageClick

            return (
              <div key={stage.stage} className="space-y-1">
                <button
                  type="button"
                  onClick={() => onStageClick?.(stage)}
                  disabled={!isClickable}
                  className={cn(
                    "w-full text-left transition-all",
                    isClickable && "hover:scale-[1.02] cursor-pointer",
                    !isClickable && "cursor-default"
                  )}
                >
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{stage.stage}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">
                        {stage.count} candidatos
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {stage.conversionRate}%
                      </span>
                    </div>
                  </div>

                  {/* Funnel bar */}
                  <div className="flex justify-center">
                    <div
                      className={cn(
                        "h-10 rounded-md flex items-center justify-center transition-all",
                        "bg-gradient-to-r from-primary/80 to-primary",
                        isClickable && "hover:from-primary hover:to-primary/90"
                      )}
                      style={{ width: `${widthPercentage}%` }}
                    >
                      <span className="text-xs font-medium text-primary-foreground">
                        {stage.conversionRate}%
                      </span>
                    </div>
                  </div>
                </button>

                {/* Dropoff indicator */}
                {stage.dropoffRate !== undefined && stage.dropoffRate > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pl-2">
                    <TrendingDown className="size-3 text-destructive" />
                    <span>
                      {stage.dropoffRate}% de perda para o próximo estágio
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Taxa de conversão total</span>
            <span className="font-medium">
              {stages.length > 0
                ? `${stages[stages.length - 1].conversionRate}%`
                : "0%"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
