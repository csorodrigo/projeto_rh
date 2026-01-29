"use client"

import * as React from "react"
import Link from "next/link"
import {
  Shield,
  AlertTriangle,
  Clock,
  MoonStar,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  getComplianceAlerts,
  type ComplianceAlert,
} from "@/lib/supabase/queries/compliance-alerts"

interface ComplianceAlertsWidgetProps {
  companyId: string
}

// Configuração de ícones e cores por tipo de alerta
const alertConfig = {
  missing_records: {
    icon: AlertTriangle,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-950",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  overtime_violation: {
    icon: Clock,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-950",
    borderColor: "border-red-200 dark:border-red-800",
  },
  rest_violation: {
    icon: MoonStar,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-950",
    borderColor: "border-red-200 dark:border-red-800",
  },
  missing_pis: {
    icon: AlertCircle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-950",
    borderColor: "border-red-200 dark:border-red-800",
  },
  duplicate_records: {
    icon: AlertTriangle,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-950",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
}

interface AlertItemProps {
  alert: ComplianceAlert
}

function AlertItem({ alert }: AlertItemProps) {
  const config = alertConfig[alert.type]
  const Icon = config.icon

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border ${config.borderColor} ${config.bgColor} transition-all hover:shadow-sm`}
    >
      <div className={`mt-0.5 ${config.color}`}>
        <Icon className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-sm">{alert.title}</h4>
          <Badge
            variant={alert.severity === "error" ? "destructive" : "secondary"}
            className="text-xs"
          >
            {alert.count}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-2">{alert.description}</p>

        {alert.affectedEmployees && alert.affectedEmployees.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-xs text-muted-foreground/80 truncate cursor-help">
                  {alert.affectedEmployees.slice(0, 2).join(", ")}
                  {alert.affectedEmployees.length > 2 &&
                    ` e mais ${alert.affectedEmployees.length - 2}`}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-semibold text-xs mb-1">
                    Funcionários afetados:
                  </p>
                  {alert.affectedEmployees.map((employee, idx) => (
                    <p key={idx} className="text-xs">
                      • {employee}
                    </p>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {alert.actionLink && (
          <Link href={alert.actionLink}>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 mt-2 text-xs"
            >
              Corrigir problema
              <ExternalLink className="ml-1 size-3" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}

export function ComplianceAlertsWidget({ companyId }: ComplianceAlertsWidgetProps) {
  const [alerts, setAlerts] = React.useState<ComplianceAlert[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadAlerts() {
      try {
        const data = await getComplianceAlerts(companyId)
        setAlerts(data)
      } catch (error) {
        console.error("Erro ao carregar alertas de compliance:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAlerts()
  }, [companyId])

  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-950">
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-base">Alertas de Compliance</CardTitle>
            <CardDescription>Problemas que precisam de atenção</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="size-12 text-green-600 mx-auto mb-3" />
            <p className="font-medium text-sm mb-1">Tudo em conformidade!</p>
            <p className="text-xs text-muted-foreground">
              Nenhum problema detectado no momento
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {alerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t pt-4">
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href="/relatorios/compliance">
            Ver relatório completo
            <ExternalLink className="ml-2 size-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
