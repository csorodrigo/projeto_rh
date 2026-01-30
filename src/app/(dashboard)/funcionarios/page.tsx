"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus,
  Download,
  RefreshCw,
  AlertCircle,
  Eye,
  Edit,
  Mail,
  Trash2,
  MoreHorizontal,
  CheckCircle2,
  Pause,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { ColumnDef } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getCurrentProfile } from "@/lib/supabase/queries"
import {
  listEmployees,
  deleteEmployee,
  type Employee
} from "@/lib/supabase/queries/employees"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import { QuickStatusBadge, type StatusKey } from "@/components/ui/status-badge"
import { ExportButton } from "@/components/export"
import { exportEmployeesToCSV, exportEmployeesPDF } from "@/lib/export"

const statusMap: Record<string, StatusKey> = {
  active: "active",
  inactive: "inactive",
  on_leave: "on_leave",
  terminated: "terminated",
}

export default function EmployeesPage() {
  const router = useRouter()
  const [employees, setEmployees] = React.useState<Employee[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [employeeToDelete, setEmployeeToDelete] = React.useState<Employee | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [selectedEmployees, setSelectedEmployees] = React.useState<Employee[]>([])

  const fetchEmployees = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const profileResult = await getCurrentProfile()
      if (profileResult.error || !profileResult.data?.company_id) {
        setError("Erro ao carregar perfil do usuario")
        return
      }

      const result = await listEmployees({ pageSize: 100 })
      setEmployees(result.employees || [])
    } catch (err) {
      setError("Erro ao carregar funcionarios")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const handleDelete = async () => {
    if (!employeeToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteEmployee(employeeToDelete.id)
      if (result.error) {
        toast.error("Erro ao desligar funcionario")
        return
      }

      toast.success("Funcionario desligado com sucesso")
      await fetchEmployees()
    } catch (err) {
      toast.error("Erro ao desligar funcionario")
      console.error(err)
    } finally {
      setIsDeleting(false)
      setEmployeeToDelete(null)
    }
  }

  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Funcionário" />,
      cell: ({ row }) => {
        const employee = row.original
        const seed = employee.name.replace(/\s+/g, '')
        const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`

        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarImage src={avatarUrl} alt={employee.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {employee.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium truncate">{employee.name}</p>
              <p className="text-sm text-muted-foreground truncate">
                {employee.personal_email || employee.cpf}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "department",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Departamento" />,
      cell: ({ row }) => <span>{row.getValue("department") || "-"}</span>,
    },
    {
      accessorKey: "position",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Cargo" />,
      cell: ({ row }) => <span>{row.getValue("position") || "-"}</span>,
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const statusKey = statusMap[status] || "active"
        return <QuickStatusBadge status={statusKey} />
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "hire_date",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Admissão" />,
      cell: ({ row }) => {
        const date = row.getValue("hire_date") as string
        return date ? new Date(date).toLocaleDateString("pt-BR") : "-"
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const employee = row.original
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
              <DropdownMenuItem asChild>
                <Link href={`/funcionarios/${employee.id}`} className="cursor-pointer">
                  <Eye className="mr-2 size-4" />
                  Visualizar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/funcionarios/${employee.id}/editar`} className="cursor-pointer">
                  <Edit className="mr-2 size-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              {employee.personal_email && (
                <DropdownMenuItem onClick={() => window.open(`mailto:${employee.personal_email}`)}>
                  <Mail className="mr-2 size-4" />
                  Enviar Email
                </DropdownMenuItem>
              )}
              {employee.status !== "terminated" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setEmployeeToDelete(employee)}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Desligar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Funcionários</h1>
            <p className="text-muted-foreground">
              Gerencie todos os funcionários da empresa
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertCircle className="h-10 w-10 text-destructive mb-4" />
            <p className="text-lg font-medium mb-2">Erro ao carregar funcionários</p>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchEmployees}>
              <RefreshCw className="mr-2 size-4" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Funcionários</h1>
          <p className="text-muted-foreground">
            Gerencie todos os funcionários da empresa
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            onExportCSV={() => exportEmployeesToCSV(employees)}
            onExportPDF={async () => { await exportEmployeesPDF(employees) }}
            disabled={employees.length === 0}
          />
          <Button variant="outline" onClick={fetchEmployees}>
            <RefreshCw className="mr-2 size-4" />
            Atualizar
          </Button>
          <Button asChild>
            <Link href="/funcionarios/novo">
              <Plus className="mr-2 size-4" />
              Novo Funcionário
            </Link>
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Funcionários</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os funcionários da empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={employees}
            searchKey="full_name"
            searchPlaceholder="Buscar por nome, email, matrícula..."
            isLoading={isLoading}
            enableRowSelection
            onSelectionChange={setSelectedEmployees}
            emptyMessage="Nenhum funcionário encontrado"
            emptyDescription="Comece adicionando seu primeiro funcionário"
            toolbar={
              selectedEmployees.length > 0 && (
                <div className="flex gap-2">
                  <ExportButton
                    onExportCSV={() => exportEmployeesToCSV(selectedEmployees)}
                    onExportPDF={async () => { await exportEmployeesPDF(selectedEmployees) }}
                    label={`Exportar selecionados (${selectedEmployees.length})`}
                    size="sm"
                  />
                </div>
              )
            }
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!employeeToDelete} onOpenChange={() => setEmployeeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Desligamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desligar o funcionário{" "}
              <strong>{employeeToDelete?.name}</strong>? Esta ação irá alterar
              o status para &quot;Desligado&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Desligando...
                </>
              ) : (
                "Confirmar Desligamento"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
