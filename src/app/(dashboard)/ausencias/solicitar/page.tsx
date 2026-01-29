"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Calendar, AlertTriangle, Info } from "lucide-react"
import { toast } from "sonner"
import { format, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import {
  createAbsenceRequest,
  calculateVacationBalance,
  checkAbsenceOverlap,
  countBusinessDays,
  getAbsenceTypeLabel,
  type CreateAbsenceRequest,
  type VacationBalanceInfo,
} from "@/lib/supabase/queries/absences-management"
import { getCurrentProfile } from "@/lib/supabase/queries"
import type { AbsenceType } from "@/types/database"

// Tipos de ausência mais comuns para solicitação
const ABSENCE_TYPES: { value: AbsenceType; label: string; requiresReason: boolean }[] = [
  { value: "vacation", label: "Férias", requiresReason: false },
  { value: "sick_leave", label: "Licença Médica", requiresReason: true },
  { value: "medical_appointment", label: "Consulta Médica", requiresReason: true },
  { value: "compensatory", label: "Folga Compensatória", requiresReason: false },
  { value: "bereavement", label: "Licença Nojo", requiresReason: true },
  { value: "marriage_leave", label: "Licença Casamento", requiresReason: false },
  { value: "paternity_leave", label: "Licença Paternidade", requiresReason: false },
  { value: "maternity_leave", label: "Licença Maternidade", requiresReason: false },
  { value: "other", label: "Outros", requiresReason: true },
]

// Schema de validação
const formSchema = z.object({
  type: z.string().min(1, "Selecione o tipo de ausência"),
  start_date: z.string().min(1, "Selecione a data de início"),
  end_date: z.string().min(1, "Selecione a data de término"),
  reason: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function SolicitarAusenciaPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [companyId, setCompanyId] = React.useState<string | null>(null)
  const [employeeId, setEmployeeId] = React.useState<string | null>(null)
  const [vacationBalances, setVacationBalances] = React.useState<VacationBalanceInfo[]>([])
  const [businessDays, setBusinessDays] = React.useState<number>(0)
  const [hasOverlap, setHasOverlap] = React.useState<boolean>(false)
  const [selectedType, setSelectedType] = React.useState<string>("")

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "",
      start_date: "",
      end_date: "",
      reason: "",
    },
  })

  const startDate = form.watch("start_date")
  const endDate = form.watch("end_date")

  // Carregar perfil do usuário
  React.useEffect(() => {
    async function loadProfile() {
      try {
        const profileResult = await getCurrentProfile()
        if (profileResult.error || !profileResult.data?.company_id) {
          toast.error("Erro ao carregar perfil")
          router.push("/ausencias")
          return
        }

        setCompanyId(profileResult.data.company_id)

        // Verificar se o usuário tem employee_id vinculado
        if (profileResult.data.employee_id) {
          setEmployeeId(profileResult.data.employee_id)

          // Carregar saldo de férias
          const balanceResult = await calculateVacationBalance(profileResult.data.employee_id)
          if (balanceResult.data) {
            setVacationBalances(balanceResult.data)
          }
        } else {
          toast.error("Seu perfil não está vinculado a um funcionário")
          router.push("/ausencias")
          return
        }
      } catch {
        toast.error("Erro ao carregar dados")
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [router])

  // Calcular dias úteis quando mudar as datas
  React.useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)

      if (start <= end) {
        const days = countBusinessDays(start, end)
        setBusinessDays(days)
      } else {
        setBusinessDays(0)
      }
    } else {
      setBusinessDays(0)
    }
  }, [startDate, endDate])

  // Verificar sobreposição de ausências
  React.useEffect(() => {
    async function checkOverlap() {
      if (!employeeId || !startDate || !endDate) {
        setHasOverlap(false)
        return
      }

      const result = await checkAbsenceOverlap(employeeId, startDate, endDate)
      if (result.data) {
        setHasOverlap(result.data)
      }
    }

    checkOverlap()
  }, [employeeId, startDate, endDate])

  // Verificar se tipo requer motivo
  const requiresReason = React.useMemo(() => {
    const type = ABSENCE_TYPES.find(t => t.value === selectedType)
    return type?.requiresReason || false
  }, [selectedType])

  // Calcular saldo disponível para férias
  const availableVacationDays = React.useMemo(() => {
    return vacationBalances
      .filter(b => b.status === 'active' && !b.is_expired)
      .reduce((sum, b) => sum + b.available_days, 0)
  }, [vacationBalances])

  // Validar saldo de férias
  const insufficientBalance = React.useMemo(() => {
    if (selectedType === 'vacation' && businessDays > 0) {
      return businessDays > availableVacationDays
    }
    return false
  }, [selectedType, businessDays, availableVacationDays])

  const onSubmit = async (values: FormValues) => {
    if (!companyId || !employeeId) {
      toast.error("Dados incompletos")
      return
    }

    // Validações adicionais
    if (hasOverlap) {
      toast.error("Já existe uma ausência aprovada neste período")
      return
    }

    if (insufficientBalance) {
      toast.error("Saldo de férias insuficiente")
      return
    }

    if (requiresReason && !values.reason?.trim()) {
      toast.error("Motivo/observação é obrigatório para este tipo de ausência")
      return
    }

    const start = new Date(values.start_date)
    const end = new Date(values.end_date)

    if (start > end) {
      toast.error("Data de início deve ser anterior à data de término")
      return
    }

    if (start < new Date(new Date().setHours(0, 0, 0, 0))) {
      toast.error("Data de início não pode ser anterior a hoje")
      return
    }

    setIsSubmitting(true)

    try {
      const requestData: CreateAbsenceRequest = {
        company_id: companyId,
        employee_id: employeeId,
        type: values.type as AbsenceType,
        start_date: values.start_date,
        end_date: values.end_date,
        reason: values.reason || undefined,
      }

      const result = await createAbsenceRequest(requestData)

      if (result.error) {
        toast.error("Erro ao criar solicitação: " + result.error.message)
        return
      }

      toast.success("Solicitação enviada com sucesso!")
      router.push("/ausencias")
    } catch {
      toast.error("Erro ao criar solicitação")
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
          <h1 className="text-3xl font-bold tracking-tight">Solicitar Ausência/Férias</h1>
          <p className="text-muted-foreground">
            Preencha o formulário abaixo para solicitar sua ausência
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulário */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Solicitação</CardTitle>
              <CardDescription>
                Todas as solicitações serão enviadas para aprovação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Tipo de ausência */}
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Ausência *</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value)
                            setSelectedType(value)
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ABSENCE_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Datas */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="start_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Início *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="end_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Término *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Informação de dias */}
                  {businessDays > 0 && (
                    <Alert>
                      <Calendar className="size-4" />
                      <AlertTitle>Quantidade de dias</AlertTitle>
                      <AlertDescription>
                        {businessDays} dia{businessDays !== 1 ? 's' : ''} útil{businessDays !== 1 ? 'is' : ''}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Alerta de sobreposição */}
                  {hasOverlap && (
                    <Alert variant="destructive">
                      <AlertTriangle className="size-4" />
                      <AlertTitle>Conflito de datas</AlertTitle>
                      <AlertDescription>
                        Você já possui uma ausência aprovada neste período
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Alerta de saldo insuficiente */}
                  {insufficientBalance && (
                    <Alert variant="destructive">
                      <AlertTriangle className="size-4" />
                      <AlertTitle>Saldo insuficiente</AlertTitle>
                      <AlertDescription>
                        Você possui {availableVacationDays} dias disponíveis, mas está solicitando {businessDays} dias
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Motivo/Observações */}
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Motivo/Observações {requiresReason && "*"}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva o motivo ou adicione observações..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {requiresReason
                            ? "Campo obrigatório para este tipo de ausência"
                            : "Opcional: adicione informações que julgar relevantes"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Ações */}
                  <div className="flex gap-3 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/ausencias")}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || hasOverlap || insufficientBalance}
                    >
                      {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                      Enviar Solicitação
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Saldo de Férias */}
          {selectedType === "vacation" && vacationBalances.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Saldo de Férias</CardTitle>
                <CardDescription>Períodos disponíveis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {vacationBalances.map((balance) => (
                  <div
                    key={balance.id}
                    className="p-3 rounded-lg border bg-card space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Período {format(new Date(balance.period_start), "yyyy")}
                      </span>
                      <Badge
                        variant={
                          balance.status === "active"
                            ? "default"
                            : balance.status === "expired"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {balance.status === "active" ? "Ativo" : balance.status === "expired" ? "Expirado" : "Usado"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Acumulados</p>
                        <p className="font-medium">{balance.accrued_days} dias</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Disponíveis</p>
                        <p className="font-medium text-green-600">
                          {balance.available_days} dias
                        </p>
                      </div>
                    </div>
                    {balance.expires_at && (
                      <p className="text-xs text-muted-foreground">
                        Expira em: {format(new Date(balance.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                ))}
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total disponível</span>
                    <span className="text-lg font-bold text-green-600">
                      {availableVacationDays} dias
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="size-4" />
                Dicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                • <strong>Férias:</strong> Solicite com antecedência mínima de 30 dias
              </p>
              <p>
                • <strong>Licenças:</strong> Verifique a documentação necessária
              </p>
              <p>
                • <strong>Atestado médico:</strong> Envie o documento após aprovação
              </p>
              <p>
                • <strong>Datas:</strong> Apenas dias úteis são contabilizados
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
