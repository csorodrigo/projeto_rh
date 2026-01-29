"use client"

import * as React from "react"
import { Briefcase, Users, Clock, TrendingUp, Target } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export interface RecruitmentStatsData {
  totalOpenJobs: number
  totalCandidates: number
  avgTimeToHire: number
  conversionRate: number
  candidatesByStage?: Array<{
    stage: string
    count: number
  }>
}

export interface RecruitmentStatsProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Statistics data
   */
  data?: RecruitmentStatsData
  /**
   * Loading state
   */
  isLoading?: boolean
}

/**
 * RecruitmentStats Component
 *
 * Displays key recruitment metrics in a grid of KPI cards.
 * Shows total jobs, candidates, time to hire, and conversion rate.
 *
 * @example
 * ```tsx
 * <RecruitmentStats
 *   data={{
 *     totalOpenJobs: 12,
 *     totalCandidates: 85,
 *     avgTimeToHire: 21,
 *     conversionRate: 15,
 *   }}
 * />
 * ```
 */
export function RecruitmentStats({
  data,
  isLoading = false,
  className,
  ...props
}: RecruitmentStatsProps) {
  if (isLoading) {
    return (
      <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) {
    return null
  }

  const stats = [
    {
      title: "Vagas Abertas",
      value: data.totalOpenJobs,
      description: "Posições em aberto",
      icon: Briefcase,
      color: "text-purple-600",
    },
    {
      title: "Candidatos",
      value: data.totalCandidates,
      description: "No pipeline",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Tempo Médio",
      value: `${data.avgTimeToHire}d`,
      description: "Para contratação",
      icon: Clock,
      color: "text-green-600",
    },
    {
      title: "Taxa de Conversão",
      value: `${data.conversionRate}%`,
      description: "Candidatos contratados",
      icon: TrendingUp,
      color: "text-orange-600",
    },
  ]

  return (
    <div
      className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}
      {...props}
    >
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className={cn("size-4", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        )
      })}

      {/* Candidates by Stage Mini Chart */}
      {data.candidatesByStage && data.candidatesByStage.length > 0 && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="size-4 text-pink-600" />
              Candidatos por Estágio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.candidatesByStage.map((stage) => {
                const percentage =
                  (stage.count / data.totalCandidates) * 100 || 0
                return (
                  <div key={stage.stage} className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{stage.stage}</span>
                        <span className="text-muted-foreground">
                          {stage.count}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
