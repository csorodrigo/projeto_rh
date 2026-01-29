"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  CreditCard,
  User,
  FileText,
  AlertCircle,
  Loader2,
  Briefcase,
  Heart,
  Clock,
  CalendarOff,
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
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getEmployee, getCurrentProfile } from "@/lib/supabase/queries"
import { getEmployeeTimeRecords } from "@/lib/supabase/queries/time-records"
import {
  getEmployeeAbsences,
  getAbsenceTypeLabel,
  getAbsenceStatusLabel,
} from "@/lib/supabase/queries/employee-absences"
import { formatCPF, formatPhone, formatCurrency, formatDate } from "@/lib/utils"
import type { Employee } from "@/types/database"
import type { TimeRecord } from "@/lib/supabase/queries/time-records"
import type { EmployeeAbsence } from "@/lib/supabase/queries/employee-absences"
import { DocumentList } from "@/components/documents/document-list"

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Ativo", variant: "default" },
  inactive: { label: "Inativo", variant: "secondary" },
  on_leave: { label: "Afastado", variant: "outline" },
  terminated: { label: "Desligado", variant: "destructive" },
}

const contractTypeMap: Record<string, string> = {
  clt: "CLT",
  pj: "PJ",
  intern: "Estagiario",
  temporary: "Temporario",
  apprentice: "Aprendiz",
}

const genderMap: Record<string, string> = {
  male: "Masculino",
  female: "Feminino",
  other: "Outro",
}

const maritalStatusMap: Record<string, string> = {
  single: "Solteiro(a)",
  married: "Casado(a)",
  divorced: "Divorciado(a)",
  widowed: "Viuvo(a)",
  separated: "Separado(a)",
}

const recordTypeMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  clock_in: { label: "Entrada", variant: "default" },
  clock_out: { label: "Saída", variant: "secondary" },
  break_start: { label: "Início Intervalo", variant: "outline" },
  break_end: { label: "Fim Intervalo", variant: "outline" },
}

const absenceStatusVariantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  pending: "outline",
  approved: "default",
  rejected: "destructive",
  cancelled: "secondary",
  in_progress: "outline",
  completed: "secondary",
}

