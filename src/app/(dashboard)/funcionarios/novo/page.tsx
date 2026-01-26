"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft } from "lucide-react"
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
import { getCurrentProfile, createEmployee } from "@/lib/supabase/queries"

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

export default function NewEmployeePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = React.useState(0)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<EmployeeInput>({
    resolver: zodResolver(employeeSchema),
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
    setIsSubmitting(true)

    try {
      // Validate all fields before submission
      const isValid = await form.trigger()
      if (!isValid) {
        toast.error("Por favor, corrija os erros no formulario")
        setIsSubmitting(false)
        return
      }

      const data = form.getValues()

      const profileResult = await getCurrentProfile()
      if (profileResult.error || !profileResult.data?.company_id) {
        toast.error("Erro ao identificar empresa")
        return
      }

      const employeeData = {
        company_id: profileResult.data.company_id,
        full_name: data.name,
        cpf: data.cpf.replace(/\D/g, ""),
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
        base_salary: data.baseSalary || null,
        work_schedule_id: data.workScheduleId || null,
        status: "active" as const,
      }

      const result = await createEmployee(employeeData)
      if (result.error) {
        if (result.error.message.includes("duplicate")) {
          toast.error("CPF ja cadastrado para outro funcionario")
        } else {
          toast.error("Erro ao cadastrar funcionario")
        }
        return
      }

      toast.success("Funcionario cadastrado com sucesso!")
      router.push("/funcionarios")
    } catch (error) {
      toast.error("Erro ao cadastrar funcionario")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <PersonalDataStep form={form} />
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
          <h1 className="text-3xl font-bold tracking-tight">Novo Funcionario</h1>
          <p className="text-muted-foreground">
            Preencha os dados para cadastrar um novo funcionario
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
          >
            {renderStepContent()}
          </WizardContainer>
        </form>
      </Form>
    </div>
  )
}
