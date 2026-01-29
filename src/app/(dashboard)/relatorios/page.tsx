"use client"

import * as React from "react"
import {
  Download,
  FileText,
  Clock,
  Calendar,
  Users,
  FolderKanban,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

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
import { ReportCategoryCard } from "@/components/relatorios/report-category-card"

const categories = [
  {
    id: 'ponto',
    title: 'Registro de ponto',
    description: 'Relatórios de horas trabalhadas, banco de horas e frequência',
    icon: Clock,
    iconColor: 'text-green-600',
    iconBgColor: 'bg-green-100',
    reportCount: 5,
  },
  {
    id: 'ausencias',
    title: 'Férias e ausências',
    description: 'Relatórios de férias, atestados e faltas',
    icon: Calendar,
    iconColor: 'text-orange-600',
    iconBgColor: 'bg-orange-100',
    reportCount: 4,
  },
  {
    id: 'dados-pessoais',
    title: 'Dados pessoais',
    description: 'Relatórios de aniversariantes, documentos e informações cadastrais',
    icon: Users,
    iconColor: 'text-blue-600',
    iconBgColor: 'bg-blue-100',
    reportCount: 3,
  },
  {
    id: 'projetos',
    title: 'Projetos e tarefas',
    description: 'Relatórios de PDI, avaliações e desenvolvimento',
    icon: FolderKanban,
    iconColor: 'text-pink-600',
    iconBgColor: 'bg-pink-100',
    reportCount: 2,
  },
]

const legalReports = [
  {
    id: "aej",
    title: "Arquivo AEJ",
    description: "Registro Eletrônico de Jornada - Portaria 671 MTE",
    icon: FileText,
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    id: "afd",
    title: "Arquivo AFD",
    description: "Arquivo Fonte de Dados - Sistema de Ponto Eletrônico",
    icon: FileText,
    color: "bg-cyan-100 text-cyan-600",
  },
]

export default function RelatoriosPage() {
  const router = useRouter()
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
      <div>
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground">
          Escolha uma categoria para visualizar os relatórios disponíveis
        </p>
      </div>

      {/* Report Categories */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {categories.map((category) => (
          <ReportCategoryCard
            key={category.id}
            {...category}
            onClick={() => router.push(`/relatorios/${category.id}`)}
          />
        ))}
      </div>

      {/* Legal Reports Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Relatórios Legais</h2>
          <p className="text-sm text-muted-foreground">
            Arquivos obrigatórios do Ministério do Trabalho
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {legalReports.map((report) => {
            const Icon = report.icon

            return (
              <Card key={report.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`rounded-lg p-3 ${report.color}`}>
                      <Icon className="size-5" />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setReportDialog(report.id as "aej" | "afd")}
                    >
                      <Download className="mr-2 size-4" />
                      Gerar
                    </Button>
                  </div>
                  <CardTitle className="mt-4">{report.title}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Indicadores Rápidos</CardTitle>
          <CardDescription>Métricas do mês atual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-blue-600">{stats.totalEmployees}</p>
              <p className="text-sm text-muted-foreground">Funcionários ativos</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-green-600">{stats.attendanceRate}%</p>
              <p className="text-sm text-muted-foreground">Taxa de presença</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-yellow-600">{stats.turnoverRate}%</p>
              <p className="text-sm text-muted-foreground">Turnover mensal</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-purple-600">{stats.overtimeHours}h</p>
              <p className="text-sm text-muted-foreground">Horas extras mês</p>
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
