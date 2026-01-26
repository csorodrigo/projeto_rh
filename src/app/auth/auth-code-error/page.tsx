import Link from "next/link"
import { AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 text-red-600 rounded-full p-4">
              <AlertCircle className="size-8" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            Erro de Autenticacao
          </CardTitle>
          <CardDescription className="text-center">
            O link de confirmacao expirou ou e invalido. Por favor, solicite um
            novo link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/login">Voltar para o Login</Link>
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Precisa de ajuda?{" "}
            <Link href="/suporte" className="text-primary hover:underline">
              Entre em contato
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
