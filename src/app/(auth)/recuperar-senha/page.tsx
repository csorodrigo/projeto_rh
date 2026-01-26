"use client"

import * as React from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, ArrowLeft, Mail } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { resetPassword } from "@/lib/supabase/auth"

const resetPasswordSchema = z.object({
  email: z.string().email("Email invalido"),
})

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export default function RecoverPasswordPage() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [emailSent, setEmailSent] = React.useState(false)

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(data: ResetPasswordFormValues) {
    setIsLoading(true)

    try {
      const { error } = await resetPassword(data.email)

      if (error) {
        toast.error("Erro ao enviar email. Tente novamente.")
        return
      }

      setEmailSent(true)
      toast.success("Email de recuperacao enviado!")
    } catch (error) {
      toast.error("Erro ao enviar email. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 text-green-600 rounded-full p-4">
              <Mail className="size-8" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Email Enviado</CardTitle>
          <CardDescription className="text-center">
            Verifique sua caixa de entrada e siga as instrucoes para redefinir sua senha.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full" variant="outline">
            <Link href="/login">
              <ArrowLeft className="mr-2 size-4" />
              Voltar para o Login
            </Link>
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Nao recebeu o email?{" "}
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => setEmailSent(false)}
            >
              Enviar novamente
            </button>
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Recuperar Senha</CardTitle>
        <CardDescription className="text-center">
          Digite seu email para receber um link de recuperacao
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      autoComplete="email"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Email de Recuperacao"
              )}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center"
          >
            <ArrowLeft className="mr-1 size-3" />
            Voltar para o Login
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
