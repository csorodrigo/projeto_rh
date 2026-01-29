"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Loader2,
  Plus,
  X,
  Building2,
  FileText,
  DollarSign,
  Send,
} from "lucide-react"
import { toast } from "sonner"

import { JobFormData, JobStatus } from "@/lib/types/recruitment"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const jobFormSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  department: z.string().min(1, "Selecione um departamento"),
  location: z.string().min(1, "Informe a localização"),
  location_type: z.enum(["onsite", "remote", "hybrid"], {
    required_error: "Selecione o modelo de trabalho",
  }),
  job_type: z.enum(["full_time", "part_time", "contract", "temporary", "internship"], {
    required_error: "Selecione o tipo de contratação",
  }),
  description: z.string().min(50, "A descrição deve ter pelo menos 50 caracteres"),
  requirements: z.array(z.string()).min(1, "Adicione pelo menos um requisito"),
  benefits: z.array(z.string()).optional(),
  salary_min: z.number().optional(),
  salary_max: z.number().optional(),
  positions: z.number().min(1, "Informe o número de vagas"),
  hiring_manager_id: z.string().optional(),
  publish_internal: z.boolean().default(true),
  publish_external: z.boolean().default(false),
  status: z.enum(["open", "paused", "closed", "draft"]).default("draft"),
})

type JobFormValues = z.infer<typeof jobFormSchema>

interface JobFormProps {
  initialData?: Partial<JobFormData>
  onSubmit: (data: JobFormData) => Promise<void>
  isLoading?: boolean
  submitLabel?: string
}

const steps = [
  {
    id: "basic",
    title: "Informações Básicas",
    description: "Defina o título, departamento e localização da vaga",
    icon: Building2,
  },
  {
    id: "description",
    title: "Descrição",
    description: "Descreva a vaga, requisitos e benefícios",
    icon: FileText,
  },
  {
    id: "compensation",
    title: "Remuneração e Vagas",
    description: "Defina a faixa salarial e número de vagas",
    icon: DollarSign,
  },
  {
    id: "publication",
    title: "Publicação",
    description: "Configure como a vaga será publicada",
    icon: Send,
  },
]

