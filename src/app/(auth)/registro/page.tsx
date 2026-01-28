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

// Função para validar CNPJ
function isValidCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]/g, "")

  if (cnpj.length !== 14) return false
  if (/^(\d)\1+$/.test(cnpj)) return false

  let size = cnpj.length - 2
  let numbers = cnpj.substring(0, size)
  const digits = cnpj.substring(size)
  let sum = 0
  let pos = size - 7

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(0))) return false

  size = size + 1
  numbers = cnpj.substring(0, size)
  sum = 0
  pos = size - 7

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  return result === parseInt(digits.charAt(1))
}

const registerSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter no minimo 2 caracteres"),
    email: z.string().email("Email invalido"),
    companyName: z.string().min(2, "Nome da empresa deve ter no minimo 2 caracteres"),
    cnpj: z.string()
      .min(1, "CNPJ é obrigatório")
      .refine((val) => isValidCNPJ(val), "CNPJ inválido"),
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
      cnpj: "",
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
        } else if (authError.message.includes("rate limit") || authError.status === 429) {
          toast.error("Muitas tentativas. Aguarde alguns minutos e tente novamente.")
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
          email: data.email,
          cnpj: data.cnpj.replace(/[^\d]/g, ""),
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

      // 3. Create/Update profile with company_id and admin role
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: profileError } = await (supabase as any)
        .from("profiles")
        .upsert({
          id: user.id,
          company_id: company.id,
          name: data.name,
          email: data.email,
          role: "admin",
        })

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
              name="cnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="00.000.000/0000-00"
                      disabled={isLoading}
                      maxLength={18}
                      {...field}
                      onChange={(e) => {
                        let value = e.target.value.replace(/[^\d]/g, "")
                        if (value.length <= 14) {
                          value = value.replace(/^(\d{2})(\d)/, "$1.$2")
                          value = value.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
                          value = value.replace(/\.(\d{3})(\d)/, ".$1/$2")
                          value = value.replace(/(\d{4})(\d)/, "$1-$2")
                        }
                        field.onChange(value)
                      }}
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
