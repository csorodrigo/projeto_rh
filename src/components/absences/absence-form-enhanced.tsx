"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, FileText, Info, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
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
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DateRangePicker, type DateRange } from "@/components/ui/date-range-picker"
import {
  ABSENCE_TYPE_LABELS,
  ABSENCE_TYPE_GROUPS,
} from "@/lib/constants"
import type { AbsenceType, VacationBalance, Employee } from "@/types/database"

const formSchema = z.object({
  employee_id: z.string().min(1, "Selecione um funcionário"),
  type: z.string().min(1, "Selecione o tipo de ausência"),
  dateRange: z.object({
    from: z.date({ message: "Data de início é obrigatória" }),
    to: z.date({ message: "Data de fim é obrigatória" }).optional(),
  }).refine((data) => !data.to || data.to >= data.from, {
    message: "Data de fim deve ser maior ou igual à data de início",
  }),
  reason: z.string().optional(),
  notes: z.string().optional(),
  document_url: z.string().optional(),

  // Campos médicos
  cid_code: z.string().optional(),
  issuing_doctor: z.string().optional(),
  crm: z.string().optional(),

  // Campos de férias
  vacation_balance_id: z.string().optional(),
  is_vacation_split: z.boolean().optional(),
  split_number: z.number().optional(),
  is_vacation_sold: z.boolean().optional(),
  sold_days: z.number().optional(),
})

type FormData = z.infer<typeof formSchema>

interface AbsenceFormEnhancedProps {
  employees?: Employee[]
  vacationBalances?: VacationBalance[]
  selectedEmployeeId?: string
  onSubmit: (data: FormData, submitForApproval: boolean) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  defaultValues?: Partial<FormData>
}