export function JobForm({
  initialData,
  onSubmit,
  isLoading = false,
  submitLabel = "Salvar Vaga",
}: JobFormProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = React.useState(0)
  const [requirementInput, setRequirementInput] = React.useState("")
  const [benefitInput, setBenefitInput] = React.useState("")

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      department: initialData?.department || "",
      location: initialData?.location || "",
      location_type: initialData?.location_type || "onsite",
      job_type: initialData?.job_type || "full_time",
      description: initialData?.description || "",
      requirements: initialData?.requirements || [],
      benefits: initialData?.benefits || [],
      salary_min: initialData?.salary_min,
      salary_max: initialData?.salary_max,
      positions: initialData?.positions || 1,
      hiring_manager_id: initialData?.hiring_manager_id,
      publish_internal: initialData?.publish_internal ?? true,
      publish_external: initialData?.publish_external ?? false,
      status: initialData?.status || "draft",
    },
  })

  const handleSubmit = async (values: JobFormValues) => {
    try {
      await onSubmit(values as JobFormData)
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error("Erro ao salvar vaga")
    }
  }

  const handleNext = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep)
    const isValid = await form.trigger(fieldsToValidate as any)

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const getFieldsForStep = (step: number): (keyof JobFormValues)[] => {
    switch (step) {
      case 0:
        return ["title", "department", "location", "location_type", "job_type"]
      case 1:
        return ["description", "requirements"]
      case 2:
        return ["positions"]
      case 3:
        return ["publish_internal", "publish_external"]
      default:
        return []
    }
  }

  const addRequirement = () => {
    if (requirementInput.trim()) {
      const current = form.getValues("requirements")
      form.setValue("requirements", [...current, requirementInput.trim()])
      setRequirementInput("")
    }
  }

  const removeRequirement = (index: number) => {
    const current = form.getValues("requirements")
    form.setValue(
      "requirements",
      current.filter((_, i) => i !== index)
    )
  }

  const addBenefit = () => {
    if (benefitInput.trim()) {
      const current = form.getValues("benefits") || []
      form.setValue("benefits", [...current, benefitInput.trim()])
      setBenefitInput("")
    }
  }

  const removeBenefit = (index: number) => {
    const current = form.getValues("benefits") || []
    form.setValue(
      "benefits",
      current.filter((_, i) => i !== index)
    )
  }

  const currentStepData = steps[currentStep]
  const StepIcon = currentStepData.icon

  return (
    <div className="space-y-6">
      {/* Steps Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = index === currentStep
              const isCompleted = index < currentStep

              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`flex size-12 items-center justify-center rounded-full border-2 transition-colors ${
                        isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : isCompleted
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-muted bg-background text-muted-foreground"
                      }`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div className="hidden sm:flex flex-col items-center gap-1">
                      <span
                        className={`text-sm font-medium ${
                          isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-4 transition-colors ${
                        isCompleted ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <StepIcon className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{currentStepData.title}</CardTitle>
                  <CardDescription>{currentStepData.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 0: Basic Information */}
              {currentStep === 0 && (
                <>
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título da Vaga</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Desenvolvedor Full Stack" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Departamento</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                              <SelectItem value="Vendas">Vendas</SelectItem>
                              <SelectItem value="Marketing">Marketing</SelectItem>
                              <SelectItem value="Recursos Humanos">
                                Recursos Humanos
                              </SelectItem>
                              <SelectItem value="Financeiro">Financeiro</SelectItem>
                              <SelectItem value="Operações">Operações</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Localização</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: São Paulo, SP" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="location_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Modelo de Trabalho</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="onsite">Presencial</SelectItem>
                              <SelectItem value="remote">Remoto</SelectItem>
                              <SelectItem value="hybrid">Híbrido</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="job_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Contratação</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="full_time">Tempo Integral</SelectItem>
                              <SelectItem value="part_time">Meio Período</SelectItem>
                              <SelectItem value="contract">Contrato</SelectItem>
                              <SelectItem value="temporary">Temporário</SelectItem>
                              <SelectItem value="internship">Estágio</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              {/* Step 1: Description */}
              {currentStep === 1 && (
                <>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição da Vaga</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva as responsabilidades e o dia a dia da posição..."
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Mínimo de 50 caracteres. Seja claro e detalhado.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <FormField
                    control={form.control}
                    name="requirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Requisitos</FormLabel>
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Adicione um requisito..."
                              value={requirementInput}
                              onChange={(e) => setRequirementInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  addRequirement()
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={addRequirement}
                            >
                              <Plus className="size-4" />
                            </Button>
                          </div>
                          {field.value && field.value.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {field.value.map((req, index) => (
                                <Badge key={index} variant="secondary" className="gap-1">
                                  {req}
                                  <button
                                    type="button"
                                    onClick={() => removeRequirement(index)}
                                    className="ml-1 hover:text-destructive"
                                  >
                                    <X className="size-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <FormDescription>
                          Pressione Enter ou clique no botão + para adicionar
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <FormField
                    control={form.control}
                    name="benefits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Benefícios (Opcional)</FormLabel>
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Adicione um benefício..."
                              value={benefitInput}
                              onChange={(e) => setBenefitInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  addBenefit()
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={addBenefit}
                            >
                              <Plus className="size-4" />
                            </Button>
                          </div>
                          {field.value && field.value.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {field.value.map((benefit, index) => (
                                <Badge key={index} variant="secondary" className="gap-1">
                                  {benefit}
                                  <button
                                    type="button"
                                    onClick={() => removeBenefit(index)}
                                    className="ml-1 hover:text-destructive"
                                  >
                                    <X className="size-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Step 2: Compensation */}
              {currentStep === 2 && (
                <>
                  <FormField
                    control={form.control}
                    name="positions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Vagas</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Quantas pessoas você deseja contratar para esta posição?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="space-y-4">
                    <FormLabel>Faixa Salarial (Opcional)</FormLabel>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="salary_min"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-normal">Mínimo</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value ? parseFloat(e.target.value) : undefined
                                  )
                                }
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="salary_max"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-normal">Máximo</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value ? parseFloat(e.target.value) : undefined
                                  )
                                }
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormDescription>
                      Deixe em branco se não deseja divulgar a faixa salarial
                    </FormDescription>
                  </div>
                </>
              )}

              {/* Step 3: Publication */}
              {currentStep === 3 && (
                <>
                  <FormField
                    control={form.control}
                    name="publish_internal"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Publicar Internamente</FormLabel>
                          <FormDescription>
                            A vaga será visível para funcionários da empresa
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="publish_external"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Publicar Externamente</FormLabel>
                          <FormDescription>
                            A vaga será visível em portais de emprego externos
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status da Vaga</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Rascunho</SelectItem>
                            <SelectItem value="open">Aberta</SelectItem>
                            <SelectItem value="paused">Pausada</SelectItem>
                            <SelectItem value="closed">Fechada</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Você pode salvar como rascunho e publicar depois
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0 || isLoading}
            >
              <ChevronLeft className="mr-2 size-4" />
              Anterior
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button type="button" onClick={handleNext} disabled={isLoading}>
                Próximo
                <ChevronRight className="ml-2 size-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 size-4" />
                    {submitLabel}
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
