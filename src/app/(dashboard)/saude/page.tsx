"use client"

import * as React from "react"
import {
  Plus,
  Heart,
  AlertTriangle,
  CheckCircle,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  getCurrentProfile,
  listCompanyASOs,
  listCompanyMedicalCertificates,
  getHealthStats,
  createASO,
  createMedicalCertificate,
  listEmployees,
  type ASOWithEmployee,
  type MedicalCertificateWithEmployee,
} from "@/lib/supabase/queries"
import type { Employee } from "@/types/database"

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

const asoTypes = [
  { value: "admissional", label: "Admissional" },
  { value: "periodico", label: "Periodico" },
  { value: "retorno", label: "Retorno ao Trabalho" },
  { value: "mudanca_funcao", label: "Mudanca de Funcao" },
  { value: "demissional", label: "Demissional" },
]

const asoResults = [
  { value: "apto", label: "Apto" },
  { value: "inapto", label: "Inapto" },
  { value: "apto_com_restricoes", label: "Apto com Restricoes" },
]

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
  const [employees, setEmployees] = React.useState<Employee[]>([])
  const [stats, setStats] = React.useState({
    totalASOs: 0,
    expiringASOs: 0,
    expiredASOs: 0,
    certificatesThisMonth: 0,
    totalDaysOff: 0,
  })

  // Dialog states
  const [showASODialog, setShowASODialog] = React.useState(false)
  const [showCertificateDialog, setShowCertificateDialog] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // ASO Form state
  const [asoForm, setAsoForm] = React.useState({
    employee_id: "",
    exam_type: "",
    exam_date: "",
    expiry_date: "",
    result: "",
    doctor_name: "",
    doctor_crm: "",
    clinic_name: "",
    notes: "",
  })

  // Certificate Form state
  const [certForm, setCertForm] = React.useState({
    employee_id: "",
    start_date: "",
    end_date: "",
    total_days: "",
    doctor_name: "",
    crm: "",
    crm_state: "",
    cid_code: "",
    cid_description: "",
    medical_notes: "",
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
        const [asosResult, certificatesResult, statsResult, employeesResult] = await Promise.all([
          listCompanyASOs(compId),
          listCompanyMedicalCertificates(compId),
          getHealthStats(compId),
          listEmployees(compId, { status: "active" }),
        ])

        if (asosResult.data) {
          setAsos(asosResult.data)
        }

        if (certificatesResult.data) {
          setCertificates(certificatesResult.data)
        }

        if (employeesResult.data) {
          setEmployees(employeesResult.data)
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

  // Calculate days between dates
  const calculateDays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return diff > 0 ? diff : 0
  }

  // Handle ASO form change
  const handleAsoChange = (field: string, value: string) => {
    setAsoForm((prev) => ({ ...prev, [field]: value }))
  }

  // Handle Certificate form change
  const handleCertChange = (field: string, value: string) => {
    const newForm = { ...certForm, [field]: value }

    // Auto-calculate days when dates change
    if (field === "start_date" || field === "end_date") {
      const days = calculateDays(
        field === "start_date" ? value : certForm.start_date,
        field === "end_date" ? value : certForm.end_date
      )
      newForm.total_days = days.toString()
    }

    setCertForm(newForm)
  }

  // Reset ASO form
  const resetAsoForm = () => {
    setAsoForm({
      employee_id: "",
      exam_type: "",
      exam_date: "",
      expiry_date: "",
      result: "",
      doctor_name: "",
      doctor_crm: "",
      clinic_name: "",
      notes: "",
    })
  }

  // Reset Certificate form
  const resetCertForm = () => {
    setCertForm({
      employee_id: "",
      start_date: "",
      end_date: "",
      total_days: "",
      doctor_name: "",
      crm: "",
      crm_state: "",
      cid_code: "",
      cid_description: "",
      medical_notes: "",
    })
  }

  // Handle ASO submit
  const handleCreateASO = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!companyId) {
      toast.error("Empresa nao identificada")
      return
    }

    if (!asoForm.employee_id || !asoForm.exam_type || !asoForm.exam_date || !asoForm.expiry_date || !asoForm.result) {
      toast.error("Preencha todos os campos obrigatorios")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createASO({
        company_id: companyId,
        employee_id: asoForm.employee_id,
        exam_type: asoForm.exam_type,
        exam_date: asoForm.exam_date,
        expiry_date: asoForm.expiry_date,
        result: asoForm.result,
        doctor_name: asoForm.doctor_name,
        doctor_crm: asoForm.doctor_crm,
        clinic_name: asoForm.clinic_name || null,
        notes: asoForm.notes || null,
        document_url: null,
      })

      if (result.error) {
        toast.error("Erro ao criar ASO: " + result.error.message)
        return
      }

      toast.success("ASO cadastrado com sucesso!")
      setShowASODialog(false)
      resetAsoForm()

      // Reload data
      const [asosResult, statsResult] = await Promise.all([
        listCompanyASOs(companyId),
        getHealthStats(companyId),
      ])
      if (asosResult.data) setAsos(asosResult.data)
      setStats(statsResult)
    } catch {
      toast.error("Erro ao criar ASO")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Certificate submit
  const handleCreateCertificate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!companyId) {
      toast.error("Empresa nao identificada")
      return
    }

    if (!certForm.employee_id || !certForm.start_date || !certForm.end_date || !certForm.doctor_name || !certForm.crm) {
      toast.error("Preencha todos os campos obrigatorios")
      return
    }

    setIsSubmitting(true)

    try {
      const totalDays = parseInt(certForm.total_days) || calculateDays(certForm.start_date, certForm.end_date)

      const result = await createMedicalCertificate({
        company_id: companyId,
        employee_id: certForm.employee_id,
        start_date: certForm.start_date,
        end_date: certForm.end_date,
        total_days: totalDays,
        doctor_name: certForm.doctor_name,
        crm: certForm.crm,
        crm_state: certForm.crm_state || null,
        cid_code: certForm.cid_code || null,
        cid_description: certForm.cid_description || null,
        show_cid: !!certForm.cid_code,
        healthcare_facility: null,
        facility_type: null,
        certificate_type: "atestado",
        medical_notes: certForm.medical_notes || null,
        internal_notes: null,
        file_url: null,
        file_name: null,
        is_validated: false,
        validated_by: null,
        validated_at: null,
        validation_notes: null,
        absence_id: null,
        requires_inss: totalDays > 15,
        inss_protocol: null,
        inss_start_date: null,
        inss_status: null,
        submitted_by: null,
      })

      if (result.error) {
        toast.error("Erro ao criar atestado: " + result.error.message)
        return
      }

      toast.success("Atestado cadastrado com sucesso!")
      setShowCertificateDialog(false)
      resetCertForm()

      // Reload data
      const [certificatesResult, statsResult] = await Promise.all([
        listCompanyMedicalCertificates(companyId),
        getHealthStats(companyId),
      ])
      if (certificatesResult.data) setCertificates(certificatesResult.data)
      setStats(statsResult)
    } catch {
      toast.error("Erro ao criar atestado")
    } finally {
      setIsSubmitting(false)
    }
  }

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
        <Button onClick={() => setShowASODialog(true)}>
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
                <Button size="sm" onClick={() => setShowCertificateDialog(true)}>
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
                          {new Date(cert.start_date).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          {new Date(cert.start_date).toLocaleDateString("pt-BR")} -{" "}
                          {new Date(cert.end_date).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{cert.total_days} dia(s)</Badge>
                        </TableCell>
                        <TableCell>{cert.doctor_name}</TableCell>
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Novo ASO */}
      <Dialog open={showASODialog} onOpenChange={setShowASODialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Novo ASO</DialogTitle>
            <DialogDescription>
              Cadastre um novo Atestado de Saude Ocupacional
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateASO}>
            <div className="grid gap-4 py-4">
              {/* Funcionario */}
              <div className="grid gap-2">
                <Label htmlFor="aso-employee">Funcionario *</Label>
                <Select
                  value={asoForm.employee_id}
                  onValueChange={(value) => handleAsoChange("employee_id", value)}
                >
                  <SelectTrigger id="aso-employee">
                    <SelectValue placeholder="Selecione o funcionario" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de Exame */}
              <div className="grid gap-2">
                <Label htmlFor="aso-type">Tipo de Exame *</Label>
                <Select
                  value={asoForm.exam_type}
                  onValueChange={(value) => handleAsoChange("exam_type", value)}
                >
                  <SelectTrigger id="aso-type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {asoTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="aso-exam-date">Data do Exame *</Label>
                  <Input
                    id="aso-exam-date"
                    type="date"
                    value={asoForm.exam_date}
                    onChange={(e) => handleAsoChange("exam_date", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="aso-expiry-date">Data de Vencimento *</Label>
                  <Input
                    id="aso-expiry-date"
                    type="date"
                    value={asoForm.expiry_date}
                    onChange={(e) => handleAsoChange("expiry_date", e.target.value)}
                  />
                </div>
              </div>

              {/* Resultado */}
              <div className="grid gap-2">
                <Label htmlFor="aso-result">Resultado *</Label>
                <Select
                  value={asoForm.result}
                  onValueChange={(value) => handleAsoChange("result", value)}
                >
                  <SelectTrigger id="aso-result">
                    <SelectValue placeholder="Selecione o resultado" />
                  </SelectTrigger>
                  <SelectContent>
                    {asoResults.map((result) => (
                      <SelectItem key={result.value} value={result.value}>
                        {result.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Medico */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="aso-doctor">Nome do Medico *</Label>
                  <Input
                    id="aso-doctor"
                    placeholder="Dr. Nome Sobrenome"
                    value={asoForm.doctor_name}
                    onChange={(e) => handleAsoChange("doctor_name", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="aso-crm">CRM *</Label>
                  <Input
                    id="aso-crm"
                    placeholder="123456/SP"
                    value={asoForm.doctor_crm}
                    onChange={(e) => handleAsoChange("doctor_crm", e.target.value)}
                  />
                </div>
              </div>

              {/* Clinica */}
              <div className="grid gap-2">
                <Label htmlFor="aso-clinic">Clinica</Label>
                <Input
                  id="aso-clinic"
                  placeholder="Nome da clinica (opcional)"
                  value={asoForm.clinic_name}
                  onChange={(e) => handleAsoChange("clinic_name", e.target.value)}
                />
              </div>

              {/* Observacoes */}
              <div className="grid gap-2">
                <Label htmlFor="aso-notes">Observacoes</Label>
                <Textarea
                  id="aso-notes"
                  placeholder="Observacoes adicionais (opcional)"
                  value={asoForm.notes}
                  onChange={(e) => handleAsoChange("notes", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowASODialog(false)
                  resetAsoForm()
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Cadastrar ASO
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Novo Atestado */}
      <Dialog open={showCertificateDialog} onOpenChange={setShowCertificateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Novo Atestado Medico</DialogTitle>
            <DialogDescription>
              Cadastre um novo atestado medico para um funcionario
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCertificate}>
            <div className="grid gap-4 py-4">
              {/* Funcionario */}
              <div className="grid gap-2">
                <Label htmlFor="cert-employee">Funcionario *</Label>
                <Select
                  value={certForm.employee_id}
                  onValueChange={(value) => handleCertChange("employee_id", value)}
                >
                  <SelectTrigger id="cert-employee">
                    <SelectValue placeholder="Selecione o funcionario" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Periodo */}
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cert-start">Data Inicio *</Label>
                  <Input
                    id="cert-start"
                    type="date"
                    value={certForm.start_date}
                    onChange={(e) => handleCertChange("start_date", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cert-end">Data Fim *</Label>
                  <Input
                    id="cert-end"
                    type="date"
                    value={certForm.end_date}
                    onChange={(e) => handleCertChange("end_date", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cert-days">Dias</Label>
                  <Input
                    id="cert-days"
                    type="number"
                    min="1"
                    value={certForm.total_days}
                    onChange={(e) => handleCertChange("total_days", e.target.value)}
                    readOnly
                  />
                </div>
              </div>

              {/* Medico */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cert-doctor">Nome do Medico *</Label>
                  <Input
                    id="cert-doctor"
                    placeholder="Dr. Nome Sobrenome"
                    value={certForm.doctor_name}
                    onChange={(e) => handleCertChange("doctor_name", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cert-crm">CRM *</Label>
                  <Input
                    id="cert-crm"
                    placeholder="123456"
                    value={certForm.crm}
                    onChange={(e) => handleCertChange("crm", e.target.value)}
                  />
                </div>
              </div>

              {/* CRM Estado */}
              <div className="grid gap-2">
                <Label htmlFor="cert-crm-state">Estado do CRM</Label>
                <Select
                  value={certForm.crm_state}
                  onValueChange={(value) => handleCertChange("crm_state", value)}
                >
                  <SelectTrigger id="cert-crm-state">
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"].map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* CID */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cert-cid">Codigo CID (opcional)</Label>
                  <Input
                    id="cert-cid"
                    placeholder="Ex: J11"
                    value={certForm.cid_code}
                    onChange={(e) => handleCertChange("cid_code", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cert-cid-desc">Descricao CID</Label>
                  <Input
                    id="cert-cid-desc"
                    placeholder="Descricao do CID"
                    value={certForm.cid_description}
                    onChange={(e) => handleCertChange("cid_description", e.target.value)}
                  />
                </div>
              </div>

              {/* Observacoes */}
              <div className="grid gap-2">
                <Label htmlFor="cert-notes">Observacoes Medicas</Label>
                <Textarea
                  id="cert-notes"
                  placeholder="Observacoes do atestado (opcional)"
                  value={certForm.medical_notes}
                  onChange={(e) => handleCertChange("medical_notes", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCertificateDialog(false)
                  resetCertForm()
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Cadastrar Atestado
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
