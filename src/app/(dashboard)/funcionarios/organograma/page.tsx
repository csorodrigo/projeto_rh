import { Network, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function OrganogramaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organograma</h1>
        <p className="text-muted-foreground">
          Visualize a estrutura hierárquica da empresa
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20">
          <Network className="size-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Em desenvolvimento</h3>
          <p className="text-muted-foreground text-center max-w-md">
            O organograma interativo estará disponível em breve. Você poderá
            visualizar a estrutura da empresa e as relações hierárquicas.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