function InfoItem({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: React.ElementType }) {
  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon className="size-4 text-muted-foreground mt-0.5" />}
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value || "-"}</p>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-[300px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-6 w-[80px]" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-5 w-[150px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function EmployeeViewPage() {
  const params = useParams()
  const router = useRouter()
  const [employee, setEmployee] = React.useState<Employee | null>(null)
  const [companyId, setCompanyId] = React.useState<string | null>(null)
  const [timeRecords, setTimeRecords] = React.useState<TimeRecord[]>([])
  const [absences, setAbsences] = React.useState<EmployeeAbsence[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function fetchData() {
      if (!params.id || typeof params.id !== "string") return

      try {
        // Fetch employee and profile in parallel
        const [employeeResult, profileResult] = await Promise.all([
          getEmployee(params.id),
          getCurrentProfile(),
        ])

        if (employeeResult.error) {
          setError(employeeResult.error.message)
          return
        }
        setEmployee(employeeResult.data)

        if (profileResult.data?.company_id) {
          setCompanyId(profileResult.data.company_id)
        }

        // Fetch time records and absences
        if (employeeResult.data) {
          const [timeRecordsData, absencesData] = await Promise.all([
            getEmployeeTimeRecords(params.id, 10),
            getEmployeeAbsences(params.id),
          ])

          setTimeRecords(timeRecordsData)
          setAbsences(absencesData)
        }
      } catch (err) {
        setError("Erro ao carregar funcionario")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (error || !employee) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/funcionarios">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Funcionario</h1>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertCircle className="h-10 w-10 text-destructive mb-4" />
            <p className="text-lg font-medium mb-2">Funcionario nao encontrado</p>
            <p className="text-muted-foreground mb-4">{error || "O funcionario solicitado nao existe"}</p>
            <Button asChild>
              <Link href="/funcionarios">Voltar para Lista</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const address = employee.address as {
    zip_code?: string
    street?: string
    number?: string
    complement?: string
    neighborhood?: string
    city?: string
    state?: string
  } | null

  return (
    <div className="space-y-6">
      {/* Employee Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={employee.photo_url || ""} alt={employee.full_name} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {employee.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">{employee.full_name}</h1>
                  <Badge variant={statusMap[employee.status]?.variant || "default"}>
                    {statusMap[employee.status]?.label || employee.status}
                  </Badge>
                </div>
                <p className="text-lg text-muted-foreground">
                  {employee.position} • {employee.department}
                </p>
                <div className="flex flex-wrap gap-4">
                  {employee.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="size-4 text-muted-foreground" />
                      <a href={`mailto:${employee.email}`} className="hover:underline">
                        {employee.email}
                      </a>
                    </div>
                  )}
                  {employee.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="size-4 text-muted-foreground" />
                      <span>{formatPhone(employee.phone)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Button asChild>
              <Link href={`/funcionarios/${employee.id}/editar`}>
                <Edit className="mr-2 size-4" />
                Editar
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="professional">Dados Profissionais</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="time-records">Histórico de Ponto</TabsTrigger>
          <TabsTrigger value="absences">Ausências</TabsTrigger>
        </TabsList>

        {/* Personal Tab */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5" />
                Dados Pessoais
              </CardTitle>
              <CardDescription>Informacoes pessoais do funcionario</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <InfoItem label="Nome Completo" value={employee.full_name} />
                <InfoItem label="CPF" value={employee.cpf ? formatCPF(employee.cpf) : null} />
                <InfoItem label="RG" value={employee.rg} />
                <InfoItem
                  label="Data de Nascimento"
                  value={employee.birth_date ? formatDate(employee.birth_date) : null}
                  icon={Calendar}
                />
                <InfoItem label="Email" value={employee.email} icon={Mail} />
                <InfoItem label="Telefone" value={employee.phone ? formatPhone(employee.phone) : null} icon={Phone} />
                <InfoItem label="Genero" value={genderMap[employee.gender || ""] || employee.gender} />
                <InfoItem
                  label="Estado Civil"
                  value={maritalStatusMap[employee.marital_status || ""] || employee.marital_status}
                />
                <InfoItem label="Nacionalidade" value={employee.nationality} />
              </div>

              {address && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="size-4" />
                      Endereco
                    </h3>
                    <div className="grid gap-6 md:grid-cols-3">
                      <InfoItem label="CEP" value={address.zip_code} />
                      <InfoItem label="Logradouro" value={address.street} />
                      <InfoItem label="Numero" value={address.number} />
                      <InfoItem label="Complemento" value={address.complement} />
                      <InfoItem label="Bairro" value={address.neighborhood} />
                      <InfoItem label="Cidade" value={address.city} />
                      <InfoItem label="Estado" value={address.state} />
                    </div>
                  </div>
                </>
              )}

              {(employee.emergency_contact || employee.emergency_phone) && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Heart className="size-4" />
                      Contato de Emergencia
                    </h3>
                    <div className="grid gap-6 md:grid-cols-2">
                      <InfoItem label="Nome" value={employee.emergency_contact} />
                      <InfoItem
                        label="Telefone"
                        value={employee.emergency_phone ? formatPhone(employee.emergency_phone) : null}
                        icon={Phone}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Professional Tab */}
        <TabsContent value="professional">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="size-5" />
                Dados Profissionais
              </CardTitle>
              <CardDescription>Informacoes do vinculo empregaticio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <InfoItem label="Cargo" value={employee.position} icon={Briefcase} />
                <InfoItem label="Departamento" value={employee.department} icon={Building} />
                <InfoItem label="Centro de Custo" value={employee.cost_center} />
                <InfoItem
                  label="Data de Admissao"
                  value={employee.hire_date ? formatDate(employee.hire_date) : null}
                  icon={Calendar}
                />
                <InfoItem
                  label="Tipo de Contrato"
                  value={contractTypeMap[employee.contract_type || ""] || employee.contract_type}
                />
                <InfoItem
                  label="Salario Base"
                  value={employee.salary ? formatCurrency(employee.salary) : null}
                />
                <InfoItem label="Carga Horaria Semanal" value={employee.weekly_hours ? `${employee.weekly_hours}h` : null} />
                <InfoItem label="Status" value={statusMap[employee.status]?.label || employee.status} />
              </div>

              {employee.termination_date && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h3 className="font-semibold mb-4 text-destructive">Desligamento</h3>
                    <div className="grid gap-6 md:grid-cols-2">
                      <InfoItem
                        label="Data de Desligamento"
                        value={formatDate(employee.termination_date)}
                        icon={Calendar}
                      />
                      <InfoItem label="Motivo" value={employee.termination_reason} />
                    </div>
                  </div>
                </>
              )}

              <Separator className="my-6" />
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <FileText className="size-4" />
                  Documentos Trabalhistas
                </h3>
                <div className="grid gap-6 md:grid-cols-3">
                  <InfoItem label="PIS/PASEP" value={employee.pis} />
                  <InfoItem label="CTPS Numero" value={employee.ctps_number} />
                  <InfoItem label="CTPS Serie" value={employee.ctps_series} />
                  <InfoItem label="CTPS Estado" value={employee.ctps_state} />
                </div>
              </div>

              {employee.bank_name && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <CreditCard className="size-4" />
                      Dados Bancarios
                    </h3>
                    <div className="grid gap-6 md:grid-cols-3">
                      <InfoItem label="Banco" value={employee.bank_name} />
                      <InfoItem label="Codigo do Banco" value={employee.bank_code} />
                      <InfoItem
                        label="Tipo de Conta"
                        value={
                          employee.account_type === "checking"
                            ? "Corrente"
                            : employee.account_type === "savings"
                            ? "Poupanca"
                            : employee.account_type === "salary"
                            ? "Salario"
                            : employee.account_type
                        }
                      />
                      <InfoItem
                        label="Agencia"
                        value={employee.agency ? `${employee.agency}${employee.agency_digit ? `-${employee.agency_digit}` : ""}` : null}
                      />
                      <InfoItem
                        label="Conta"
                        value={employee.account ? `${employee.account}${employee.account_digit ? `-${employee.account_digit}` : ""}` : null}
                      />
                      <InfoItem label="Chave PIX" value={employee.pix_key} />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          {companyId ? (
            <DocumentList employeeId={employee.id} companyId={companyId} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-5" />
                  Documentos
                </CardTitle>
                <CardDescription>Documentos anexados do funcionario</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Nenhum documento anexado</p>
                <Button disabled>
                  <FileText className="mr-2 size-4" />
                  Adicionar Documento
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Time Records Tab */}
        <TabsContent value="time-records">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-5" />
                Histórico de Ponto
              </CardTitle>
              <CardDescription>Últimos 10 registros de ponto do funcionário</CardDescription>
            </CardHeader>
            <CardContent>
              {timeRecords.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Origem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeRecords.map((record) => {
                      const recordDate = new Date(record.recorded_at)
                      return (
                        <TableRow key={record.id}>
                          <TableCell>
                            {recordDate.toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="font-medium">
                            {recordDate.toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={recordTypeMap[record.record_type]?.variant || "default"}>
                              {recordTypeMap[record.record_type]?.label || record.record_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {record.location_address || "-"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {record.source === 'web' ? 'Web' :
                             record.source === 'mobile_app' ? 'App' :
                             record.source === 'biometric' ? 'Biométrico' :
                             record.source === 'manual' ? 'Manual' :
                             record.source}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-10">
                  <Clock className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum registro de ponto</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Absences Tab */}
        <TabsContent value="absences">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarOff className="size-5" />
                Ausências
              </CardTitle>
              <CardDescription>Histórico de ausências, férias e licenças</CardDescription>
            </CardHeader>
            <CardContent>
              {absences.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Dias</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {absences.map((absence) => (
                      <TableRow key={absence.id}>
                        <TableCell className="font-medium">
                          {getAbsenceTypeLabel(absence.type)}
                        </TableCell>
                        <TableCell>
                          {formatDate(absence.start_date)} - {formatDate(absence.end_date)}
                        </TableCell>
                        <TableCell>
                          {absence.days_count} {absence.days_count === 1 ? 'dia' : 'dias'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={absenceStatusVariantMap[absence.status] || "default"}>
                            {getAbsenceStatusLabel(absence.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {absence.reason || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-10">
                  <CalendarOff className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma ausência registrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
