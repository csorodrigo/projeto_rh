"use client"

import * as React from "react"
import {
  Check,
  Crown,
  Zap,
  Users,
  HardDrive,
  Shield,
  ExternalLink,
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
import { Progress } from "@/components/ui/progress"

interface PlanFeature {
  name: string
  included: boolean
}

interface Plan {
  id: string
  name: string
  price: number
  billingCycle: string
  description: string
  features: PlanFeature[]
  highlighted?: boolean
  current?: boolean
}

const PLANS: Plan[] = [
  {
    id: "basic",
    name: "Básico",
    price: 49,
    billingCycle: "mês",
    description: "Para pequenas empresas começando",
    current: true,
    features: [
      { name: "Até 10 funcionários", included: true },
      { name: "Marcação de ponto", included: true },
      { name: "Gestão de férias", included: true },
      { name: "Holerites digitais", included: true },
      { name: "Relatórios básicos", included: true },
      { name: "Suporte por email", included: true },
      { name: "API de integração", included: false },
      { name: "Relatórios avançados", included: false },
      { name: "Múltiplas empresas", included: false },
    ],
  },
  {
    id: "professional",
    name: "Profissional",
    price: 149,
    billingCycle: "mês",
    description: "Para empresas em crescimento",
    highlighted: true,
    features: [
      { name: "Até 50 funcionários", included: true },
      { name: "Marcação de ponto", included: true },
      { name: "Gestão de férias", included: true },
      { name: "Holerites digitais", included: true },
      { name: "Relatórios básicos", included: true },
      { name: "Suporte por email", included: true },
      { name: "API de integração", included: true },
      { name: "Relatórios avançados", included: true },
      { name: "Suporte prioritário", included: true },
      { name: "Múltiplas empresas", included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 399,
    billingCycle: "mês",
    description: "Para grandes organizações",
    features: [
      { name: "Funcionários ilimitados", included: true },
      { name: "Marcação de ponto", included: true },
      { name: "Gestão de férias", included: true },
      { name: "Holerites digitais", included: true },
      { name: "Relatórios básicos", included: true },
      { name: "Suporte por email", included: true },
      { name: "API de integração", included: true },
      { name: "Relatórios avançados", included: true },
      { name: "Suporte prioritário", included: true },
      { name: "Múltiplas empresas", included: true },
      { name: "Gerente de conta dedicado", included: true },
      { name: "SLA garantido", included: true },
    ],
  },
]

export function PlanSettings() {
  const currentPlan = PLANS.find(p => p.current)
  const employeesUsed = 7
  const employeesLimit = 10
  const storageUsed = 2.4
  const storageLimit = 5

  return (
    <div className="space-y-6">
      {/* Plano Atual */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Plano Atual</CardTitle>
              <CardDescription>Gerencie sua assinatura</CardDescription>
            </div>
            <Badge className="bg-primary">Ativo</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Crown className="size-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{currentPlan?.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {currentPlan?.description}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">
                R$ {currentPlan?.price}
                <span className="text-base font-normal text-muted-foreground">
                  /{currentPlan?.billingCycle}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Próxima cobrança: 01/02/2024
              </p>
            </div>
          </div>

          {/* Uso */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Funcionários</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {employeesUsed} de {employeesLimit}
                </span>
              </div>
              <Progress value={(employeesUsed / employeesLimit) * 100} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Armazenamento</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {storageUsed} GB de {storageLimit} GB
                </span>
              </div>
              <Progress value={(storageUsed / storageLimit) * 100} />
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              Gerenciar Assinatura
            </Button>
            <Button variant="outline">
              <ExternalLink className="mr-2 size-4" />
              Faturas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comparação de Planos */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Comparar Planos</h3>
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map(plan => (
            <Card
              key={plan.id}
              className={
                plan.highlighted
                  ? "border-primary shadow-lg relative"
                  : plan.current
                    ? "border-primary/50"
                    : ""
              }
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary">Mais Popular</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {plan.current && (
                    <Badge variant="outline" className="text-xs">
                      Atual
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-4">
                  <p className="text-4xl font-bold">
                    R$ {plan.price}
                    <span className="text-base font-normal text-muted-foreground">
                      /{plan.billingCycle}
                    </span>
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li
                      key={index}
                      className={`flex items-start gap-2 text-sm ${
                        feature.included
                          ? "text-foreground"
                          : "text-muted-foreground line-through"
                      }`}
                    >
                      <Check
                        className={`size-4 mt-0.5 shrink-0 ${
                          feature.included
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                      <span>{feature.name}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.current ? "outline" : "default"}
                  disabled={plan.current}
                >
                  {plan.current ? "Plano Atual" : "Fazer Upgrade"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recursos Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Recursos Adicionais</CardTitle>
          <CardDescription>
            Adicione recursos extras ao seu plano
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <Users className="size-5" />
                </div>
                <div>
                  <p className="font-medium">Funcionários Extras</p>
                  <p className="text-sm text-muted-foreground">
                    +10 funcionários
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">R$ 29/mês</p>
                <Button variant="outline" size="sm" className="mt-1">
                  Adicionar
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 text-green-600">
                  <HardDrive className="size-5" />
                </div>
                <div>
                  <p className="font-medium">Armazenamento Extra</p>
                  <p className="text-sm text-muted-foreground">+5 GB</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">R$ 9/mês</p>
                <Button variant="outline" size="sm" className="mt-1">
                  Adicionar
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                  <Shield className="size-5" />
                </div>
                <div>
                  <p className="font-medium">Suporte Premium</p>
                  <p className="text-sm text-muted-foreground">
                    Suporte 24/7 com SLA
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">R$ 99/mês</p>
                <Button variant="outline" size="sm" className="mt-1">
                  Adicionar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Método de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle>Método de Pagamento</CardTitle>
          <CardDescription>Gerencie suas formas de pagamento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Zap className="size-6 text-white" />
              </div>
              <div>
                <p className="font-medium">Cartão de Crédito</p>
                <p className="text-sm text-muted-foreground">•••• 4242</p>
              </div>
            </div>
            <Button variant="outline">Alterar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
