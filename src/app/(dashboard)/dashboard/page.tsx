"use client"

import * as React from "react"
import Link from "next/link"
import {
  Users,
  UserCheck,
  Plane,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Calendar,
  FileText,
  Heart,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  getCurrentProfile,
  getDashboardStats,
  getRecentActivity,
  type DashboardStats,
  type RecentActivity as RecentActivityType,
} from "@/lib/supabase/queries"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ElementType
  trend?: {
    value: number
    label: string
  }
  variant?: "default" | "success" | "warning" | "danger"
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = "default",
}: StatCardProps) {
  const variantStyles = {
    default: "bg-primary/10 text-primary",
    success: "bg-green-500/10 text-green-600",
    warning: "bg-yellow-500/10 text-yellow-600",
    danger: "bg-red-500/10 text-red-600",
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`rounded-lg p-2 ${variantStyles[variant]}`}>
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="size-3 text-green-600" />
            <span className="text-xs text-green-600">+{trend.value}%</span>
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface QuickActionProps {
  title: string
  description: string
  icon: React.ElementType
  href: string
}

function QuickAction({ title, description, icon: Icon, href }: QuickActionProps) {
  return (
    <Link href={href}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer group">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="bg-primary/10 text-primary rounded-lg p-2">
            <Icon className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{title}</h4>
            <p className="text-sm text-muted-foreground truncate">{description}</p>
          </div>
          <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </CardContent>
      </Card>
    </Link>
  )
}

function RecentActivityList({ items }: { items: RecentActivityType[] }) {
  const getIcon = (type: RecentActivityType["type"]) => {
    switch (type) {
      case "ponto":
        return Clock
      case "ausencia":
        return Plane
      case "funcionario":
        return Users
      case "aso":
        return Heart
      default:
        return FileText
    }
  }

  const getBadgeVariant = (type: RecentActivityType["type"]) => {
    switch (type) {
      case "ponto":
        return "default"
      case "ausencia":
        return "secondary"
      case "funcionario":
        return "outline"
      case "aso":
        return "destructive"
      default:
        return "default"
    }
  }

  const typeLabels: Record<string, string> = {
    ponto: "Ponto",
    ausencia: "Ausência",
    funcionario: "Funcionário",
    aso: "ASO",
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Ultimas movimentacoes do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="mx-auto size-10 opacity-50 mb-2" />
            <p>Nenhuma atividade recente</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade Recente</CardTitle>
        <CardDescription>Ultimas movimentacoes do sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => {
            const Icon = getIcon(item.type)
            return (
              <div key={item.id} className="flex items-start gap-4">
                <div className="bg-muted rounded-full p-2">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{item.title}</span>
                    <Badge variant={getBadgeVariant(item.type)} className="text-xs">
                      {typeLabels[item.type] || item.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {item.description}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {item.time}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [stats, setStats] = React.useState<DashboardStats>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    expiringASOs: 0,
    overtimeHours: 0,
    attendanceRate: 0,
  })
  const [recentActivity, setRecentActivity] = React.useState<RecentActivityType[]>([])

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

        // Load data in parallel
        const [statsResult, activityResult] = await Promise.all([
          getDashboardStats(companyId),
          getRecentActivity(companyId),
        ])

        setStats(statsResult)
        setRecentActivity(activityResult)
      } catch {
        toast.error("Erro ao carregar dados do dashboard")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const quickActions: QuickActionProps[] = [
    {
      title: "Registrar Ponto",
      description: "Registrar entrada ou saida",
      icon: Clock,
      href: "/ponto",
    },
    {
      title: "Solicitar Ausencia",
      description: "Ferias, atestados e folgas",
      icon: Calendar,
      href: "/ausencias",
    },
    {
      title: "Ver Funcionarios",
      description: "Lista completa de funcionarios",
      icon: Users,
      href: "/funcionarios",
    },
    {
      title: "Gerar Relatorio",
      description: "Relatorios personalizados",
      icon: FileText,
      href: "/relatorios",
    },
  ]

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
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao sistema de gestao de RH
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Funcionarios"
          value={stats.totalEmployees}
          description="Funcionarios ativos"
          icon={Users}
        />
        <StatCard
          title="Presentes Hoje"
          value={stats.presentToday}
          description={`${stats.attendanceRate}% de presenca`}
          icon={UserCheck}
          variant="success"
        />
        <StatCard
          title="Ferias/Ausentes"
          value={stats.absentToday}
          description="Funcionarios ausentes hoje"
          icon={Plane}
          variant="warning"
        />
        <StatCard
          title="ASOs Vencendo"
          value={stats.expiringASOs}
          description="Nos proximos 30 dias"
          icon={AlertTriangle}
          variant="danger"
        />
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acoes Rapidas</CardTitle>
            <CardDescription>Acesse as funcionalidades mais usadas</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {quickActions.map((action) => (
              <QuickAction key={action.title} {...action} />
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <RecentActivityList items={recentActivity} />
      </div>

      {/* Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Estatisticas de Ponto</CardTitle>
          <CardDescription>Visao geral do mes atual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
              <TrendingUp className="mx-auto size-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                Grafico de estatisticas sera exibido aqui
              </p>
              <Button variant="link" className="mt-2" asChild>
                <Link href="/relatorios">Ver relatorios detalhados</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
