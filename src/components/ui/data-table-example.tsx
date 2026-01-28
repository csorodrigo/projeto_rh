"use client"

/**
 * EXEMPLO DE USO DO DATA TABLE PROFISSIONAL
 *
 * Este arquivo demonstra como usar o DataTable avançado com todas as funcionalidades:
 * - Paginação completa
 * - Ordenação por coluna
 * - Busca/filtro global
 * - Seleção múltipla
 * - Ações em lote
 * - Status badges com ícones
 * - Row actions dropdown
 */

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Eye, Edit, Trash2, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import { QuickStatusBadge, type StatusKey } from "@/components/ui/status-badge"

// Exemplo de tipo de dados
interface ExampleData {
  id: string
  name: string
  email: string
  role: string
  status: "active" | "inactive" | "pending"
  createdAt: string
}

// Mapeamento de status para badges
const statusMap: Record<string, StatusKey> = {
  active: "active",
  inactive: "inactive",
  pending: "pending",
}

export function DataTableExample() {
  const [data, setData] = React.useState<ExampleData[]>([
    {
      id: "1",
      name: "João Silva",
      email: "joao@example.com",
      role: "Desenvolvedor",
      status: "active",
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      name: "Maria Santos",
      email: "maria@example.com",
      role: "Designer",
      status: "active",
      createdAt: "2024-01-20",
    },
    {
      id: "3",
      name: "Pedro Costa",
      email: "pedro@example.com",
      role: "Gerente",
      status: "pending",
      createdAt: "2024-02-01",
    },
  ])

  const [selectedRows, setSelectedRows] = React.useState<ExampleData[]>([])

  // Definição das colunas
  const columns: ColumnDef<ExampleData>[] = [
    // Coluna com ordenação
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
      cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
    },
    {
      accessorKey: "email",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    },
    {
      accessorKey: "role",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Cargo" />,
    },
    // Coluna com status badge
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const statusKey = statusMap[status] || "active"
        return <QuickStatusBadge status={statusKey} />
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Data Criação" />,
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as string
        return new Date(date).toLocaleDateString("pt-BR")
      },
    },
    // Coluna de ações
    {
      id: "actions",
      cell: ({ row }) => {
        const item = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Ações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => console.log("Ver", item)}>
                <Eye className="mr-2 size-4" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log("Editar", item)}>
                <Edit className="mr-2 size-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => console.log("Deletar", item)}
              >
                <Trash2 className="mr-2 size-4" />
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={data}
      // Busca global
      searchKey="name"
      searchPlaceholder="Buscar por nome..."
      // Seleção múltipla
      enableRowSelection
      onSelectionChange={setSelectedRows}
      // Empty state customizado
      emptyMessage="Nenhum item encontrado"
      emptyDescription="Tente ajustar os filtros de busca"
      // Paginação
      pageSize={10}
      pageSizeOptions={[10, 25, 50, 100]}
      // Toolbar customizado (ações em lote)
      toolbar={
        selectedRows.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => console.log("Exportar", selectedRows)}
            >
              <Download className="mr-2 size-4" />
              Exportar selecionados ({selectedRows.length})
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => console.log("Deletar", selectedRows)}
            >
              <Trash2 className="mr-2 size-4" />
              Deletar selecionados
            </Button>
          </div>
        )
      }
    />
  )
}

/**
 * GUIA DE USO RÁPIDO:
 *
 * 1. IMPORTAR COMPONENTES:
 * ```tsx
 * import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
 * import { QuickStatusBadge } from "@/components/ui/status-badge"
 * import { ColumnDef } from "@tanstack/react-table"
 * ```
 *
 * 2. DEFINIR COLUNAS:
 * ```tsx
 * const columns: ColumnDef<YourType>[] = [
 *   {
 *     accessorKey: "name",
 *     header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
 *     cell: ({ row }) => <span>{row.getValue("name")}</span>,
 *   },
 * ]
 * ```
 *
 * 3. USAR O DATATABLE:
 * ```tsx
 * <DataTable
 *   columns={columns}
 *   data={data}
 *   searchKey="name"
 *   searchPlaceholder="Buscar..."
 *   enableRowSelection
 *   onSelectionChange={setSelected}
 * />
 * ```
 *
 * FUNCIONALIDADES:
 * - ✅ Paginação real (10, 25, 50, 100 items)
 * - ✅ Ordenação por coluna (clicável no header)
 * - ✅ Filtro de busca global
 * - ✅ Seleção múltipla com checkbox
 * - ✅ Ações em lote (toolbar customizado)
 * - ✅ Loading skeleton automático
 * - ✅ Empty state com ilustração
 * - ✅ Responsivo (horizontal scroll)
 * - ✅ Status badges com ícones e tooltips
 * - ✅ Row actions dropdown
 * - ✅ Confirmação para ações destrutivas
 */
