"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

/**
 * Exemplo de formulário com animações e validação
 * Demonstra shake em erros e feedback visual completo
 */
export function AnimatedFormExample() {
  const [errors, setErrors] = React.useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newErrors: Record<string, boolean> = {}

    // Validação simples
    if (!formData.get("name")) newErrors.name = true
    if (!formData.get("email")) newErrors.email = true
    if (!formData.get("department")) newErrors.department = true

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    setIsSubmitting(true)
    toast.loading("Salvando dados...", { id: "form-submit" })

    // Simula envio
    await new Promise(resolve => setTimeout(resolve, 2000))

    setIsSubmitting(false)
    toast.success("Dados salvos com sucesso!", { id: "form-submit" })

    // Reset form
    e.currentTarget.reset()
  }

  return (
    <Card className="animate-scale-in max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Cadastro de Funcionário</CardTitle>
        <CardDescription>
          Preencha os dados do novo funcionário
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nome Completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="Digite o nome completo"
              className={errors.name ? "animate-shake border-destructive" : ""}
              onFocus={() => setErrors(prev => ({ ...prev, name: false }))}
            />
            {errors.name && (
              <p className="text-xs text-destructive animate-fade-in">
                Campo obrigatório
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              E-mail <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="email@empresa.com"
              className={errors.email ? "animate-shake border-destructive" : ""}
              onFocus={() => setErrors(prev => ({ ...prev, email: false }))}
            />
            {errors.email && (
              <p className="text-xs text-destructive animate-fade-in">
                Campo obrigatório
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">
                Departamento <span className="text-destructive">*</span>
              </Label>
              <Select name="department">
                <SelectTrigger
                  className={errors.department ? "animate-shake border-destructive" : ""}
                  onFocus={() => setErrors(prev => ({ ...prev, department: false }))}
                >
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dev">Desenvolvimento</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="rh">Recursos Humanos</SelectItem>
                  <SelectItem value="sales">Vendas</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
              {errors.department && (
                <p className="text-xs text-destructive animate-fade-in">
                  Campo obrigatório
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Informações adicionais..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setErrors({})
                toast.info("Formulário resetado")
              }}
            >
              Limpar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="hover-glow"
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
