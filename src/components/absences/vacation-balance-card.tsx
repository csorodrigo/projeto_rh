"use client"

import { format, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar, AlertTriangle, Clock, Sun } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import type { VacationBalance } from "@/types/database"

interface VacationBalanceCardProps {
  balance: VacationBalance
  compact?: boolean
}

export function VacationBalanceCard({ balance, compact = false }: VacationBalanceCardProps) {
  const today = new Date()
  const expiresAt = balance.expires_at ? new Date(balance.expires_at) : null
  const daysUntilExpiry = expiresAt ? differenceInDays(expiresAt, today) : null

  const usedPercentage = balance.accrued_days > 0
    ? ((balance.used_days + balance.sold_days) / balance.accrued_days) * 100
    : 0

  const getExpiryStatus = () => {
    if (!daysUntilExpiry) return null
    if (daysUntilExpiry < 0) return { label: "Vencido", color: "destructive" as const }
    if (daysUntilExpiry <= 30) return { label: "Crítico", color: "destructive" as const }
    if (daysUntilExpiry <= 90) return { label: "Atenção", color: "outline" as const }
    return null
  }

  const expiryStatus = getExpiryStatus()

  if (compact) {
    return (
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 text-blue-600 rounded-lg p-2">
            <Sun className="size-5" />
          </div>
          <div>
            <p className="font-medium">{balance.available_days} dias disponíveis</p>
            <p className="text-sm text-muted-foreground">
              Período: {format(new Date(balance.period_start), "dd/MM/yy")} -{" "}
              {format(new Date(balance.period_end), "dd/MM/yy")}
            </p>
          </div>
        </div>
        {expiryStatus && (
          <Badge variant={expiryStatus.color}>
            {expiryStatus.label}
          </Badge>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sun className="size-5 text-yellow-500" />
            Saldo de Férias
          </CardTitle>
          {expiryStatus && (
            <Badge variant={expiryStatus.color} className="gap-1">
              <AlertTriangle className="size-3" />
              {expiryStatus.label}
            </Badge>
          )}
        </div>
        <CardDescription>
          Período aquisitivo: {format(new Date(balance.period_start), "dd/MM/yyyy", { locale: ptBR })} a{" "}
          {format(new Date(balance.period_end), "dd/MM/yyyy", { locale: ptBR })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Saldo principal */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-primary">{balance.available_days}</p>
            <p className="text-sm text-muted-foreground">dias disponíveis</p>
          </div>
          <div className="text-right">
            <p className="text-sm">
              <span className="font-medium">{balance.accrued_days}</span> acumulados
            </p>
            <p className="text-sm">
              <span className="font-medium">{balance.used_days}</span> utilizados
            </p>
            {balance.sold_days > 0 && (
              <p className="text-sm">
                <span className="font-medium">{balance.sold_days}</span> vendidos
              </p>
            )}
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Utilização</span>
            <span>{Math.round(usedPercentage)}%</span>
          </div>
          <Progress value={usedPercentage} className="h-2" />
        </div>

        {/* Validade */}
        {expiresAt && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Vence em:</span>
            <span className={daysUntilExpiry && daysUntilExpiry <= 30 ? "text-destructive font-medium" : ""}>
              {format(expiresAt, "dd/MM/yyyy", { locale: ptBR })}
              {daysUntilExpiry && daysUntilExpiry > 0 && (
                <span className="ml-1">({daysUntilExpiry} dias)</span>
              )}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface VacationBalanceListProps {
  balances: VacationBalance[]
  emptyMessage?: string
}

export function VacationBalanceList({ balances, emptyMessage = "Nenhum saldo de férias disponível" }: VacationBalanceListProps) {
  if (balances.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Calendar className="size-12 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {balances.map((balance) => (
        <VacationBalanceCard key={balance.id} balance={balance} />
      ))}
    </div>
  )
}
