import { Kanban as KanbanIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function KanbanPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kanban de Ausências</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie ausências em quadro kanban
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20">
          <KanbanIcon className="size-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Em desenvolvimento</h3>
          <p className="text-muted-foreground text-center max-w-md">
            O quadro kanban de ausências estará disponível em breve. Você poderá
            arrastar e soltar para alterar status das solicitações.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
