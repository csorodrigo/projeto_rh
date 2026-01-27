"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { signUp } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/client"

const registerSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter no minimo 2 caracteres"),
    email: z.string().email("Email invalido"),
    companyName: z.string().min(2, "Nome da empresa deve ter no minimo 2 caracteres"),
    password: z.string().min(6, "Senha deve ter no minimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas nao coincidem",
    path: ["confirmPassword"],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      companyName: "",
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true)
    const supabase = createClient()

    try {
      // 1. Create auth user
      const { user, error: authError } = await signUp({
        email: data.email,
        password: data.password,
        full_name: data.name,
      })

      if (authError) {
        if (authError.message.includes("already registered")) {
          toast.error("Este email ja esta cadastrado.")
        } else {
          toast.error("Erro ao criar conta. Tente novamente.")
        }
        return
      }

      if (!user) {
        toast.error("Erro ao criar conta. Tente novamente.")
        return
      }

      // 2. Create company
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: company, error: companyError } = await (supabase as any)
        .from("companies")
        .insert({
          name: data.companyName,
          owner_id: user.id,
          status: "active",
        })
        .select("id")
        .single()

      if (companyError) {
        console.error("Company creation error:", companyError)
        toast.error("Erro ao criar empresa. Entre em contato com o suporte.")
        return
      }

      // 3. Update profile with company_id and admin role
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: profileError } = await (supabase as any)
        .from("profiles")
        .update({
          company_id: company.id,
          role: "admin",
          full_name: data.name,
        })
        .eq("id", user.id)

      if (profileError) {
        console.error("Profile update error:", profileError)
        toast.error("Erro ao configurar perfil. Entre em contato com o suporte.")
        return
      }

      toast.success("Conta criada com sucesso! Verifique seu email para confirmar.")
      router.push("/login")
    } catch (error) {
      console.error("Registration error:", error)
      toast.error("Erro ao criar conta. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Criar Conta</CardTitle>
        <CardDescription className="text-center">
          Cadastre sua empresa no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seu Nome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Joao Silva"
                      autoComplete="name"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Empresa</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Minha Empresa LTDA"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="******"
                      autoComplete="new-password"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="******"
                      autoComplete="new-password"
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
                  Criando conta...
                </>
              ) : (
                "Criar Conta"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <p className="text-center text-sm text-muted-foreground w-full">
          Ja tem uma conta?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
