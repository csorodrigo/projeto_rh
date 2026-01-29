"use client"

import * as React from "react"
import {
  Briefcase,
  Users,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react"
import { JobStats as JobStatsType } from "@/lib/types/recruitment"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface JobStatsProps {
  stats: JobStatsType | null
  isLoading?: boolean
}

export function JobStats({ stats, isLoading }: JobStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-4 rounded" />
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

  if (!stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <div className="text-center">
            <AlertCircle className="size-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar as estatísticas
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const statCards = [
    {
      title: "Vagas Abertas",
      value: stats.open_jobs,
      description: `${stats.total_jobs} vagas no total`,
      icon: Briefcase,
      trend: stats.open_jobs > 0 ? "positive" : "neutral",
    },
    {
      title: "Total de Candidatos",
      value: stats.total_applications,
      description: `+${stats.applications_this_week} esta semana`,
      icon: Users,
      trend: stats.applications_this_week > 0 ? "positive" : "neutral",
    },
    {
      title: "Em Processo",
      value: stats.in_process,
      description: "Candidatos em avaliação",
      icon: TrendingUp,
      trend: "neutral",
    },
    {
      title: "Tempo Médio",
      value: `${stats.avg_time_to_hire}d`,
      description: "Tempo médio de contratação",
      icon: Clock,
      trend: "neutral",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
