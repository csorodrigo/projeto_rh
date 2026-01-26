"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format, differenceInDays, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Loader2, Upload, FileText, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import {
  ABSENCE_TYPE_LABELS,
  ABSENCE_TYPE_GROUPS,
} from "@/lib/constants"
import type { AbsenceType, VacationBalance, Employee } from "@/types/database"

const formSchema = z.object({
  employee_id: z.string().min(1, "Selecione um funcionário"),
  type: z.string().min(1, "Selecione o tipo de ausência"),
  start_date: z.date({ required_error: "Data de início é obrigatória" }),
  end_date: z.date({ required_error: "Data de fim é obrigatória" }),
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
}).refine((data) => data.end_date >= data.start_date, {
  message: "Data de fim deve ser maior ou igual à data de início",
  path: ["end_date"],
})

type FormData = z.infer<typeof formSchema>

interface AbsenceFormProps {
  employees?: Employee[]
  vacationBalances?: VacationBalance[]
  selectedEmployeeId?: string
  onSubmit: (data: FormData, submitForApproval: boolean) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  defaultValues?: Partial<FormData>
}

export function AbsenceForm({
  employees = [],
  vacationBalances = [],
  selectedEmployeeId,
  onSubmit,
  onCancel,
  isLoading = false,
  defaultValues,
}: AbsenceFormProps) {
  const [submitForApproval, setSubmitForApproval] = React.useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employee_id: selectedEmployeeId || defaultValues?.employee_id || "",
      type: defaultValues?.type || "",
      start_date: defaultValues?.start_date,
      end_date: defaultValues?.end_date,
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
  const watchStartDate = form.watch("start_date")
  const watchEndDate = form.watch("end_date")
  const watchEmployeeId = form.watch("employee_id")

  // Calcular dias
  const totalDays = React.useMemo(() => {
    if (!watchStartDate || !watchEndDate) return 0
    return differenceInDays(watchEndDate, watchStartDate) + 1
  }, [watchStartDate, watchEndDate])

  // Verificar se é tipo médico
  const isMedicalType = ABSENCE_TYPE_GROUPS.medical.includes(watchType as AbsenceType)

  // Verificar se é férias
  const isVacationType = ABSENCE_TYPE_GROUPS.vacation.includes(watchType as AbsenceType)

  // Saldo de férias do funcionário selecionado
  const employeeVacationBalances = React.useMemo(() => {
    if (!watchEmployeeId) return []
    return vacationBalances.filter((b) => b.employee_id === watchEmployeeId)
  }, [watchEmployeeId, vacationBalances])

  const handleSubmit = async (data: FormData) => {
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data Início</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecione</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data Fim</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecione</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        watchStartDate ? date < watchStartDate : false
                      }
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Total de dias */}
        {totalDays > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Total: <strong>{totalDays} dia(s)</strong>
            </AlertDescription>
          </Alert>
        )}

        {/* Saldo de férias (se tipo férias) */}
        {isVacationType && employeeVacationBalances.length > 0 && (
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Saldo de Férias:</strong>{" "}
              {employeeVacationBalances.reduce((acc, b) => acc + b.available_days, 0)} dias disponíveis
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
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Opcional. Informe detalhes adicionais sobre a ausência.
              </FormDescription>
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
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
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
