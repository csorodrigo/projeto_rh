"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FormField } from "@/components/ui/form-field"
import { MaskedInput } from "@/components/ui/input-masked"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import { toastSuccess, toastError, toastPromise } from "@/lib/toast-utils"
import { Mail, Phone } from "lucide-react"

const demoSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  cpf: z.string().min(1, "CPF é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  cep: z.string().min(1, "CEP é obrigatório"),
  dateRange: z.object({
    from: z.union([z.date(), z.undefined()]),
    to: z.date().optional(),
  }),
  message: z.string().max(500, "Mensagem muito longa"),
})

type DemoFormData = z.infer<typeof demoSchema>

export default function DemoFormsPage() {
  const [showConfirmation, setShowConfirmation] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<DemoFormData>({
    resolver: zodResolver(demoSchema),
    defaultValues: {
      name: "",
      email: "",
      cpf: "",
      phone: "",
      cep: "",
      message: "",
      dateRange: {
        from: undefined,
        to: undefined,
      },
    },
  })

  const handleAddressFetch = (address: {
    logradouro: string
    bairro: string
    cidade: string
    uf: string
  }) => {
    console.log("Endereço encontrado:", address)
    toastSuccess("CEP encontrado!", `${address.logradouro}, ${address.bairro}`)
  }

  const onSubmit = async (data: DemoFormData) => {
    setShowConfirmation(true)
  }

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true)

    await toastPromise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: "Salvando dados...",
        success: "Dados salvados com sucesso!",
        error: "Erro ao salvar dados",
      }
    )

    setIsSubmitting(false)
    setShowConfirmation(false)
    form.reset()
  }

  const testToasts = () => {
    toastSuccess("Operação bem-sucedida", "Seus dados foram salvos")
    setTimeout(() => {
      toastError("Erro encontrado", "Verifique os campos e tente novamente")
    }, 1000)
  }

  return (
    <div className="container max-w-4xl py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Demo: Formulários Melhorados
        </h1>
        <p className="text-muted-foreground mt-2">
          Demonstração dos componentes de formulário com validação visual
        </p>
      </div>

      <Separator />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* FormField Básico */}
          <Card>
            <CardHeader>
              <CardTitle>FormField Básico</CardTitle>
              <CardDescription>
                Campo com validação visual em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="Nome Completo"
                required
                placeholder="Digite seu nome"
                helperText="Mínimo de 3 caracteres"
                showCharacterCount
                maxCharacters={100}
                {...form.register("name")}
                error={form.formState.errors.name?.message}
                isValid={!!form.watch("name") && !form.formState.errors.name}
              />
            </CardContent>
          </Card>

          {/* Campos com Máscara */}
          <Card>
            <CardHeader>
              <CardTitle>Campos com Máscara e Validação</CardTitle>
              <CardDescription>
                CPF, E-mail, Telefone e CEP com formatação automática
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <MaskedInput
                  maskType="cpf"
                  label="CPF"
                  required
                  placeholder="000.000.000-00"
                  {...form.register("cpf")}
                  value={form.watch("cpf")}
                  onChange={(value) => form.setValue("cpf", value)}
                  validateOnBlur
                />

                <MaskedInput
                  maskType="email"
                  label="E-mail"
                  required
                  placeholder="seu@email.com"
                  leftIcon={<Mail className="size-4" />}
                  {...form.register("email")}
                  value={form.watch("email")}
                  onChange={(value) => form.setValue("email", value)}
                  validateOnBlur
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <MaskedInput
                  maskType="phone"
                  label="Telefone"
                  required
                  placeholder="(00) 00000-0000"
                  leftIcon={<Phone className="size-4" />}
                  {...form.register("phone")}
                  value={form.watch("phone")}
                  onChange={(value) => form.setValue("phone", value)}
                  validateOnBlur
                />

                <MaskedInput
                  maskType="cep"
                  label="CEP"
                  required
                  placeholder="00000-000"
                  helperText="O endereço será buscado automaticamente"
                  {...form.register("cep")}
                  value={form.watch("cep")}
                  onChange={(value) => form.setValue("cep", value)}
                  onAddressFetch={handleAddressFetch}
                  validateOnBlur
                />
              </div>
            </CardContent>
          </Card>

          {/* Date Range Picker */}
          <Card>
            <CardHeader>
              <CardTitle>Seletor de Período</CardTitle>
              <CardDescription>
                Com cálculo automático de dias úteis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DateRangePicker
                value={form.watch("dateRange")}
                onChange={(range) => form.setValue("dateRange", range)}
                label="Período de Férias"
                required
                showBusinessDays
                helperText="Selecione o período desejado"
              />
            </CardContent>
          </Card>

          {/* Character Counter */}
          <Card>
            <CardHeader>
              <CardTitle>Campo com Contador de Caracteres</CardTitle>
              <CardDescription>
                Limite de 500 caracteres
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                label="Mensagem"
                placeholder="Digite sua mensagem..."
                showCharacterCount
                maxCharacters={500}
                {...form.register("message")}
                error={form.formState.errors.message?.message}
                helperText="Opcional. Descreva detalhes adicionais"
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4">
            <Button type="button" variant="outline" onClick={testToasts}>
              Testar Toasts
            </Button>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
              >
                Limpar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Enviar Formulário
              </Button>
            </div>
          </div>
        </form>
      </Form>

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        onConfirm={handleConfirmSubmit}
        title="Confirmar envio"
        description="Você tem certeza que deseja enviar este formulário? Esta ação não pode ser desfeita."
        confirmText="Sim, enviar"
        cancelText="Cancelar"
        isLoading={isSubmitting}
      />
    </div>
  )
}
