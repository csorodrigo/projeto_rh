"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import {
  WizardContainer,
  WizardStep,
  PersonalDataStep,
  ProfessionalDataStep,
  DocumentsStep,
  BankDataStep,
  ContactStep,
  AddressStep,
  ReviewStep,
} from "@/components/admission-wizard"
import { employeeSchema, type EmployeeInput } from "@/lib/validations/employee"
import { getCurrentProfile, getEmployee, updateEmployee } from "@/lib/supabase/queries"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import type { Employee } from "@/types/database"

const WIZARD_STEPS: WizardStep[] = [
  { id: "personal", title: "Pessoal" },
  { id: "professional", title: "Profissional" },
  { id: "documents", title: "Documentos" },
  { id: "bank", title: "Bancario" },
  { id: "contact", title: "Contato" },
  { id: "address", title: "Endereco" },
  { id: "review", title: "Revisao" },
]

// Fields to validate per step
const STEP_FIELDS: Record<number, (keyof EmployeeInput)[]> = {
  0: ["name", "cpf", "birthDate", "gender", "maritalStatus"], // Personal
  1: ["position", "department", "hireDate", "contractType"], // Professional
  2: [], // Documents - optional fields
  3: [], // Bank - optional fields
  4: [], // Contact - optional fields
  5: [], // Address - optional fields
  6: [], // Review - no validation needed
}

/**
 * Convert Employee database type to form input type
 */
function employeeToFormData(employee: Employee): EmployeeInput {
  const address = employee.address as {
    zip_code?: string
    street?: string
    number?: string
    complement?: string
    neighborhood?: string
    city?: string
    state?: string
  } | null

  return {
    name: employee.full_name,
    cpf: employee.cpf || "",
    rg: employee.rg || "",
    birthDate: employee.birth_date || "",
    gender: (employee.gender as "male" | "female" | "other") || "male",
    maritalStatus: (employee.marital_status as "single" | "married" | "divorced" | "widowed" | "separated") || "single",
    nationality: employee.nationality || "Brasileira",
    position: employee.position || "",
    department: employee.department || "",
    costCenter: employee.cost_center || "",
    hireDate: employee.hire_date || "",
    contractType: (employee.contract_type as "clt" | "pj" | "intern" | "temporary") || "clt",
    pis: employee.pis || "",
    ctps: employee.ctps_number || "",
    ctpsSeries: employee.ctps_series || "",
    professionalCategory: employee.professional_category || "",
    cbo: employee.cbo || "",
    bank: employee.bank_name || "",
    agency: employee.agency || "",
    account: employee.account || "",
    accountType: (employee.account_type as "checking" | "savings") || "checking",
    pixKey: employee.pix_key || "",
    address: {
      zipCode: address?.zip_code || "",
      street: address?.street || "",
      number: address?.number || "",
      complement: address?.complement || "",
      neighborhood: address?.neighborhood || "",
      city: address?.city || "",
      state: address?.state || "",
    },
    email: employee.email || "",
    phone: employee.phone || "",
    emergencyContact: {
      name: employee.emergency_contact || "",
      phone: employee.emergency_phone || "",
      relationship: "",
    },
    baseSalary: employee.salary || employee.base_salary || 0,
    workScheduleId: employee.work_schedule_id || undefined,
  }
}

