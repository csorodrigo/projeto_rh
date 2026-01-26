"use client"

import * as React from "react"
import {
  Plus,
  Heart,
  AlertTriangle,
  CheckCircle,
  Calendar,
  FileText,
  Clock,
  Filter,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// Placeholder data
const asos = [
  {
    id: "1",
    employee: "Maria Silva",
    type: "periodic",
    examDate: "2024-01-15",
    expirationDate: "2024-07-15",
    result: "Apto",
    daysUntilExpiration: 180,
  },
  {
    id: "2",
    employee: "Joao Santos",
    type: "periodic",
    examDate: "2023-06-10",
    expirationDate: "2024-02-10",
    result: "Apto",
    daysUntilExpiration: 15,
  },
  {
    id: "3",
    employee: "Pedro Costa",
    type: "admission",
    examDate: "2024-01-20",
    expirationDate: "2024-07-20",
    result: "Apto",
    daysUntilExpiration: 185,
  },
  {
    id: "4",
    employee: "Ana Oliveira",
    type: "periodic",
    examDate: "2023-08-05",
    expirationDate: "2024-02-05",
    result: "Apto",
    daysUntilExpiration: 7,
  },
]

const medicalCertificates = [
  {
    id: "1",
    employee: "Joao Santos",
    date: "2024-01-28",
    days: 3,
    doctor: "Dr. Carlos Silva",
    crm: "12345-SP",
  },
  {
    id: "2",
    employee: "Maria Silva",
    date: "2024-01-20",
    days: 1,
    doctor: "Dra. Ana Costa",
    crm: "54321-SP",
  },
]

const typeLabels: Record<string, string> = {
  admission: "Admissional",
  periodic: "Periodico",
  return: "Retorno",
  change: "Mudanca Funcao",
  dismissal: "Demissional",
}

function getExpirationBadge(days: number) {
  if (days <= 7) {
    return { variant: "destructive" as const, label: "Critico" }
  }
  if (days <= 30) {
    return { variant: "outline" as const, label: "Vencendo" }
  }
  return { variant: "secondary" as const, label: "Regular" }
}

export default function HealthPage() {
  const criticalAsos = asos.filter((a) => a.daysUntilExpiration <= 30).length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Saude Ocupacional</h1>
          <p className="text-muted-foreground">
            Gerencie ASOs e atestados medicos
          </p>
        </div>
        <Button>
          <Plus className="mr-2 size-4" />
          Novo ASO
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-red-100 text-red-600 rounded-lg p-3">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{criticalAsos}</p>
                <p className="text-sm text-muted-foreground">ASOs vencendo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 text-green-600 rounded-lg p-3">
                <CheckCircle className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{asos.length}</p>
                <p className="text-sm text-muted-foreground">ASOs ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 text-blue-600 rounded-lg p-3">
                <FileText className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{medicalCertificates.length}</p>
                <p className="text-sm text-muted-foreground">Atestados mes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 text-purple-600 rounded-lg p-3">
                <Clock className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">4</p>
                <p className="text-sm text-muted-foreground">Dias perdidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="asos" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="asos" className="gap-2">
              <Heart className="size-4" />
              ASOs
              {criticalAsos > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {criticalAsos}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="certificates" className="gap-2">
              <FileText className="size-4" />
              Atestados
            </TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 size-4" />
            Filtros
          </Button>
        </div>

        <TabsContent value="asos">
          <Card>
            <CardHeader>
              <CardTitle>Atestados de Saude Ocupacional</CardTitle>
              <CardDescription>
                Controle de vencimento dos ASOs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionario</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data Exame</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {asos.map((aso) => {
                    const badge = getExpirationBadge(aso.daysUntilExpiration)
                    return (
                      <TableRow key={aso.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {aso.employee
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{aso.employee}</span>
                          </div>
                        </TableCell>
                        <TableCell>{typeLabels[aso.type] || aso.type}</TableCell>
                        <TableCell>
                          {new Date(aso.examDate).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          {new Date(aso.expirationDate).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {aso.result}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={badge.variant}>
                            {aso.daysUntilExpiration} dias
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Atestados Medicos</CardTitle>
                  <CardDescription>
                    Historico de atestados dos funcionarios
                  </CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="mr-2 size-4" />
                  Novo Atestado
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionario</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Dias</TableHead>
                    <TableHead>Medico</TableHead>
                    <TableHead>CRM</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicalCertificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-medium">{cert.employee}</TableCell>
                      <TableCell>
                        {new Date(cert.date).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>{cert.days} dia(s)</TableCell>
                      <TableCell>{cert.doctor}</TableCell>
                      <TableCell>{cert.crm}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