export function AbsenceFormEnhanced({
  employees = [],
  vacationBalances = [],
  selectedEmployeeId,
  onSubmit,
  onCancel,
  isLoading = false,
  defaultValues,
}: AbsenceFormEnhancedProps) {
  const [submitForApproval, setSubmitForApproval] = React.useState(false)
  const [conflictingAbsences, setConflictingAbsences] = React.useState<string[]>([])

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employee_id: selectedEmployeeId || defaultValues?.employee_id || "",
      type: defaultValues?.type || "",
      dateRange: defaultValues?.dateRange || { from: undefined, to: undefined },
      reason: defaultValues?.reason || "",
      notes: defaultValues?.notes || "",
      cid_code: defaultValues?.cid_code || "",
      issuing_doctor: defaultValues?.issuing_doctor || "",
      crm: defaultValues?.crm || "",
      is_vacation_split: defaultValues?.is_vacation_split || false,
      is_vacation_sold: defaultValues?.is_vacation_sold || false,
      sold_days: defaultValues?.sold_days || 0,
    },
  })

  const watchType = form.watch("type")
  const watchDateRange = form.watch("dateRange")
  const watchEmployeeId = form.watch("employee_id")

  // Verificar se é tipo médico
  const isMedicalType = (ABSENCE_TYPE_GROUPS.medical as readonly string[]).includes(watchType)

  // Verificar se é férias
  const isVacationType = (ABSENCE_TYPE_GROUPS.vacation as readonly string[]).includes(watchType)

  // Saldo de férias do funcionário selecionado
  const employeeVacationBalances = React.useMemo(() => {
    if (!watchEmployeeId) return []
    return vacationBalances.filter((b) => b.employee_id === watchEmployeeId)
  }, [watchEmployeeId, vacationBalances])

  const availableVacationDays = React.useMemo(() => {
    return employeeVacationBalances.reduce((acc, b) => acc + b.available_days, 0)
  }, [employeeVacationBalances])

  // Calcular dias úteis
  const totalDays = React.useMemo(() => {
    if (!watchDateRange?.from || !watchDateRange?.to) return 0

    let count = 0
    const current = new Date(watchDateRange.from)
    const end = new Date(watchDateRange.to)

    while (current <= end) {
      const dayOfWeek = current.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++
      }
      current.setDate(current.getDate() + 1)
    }

    return count
  }, [watchDateRange])

  // Verificar conflitos (simulado - em produção, buscar do backend)
  React.useEffect(() => {
    if (watchDateRange?.from && watchDateRange?.to && watchEmployeeId) {
      // Aqui você faria uma chamada ao backend para verificar conflitos
      // Por enquanto, apenas limpamos os conflitos
      setConflictingAbsences([])
    }
  }, [watchDateRange, watchEmployeeId])

  const handleSubmit = async (data: FormData) => {
    // Validar saldo de férias
    if (isVacationType && totalDays > availableVacationDays) {
      toast.error("Saldo insuficiente", {
        description: `Você tem apenas ${availableVacationDays} dias disponíveis.`,
      })
      return
    }

    // Verificar conflitos
    if (conflictingAbsences.length > 0) {
      toast.error("Conflito de datas", {
        description: "Já existe uma ausência registrada neste período.",
      })
      return
    }

    await onSubmit(data, submitForApproval)
  }

  // Grupos de tipos para melhor organização
  const typeGroups = [
    { label: "Férias", types: ABSENCE_TYPE_GROUPS.vacation },
    { label: "Médico", types: ABSENCE_TYPE_GROUPS.medical },
    { label: "Licenças Legais", types: ABSENCE_TYPE_GROUPS.legal_leave },
    { label: "Outras Justificadas", types: ABSENCE_TYPE_GROUPS.justified },
    { label: "Não Justificadas", types: ABSENCE_TYPE_GROUPS.unjustified },
    { label: "Outros", types: ABSENCE_TYPE_GROUPS.other },
  ]

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Funcionário (se admin/RH) */}
        {employees.length > 0 && !selectedEmployeeId && (
          <FormField
            control={form.control}
            name="employee_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Funcionário</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um funcionário" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} - {emp.department || "Sem departamento"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Tipo de ausência */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Ausência</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {typeGroups.map((group) => (
                    <React.Fragment key={group.label}>
                      <SelectItem value={`__group_${group.label}`} disabled className="font-medium text-xs text-muted-foreground">
                        {group.label}
                      </SelectItem>
                      {group.types.map((type) => (
                        <SelectItem key={type} value={type} className="pl-6">
                          {ABSENCE_TYPE_LABELS[type as AbsenceType]}
                        </SelectItem>
                      ))}
                    </React.Fragment>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Período */}
        <FormField
          control={form.control}
          name="dateRange"
          render={({ field }) => (
            <FormItem>
              <DateRangePicker
                value={field.value}
                onChange={field.onChange}
                label="Período"
                required
                showBusinessDays
                error={form.formState.errors.dateRange?.message}
                helperText="Selecione as datas de início e fim da ausência"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Alerta de saldo de férias */}
        {isVacationType && availableVacationDays > 0 && (
          <Alert className={totalDays > availableVacationDays ? "border-red-500 bg-red-50" : "bg-blue-50 border-blue-200"}>
            <Info className={`size-4 ${totalDays > availableVacationDays ? "text-red-600" : "text-blue-600"}`} />
            <AlertDescription className={totalDays > availableVacationDays ? "text-red-800" : "text-blue-800"}>
              <div className="space-y-1">
                <p>
                  <strong>Saldo disponível:</strong> {availableVacationDays} dias
                </p>
                {totalDays > 0 && (
                  <p>
                    <strong>Saldo após solicitação:</strong>{" "}
                    <span className={totalDays > availableVacationDays ? "text-red-600 font-semibold" : ""}>
                      {availableVacationDays - totalDays} dias
                    </span>
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Alerta de conflitos */}
        {conflictingAbsences.length > 0 && (
          <Alert className="border-yellow-500 bg-yellow-50">
            <AlertTriangle className="size-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Atenção:</strong> Já existe(m) ausência(s) registrada(s) neste período.
              <ul className="mt-2 list-disc list-inside">
                {conflictingAbsences.map((conflict, idx) => (
                  <li key={idx}>{conflict}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Campos médicos (se tipo médico) */}
        {isMedicalType && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <FileText className="size-4" />
              Informações Médicas
            </h4>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="cid_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CID</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: J11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issuing_doctor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Médico</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do médico" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="crm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CRM</FormLabel>
                    <FormControl>
                      <Input placeholder="CRM" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* Motivo */}
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motivo</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva o motivo da ausência..."
                  rows={3}
                  maxLength={500}
                  {...field}
                />
              </FormControl>
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">
                  Opcional. Informe detalhes adicionais sobre a ausência.
                </p>
                <p className="text-xs text-muted-foreground">
                  {field.value?.length || 0}/500
                </p>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Observações */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações internas</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações internas (visível apenas para RH)..."
                  rows={2}
                  maxLength={500}
                  {...field}
                />
              </FormControl>
              <div className="flex justify-end">
                <p className="text-xs text-muted-foreground">
                  {field.value?.length || 0}/500
                </p>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            variant="outline"
            disabled={isLoading}
            onClick={() => setSubmitForApproval(false)}
          >
            {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Salvar Rascunho
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            onClick={() => setSubmitForApproval(true)}
          >
            {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Enviar para Aprovação
          </Button>
        </div>
      </form>
    </Form>
  )
}
