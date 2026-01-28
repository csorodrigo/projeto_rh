"use client"

import * as React from "react"
import { Clock, TrendingUp, TrendingDown, Minus } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface TimeSummaryCardProps {
  type: "worked" | "bank" | "overtime" | "expected"
  minutes: number
  label: string
  expectedMinutes?: number
  className?: string
}

export function TimeSummaryCard({
  type,
  minutes,
  label,
  expectedMinutes,
  className,
}: TimeSummaryCardProps) {
  const formatMinutes = (mins: number): string => {
    const hours = Math.floor(Math.abs(mins) / 60)
    const remainingMins = Math.abs(mins) % 60
    const sign = mins < 0 ? "-" : ""
    return `${sign}${hours.toString().padStart(2, "0")}:${remainingMins.toString().padStart(2, "0")}`
  }

  const getTypeConfig = () => {
    switch (type) {
      case "worked":
        return {
          icon: Clock,
          color: "text-emerald-600 dark:text-emerald-400",
          bgColor: "bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-950 dark:to-green-950",
          iconBg: "bg-gradient-to-br from-emerald-500 to-green-500",
          borderColor: "border-emerald-200/50 dark:border-emerald-800/50",
        }
      case "bank":
        return {
          icon: minutes >= 0 ? TrendingUp : TrendingDown,
          color:
            minutes >= 0
              ? "text-blue-600 dark:text-cyan-400"
              : "text-orange-600 dark:text-red-400",
          bgColor:
            minutes >= 0
              ? "bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-950 dark:to-cyan-950"
              : "bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-950 dark:to-red-950",
          iconBg:
            minutes >= 0
              ? "bg-gradient-to-br from-blue-500 to-cyan-500"
              : "bg-gradient-to-br from-orange-500 to-red-500",
          borderColor:
            minutes >= 0
              ? "border-blue-200/50 dark:border-blue-800/50"
              : "border-orange-200/50 dark:border-orange-800/50",
        }
      case "overtime":
        return {
          icon: TrendingUp,
          color: "text-amber-600 dark:text-amber-400",
          bgColor: "bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-950 dark:to-yellow-950",
          iconBg: "bg-gradient-to-br from-amber-500 to-yellow-500",
          borderColor: "border-amber-200/50 dark:border-amber-800/50",
        }
      case "expected":
        return {
          icon: Minus,
          color: "text-slate-600 dark:text-slate-400",
          bgColor: "bg-gradient-to-br from-slate-100 to-gray-100 dark:from-slate-950 dark:to-gray-950",
          iconBg: "bg-gradient-to-br from-slate-400 to-gray-400",
          borderColor: "border-slate-200/50 dark:border-slate-800/50",
        }
      default:
        return {
          icon: Clock,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          iconBg: "bg-gray-400",
          borderColor: "border-gray-200",
        }
    }
  }

  const config = getTypeConfig()
  const Icon = config.icon

  const progressPercentage = expectedMinutes
    ? Math.min((minutes / expectedMinutes) * 100, 100)
    : null

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg border-2",
      config.bgColor,
      config.borderColor,
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription className="text-sm font-semibold">{label}</CardDescription>
        <div className={cn("rounded-full p-2.5 shadow-md transition-transform hover:scale-110", config.iconBg)}>
          <Icon className="size-5 text-white" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span
            className={cn("text-3xl font-bold tabular-nums transition-all", config.color)}
            aria-label={`${label}: ${formatMinutes(minutes)}`}
          >
            {formatMinutes(minutes)}
          </span>
          {type === "bank" && (
            <span className={cn("text-sm font-semibold", config.color)}>
              {minutes >= 0 ? "crédito" : "débito"}
            </span>
          )}
        </div>
        {progressPercentage !== null && (
          <div className="mt-3">
            <div
              className="h-2 w-full rounded-full bg-white/50 dark:bg-black/30 overflow-hidden shadow-inner"
              role="progressbar"
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progresso: ${progressPercentage.toFixed(0)}%`}
            >
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700 ease-out shadow-lg relative overflow-hidden",
                  config.iconBg
                )}
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground font-medium">
              {progressPercentage.toFixed(0)}% da jornada
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