export default function EditEmployeePage() {
  const params = useParams()
  const router = useRouter()
  const [currentStep, setCurrentStep] = React.useState(0)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [employee, setEmployee] = React.useState<Employee | null>(null)
  const [originalData, setOriginalData] = React.useState<string>("")

  const form = useForm<EmployeeInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(employeeSchema) as any,
    defaultValues: {
      name: "",
      cpf: "",
      rg: "",
      birthDate: "",
      gender: "male",
      maritalStatus: "single",
      nationality: "Brasileira",
      position: "",
      department: "",
      costCenter: "",
      hireDate: new Date().toISOString().split("T")[0],
      contractType: "clt",
      pis: "",
      ctps: "",
      ctpsSeries: "",
      professionalCategory: "",
      cbo: "",
      bank: "",
      agency: "",
      account: "",
      accountType: "checking",
      pixKey: "",
      address: {
        zipCode: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
      },
      email: "",
      phone: "",
      emergencyContact: {
        name: "",
        phone: "",
        relationship: "",
      },
      baseSalary: 0,
      workScheduleId: undefined,
    },
    mode: "onChange",
  })

  // Load employee data
  React.useEffect(() => {
    async function loadEmployee() {
      if (!params.id || typeof params.id !== "string") {
        setError("ID do funcionário inválido")
        setIsLoading(false)
        return
      }

      try {
        const result = await getEmployee(params.id)
        if (result.error || !result.data) {
          setError(result.error?.message || "Funcionário não encontrado")
          setIsLoading(false)
          return
        }

        setEmployee(result.data)
        const formData = employeeToFormData(result.data)

        // Store original data for comparison
        setOriginalData(JSON.stringify(formData))

        // Reset form with employee data
        form.reset(formData)
        setIsLoading(false)
      } catch (err) {
        setError("Erro ao carregar dados do funcionário")
        setIsLoading(false)
      }
    }

    loadEmployee()
  }, [params.id, form])

  const validateCurrentStep = async (): Promise<boolean> => {
    const fieldsToValidate = STEP_FIELDS[currentStep]

    if (fieldsToValidate.length === 0) {
      return true
    }

    const result = await form.trigger(fieldsToValidate)
    return result
  }

  const handleNext = async (): Promise<boolean> => {
    return await validateCurrentStep()
  }

  const handleBack = () => {
    // Nothing special needed when going back
  }

  const handleSubmit = async () => {
    if (!employee?.id) {
      toast.error("ID do funcionário não encontrado")
      return
    }

    setIsSubmitting(true)

    try {
      // Validate all fields before submission
      const isValid = await form.trigger()
      if (!isValid) {
        toast.error("Por favor, corrija os erros no formulário")
        setIsSubmitting(false)
        return
      }

      const data = form.getValues()

      // Check if there are any changes
      const currentData = JSON.stringify(data)
      if (currentData === originalData) {
        toast.info("Nenhuma alteração foi feita")
        router.push(`/funcionarios/${employee.id}`)
        return
      }

      const profileResult = await getCurrentProfile()
      if (profileResult.error || !profileResult.data?.company_id) {
        toast.error("Erro ao identificar empresa")
        setIsSubmitting(false)
        return
      }

      const employeeData = {
        company_id: profileResult.data.company_id,
        full_name: data.name,
        // CPF is readonly, so we don't update it
        rg: data.rg || null,
        birth_date: data.birthDate,
        gender: data.gender,
        marital_status: data.maritalStatus,
        nationality: data.nationality,
        position: data.position,
        department: data.department,
        cost_center: data.costCenter || null,
        hire_date: data.hireDate,
        contract_type: data.contractType,
        pis: data.pis || null,
        ctps_number: data.ctps || null,
        ctps_series: data.ctpsSeries || null,
        professional_category: data.professionalCategory || null,
        cbo: data.cbo || null,
        bank_name: data.bank || null,
        agency: data.agency || null,
        account: data.account || null,
        account_type: data.accountType || null,
        pix_key: data.pixKey || null,
        address: data.address || null,
        email: data.email || null,
        phone: data.phone || null,
        emergency_contact: data.emergencyContact?.name || null,
        emergency_phone: data.emergencyContact?.phone || null,
        salary: data.baseSalary || null,
        work_schedule_id: data.workScheduleId || null,
        // Status is managed separately, not included in this update
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await updateEmployee(employee.id, employeeData as any)
      if (result.error) {
        toast.error(result.error.message || "Erro ao atualizar funcionário")
        setIsSubmitting(false)
        return
      }

      toast.success("Funcionário atualizado com sucesso!")
      router.push(`/funcionarios/${employee.id}`)
    } catch (error) {
      toast.error("Erro ao atualizar funcionário")
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (!employee?.id) {
      router.push("/funcionarios")
      return
    }
    router.push(`/funcionarios/${employee.id}`)
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <PersonalDataStep form={form} isEditing={true} />
      case 1:
        return <ProfessionalDataStep form={form} />
      case 2:
        return <DocumentsStep form={form} />
      case 3:
        return <BankDataStep form={form} />
      case 4:
        return <ContactStep form={form} />
      case 5:
        return <AddressStep form={form} />
      case 6:
        return <ReviewStep form={form} />
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/funcionarios">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Funcionário</h1>
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
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
            <h1 className="text-3xl font-bold tracking-tight">Editar Funcionário</h1>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertCircle className="h-10 w-10 text-destructive mb-4" />
            <p className="text-lg font-medium mb-2">Erro ao carregar funcionário</p>
            <p className="text-muted-foreground mb-4">{error || "Funcionário não encontrado"}</p>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/funcionarios">Voltar para Lista</Link>
              </Button>
              <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Funcionário</h1>
          <p className="text-muted-foreground">
            Edite os dados de {employee.full_name}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()}>
          <WizardContainer
            steps={WIZARD_STEPS}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            onNext={handleNext}
            onBack={handleBack}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitButtonText="Salvar Alterações"
            onCancel={handleCancel}
          >
            {renderStepContent()}
          </WizardContainer>
        </form>
      </Form>
    </div>
  )
}
