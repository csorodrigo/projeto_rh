import { AnimationShowcase } from "@/components/ui/animation-showcase"
import { AnimatedEmployeeGrid } from "@/components/examples/animated-employee-card"
import { AnimatedFormExample } from "@/components/examples/animated-form-example"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AnimationsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold">Animações e Micro-Interactions</h1>
        <p className="text-muted-foreground mt-2">
          Sistema completo de animações para melhorar a experiência do usuário
        </p>
      </div>

      <Tabs defaultValue="showcase" className="animate-slide-up">
        <TabsList>
          <TabsTrigger value="showcase">Showcase Completo</TabsTrigger>
          <TabsTrigger value="employee-cards">Cards de Funcionários</TabsTrigger>
          <TabsTrigger value="forms">Formulários</TabsTrigger>
        </TabsList>

        <TabsContent value="showcase" className="space-y-6">
          <AnimationShowcase />
        </TabsContent>

        <TabsContent value="employee-cards" className="space-y-6">
          <div className="animate-fade-in">
            <h2 className="text-2xl font-semibold mb-2">Cards de Funcionários Animados</h2>
            <p className="text-muted-foreground mb-6">
              Exemplo real de cards com hover states, stagger animation e micro-interactions
            </p>
          </div>
          <AnimatedEmployeeGrid />
        </TabsContent>

        <TabsContent value="forms" className="space-y-6">
          <div className="animate-fade-in">
            <h2 className="text-2xl font-semibold mb-2">Formulário com Validação Animada</h2>
            <p className="text-muted-foreground mb-6">
              Demonstração de shake em erros, feedback visual e animações de submit
            </p>
          </div>
          <AnimatedFormExample />
        </TabsContent>
      </Tabs>
    </div>
  )
}
