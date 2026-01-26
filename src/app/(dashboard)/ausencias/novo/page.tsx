"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AbsenceForm, VacationBalanceList } from "@/components/absences"
import {
  createAbsence,
  submitAbsence,
  getCurrentProfile,
  listEmployees,
  getVacationBalance,
  checkAbsenceOverlap,
} from "@/lib/supabase/queries"
import type { Employee, VacationBalance, AbsenceType, AbsenceStatus } from "@/types/database"

export default function NovaAusenciaPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [employees, setEmployees] = React.useState<Employee[]>([])
  const [vacationBalances, setVacationBalances] = React.useState<VacationBalance[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string | null>(null)
  const [companyId, setCompanyId] = React.useState<string | null>(null)
  const [userRole, setUserRole] = React.useState<string | null>(null)
  const [userEmployeeId, setUserEmployeeId] = React.useState<string | null>(null)

  // Carregar dados iniciais
  React.useEffect(() => {
    async function loadData() {
      try {
        const profileResult = await getCurrentProfile()
        if (profileResult.error || !profileResult.data?.company_id) {
          toast.error("Erro ao carregar perfil")
          router.push("/ausencias")
          return
        }

        const profile = profileResult.data
        setCompanyId(profile.company_id)
        setUserRole(profile.role)

        // Se for admin/HR, carregar lista de funcionários
        if (["super_admin", "company_admin", "hr_manager", "hr_analyst"].includes(profile.role)) {
          const employeesResult = await listEmployees(profile.company_id!, { status: "active" })
          if (employeesResult.data) {
            setEmployees(employeesResult.data)
          }
        } else {
          // Se for funcionário comum, usar o próprio ID
          // Assumindo que o profile tem um campo que relaciona ao employee
          // Por enquanto, vamos definir como null e o usuário terá que ser vinculado
          setUserEmployeeId(null) // TODO: Obter employee_id do profile
        }
      } catch {
        toast.error("Erro ao carregar dados")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router])

  // Carregar saldo de férias quando selecionar funcionário
  React.useEffect(() => {
    async function loadVacationBalance() {
      const employeeId = selectedEmployeeId || userEmployeeId
      if (!employeeId) return

      const result = await getVacationBalance(employeeId)
      if (result.data) {
        setVacationBalances(result.data)
      }
    }

    loadVacationBalance()
  }, [selectedEmployeeId, userEmployeeId])

  const handleSubmit = async (
    data: {
      employee_id: string
      type: string
      start_date: Date
      end_date: Date
      reason?: string
      notes?: string
      document_url?: string
      document_type?: string
      cid_code?: string
      issuing_doctor?: string
      crm?: string
      vacation_balance_id?: string
      is_vacation_split?: boolean
      split_number?: number
      is_vacation_sold?: boolean
      sold_days?: number
    },
    submitForApproval: boolean
  ) => {
    if (!companyId) {
      toast.error("Empresa não encontrada")
      return
    }

    setIsSubmitting(true)

    try {
      // Verificar sobreposição
      const overlapResult = await checkAbsenceOverlap(
        data.employee_id,
        data.start_date.toISOString().split("T")[0],
        data.end_date.toISOString().split("T")[0]
      )

      if (overlapResult.data) {
        toast.error("Já existe uma ausência aprovada neste período")
        return
      }

      // Criar ausência
      const createResult = await createAbsence({
        company_id: companyId,
        employee_id: data.employee_id,
        type: data.type as AbsenceType,
        start_date: data.start_date.toISOString().split("T")[0],
        end_date: data.end_date.toISOString().split("T")[0],
        reason: data.reason,
        notes: data.notes,
        document_url: data.document_url,
        document_type: data.document_type,
        cid_code: data.cid_code,
        issuing_doctor: data.issuing_doctor,
        crm: data.crm,
        vacation_balance_id: data.vacation_balance_id,
        is_vacation_split: data.is_vacation_split,
        split_number: data.split_number,
        is_vacation_sold: data.is_vacation_sold,
        sold_days: data.sold_days,
        status: "draft" as AbsenceStatus,
      })

      if (createResult.error) {
        toast.error("Erro ao criar ausência: " + createResult.error.message)
        return
      }

      // Se solicitou envio para aprovação
      if (submitForApproval && createResult.data) {
        const submitResult = await submitAbsence(createResult.data.id)
        if (submitResult.error) {
          toast.error("Ausência criada, mas erro ao enviar para aprovação")
          router.push("/ausencias")
          return
        }
        toast.success("Ausência enviada para aprovação!")
      } else {
        toast.success("Rascunho salvo com sucesso!")
      }

      router.push("/ausencias")
    } catch {
      toast.error("Erro ao criar ausência")
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

  const isAdminOrHR = ["super_admin", "company_admin", "hr_manager", "hr_analyst"].includes(
    userRole || ""
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/ausencias">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Solicitação</h1>
          <p className="text-muted-foreground">
            Solicite férias, licenças ou registre ausências
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulário */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Ausência</CardTitle>
              <CardDescription>
                Preencha os dados da ausência. Você pode salvar como rascunho ou
                enviar diretamente para aprovação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AbsenceForm
                employees={isAdminOrHR ? employees : []}
                vacationBalances={vacationBalances}
                selectedEmployeeId={userEmployeeId || undefined}
                onSubmit={handleSubmit}
                onCancel={() => router.push("/ausencias")}
                isLoading={isSubmitting}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Saldo de Férias */}
        <div className="space-y-6">
          {vacationBalances.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Saldo de Férias</CardTitle>
                <CardDescription>
                  Períodos disponíveis para o funcionário
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VacationBalanceList balances={vacationBalances} />
              </CardContent>
            </Card>
          )}

          {/* Dicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                • <strong>Férias:</strong> Solicite com pelo menos 30 dias de antecedência
              </p>
              <p>
                • <strong>Atestado médico:</strong> Anexe o documento digitalizado
              </p>
              <p>
                • <strong>Licenças:</strong> Verifique os dias permitidos por lei
              </p>
              <p>
                • <strong>Fracionamento:</strong> Férias podem ser divididas em até 3 períodos
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
