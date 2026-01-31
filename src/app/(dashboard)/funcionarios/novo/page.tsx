"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { createClient } from "@/lib/supabase/client"
import { createEmployee } from "@/lib/supabase/queries/employees"
import { isValidCPF, formatCPF, formatPhone } from "@/lib/utils"

// Schema de validação simplificado
const newEmployeeSchema = z.object({
  // Dados pessoais
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  cpf: z.string().refine((val) => isValidCPF(val), "CPF inválido"),
  personal_email: z.string().email("Email inválido"),
  birth_date: z.string().min(1, "Data de nascimento é obrigatória").refine((val) => {
    const date = new Date(val)
    return date < new Date()
  }, "Data de nascimento deve ser anterior a hoje"),
  personal_phone: z.string().optional(),
  rg: z.string().optional(),

  // Dados profissionais
  position: z.string().min(1, "Cargo é obrigatório"),
  department: z.string().min(1, "Departamento é obrigatório"),
  hire_date: z.string().min(1, "Data de admissão é obrigatória").refine((val) => {
    const date = new Date(val)
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    return date <= today
  }, "Data de admissão não pode ser no futuro"),
  base_salary: z.string().min(1, "Salário é obrigatório").refine((val) => {
    const num = parseFloat(val.replace(/[^\d,]/g, '').replace(',', '.'))
    return num > 0
  }, "Salário deve ser maior que zero"),
  status: z.enum(["active", "inactive", "on_leave"], {
    message: "Status é obrigatório",
  }),

  // Endereço (opcional)
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  address_complement: z.string().optional(),
  address_neighborhood: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
  address_zip: z.string().optional(),
})

type NewEmployeeFormData = z.infer<typeof newEmployeeSchema>

export default function NewEmployeePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<NewEmployeeFormData>({
    resolver: zodResolver(newEmployeeSchema),
    defaultValues: {
      name: "",
      cpf: "",
      personal_email: "",
      birth_date: "",
      personal_phone: "",
      rg: "",
      position: "",
      department: "",
      hire_date: new Date().toISOString().split("T")[0],
      base_salary: "",
      status: "active",
      address_street: "",
      address_number: "",
      address_complement: "",
      address_neighborhood: "",
      address_city: "",
      address_state: "",
      address_zip: "",
    },
  })

  // Formatação de CPF
  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value)
    form.setValue("cpf", formatted)
  }

  // Formatação de telefone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    form.setValue("personal_phone", formatted)
  }

  // Formatação de salário
  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    const formatted = (parseFloat(value) / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    form.setValue("base_salary", formatted)
  }

  const onSubmit = async (data: NewEmployeeFormData) => {
    setIsSubmitting(true)

    try {
      // Buscar company_id do usuário logado
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Usuário não autenticado")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single()

      const profileCompanyId = (profile as { company_id?: string } | null)?.company_id

      if (!profileCompanyId) {
        toast.error("Erro ao identificar empresa")
        return
      }

      // Preparar dados do funcionário
      const employeeData = {
        company_id: profileCompanyId,
        name: data.name,
        cpf: data.cpf.replace(/\D/g, ""),
        personal_email: data.personal_email,
        birth_date: data.birth_date,
        personal_phone: data.personal_phone || null,
        position: data.position,
        department: data.department,
        hire_date: data.hire_date,
        base_salary: parseFloat(data.base_salary.replace(/\./g, "").replace(",", ".")),
        status: data.status,
      }

      // Criar funcionário
      const result = await createEmployee(employeeData)

      if (result.error) {
        if (result.error.includes("duplicate") || result.error.includes("unique")) {
          toast.error("CPF já cadastrado para outro funcionário")
        } else {
          toast.error("Erro ao cadastrar funcionário: " + result.error)
        }
        return
      }

      toast.success("Funcionário cadastrado com sucesso!")
      router.push("/funcionarios")
    } catch (error) {
      console.error("Erro ao cadastrar funcionário:", error)
      toast.error("Erro ao cadastrar funcionário")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/funcionarios">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Funcionário</h1>
          <p className="text-muted-foreground">
            Preencha os dados para cadastrar um novo funcionário
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Dados Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
              <CardDescription>
                Informações básicas do funcionário
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="João da Silva" {...field} />
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
                        maxLength={14}
                        {...field}
                        onChange={handleCPFChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                name="birth_date"
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
                name="personal_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                        {...field}
                        onChange={handlePhoneChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="personal_email"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="joao.silva@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Dados Profissionais */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Profissionais</CardTitle>
              <CardDescription>
                Informações sobre o cargo e contrato
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Analista de RH" {...field} />
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
                      <Input placeholder="Recursos Humanos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hire_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Admissão *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="base_salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salário Base *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0,00"
                        {...field}
                        onChange={handleSalaryChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                        <SelectItem value="on_leave">Afastado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Endereço (Opcional) */}
          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
              <CardDescription>
                Informações de endereço (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="address_zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input placeholder="00000-000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address_street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rua</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua das Flores" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input placeholder="123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address_complement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complemento</FormLabel>
                    <FormControl>
                      <Input placeholder="Apto 45" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address_neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input placeholder="Centro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address_city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="São Paulo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address_state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input placeholder="SP" maxLength={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/funcionarios")}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Salvar Funcionário
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
