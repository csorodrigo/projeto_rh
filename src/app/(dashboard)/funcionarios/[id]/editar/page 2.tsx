"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Loader2, Save, AlertCircle } from "lucide-react"
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
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { employeeUpdateSchema, type EmployeeUpdateInput } from "@/lib/validations/employee"
import { getEmployee, updateEmployee } from "@/lib/supabase/queries"
import { formatCPF, formatPhone, formatCEP } from "@/lib/utils"
import type { Employee } from "@/types/database"

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
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="space-y-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function EditEmployeePage() {
  const params = useParams()
  const router = useRouter()
  const [employee, setEmployee] = React.useState<Employee | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const form = useForm<EmployeeUpdateInput>({
    resolver: zodResolver(employeeUpdateSchema),
    defaultValues: {},
  })

  React.useEffect(() => {
    async function fetchEmployee() {
      if (!params.id || typeof params.id !== "string") return

      try {
        const result = await getEmployee(params.id)
        if (result.error) {
          setError(result.error.message)
          return
        }

        const emp = result.data
        if (!emp) {
          setError("Funcionario nao encontrado")
          return
        }

        setEmployee(emp)

        const address = emp.address as {
          zip_code?: string
          street?: string
          number?: string
          complement?: string
          neighborhood?: string
          city?: string
          state?: string
        } | null

        form.reset({
          name: emp.full_name || "",
          cpf: emp.cpf ? formatCPF(emp.cpf) : "",
          rg: emp.rg || "",
          birthDate: emp.birth_date || "",
          gender: (emp.gender as "male" | "female" | "other") || undefined,
          maritalStatus: (emp.marital_status as "single" | "married" | "divorced" | "widowed" | "separated") || undefined,
          nationality: emp.nationality || "Brasileira",
          position: emp.position || "",
          department: emp.department || "",
          costCenter: emp.cost_center || "",
          hireDate: emp.hire_date || "",
          contractType: (emp.contract_type as "clt" | "pj" | "intern" | "temporary") || undefined,
          pis: emp.pis || "",
          ctps: emp.ctps_number || "",
          ctpsSeries: emp.ctps_series || "",
          professionalCategory: emp.professional_category || "",
          cbo: emp.cbo || "",
          bank: emp.bank_name || "",
          agency: emp.agency || "",
          account: emp.account || "",
          accountType: (emp.account_type as "checking" | "savings") || undefined,
          pixKey: emp.pix_key || "",
          address: {
            zipCode: address?.zip_code || "",
            street: address?.street || "",
            number: address?.number || "",
            complement: address?.complement || "",
            neighborhood: address?.neighborhood || "",
            city: address?.city || "",
            state: address?.state || "",
          },
          email: emp.email || "",
          phone: emp.phone || "",
          emergencyContact: {
            name: emp.emergency_contact || "",
            phone: emp.emergency_phone || "",
            relationship: "",
          },
          baseSalary: emp.salary || 0,
          workScheduleId: emp.work_schedule_id || undefined,
        })
      } catch (err) {
        setError("Erro ao carregar funcionario")
      } finally {
        setIsLoading(false)
      }
    }

    fetchEmployee()
  }, [params.id, form])

  async function onSubmit(data: EmployeeUpdateInput) {
    if (!employee) return

    setIsSaving(true)

    try {
      const updates: Record<string, unknown> = {}

      if (data.name) updates.full_name = data.name
      if (data.cpf) updates.cpf = data.cpf.replace(/\D/g, "")
      if (data.rg !== undefined) updates.rg = data.rg || null
      if (data.birthDate) updates.birth_date = data.birthDate
      if (data.gender) updates.gender = data.gender
      if (data.maritalStatus) updates.marital_status = data.maritalStatus
      if (data.nationality !== undefined) updates.nationality = data.nationality || null
      if (data.position) updates.position = data.position
      if (data.department) updates.department = data.department
      if (data.costCenter !== undefined) updates.cost_center = data.costCenter || null
      if (data.hireDate) updates.hire_date = data.hireDate
      if (data.contractType) updates.contract_type = data.contractType
      if (data.pis !== undefined) updates.pis = data.pis || null
      if (data.ctps !== undefined) updates.ctps_number = data.ctps || null
      if (data.ctpsSeries !== undefined) updates.ctps_series = data.ctpsSeries || null
      if (data.professionalCategory !== undefined) updates.professional_category = data.professionalCategory || null
      if (data.cbo !== undefined) updates.cbo = data.cbo || null
      if (data.bank !== undefined) updates.bank_name = data.bank || null
      if (data.agency !== undefined) updates.agency = data.agency || null
      if (data.account !== undefined) updates.account = data.account || null
      if (data.accountType !== undefined) updates.account_type = data.accountType || null
      if (data.pixKey !== undefined) updates.pix_key = data.pixKey || null
      if (data.address) updates.address = data.address
      if (data.email !== undefined) updates.email = data.email || null
      if (data.phone !== undefined) updates.phone = data.phone || null
      if (data.emergencyContact?.name !== undefined) updates.emergency_contact = data.emergencyContact.name || null
      if (data.emergencyContact?.phone !== undefined) updates.emergency_phone = data.emergencyContact.phone || null
      if (data.baseSalary !== undefined) updates.salary = data.baseSalary || null
      if (data.workScheduleId !== undefined) updates.work_schedule_id = data.workScheduleId || null

      const result = await updateEmployee(employee.id, updates)
      if (result.error) {
        if (result.error.message.includes("duplicate")) {
          toast.error("CPF ja cadastrado para outro funcionario")
        } else {
          toast.error("Erro ao atualizar funcionario")
        }
        return
      }

      toast.success("Funcionario atualizado com sucesso!")
      router.push(`/funcionarios/${employee.id}`)
    } catch (err) {
      toast.error("Erro ao atualizar funcionario")
    } finally {
      setIsSaving(false)
    }
  }

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
            <h1 className="text-3xl font-bold tracking-tight">Editar Funcionario</h1>
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/funcionarios/${employee.id}`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Funcionario</h1>
          <p className="text-muted-foreground">{employee.full_name}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Dados Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
              <CardDescription>Informacoes pessoais do funcionario</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="000.000.000-00"
                          {...field}
                          onChange={(e) => {
                            const formatted = formatCPF(e.target.value)
                            field.onChange(formatted)
                          }}
                          maxLength={14}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="rg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RG</FormLabel>
                      <FormControl>
                        <Input placeholder="00.000.000-0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nacionalidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Brasileira" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Genero *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Masculino</SelectItem>
                          <SelectItem value="female">Feminino</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maritalStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado Civil *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="single">Solteiro(a)</SelectItem>
                          <SelectItem value="married">Casado(a)</SelectItem>
                          <SelectItem value="divorced">Divorciado(a)</SelectItem>
                          <SelectItem value="widowed">Viuvo(a)</SelectItem>
                          <SelectItem value="separated">Separado(a)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Dados Profissionais */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Profissionais</CardTitle>
              <CardDescription>Informacoes do vinculo empregaticio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Analista de RH" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departamento *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Recursos Humanos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="hireDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Admissao *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contractType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Contrato *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="clt">CLT</SelectItem>
                          <SelectItem value="pj">PJ</SelectItem>
                          <SelectItem value="intern">Estagiario</SelectItem>
                          <SelectItem value="temporary">Temporario</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="costCenter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Centro de Custo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: CC001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="baseSalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salario Base</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>Valor em Reais (R$)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardHeader>
              <CardTitle>Contato</CardTitle>
              <CardDescription>Informacoes de contato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(00) 00000-0000"
                          {...field}
                          onChange={(e) => {
                            const formatted = formatPhone(e.target.value)
                            field.onChange(formatted)
                          }}
                          maxLength={15}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />
              <p className="text-sm font-medium">Contato de Emergencia</p>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="emergencyContact.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do contato" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergencyContact.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(00) 00000-0000"
                          {...field}
                          onChange={(e) => {
                            const formatted = formatPhone(e.target.value)
                            field.onChange(formatted)
                          }}
                          maxLength={15}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergencyContact.relationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parentesco</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Mae, Pai, Conjuge" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" asChild>
              <Link href={`/funcionarios/${employee.id}`}>Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 size-4" />
                  Salvar Alteracoes
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
