"use client"

import * as React from "react"
import { TrendingUp, Clock, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface TimeSummaryCardProps {
  type: 'worked' | 'bank' | 'overtime' | 'missing'
  minutes: number
  label?: string
}

function formatMinutesToHours(minutes: number): string {
  const hours = Math.floor(Math.abs(minutes) / 60)
  const mins = Math.abs(minutes) % 60
  const sign = minutes < 0 ? '-' : (minutes > 0 ? '+' : '')

  if (hours === 0) {
    return `${sign}${mins}min`
  }

  return `${sign}${hours}h ${mins > 0 ? `${mins}min` : ''}`
}

const cardConfig = {
  worked: {
    icon: TrendingUp,
    bgColor: "bg-green-100",
    iconColor: "text-green-600",
    defaultLabel: "Horas hoje",
  },
  bank: {
    icon: Clock,
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
    defaultLabel: "Banco de horas",
  },
  overtime: {
    icon: TrendingUp,
    bgColor: "bg-purple-100",
    iconColor: "text-purple-600",
    defaultLabel: "Horas extras",
  },
  missing: {
    icon: AlertTriangle,
    bgColor: "bg-red-100",
    iconColor: "text-red-600",
    defaultLabel: "Horas faltantes",
  },
}

export function TimeSummaryCard({ type, minutes, label }: TimeSummaryCardProps) {
  const config = cardConfig[type]
  const Icon = config.icon

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={`${config.bgColor} ${config.iconColor} rounded-lg p-3`}>
            <Icon className="size-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{formatMinutesToHours(minutes)}</p>
            <p className="text-sm text-muted-foreground">
              {label || config.defaultLabel}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
