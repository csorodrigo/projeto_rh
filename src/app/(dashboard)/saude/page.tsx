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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  getCurrentProfile,
  listCompanyASOs,
  listCompanyMedicalCertificates,
  getHealthStats,
  type ASOWithEmployee,
  type MedicalCertificateWithEmployee,
} from "@/lib/supabase/queries"

const typeLabels: Record<string, string> = {
  admission: "Admissional",
  admissional: "Admissional",
  periodic: "Periodico",
  periodico: "Periodico",
  return: "Retorno ao trabalho",
  retorno: "Retorno ao trabalho",
  change: "Mudanca de Funcao",
  mudanca_funcao: "Mudanca de Funcao",
  dismissal: "Demissional",
  demissional: "Demissional",
}

function getExpirationBadge(expirationDate: string) {
  const today = new Date()
  const expDate = new Date(expirationDate)
  const days = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (days < 0) {
    return { variant: "destructive" as const, label: "Vencido", days }
  }
  if (days <= 7) {
    return { variant: "destructive" as const, label: "Critico", days }
  }
  if (days <= 30) {
    return { variant: "outline" as const, label: "Vencendo", days }
  }
  return { variant: "secondary" as const, label: "Regular", days }
}

export default function HealthPage() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [companyId, setCompanyId] = React.useState<string | null>(null)
  const [asos, setAsos] = React.useState<ASOWithEmployee[]>([])
  const [certificates, setCertificates] = React.useState<MedicalCertificateWithEmployee[]>([])
  const [stats, setStats] = React.useState({
    totalASOs: 0,
    expiringASOs: 0,
    expiredASOs: 0,
    certificatesThisMonth: 0,
    totalDaysOff: 0,
  })

  // Load initial data
  React.useEffect(() => {
    async function loadData() {
      try {
        const profileResult = await getCurrentProfile()
        if (profileResult.error || !profileResult.data?.company_id) {
          toast.error("Erro ao carregar perfil")
          return
        }

        const compId = profileResult.data.company_id
        setCompanyId(compId)

        // Load data in parallel
        const [asosResult, certificatesResult, statsResult] = await Promise.all([
          listCompanyASOs(compId),
          listCompanyMedicalCertificates(compId),
          getHealthStats(compId),
        ])

        if (asosResult.data) {
          setAsos(asosResult.data)
        }

        if (certificatesResult.data) {
          setCertificates(certificatesResult.data)
        }

        setStats(statsResult)
      } catch {
        toast.error("Erro ao carregar dados de saude")
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

  const criticalAsos = stats.expiringASOs + stats.expiredASOs

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
                <p className="text-2xl font-bold">{stats.totalASOs}</p>
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
                <p className="text-2xl font-bold">{stats.certificatesThisMonth}</p>
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
                <p className="text-2xl font-bold">{stats.totalDaysOff}</p>
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
              {asos.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Heart className="mx-auto size-12 mb-4 opacity-20" />
                  <p>Nenhum ASO cadastrado</p>
                  <p className="text-sm">Clique em "Novo ASO" para adicionar</p>
                </div>
              ) : (
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
                      const badge = getExpirationBadge(aso.expiry_date)
                      return (
                        <TableRow key={aso.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="size-8">
                                {aso.employee_photo_url && (
                                  <AvatarImage src={aso.employee_photo_url} />
                                )}
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {aso.employee_name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="font-medium">{aso.employee_name}</span>
                                {aso.employee_department && (
                                  <p className="text-xs text-muted-foreground">
                                    {aso.employee_department}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {typeLabels[aso.exam_type] || aso.exam_type}
                          </TableCell>
                          <TableCell>
                            {new Date(aso.exam_date).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            {new Date(aso.expiry_date).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                aso.result?.toLowerCase() === "apto"
                                  ? "bg-green-50 text-green-700"
                                  : aso.result?.toLowerCase() === "inapto"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-yellow-50 text-yellow-700"
                              }
                            >
                              {aso.result || "Pendente"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={badge.variant}>
                              {badge.days < 0
                                ? `${Math.abs(badge.days)} dias vencido`
                                : `${badge.days} dias`}
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
              )}
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
              {certificates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="mx-auto size-12 mb-4 opacity-20" />
                  <p>Nenhum atestado cadastrado</p>
                  <p className="text-sm">Clique em "Novo Atestado" para adicionar</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionario</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Periodo</TableHead>
                      <TableHead>Dias</TableHead>
                      <TableHead>Medico</TableHead>
                      <TableHead>CRM</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certificates.map((cert) => (
                      <TableRow key={cert.id}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{cert.employee_name}</span>
                            {cert.employee_department && (
                              <p className="text-xs text-muted-foreground">
                                {cert.employee_department}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(cert.certificate_date).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          {new Date(cert.start_date).toLocaleDateString("pt-BR")} -{" "}
                          {new Date(cert.end_date).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{cert.days_off} dia(s)</Badge>
                        </TableCell>
                        <TableCell>{cert.doctor_name}</TableCell>
                        <TableCell>{cert.doctor_crm}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
