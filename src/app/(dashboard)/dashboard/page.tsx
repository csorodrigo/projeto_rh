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
  TrendingDown,
  Clock,
  Calendar,
  FileText,
  Heart,
  Loader2,
  Cake,
  Shield,
  Timer,
} from "lucide-react"
import { toast } from "sonner"
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts"

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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  getCurrentProfile,
  getDashboardStats,
  getRecentActivity,
  type DashboardStats,
  type RecentActivity as RecentActivityType,
} from "@/lib/supabase/queries"
import { WidgetsContainer } from "@/components/dashboard/widgets-container"
import { StatsContainer } from "@/components/dashboard/stats-container"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ElementType
  trend?: {
    value: number
    label: string
    isPositive?: boolean
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
    default: {
      bg: "bg-blue-100 dark:bg-blue-950",
      text: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-500/10 hover:bg-blue-500/20 dark:bg-blue-500/20 dark:hover:bg-blue-500/30",
    },
    success: {
      bg: "bg-green-100 dark:bg-green-950",
      text: "text-green-600 dark:text-green-400",
      iconBg: "bg-green-500/10 hover:bg-green-500/20 dark:bg-green-500/20 dark:hover:bg-green-500/30",
    },
    warning: {
      bg: "bg-amber-100 dark:bg-amber-950",
      text: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-500/10 hover:bg-amber-500/20 dark:bg-amber-500/20 dark:hover:bg-amber-500/30",
    },
    danger: {
      bg: "bg-red-100 dark:bg-red-950",
      text: "text-red-600 dark:text-red-400",
      iconBg: "bg-red-500/10 hover:bg-red-500/20 dark:bg-red-500/20 dark:hover:bg-red-500/30",
    },
  }

  const styles = variantStyles[variant]

  return (
    <Card className="transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className={`rounded-full p-3 transition-all duration-200 ${styles.iconBg}`}
        >
          <Icon className={`size-6 ${styles.text}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1.5 mt-3">
            {trend.isPositive !== false ? (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <TrendingUp className="size-4" />
                <span className="text-sm font-semibold">+{trend.value}%</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <TrendingDown className="size-4" />
                <span className="text-sm font-semibold">{trend.value}%</span>
              </div>
            )}
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

// Mock data for charts (will be replaced with real data from Supabase)
const attendanceData = [
  { day: "Seg", presentes: 42, ausentes: 3 },
  { day: "Ter", presentes: 45, ausentes: 0 },
  { day: "Qua", presentes: 43, ausentes: 2 },
  { day: "Qui", presentes: 44, ausentes: 1 },
  { day: "Sex", presentes: 41, ausentes: 4 },
  { day: "Sab", presentes: 15, ausentes: 30 },
  { day: "Dom", presentes: 0, ausentes: 45 },
]

const absenceTypeData = [
  { name: "Férias", value: 15, color: "#3b82f6" },
  { name: "Atestado", value: 8, color: "#ef4444" },
  { name: "Falta", value: 2, color: "#f59e0b" },
  { name: "Folga", value: 5, color: "#10b981" },
]

const hoursWorkedData = [
  { employee: "João", esperado: 176, trabalhado: 180 },
  { employee: "Maria", esperado: 176, trabalhado: 172 },
  { employee: "Pedro", esperado: 176, trabalhado: 185 },
  { employee: "Ana", esperado: 176, trabalhado: 176 },
  { employee: "Carlos", esperado: 176, trabalhado: 168 },
]

interface UpcomingEvent {
  id: string
  type: "vacation" | "aso" | "birthday"
  title: string
  date: string
  description: string
}

const upcomingEvents: UpcomingEvent[] = [
  {
    id: "1",
    type: "vacation",
    title: "Férias - João Silva",
    date: "2024-02-15",
    description: "15 dias de férias",
  },
  {
    id: "2",
    type: "aso",
    title: "ASO Vencendo - Maria Santos",
    date: "2024-02-20",
    description: "Renovação obrigatória",
  },
  {
    id: "3",
    type: "birthday",
    title: "Aniversário - Pedro Costa",
    date: "2024-02-18",
    description: "Completando 35 anos",
  },
  {
    id: "4",
    type: "vacation",
    title: "Férias - Ana Paula",
    date: "2024-02-25",
    description: "10 dias de férias",
  },
]

// Mock data for birthdays
const mockBirthdays = [
  {
    id: "1",
    name: "Pedro Costa",
    initials: "PC",
    age: 35,
    date: "18 de Fevereiro",
  },
  {
    id: "2",
    name: "Ana Silva",
    initials: "AS",
    age: 28,
    date: "20 de Fevereiro",
  },
]

// Mock data for absent employees
const mockAbsentees = [
  {
    id: "1",
    name: "João Silva",
    initials: "JS",
    reason: "vacation" as const,
    reason_label: "Férias",
  },
  {
    id: "2",
    name: "Maria Santos",
    initials: "MS",
    reason: "medical" as const,
    reason_label: "Atestado Médico",
  },
]

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

  const getEventIcon = (type: UpcomingEvent["type"]) => {
    switch (type) {
      case "vacation":
        return Plane
      case "aso":
        return Shield
      case "birthday":
        return Cake
      default:
        return Calendar
    }
  }

  const getEventBadgeVariant = (
    type: UpcomingEvent["type"]
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case "vacation":
        return "default"
      case "aso":
        return "destructive"
      case "birthday":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bem-vindo ao sistema de gestão de RH
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Stats Grid - Real Data from Supabase */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsContainer />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Attendance Chart */}
        <Card className="col-span-full lg:col-span-2">
          <CardHeader>
            <CardTitle>Presença nos Últimos 7 Dias</CardTitle>
            <CardDescription>
              Acompanhamento diário de presença e ausências
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                presentes: {
                  label: "Presentes",
                  color: "hsl(142, 76%, 36%)",
                },
                ausentes: {
                  label: "Ausentes",
                  color: "hsl(0, 84%, 60%)",
                },
              }}
              className="h-[300px]"
            >
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="day"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="presentes"
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="ausentes"
                  stroke="hsl(0, 84%, 60%)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Absence Types Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tipos de Ausência</CardTitle>
            <CardDescription>Distribuição por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: "Quantidade",
                },
              }}
              className="h-[300px] !aspect-auto w-full"
            >
              <PieChart>
                <Pie
                  data={absenceTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {absenceTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Hours Worked Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Horas Trabalhadas - Top 5 Funcionários</CardTitle>
          <CardDescription>
            Comparação entre horas esperadas e trabalhadas no mês
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              esperado: {
                label: "Esperado",
                color: "hsl(var(--muted))",
              },
              trabalhado: {
                label: "Trabalhado",
                color: "hsl(221, 83%, 53%)",
              },
            }}
            className="h-[300px]"
          >
            <BarChart data={hoursWorkedData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="employee"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar
                dataKey="esperado"
                fill="hsl(var(--muted))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="trabalhado"
                fill="hsl(221, 83%, 53%)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Widgets Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Widgets with Real Data */}
        <WidgetsContainer />

        {/* Upcoming Events */}
        <Card className="transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-950">
                <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-base">Próximos Eventos</CardTitle>
                <CardDescription>Datas importantes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.slice(0, 3).map((event) => {
                const Icon = getEventIcon(event.type)
                return (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className="bg-muted rounded-lg p-2.5">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">
                          {event.title}
                        </span>
                        <Badge
                          variant={getEventBadgeVariant(event.type)}
                          className="text-xs"
                        >
                          {event.type === "vacation"
                            ? "Férias"
                            : event.type === "aso"
                              ? "ASO"
                              : "Aniversário"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {event.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(event.date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-base">Ações Rápidas</CardTitle>
            <CardDescription>Funcionalidades mais usadas</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {quickActions.map((action) => (
              <QuickAction key={action.title} {...action} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-3">
          <RecentActivityList items={recentActivity} />
        </div>
      </div>
    </div>
  )
}
