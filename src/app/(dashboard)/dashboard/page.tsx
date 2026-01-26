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
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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

interface RecentActivityItem {
  id: string
  type: "ponto" | "ausencia" | "funcionario" | "aso"
  title: string
  description: string
  time: string
}

function RecentActivity({ items }: { items: RecentActivityItem[] }) {
  const getIcon = (type: RecentActivityItem["type"]) => {
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

  const getBadgeVariant = (type: RecentActivityItem["type"]) => {
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
                      {item.type}
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
  // Placeholder data - will be replaced with real data from API
  const stats = {
    totalFuncionarios: 125,
    presentesHoje: 118,
    feriasAusentes: 7,
    asosVencendo: 4,
  }

  const recentActivity: RecentActivityItem[] = [
    {
      id: "1",
      type: "ponto",
      title: "Registro de Ponto",
      description: "Maria Silva registrou entrada as 08:00",
      time: "5 min",
    },
    {
      id: "2",
      type: "ausencia",
      title: "Solicitacao de Ferias",
      description: "Joao Santos solicitou ferias para Janeiro",
      time: "1 hora",
    },
    {
      id: "3",
      type: "funcionario",
      title: "Novo Funcionario",
      description: "Pedro Costa foi cadastrado no sistema",
      time: "2 horas",
    },
    {
      id: "4",
      type: "aso",
      title: "ASO Vencendo",
      description: "Ana Oliveira com ASO vencendo em 7 dias",
      time: "3 horas",
    },
    {
      id: "5",
      type: "ponto",
      title: "Ajuste de Ponto",
      description: "Carlos Lima solicitou ajuste de ponto",
      time: "5 horas",
    },
  ]

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
          value={stats.totalFuncionarios}
          description="Funcionarios ativos"
          icon={Users}
          trend={{ value: 2.5, label: "vs mes anterior" }}
        />
        <StatCard
          title="Presentes Hoje"
          value={stats.presentesHoje}
          description={`${Math.round((stats.presentesHoje / stats.totalFuncionarios) * 100)}% de presenca`}
          icon={UserCheck}
          variant="success"
        />
        <StatCard
          title="Ferias/Ausentes"
          value={stats.feriasAusentes}
          description="Funcionarios ausentes hoje"
          icon={Plane}
          variant="warning"
        />
        <StatCard
          title="ASOs Vencendo"
          value={stats.asosVencendo}
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
        <RecentActivity items={recentActivity} />
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
