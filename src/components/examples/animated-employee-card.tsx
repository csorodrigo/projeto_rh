"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { QuickStatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { MoreVertical, Mail, Phone, MapPin } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AnimatedEmployeeCardProps {
  name: string
  role: string
  email: string
  phone: string
  location: string
  status: "active" | "inactive" | "on_leave" | "terminated"
  initials: string
}

/**
 * Exemplo de card de funcionário com todas as animações aplicadas
 * Demonstra uso real das micro-interactions no contexto do sistema RH
 */
export function AnimatedEmployeeCard({
  name,
  role,
  email,
  phone,
  location,
  status,
  initials,
}: AnimatedEmployeeCardProps) {
  return (
    <Card className="animate-fade-in hover-lift group">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="flex items-start gap-3">
          <Avatar className="transition-transform duration-200 group-hover:scale-110">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <CardTitle className="text-base transition-colors duration-200 group-hover:text-primary">
              {name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{role}</p>
            <QuickStatusBadge status={status} />
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="opacity-0 group-hover:opacity-100 transition-smooth"
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Ver perfil</DropdownMenuItem>
            <DropdownMenuItem>Editar</DropdownMenuItem>
            <DropdownMenuItem variant="destructive">Desativar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground group/item">
          <Mail className="size-3.5 transition-transform duration-200 group-hover/item:scale-110" />
          <a
            href={`mailto:${email}`}
            className="link-animated hover:text-primary"
          >
            {email}
          </a>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground group/item">
          <Phone className="size-3.5 transition-transform duration-200 group-hover/item:scale-110" />
          <a
            href={`tel:${phone}`}
            className="link-animated hover:text-primary"
          >
            {phone}
          </a>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-3.5" />
          <span>{location}</span>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Grid de cards de funcionários com stagger animation
 */
export function AnimatedEmployeeGrid() {
  const employees = [
    {
      name: "Ana Silva",
      role: "Desenvolvedora Frontend",
      email: "ana.silva@empresa.com",
      phone: "(11) 98765-4321",
      location: "São Paulo, SP",
      status: "active" as const,
      initials: "AS",
    },
    {
      name: "Carlos Santos",
      role: "Designer UX/UI",
      email: "carlos.santos@empresa.com",
      phone: "(21) 98765-4322",
      location: "Rio de Janeiro, RJ",
      status: "active" as const,
      initials: "CS",
    },
    {
      name: "Mariana Costa",
      role: "Gerente de Projetos",
      email: "mariana.costa@empresa.com",
      phone: "(31) 98765-4323",
      location: "Belo Horizonte, MG",
      status: "on_leave" as const,
      initials: "MC",
    },
    {
      name: "Pedro Oliveira",
      role: "Desenvolvedor Backend",
      email: "pedro.oliveira@empresa.com",
      phone: "(41) 98765-4324",
      location: "Curitiba, PR",
      status: "active" as const,
      initials: "PO",
    },
  ]

  return (
    <div className="stagger-fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {employees.map((employee) => (
        <AnimatedEmployeeCard key={employee.email} {...employee} />
      ))}
    </div>
  )
}
