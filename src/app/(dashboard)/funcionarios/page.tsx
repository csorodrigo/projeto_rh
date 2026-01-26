"use client"

import * as React from "react"
import Link from "next/link"
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  Mail,
  Loader2,
  RefreshCw,
  AlertCircle,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { getCurrentProfile, listEmployees, deleteEmployee } from "@/lib/supabase/queries"
import type { Employee } from "@/types/database"

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Ativo", variant: "default" },
  inactive: { label: "Inativo", variant: "secondary" },
  on_leave: { label: "Afastado", variant: "outline" },
  terminated: { label: "Desligado", variant: "destructive" },
}

function EmployeeTableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 py-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-3 w-[150px]" />
          </div>
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-6 w-[80px]" />
          <Skeleton className="h-4 w-[80px]" />
        </div>
      ))}
    </div>
  )
}

export default function EmployeesPage() {
  const [employees, setEmployees] = React.useState<Employee[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = React.useState<string>("all")
  const [employeeToDelete, setEmployeeToDelete] = React.useState<Employee | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const fetchEmployees = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const profileResult = await getCurrentProfile()
      if (profileResult.error || !profileResult.data?.company_id) {
        setError("Erro ao carregar perfil do usuario")
        return
      }

      const filters: { status?: string; department?: string } = {}
      if (statusFilter !== "all") {
        filters.status = statusFilter
      }
      if (departmentFilter !== "all") {
        filters.department = departmentFilter
      }

      const result = await listEmployees(profileResult.data.company_id, filters)
      if (result.error) {
        setError(result.error.message)
        return
      }

      setEmployees(result.data || [])
    } catch (err) {
      setError("Erro ao carregar funcionarios")
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, departmentFilter])

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
      fetchEmployees()
    } catch (err) {
      toast.error("Erro ao desligar funcionario")
    } finally {
      setIsDeleting(false)
      setEmployeeToDelete(null)
    }
  }

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_number?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const departments = React.useMemo(() => {
    const depts = new Set(employees.map((e) => e.department).filter(Boolean))
    return Array.from(depts).sort()
  }, [employees])

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Funcionarios</h1>
            <p className="text-muted-foreground">
              Gerencie todos os funcionarios da empresa
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertCircle className="h-10 w-10 text-destructive mb-4" />
            <p className="text-lg font-medium mb-2">Erro ao carregar funcionarios</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Funcionarios</h1>
          <p className="text-muted-foreground">
            Gerencie todos os funcionarios da empresa
          </p>
        </div>
        <Button asChild>
          <Link href="/funcionarios/novo">
            <Plus className="mr-2 size-4" />
            Novo Funcionario
          </Link>
        </Button>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busque e filtre funcionarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email, matricula..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="on_leave">Afastado</SelectItem>
                <SelectItem value="terminated">Desligado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Departamentos</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept!}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchEmployees}>
              <RefreshCw className="mr-2 size-4" />
              Atualizar
            </Button>
            <Button variant="outline">
              <Download className="mr-2 size-4" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Funcionarios</CardTitle>
          <CardDescription>
            {isLoading ? (
              <Skeleton className="h-4 w-[200px]" />
            ) : (
              `${filteredEmployees.length} funcionario(s) encontrado(s)`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <EmployeeTableSkeleton />
          ) : filteredEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Users className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Nenhum funcionario encontrado</p>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" || departmentFilter !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Comece adicionando seu primeiro funcionario"}
              </p>
              {!searchTerm && statusFilter === "all" && departmentFilter === "all" && (
                <Button asChild>
                  <Link href="/funcionarios/novo">
                    <Plus className="mr-2 size-4" />
                    Adicionar Funcionario
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionario</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Admissao</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={employee.photo_url || ""} alt={employee.full_name} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {employee.full_name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{employee.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {employee.email || employee.employee_number}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.department || "-"}</TableCell>
                    <TableCell>{employee.position || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={statusMap[employee.status]?.variant || "default"}>
                        {statusMap[employee.status]?.label || employee.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {employee.hire_date
                        ? new Date(employee.hire_date).toLocaleDateString("pt-BR")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Acoes</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acoes</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/funcionarios/${employee.id}`}>
                              <Eye className="mr-2 size-4" />
                              Visualizar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/funcionarios/${employee.id}/editar`}>
                              <Edit className="mr-2 size-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          {employee.email && (
                            <DropdownMenuItem
                              onClick={() => window.open(`mailto:${employee.email}`)}
                            >
                              <Mail className="mr-2 size-4" />
                              Enviar Email
                            </DropdownMenuItem>
                          )}
                          {employee.status !== "terminated" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setEmployeeToDelete(employee)}
                              >
                                <Trash2 className="mr-2 size-4" />
                                Desligar
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!employeeToDelete} onOpenChange={() => setEmployeeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Desligamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desligar o funcionario{" "}
              <strong>{employeeToDelete?.full_name}</strong>? Esta acao ira alterar
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
