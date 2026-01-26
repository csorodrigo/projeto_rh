"use client"

import * as React from "react"
import Link from "next/link"
import {
  Plus,
  Target,
  TrendingUp,
  Users,
  Award,
  Sparkles,
  MoreHorizontal,
  Eye,
  MessageSquare,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Placeholder data
const pdis = [
  {
    id: "1",
    employee: "Maria Silva",
    title: "Desenvolvimento de Lideranca",
    progress: 75,
    status: "active",
    targetDate: "2024-06-30",
    goals: 4,
    completedGoals: 3,
  },
  {
    id: "2",
    employee: "Joao Santos",
    title: "Certificacao AWS",
    progress: 50,
    status: "active",
    targetDate: "2024-04-15",
    goals: 6,
    completedGoals: 3,
  },
  {
    id: "3",
    employee: "Pedro Costa",
    title: "Habilidades de Comunicacao",
    progress: 25,
    status: "active",
    targetDate: "2024-05-20",
    goals: 5,
    completedGoals: 1,
  },
]

const evaluationCycles = [
  {
    id: "1",
    name: "Avaliacao Q1 2024",
    status: "in_progress",
    startDate: "2024-01-15",
    endDate: "2024-02-15",
    completed: 45,
    total: 120,
  },
]

const statusColors: Record<string, { bg: string; text: string }> = {
  active: { bg: "bg-green-100", text: "text-green-700" },
  draft: { bg: "bg-gray-100", text: "text-gray-700" },
  completed: { bg: "bg-blue-100", text: "text-blue-700" },
  cancelled: { bg: "bg-red-100", text: "text-red-700" },
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-muted">
      <div
        className="h-2 rounded-full bg-primary transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

export default function PDIPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PDI</h1>
          <p className="text-muted-foreground">
            Planos de Desenvolvimento Individual com IA
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Sparkles className="mr-2 size-4" />
            Gerar PDI com IA
          </Button>
          <Button>
            <Plus className="mr-2 size-4" />
            Novo PDI
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 text-blue-600 rounded-lg p-3">
                <Target className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pdis.length}</p>
                <p className="text-sm text-muted-foreground">PDIs ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 text-green-600 rounded-lg p-3">
                <TrendingUp className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">67%</p>
                <p className="text-sm text-muted-foreground">Progresso medio</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 text-purple-600 rounded-lg p-3">
                <Users className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">45</p>
                <p className="text-sm text-muted-foreground">Avaliacoes pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-100 text-yellow-600 rounded-lg p-3">
                <Award className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">Metas concluidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pdis" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pdis" className="gap-2">
            <Target className="size-4" />
            PDIs
          </TabsTrigger>
          <TabsTrigger value="evaluations" className="gap-2">
            <Users className="size-4" />
            Avaliacoes 360
          </TabsTrigger>
          <TabsTrigger value="feedbacks" className="gap-2">
            <MessageSquare className="size-4" />
            Feedbacks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pdis">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pdis.map((pdi) => {
              const statusStyle = statusColors[pdi.status]
              return (
                <Card key={pdi.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {pdi.employee
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{pdi.employee}</CardTitle>
                          <CardDescription className="text-xs">
                            {pdi.title}
                          </CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 size-4" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MessageSquare className="mr-2 size-4" />
                            Adicionar check-in
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">{pdi.progress}%</span>
                      </div>
                      <ProgressBar value={pdi.progress} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {pdi.completedGoals}/{pdi.goals} metas
                      </span>
                      <Badge className={`${statusStyle.bg} ${statusStyle.text}`}>
                        {pdi.status === "active" ? "Ativo" : pdi.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Meta: {new Date(pdi.targetDate).toLocaleDateString("pt-BR")}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="evaluations">
          <Card>
            <CardHeader>
              <CardTitle>Ciclos de Avaliacao</CardTitle>
              <CardDescription>
                Avaliacoes 360 graus em andamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {evaluationCycles.map((cycle) => (
                <div
                  key={cycle.id}
                  className="flex items-center justify-between py-4 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">{cycle.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(cycle.startDate).toLocaleDateString("pt-BR")} -{" "}
                      {new Date(cycle.endDate).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {cycle.completed}/{cycle.total}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Avaliacoes concluidas
                      </p>
                    </div>
                    <Badge variant="outline">Em andamento</Badge>
                    <Button size="sm">Ver</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedbacks">
          <Card>
            <CardHeader>
              <CardTitle>Feedbacks Recentes</CardTitle>
              <CardDescription>
                Feedbacks continuos e reconhecimentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="mx-auto size-10 opacity-50 mb-2" />
                <p>Nenhum feedback recente</p>
                <Button variant="link" className="mt-2">
                  Dar feedback
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
