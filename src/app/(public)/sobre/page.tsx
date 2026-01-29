import { Metadata } from "next"
import { Building2, Users, Target, TrendingUp } from "lucide-react"

export const metadata: Metadata = {
  title: "Sobre Nós | RH Sesame",
  description: "Conheça o RH Sesame - Sistema completo de gestão de recursos humanos para empresas brasileiras.",
}

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Sobre o RH Sesame
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sistema completo de gestão de recursos humanos desenvolvido para
            atender às necessidades das empresas brasileiras.
          </p>
        </div>

        {/* Mission Section */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div className="bg-card rounded-lg p-8 shadow-sm border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold">Nossa Missão</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Simplificar e otimizar a gestão de recursos humanos, fornecendo
              ferramentas modernas e intuitivas que ajudam empresas a gerenciar
              seus colaboradores de forma eficiente e em conformidade com a
              legislação brasileira.
            </p>
          </div>

          <div className="bg-card rounded-lg p-8 shadow-sm border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold">Nossa Visão</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Ser a plataforma de RH mais utilizada e confiável do Brasil,
              reconhecida pela inovação, facilidade de uso e compromisso com o
              sucesso de nossos clientes.
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Por Que Escolher o RH Sesame?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Gestão Completa de Pessoas
              </h3>
              <p className="text-muted-foreground">
                Controle de ponto, férias, ausências, folha de pagamento e muito
                mais em um único lugar.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Compliance Brasileiro
              </h3>
              <p className="text-muted-foreground">
                100% em conformidade com CLT, e-Social, LGPD e demais
                regulamentações brasileiras.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <Target className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Fácil de Usar</h3>
              <p className="text-muted-foreground">
                Interface moderna e intuitiva que qualquer pessoa pode usar sem
                treinamento extensivo.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-card rounded-lg p-12 shadow-sm border text-center">
          <h2 className="text-3xl font-bold mb-8">Nossos Números</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">100+</div>
              <p className="text-muted-foreground">Empresas Atendidas</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">
                10K+
              </div>
              <p className="text-muted-foreground">Funcionários Gerenciados</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">
                99.9%
              </div>
              <p className="text-muted-foreground">Uptime Garantido</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">24/7</div>
              <p className="text-muted-foreground">Suporte Disponível</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para Transformar seu RH?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Entre em contato conosco e descubra como o RH Sesame pode ajudar sua
            empresa a crescer.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/vagas"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Ver Vagas Abertas
            </a>
            <a
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Acessar Sistema
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
