"use client"

import * as React from "react"
import { KanbanBoard, defaultAbsenceColumns, type KanbanItem } from "./kanban"
import type { AbsenceStatus } from "@/types/database"

/**
 * Kanban Board Example Component
 * Demonstração do componente Kanban com dados de exemplo
 */

export function KanbanExample() {
  const [items, setItems] = React.useState<KanbanItem[]>([
    {
      id: "1",
      title: "João Silva",
      status: "pending",
      type: "vacation",
      startDate: "2024-02-01",
      endDate: "2024-02-15",
      employee: {
        id: "emp-1",
        name: "João Silva",
        department: "Tecnologia da Informação",
      },
    },
    {
      id: "2",
      title: "Maria Santos",
      status: "pending",
      type: "sick_leave",
      startDate: "2024-02-05",
      endDate: "2024-02-07",
      employee: {
        id: "emp-2",
        name: "Maria Santos",
        department: "Recursos Humanos",
      },
    },
    {
      id: "3",
      title: "Pedro Oliveira",
      status: "approved",
      type: "maternity_leave",
      startDate: "2024-01-15",
      endDate: "2024-05-15",
      employee: {
        id: "emp-3",
        name: "Pedro Oliveira",
        department: "Financeiro",
      },
    },
    {
      id: "4",
      title: "Ana Costa",
      status: "approved",
      type: "vacation",
      startDate: "2024-02-10",
      endDate: "2024-02-20",
      employee: {
        id: "emp-4",
        name: "Ana Costa",
        department: "Marketing",
      },
    },
    {
      id: "5",
      title: "Carlos Ferreira",
      status: "rejected",
      type: "vacation",
      startDate: "2024-02-01",
      endDate: "2024-02-05",
      employee: {
        id: "emp-5",
        name: "Carlos Ferreira",
        department: "Vendas",
      },
    },
    {
      id: "6",
      title: "Juliana Alves",
      status: "in_progress",
      type: "medical_appointment",
      startDate: "2024-02-01",
      endDate: "2024-02-01",
      employee: {
        id: "emp-6",
        name: "Juliana Alves",
        department: "Operações",
      },
    },
  ])

  const handleItemMove = (itemId: string, newStatus: AbsenceStatus) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status: newStatus } : item))
    )

    console.log(`Item ${itemId} moved to ${newStatus}`)
  }

  const handleItemClick = (item: KanbanItem) => {
    console.log("Item clicked:", item)
    alert(`Detalhes de ${item.employee.name}\nTipo: ${item.type}\nStatus: ${item.status}`)
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Kanban Board - Exemplo</h2>
        <p className="text-muted-foreground">
          Arraste os cards entre as colunas para mudar o status
        </p>
      </div>

      <KanbanBoard
        items={items}
        columns={defaultAbsenceColumns}
        onItemMove={handleItemMove}
        onItemClick={handleItemClick}
      />

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Instruções:</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Arraste os cards entre as colunas para mudar o status</li>
          <li>• Clique em um card para ver os detalhes</li>
          <li>• Os contadores são atualizados automaticamente</li>
          <li>• Em mobile, use scroll horizontal para ver todas as colunas</li>
        </ul>
      </div>
    </div>
  )
}
