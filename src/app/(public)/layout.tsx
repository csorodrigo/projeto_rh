import { Building2 } from "lucide-react"
import Link from "next/link"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          {/* Logo */}
          <Link href="/vagas" className="flex items-center gap-2 mr-6">
            <div className="bg-primary text-primary-foreground flex aspect-square size-10 items-center justify-center rounded-lg">
              <Building2 className="size-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg">Carreiras</span>
              <span className="text-xs text-muted-foreground">Sua Empresa</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-6 text-sm flex-1">
            <Link
              href="/vagas"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Vagas Abertas
            </Link>
            <Link
              href="/sobre"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Sobre a Empresa
            </Link>
          </nav>

          {/* Login Link */}
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Building2 className="size-4" />
                </div>
                <span className="font-bold">Sua Empresa</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Construindo o futuro com pessoas incríveis.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4">Links Rápidos</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/vagas" className="text-muted-foreground hover:text-foreground transition-colors">
                    Vagas Abertas
                  </Link>
                </li>
                <li>
                  <Link href="/sobre" className="text-muted-foreground hover:text-foreground transition-colors">
                    Sobre a Empresa
                  </Link>
                </li>
                <li>
                  <Link href="/privacidade" className="text-muted-foreground hover:text-foreground transition-colors">
                    Política de Privacidade
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold mb-4">Contato</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>rh@suaempresa.com</li>
                <li>+55 (11) 1234-5678</li>
                <li>São Paulo, SP</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Sua Empresa. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
