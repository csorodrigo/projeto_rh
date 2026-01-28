"use client"

import * as React from "react"
import { Plus, Shield, Mail, MoreVertical, Search } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

interface User {
  id: string
  name: string
  email: string
  role: string
  status: "active" | "pending" | "inactive"
}

const ROLES = [
  {
    value: "admin",
    label: "Administrador",
    description: "Acesso total ao sistema",
  },
  {
    value: "manager",
    label: "Gestor",
    description: "Gerenciar equipe e aprovações",
  },
  {
    value: "hr",
    label: "RH",
    description: "Gerenciar funcionários e documentos",
  },
  {
    value: "employee",
    label: "Funcionário",
    description: "Acesso básico ao sistema",
  },
]

export function UsersSettings() {
  const [users, setUsers] = React.useState<User[]>([
    {
      id: "1",
      name: "João Silva",
      email: "joao@empresa.com",
      role: "admin",
      status: "active",
    },
    {
      id: "2",
      name: "Maria Santos",
      email: "maria@empresa.com",
      role: "hr",
      status: "active",
    },
    {
      id: "3",
      name: "Pedro Costa",
      email: "pedro@empresa.com",
      role: "manager",
      status: "pending",
    },
  ])

  const [searchQuery, setSearchQuery] = React.useState("")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = React.useState(false)
  const [inviteData, setInviteData] = React.useState({
    email: "",
    role: "employee",
  })

  const filteredUsers = users.filter(
    user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleInviteUser = () => {
    toast.success(`Convite enviado para ${inviteData.email}`)
    setIsInviteDialogOpen(false)
    setInviteData({ email: "", role: "employee" })
  }

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
      manager: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      hr: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      employee: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    }
    return colors[role as keyof typeof colors] || colors.employee
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      active: <Badge className="bg-green-100 text-green-700">Ativo</Badge>,
      pending: <Badge variant="outline">Pendente</Badge>,
      inactive: <Badge variant="secondary">Inativo</Badge>,
    }
    return badges[status as keyof typeof badges]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Usuários do Sistema</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie usuários e permissões de acesso
          </p>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Mail className="mr-2 size-4" />
              Convidar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar Novo Usuário</DialogTitle>
              <DialogDescription>
                Envie um convite por email para um novo usuário
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="usuario@empresa.com"
                  value={inviteData.email}
                  onChange={e =>
                    setInviteData(prev => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-role">Função</Label>
                <Select
                  value={inviteData.role}
                  onValueChange={role =>
                    setInviteData(prev => ({ ...prev, role }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex flex-col items-start">
                          <span>{role.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {role.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsInviteDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleInviteUser} disabled={!inviteData.email}>
                  Enviar Convite
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar usuários..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários Ativos</CardTitle>
          <CardDescription>
            {filteredUsers.length} usuário(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map(user => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>
                      {user.name
                        .split(" ")
                        .map(n => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {ROLES.find(r => r.value === user.role)?.label}
                  </Badge>
                  {getStatusBadge(user.status)}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Editar Perfil</DropdownMenuItem>
                      <DropdownMenuItem>Alterar Função</DropdownMenuItem>
                      <DropdownMenuItem>Redefinir Senha</DropdownMenuItem>
                      <Separator className="my-1" />
                      <DropdownMenuItem className="text-destructive">
                        Desativar Usuário
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Papéis e Permissões */}
      <Card>
        <CardHeader>
          <CardTitle>Papéis e Permissões</CardTitle>
          <CardDescription>
            Configure as permissões de cada função
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ROLES.map(role => (
              <div
                key={role.value}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <Shield className="size-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{role.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {role.description}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Configurar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
