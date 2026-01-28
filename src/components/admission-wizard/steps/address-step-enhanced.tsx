"use client"

import * as React from "react"
import { UseFormReturn } from "react-hook-form"
import { MapPin, Loader2, CheckCircle2 } from "lucide-react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toastSuccess, toastError } from "@/lib/toast-utils"
import type { EmployeeInput } from "@/lib/validations/employee"

interface AddressStepEnhancedProps {
  form: UseFormReturn<EmployeeInput>
}

const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
]

export function AddressStepEnhanced({ form }: AddressStepEnhancedProps) {
  const [cepFetched, setCepFetched] = React.useState(false)

  const handleAddressFetch = React.useCallback(
    (address: { logradouro: string; bairro: string; cidade: string; uf: string }) => {
      form.setValue("address.street", address.logradouro)
      form.setValue("address.neighborhood", address.bairro)
      form.setValue("address.city", address.cidade)
      form.setValue("address.state", address.uf)

      setCepFetched(true)
      toastSuccess("CEP encontrado!", "Endereço preenchido automaticamente")

      // Reset after 3 seconds
      setTimeout(() => setCepFetched(false), 3000)
    },
    [form]
  )

  return (
    <Card className="animate-in fade-in duration-300">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <MapPin className="size-5 text-primary" />
          </div>
          <div>
            <CardTitle>Endereço</CardTitle>
            <CardDescription>
              Endereço residencial do funcionário
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* CEP with auto-fetch */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="address.zipCode"
            render={({ field }) => (
              <FormItem className="max-w-[200px]">
                <FormControl>
                  <MaskedInput
                    maskType="cep"
                    value={field.value}
                    onChange={field.onChange}
                    onAddressFetch={handleAddressFetch}
                    label="CEP"
                    placeholder="00000-000"
                    validateOnBlur
                    helperText="O endereço será preenchido automaticamente"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Success Alert */}
          {cepFetched && (
            <Alert className="bg-green-50 border-green-200 animate-in slide-in-from-top-2 duration-300">
              <CheckCircle2 className="size-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Endereço preenchido automaticamente a partir do CEP
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Street */}
        <FormField
          control={form.control}
          name="address.street"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Logradouro</FormLabel>
              <FormControl>
                <Input
                  placeholder="Rua, Avenida, etc."
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

        {/* Number, Complement, Neighborhood */}
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="address.number"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Número</FormLabel>
                <FormControl>
                  <Input
                    placeholder="000"
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
            name="address.complement"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Complemento</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Apto, Bloco, etc."
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
            name="address.neighborhood"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Bairro</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Bairro"
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

        {/* City and State */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="address.city"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Cidade</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Cidade"
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
            name="address.state"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger
                      className={
                        field.value
                          ? "border-green-500 focus:ring-green-500"
                          : ""
                      }
                    >
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BRAZILIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  )
}
