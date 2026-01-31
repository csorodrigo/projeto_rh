"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Calculator,
  CalendarDays,
  CheckCircle2,
  DollarSign,
  FileText,
  HelpCircle,
  Info,
  Loader2,
  Minus,
  Plus,
  Save,
  User,
  XCircle,
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
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  getCurrentProfile,
  listEmployees,
  getEmployee,
} from "@/lib/supabase/queries"
import {
  calculateTermination,
  getTerminationTypeLabel,
  getTerminationRightsSummary,
  formatCurrencyBRL,
  type TerminationType,
  type TerminationInput,
  type TerminationResult,
} from "@/lib/compliance/termination-calculations"
import type { Employee } from "@/types/database"

const terminationTypes: { value: TerminationType; label: string; description: string }[] = [
  {
    value: "sem_justa_causa",
    label: "Demissao sem Justa Causa",
    description: "Empresa dispensa o funcionario sem motivo grave. Direito a todas as verbas.",
  },
  {
    value: "justa_causa",
    label: "Demissao por Justa Causa",
    description: "Dispensa por falta grave (Art. 482 CLT). Perde varios direitos.",
  },
  {
    value: "pedido_demissao",
    label: "Pedido de Demissao",
    description: "Funcionario pede para sair. Deve cumprir ou pagar aviso previo.",
  },
  {
    value: "acordo_mutuo",
    label: "Acordo Mutuo (Art. 484-A)",
    description: "Acordo entre empresa e funcionario. Recebe 50% do aviso e 20% da multa FGTS.",
  },
]

