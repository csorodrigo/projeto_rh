"use client"

import * as React from "react"
import { UseFormReturn } from "react-hook-form"
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
import { Separator } from "@/components/ui/separator"
import { formatPhone } from "@/lib/utils"
import type { EmployeeInput } from "@/lib/validations/employee"

interface ContactStepProps {
  form: UseFormReturn<EmployeeInput>
}

export function ContactStep({ form }: ContactStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contato</CardTitle>
        <CardDescription>
          Informacoes de contato
        </CardDescription>
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
  )
}
