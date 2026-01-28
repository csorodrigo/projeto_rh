"use client"

import * as React from "react"
import {
  BarChart3,
  Download,
  FileText,
  Users,
  Clock,
  Calendar,
  TrendingUp,
  PieChart,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  getCurrentProfile,
  getReportStats,
} from "@/lib/supabase/queries"
import { ReportGeneratorDialog } from "@/components/reports/ReportGeneratorDialog"

const reportTypes = [
  {
    id: "employees",
    title: "Quadro de Funcionarios",
    description: "Lista completa com todos os dados dos funcionarios",
    icon: Users,
    color: "bg-blue-100 text-blue-600",
    disabled: true,
  },
  {
    id: "time_tracking",
    title: "Espelho de Ponto",
    description: "Relatorio de marcacoes de ponto por periodo",
    icon: Clock,
    color: "bg-green-100 text-green-600",
    disabled: true,
  },
  {
    id: "overtime",
    title: "Horas Extras",
    description: "Detalhamento de horas extras por funcionario",
    icon: TrendingUp,
    color: "bg-yellow-100 text-yellow-600",
    disabled: true,
  },
  {
    id: "absences",
    title: "Ausencias e Ferias",
    description: "Relatorio de faltas, ferias e licencas",
    icon: Calendar,
    color: "bg-purple-100 text-purple-600",
    disabled: true,
  },
  {
    id: "payroll",
    title: "Folha de Pagamento",
    description: "Resumo da folha por periodo",
    icon: FileText,
    color: "bg-pink-100 text-pink-600",
    disabled: true,
  },
  {
    id: "turnover",
    title: "Turnover",
    description: "Analise de rotatividade de funcionarios",
    icon: PieChart,
    color: "bg-red-100 text-red-600",
    disabled: true,
  },
  {
    id: "aej",
    title: "Arquivo AEJ",
    description: "Registro Eletronico de Jornada - Portaria 671 MTE",
    icon: FileText,
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    id: "afd",
    title: "Arquivo AFD",
    description: "Arquivo Fonte de Dados - Sistema de Ponto Eletronico",
    icon: FileText,
    color: "bg-cyan-100 text-cyan-600",
  },
]

export default function RelatoriosPage() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [reportDialog, setReportDialog] = React.useState<"aej" | "afd" | null>(null)
  const [stats, setStats] = React.useState({
    totalEmployees: 0,
    attendanceRate: 0,
    turnoverRate: 0,
    overtimeHours: 0,
  })

  React.useEffect(() => {
    async function loadData() {
      try {
        const profileResult = await getCurrentProfile()
        if (profileResult.error || !profileResult.data?.company_id) {
          toast.error("Erro ao carregar perfil")
          setIsLoading(false)
          return
        }

        const companyId = profileResult.data.company_id
        const statsResult = await getReportStats(companyId)
        setStats(statsResult)
      } catch {
        toast.error("Erro ao carregar estatísticas")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatorios</h1>
          <p className="text-muted-foreground">
            Gere relatorios personalizados
          </p>
        </div>
      </div>

      {/* Report Types Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report) => {
          const Icon = report.icon
          const isAEJorAFD = report.id === "aej" || report.id === "afd"
          const isDisabled = report.disabled ?? false

          return (
            <Card key={report.id} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`rounded-lg p-3 ${report.color}`}>
                    <Icon className="size-5" />
                  </div>
                  {isAEJorAFD ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setReportDialog(report.id as "aej" | "afd")}
                    >
                      <Download className="mr-2 size-4" />
                      Gerar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isDisabled}
                      title={isDisabled ? "Em breve" : undefined}
                    >
                      <Download className="mr-2 size-4" />
                      {isDisabled ? "Em breve" : "Gerar"}
                    </Button>
                  )}
                </div>
                <CardTitle className="mt-4">{report.title}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
            </Card>
          )
        })}
      </div>

      {/* Charts Placeholder */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Funcionarios por Departamento</CardTitle>
            <CardDescription>Distribuicao atual do quadro</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
              <div className="text-center">
                <PieChart className="mx-auto size-10 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Grafico de distribuicao
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evolucao do Quadro</CardTitle>
            <CardDescription>Admissoes e desligamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
              <div className="text-center">
                <BarChart3 className="mx-auto size-10 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Grafico de evolucao
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Indicadores Rapidos</CardTitle>
          <CardDescription>Metricas do mes atual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-blue-600">{stats.totalEmployees}</p>
              <p className="text-sm text-muted-foreground">Funcionarios ativos</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-green-600">{stats.attendanceRate}%</p>
              <p className="text-sm text-muted-foreground">Taxa de presenca</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-yellow-600">{stats.turnoverRate}%</p>
              <p className="text-sm text-muted-foreground">Turnover mensal</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-purple-600">{stats.overtimeHours}h</p>
              <p className="text-sm text-muted-foreground">Horas extras mes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Generator Dialog */}
      <ReportGeneratorDialog
        reportType={reportDialog}
        open={!!reportDialog}
        onOpenChange={(open) => !open && setReportDialog(null)}
      />
    </div>
  )
}
