"use client"

import * as React from "react"
import { UseFormReturn } from "react-hook-form"
import { User } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
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
import { MaskedInput } from "@/components/ui/input-masked"
import type { EmployeeInput } from "@/lib/validations/employee"

interface PersonalDataStepEnhancedProps {
  form: UseFormReturn<EmployeeInput>
}

export function PersonalDataStepEnhanced({ form }: PersonalDataStepEnhancedProps) {
  const [cpfValid, setCpfValid] = React.useState(false)

  return (
    <Card className="animate-in fade-in duration-300">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <User className="size-5 text-primary" />
          </div>
          <div>
            <CardTitle>Dados Pessoais</CardTitle>
            <CardDescription>
              Informações pessoais do funcionário
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Nome e CPF */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Nome completo"
                    className={
                      fieldState.error
                        ? "border-red-500 focus-visible:ring-red-500 animate-shake"
                        : field.value && !fieldState.error
                        ? "border-green-500 focus-visible:ring-green-500"
                        : ""
                    }
                  />
                </FormControl>
                <FormLabel className="flex items-center gap-1">
                  Nome Completo
                  <span className="text-red-500 text-sm">*</span>
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <MaskedInput
                    maskType="cpf"
                    value={field.value}
                    onChange={field.onChange}
                    onValidChange={setCpfValid}
                    label="CPF"
                    required
                    placeholder="000.000.000-00"
                    validateOnBlur
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* RG, Data de Nascimento, Nacionalidade */}
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="rg"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>RG</FormLabel>
                <FormControl>
                  <Input
                    placeholder="00.000.000-0"
                    {...field}
                    className={
                      field.value && !fieldState.error
                        ? "border-green-500 focus-visible:ring-green-500"
                        : ""
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="birthDate"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  Data de Nascimento
                  <span className="text-red-500 text-sm">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    max={new Date().toISOString().split("T")[0]}
                    className={
                      fieldState.error
                        ? "border-red-500 focus-visible:ring-red-500 animate-shake"
                        : field.value && !fieldState.error
                        ? "border-green-500 focus-visible:ring-green-500"
                        : ""
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nationality"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Nacionalidade</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Brasileira"
                    {...field}
                    className={
                      field.value && !fieldState.error
                        ? "border-green-500 focus-visible:ring-green-500"
                        : ""
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Gênero e Estado Civil */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="gender"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  Gênero
                  <span className="text-red-500 text-sm">*</span>
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger
                      className={
                        fieldState.error
                          ? "border-red-500 focus:ring-red-500 animate-shake"
                          : field.value
                          ? "border-green-500 focus:ring-green-500"
                          : ""
                      }
                    >
                      <SelectValue placeholder="Selecione o gênero" />
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
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  Estado Civil
                  <span className="text-red-500 text-sm">*</span>
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger
                      className={
                        fieldState.error
                          ? "border-red-500 focus:ring-red-500 animate-shake"
                          : field.value
                          ? "border-green-500 focus:ring-green-500"
                          : ""
                      }
                    >
                      <SelectValue placeholder="Selecione o estado civil" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="single">Solteiro(a)</SelectItem>
                    <SelectItem value="married">Casado(a)</SelectItem>
                    <SelectItem value="divorced">Divorciado(a)</SelectItem>
                    <SelectItem value="widowed">Viúvo(a)</SelectItem>
                    <SelectItem value="separated">Separado(a)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Progress Indicator */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Progresso do formulário
            </span>
            <span className="font-medium">
              {Object.values(form.watch()).filter(Boolean).length} /{" "}
              {Object.keys(form.watch()).length} campos preenchidos
            </span>
          </div>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 progress-gradient"
              style={{
                width: `${
                  (Object.values(form.watch()).filter(Boolean).length /
                    Object.keys(form.watch()).length) *
                  100
                }%`,
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
