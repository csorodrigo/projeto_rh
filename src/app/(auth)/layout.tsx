import { Building2 } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/50 p-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="bg-primary text-primary-foreground flex aspect-square size-10 items-center justify-center rounded-lg">
          <Building2 className="size-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Sistema RH</h1>
          <p className="text-xs text-muted-foreground">Gestao de Recursos Humanos</p>
        </div>
      </div>

      {/* Content */}
      <div className="w-full max-w-md">
        {children}
      </div>

      {/* Footer */}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Todos os direitos reservados
      </p>
    </div>
  )
}
