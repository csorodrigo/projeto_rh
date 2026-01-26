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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import type { EmployeeInput } from "@/lib/validations/employee"

interface DocumentsStepProps {
  form: UseFormReturn<EmployeeInput>
}

export function DocumentsStep({ form }: DocumentsStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentos Trabalhistas</CardTitle>
        <CardDescription>
          Documentos para registro trabalhista
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="pis"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PIS/PASEP</FormLabel>
                <FormControl>
                  <Input placeholder="000.00000.00-0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cbo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CBO</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 2524-05" {...field} />
                </FormControl>
                <FormDescription>Classificacao Brasileira de Ocupacoes</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="ctps"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CTPS Numero</FormLabel>
                <FormControl>
                  <Input placeholder="0000000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ctpsSeries"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CTPS Serie</FormLabel>
                <FormControl>
                  <Input placeholder="0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="professionalCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 01" {...field} />
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