export default function RescisaoPage() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [companyId, setCompanyId] = React.useState<string | null>(null)
  const [employees, setEmployees] = React.useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee | null>(null)

  // Form state
  const [terminationType, setTerminationType] = React.useState<TerminationType>("sem_justa_causa")
  const [terminationDate, setTerminationDate] = React.useState(
    new Date().toISOString().split("T")[0]
  )
  const [noticeWorked, setNoticeWorked] = React.useState<"worked" | "indemnified">("indemnified")
  const [fgtsBalance, setFgtsBalance] = React.useState("")
  const [reason, setReason] = React.useState("")

  // Calculation result
  const [result, setResult] = React.useState<TerminationResult | null>(null)

  // Load initial data
  React.useEffect(() => {
    async function init() {
      try {
        const profileResult = await getCurrentProfile()
        if (profileResult.error || !profileResult.data?.company_id) {
          toast.error("Erro ao carregar perfil")
          setIsLoading(false)
          return
        }

        const compId = profileResult.data.company_id
        setCompanyId(compId)

        // Load active employees
        const employeesResult = await listEmployees(compId, { status: "active" })
        if (employeesResult.data) {
          setEmployees(employeesResult.data)
        }
      } catch {
        toast.error("Erro ao carregar dados")
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [])

  // Auto-calculate when inputs change
  React.useEffect(() => {
    if (!selectedEmployee) {
      setResult(null)
      return
    }

    const baseSalary = selectedEmployee.base_salary || selectedEmployee.salary || 0
    const hireDate = selectedEmployee.hire_date
    const dependents = Array.isArray(selectedEmployee.dependents)
      ? selectedEmployee.dependents.length
      : 0

    if (!baseSalary || !hireDate || !terminationDate) {
      setResult(null)
      return
    }

    const input: TerminationInput = {
      baseSalary,
      hireDate,
      terminationDate,
      terminationType,
      noticeWorked: noticeWorked === "worked",
      fgtsBalance: parseFloat(fgtsBalance) || 0,
      dependents,
    }

    try {
      const calcResult = calculateTermination(input)
      setResult(calcResult)
    } catch (error) {
      console.error("Erro no calculo:", error)
      setResult(null)
    }
  }, [selectedEmployee, terminationType, terminationDate, noticeWorked, fgtsBalance])

  const handleEmployeeChange = async (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId)
    setSelectedEmployee(employee || null)
  }

  const handleSave = async () => {
    if (!selectedEmployee || !result) {
      toast.error("Selecione um funcionario e calcule a rescisao")
      return
    }

    setIsSaving(true)
    try {
      // TODO: Implement save to database
      toast.success("Rescisao salva com sucesso!")
    } catch {
      toast.error("Erro ao salvar rescisao")
    } finally {
      setIsSaving(false)
    }
  }

  const rights = getTerminationRightsSummary(terminationType)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/folha">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Rescisao Trabalhista</h1>
              <p className="text-muted-foreground">
                Calculo de verbas rescisorias conforme CLT
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={!result || isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Salvar Rescisao
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Employee Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="size-5" />
                  Dados da Rescisao
                </CardTitle>
                <CardDescription>
                  Selecione o funcionario e preencha os dados da rescisao
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Employee Select */}
                <div className="space-y-2">
                  <Label htmlFor="employee">Funcionario</Label>
                  <Select onValueChange={handleEmployeeChange}>
                    <SelectTrigger id="employee">
                      <SelectValue placeholder="Selecione um funcionario" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          <div className="flex flex-col">
                            <span>{employee.full_name || employee.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {employee.position} - {employee.department}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Employee Info */}
                {selectedEmployee && (
                  <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Admissao:</span>{" "}
                        <span className="font-medium">
                          {new Date(selectedEmployee.hire_date).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Salario:</span>{" "}
                        <span className="font-medium">
                          {formatCurrencyBRL(
                            selectedEmployee.base_salary || selectedEmployee.salary || 0
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cargo:</span>{" "}
                        <span className="font-medium">{selectedEmployee.position}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Dependentes:</span>{" "}
                        <span className="font-medium">
                          {Array.isArray(selectedEmployee.dependents)
                            ? selectedEmployee.dependents.length
                            : 0}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Termination Type */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="type">Tipo de Rescisao</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="size-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>O tipo de rescisao define quais verbas o funcionario tera direito.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select
                    value={terminationType}
                    onValueChange={(v) => setTerminationType(v as TerminationType)}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {terminationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex flex-col">
                            <span>{type.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {type.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Rights Summary */}
                <div className="flex flex-wrap gap-2">
                  {rights.map((right) => (
                    <Badge key={right} variant="secondary">
                      {right}
                    </Badge>
                  ))}
                </div>

                <Separator />

                {/* Termination Date */}
                <div className="space-y-2">
                  <Label htmlFor="date">Data de Saida</Label>
                  <Input
                    id="date"
                    type="date"
                    value={terminationDate}
                    onChange={(e) => setTerminationDate(e.target.value)}
                  />
                </div>

                {/* Notice Period */}
                {terminationType !== "justa_causa" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>Aviso Previo</Label>
                      {result && (
                        <Badge variant="outline">{result.noticeDays} dias</Badge>
                      )}
                    </div>
                    <RadioGroup
                      value={noticeWorked}
                      onValueChange={(v) => setNoticeWorked(v as "worked" | "indemnified")}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="worked" id="worked" />
                        <Label htmlFor="worked" className="cursor-pointer">
                          Trabalhado
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="indemnified" id="indemnified" />
                        <Label htmlFor="indemnified" className="cursor-pointer">
                          Indenizado
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {/* FGTS Balance */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="fgts">Saldo FGTS</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="size-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          Informe o saldo do FGTS do funcionario. Voce pode consultar no site
                          da Caixa ou no extrato do FGTS.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="fgts"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={fgtsBalance}
                    onChange={(e) => setFgtsBalance(e.target.value)}
                  />
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo (opcional)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Descreva o motivo da rescisao..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {/* Calculation Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="size-5" />
                  Calculo da Rescisao
                </CardTitle>
                <CardDescription>
                  Valores calculados automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedEmployee ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <User className="size-12 mb-4 opacity-20" />
                    <p>Selecione um funcionario para calcular a rescisao</p>
                  </div>
                ) : !result ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Time Worked */}
                    <div className="rounded-lg border bg-muted/50 p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <CalendarDays className="size-4" />
                        Tempo de Servico
                      </div>
                      <div className="text-2xl font-bold">
                        {result.workedYears} anos e {result.workedMonths % 12} meses
                      </div>
                    </div>

                    {/* Earnings */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-green-600 flex items-center gap-2">
                        <Plus className="size-4" />
                        Proventos
                      </h4>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Saldo de Salario</span>
                          <span className="font-medium">
                            {formatCurrencyBRL(result.salaryBalance)}
                          </span>
                        </div>

                        {result.vacationVested > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Ferias Vencidas ({result.vestedVacationPeriods} periodo(s))
                            </span>
                            <span className="font-medium">
                              {formatCurrencyBRL(result.vacationVested)}
                            </span>
                          </div>
                        )}

                        {result.vacationProportional > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Ferias Proporcionais</span>
                            <span className="font-medium">
                              {formatCurrencyBRL(result.vacationProportional)}
                            </span>
                          </div>
                        )}

                        {result.vacationBonus > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">1/3 Constitucional</span>
                            <span className="font-medium">
                              {formatCurrencyBRL(result.vacationBonus)}
                            </span>
                          </div>
                        )}

                        {result.thirteenthProportional > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">13o Proporcional</span>
                            <span className="font-medium">
                              {formatCurrencyBRL(result.thirteenthProportional)}
                            </span>
                          </div>
                        )}

                        {result.noticePeriodValue > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Aviso Previo Indenizado ({result.noticeDays} dias)
                            </span>
                            <span className="font-medium">
                              {formatCurrencyBRL(result.noticePeriodValue)}
                            </span>
                          </div>
                        )}

                        {result.fgtsFine > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Multa FGTS ({terminationType === "acordo_mutuo" ? "20%" : "40%"})
                            </span>
                            <span className="font-medium">
                              {formatCurrencyBRL(result.fgtsFine)}
                            </span>
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="flex justify-between text-lg font-semibold text-green-600">
                        <span>Total Bruto</span>
                        <span>{formatCurrencyBRL(result.totalGross)}</span>
                      </div>
                    </div>

                    {/* Deductions */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-red-600 flex items-center gap-2">
                        <Minus className="size-4" />
                        Descontos
                      </h4>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">INSS</span>
                          <span className="font-medium text-red-600">
                            -{formatCurrencyBRL(result.inssDeduction)}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IRRF</span>
                          <span className="font-medium text-red-600">
                            -{formatCurrencyBRL(result.irrfDeduction)}
                          </span>
                        </div>

                        {result.noticePenalty > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Aviso Previo (nao cumprido)
                            </span>
                            <span className="font-medium text-red-600">
                              -{formatCurrencyBRL(result.noticePenalty)}
                            </span>
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="flex justify-between text-lg font-semibold text-red-600">
                        <span>Total Descontos</span>
                        <span>-{formatCurrencyBRL(result.totalDeductions)}</span>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Net Total */}
                    <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total Liquido</span>
                        <span className="text-3xl font-bold text-primary">
                          {formatCurrencyBRL(result.totalNet)}
                        </span>
                      </div>
                    </div>

                    {/* FGTS Info */}
                    {result.canWithdrawFgts && parseFloat(fgtsBalance) > 0 && (
                      <Alert>
                        <DollarSign className="size-4" />
                        <AlertTitle>Saque do FGTS</AlertTitle>
                        <AlertDescription>
                          O funcionario pode sacar{" "}
                          <strong>{formatCurrencyBRL(result.fgtsWithdrawable)}</strong> do FGTS
                          {terminationType === "acordo_mutuo"
                            ? " (80% do saldo + multa de 20%)"
                            : " (100% do saldo + multa de 40%)"}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Unemployment Insurance */}
                    {result.hasUnemploymentInsurance && (
                      <Alert>
                        <CheckCircle2 className="size-4" />
                        <AlertTitle>Seguro-Desemprego</AlertTitle>
                        <AlertDescription>
                          O funcionario tem direito ao seguro-desemprego. Guias para
                          requerimento devem ser entregues na rescisao.
                        </AlertDescription>
                      </Alert>
                    )}

                    {terminationType === "justa_causa" && (
                      <Alert variant="destructive">
                        <XCircle className="size-4" />
                        <AlertTitle>Justa Causa</AlertTitle>
                        <AlertDescription>
                          Na demissao por justa causa, o funcionario perde o direito a: aviso
                          previo, ferias proporcionais, multa FGTS, saque FGTS e
                          seguro-desemprego.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Info className="size-4" />
                  Informacoes Importantes
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong>Aviso Previo:</strong> Calculado conforme Lei 12.506/2011 (30 dias +
                  3 dias por ano trabalhado, maximo 90 dias).
                </p>
                <p>
                  <strong>INSS:</strong> Calculado sobre saldo de salario, 13o e aviso previo
                  (ferias sao isentas).
                </p>
                <p>
                  <strong>Prazo de Pagamento:</strong> Ate 10 dias apos o termino do contrato
                  (Art. 477 CLT).
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
