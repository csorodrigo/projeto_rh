/**
 * Org Detail Panel Component
 * Detailed information panel when clicking on a node
 */

'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import type { OrgNode } from '@/types/organogram'
import {
  X,
  Mail,
  Phone,
  Calendar,
  Users,
  User,
  Building2,
  Briefcase,
  Edit,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'

interface OrgDetailPanelProps {
  employee: OrgNode | null
  manager: OrgNode | null
  managerChain: OrgNode[]
  onClose: () => void
  onSelectEmployee: (employeeId: string) => void
  onEdit?: (employeeId: string) => void
}

export default function OrgDetailPanel({
  employee,
  manager,
  managerChain,
  onClose,
  onSelectEmployee,
  onEdit,
}: OrgDetailPanelProps) {
  if (!employee) return null

  const initials = employee.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card className="w-96 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Detalhes do Funcionário</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Profile */}
          <div className="flex flex-col items-center text-center space-y-3">
            <Avatar className="h-24 w-24">
              <AvatarImage src={employee.avatarUrl || undefined} alt={employee.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div>
              <h2 className="text-xl font-semibold">{employee.name}</h2>
              <p className="text-muted-foreground">{employee.jobTitle}</p>
              {employee.department && (
                <p className="text-sm text-muted-foreground/70 mt-1">
                  {employee.department}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              {employee.isAbsent && (
                <Badge variant="destructive">Ausente</Badge>
              )}
              <Badge variant="outline">Nível {employee.level}</Badge>
              {employee.subordinates.length > 0 && (
                <Badge variant="secondary">
                  <Users className="h-3 w-3 mr-1" />
                  {employee.subordinates.length} subordinado
                  {employee.subordinates.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Contato</h4>

            {employee.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${employee.email}`}
                  className="text-primary hover:underline"
                >
                  {employee.email}
                </a>
              </div>
            )}

            {employee.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`tel:${employee.phone}`}
                  className="text-primary hover:underline"
                >
                  {employee.phone}
                </a>
              </div>
            )}

            {employee.hireDate && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Admitido em{' '}
                  {new Date(employee.hireDate).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}

            {employee.employeeNumber && (
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Matrícula: {employee.employeeNumber}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Hierarchy Path */}
          {managerChain.length > 0 && (
            <>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Caminho Hierárquico</h4>

                <div className="space-y-2">
                  {managerChain.map((mgr, index) => (
                    <button
                      key={mgr.id}
                      onClick={() => onSelectEmployee(mgr.id)}
                      className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors text-left"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={mgr.avatarUrl || undefined} alt={mgr.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {mgr.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{mgr.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {mgr.jobTitle}
                        </div>
                      </div>

                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Direct Manager */}
          {manager && (
            <>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Gestor Direto</h4>

                <button
                  onClick={() => onSelectEmployee(manager.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors text-left"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={manager.avatarUrl || undefined} alt={manager.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {manager.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{manager.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {manager.jobTitle}
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <Separator />
            </>
          )}

          {/* Direct Reports */}
          {employee.subordinates.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">
                Subordinados Diretos ({employee.subordinates.length})
              </h4>

              <div className="space-y-2">
                {employee.subordinates.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => onSelectEmployee(sub.id)}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors text-left"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={sub.avatarUrl || undefined} alt={sub.name} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {sub.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{sub.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {sub.jobTitle}
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="p-4 border-t space-y-2">
        <Button asChild className="w-full">
          <Link href={`/funcionarios/${employee.id}`}>
            <User className="h-4 w-4 mr-2" />
            Ver Perfil Completo
          </Link>
        </Button>

        {onEdit && (
          <Button
            variant="outline"
            onClick={() => onEdit(employee.id)}
            className="w-full"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar Hierarquia
          </Button>
        )}

        {employee.email && (
          <Button variant="outline" asChild className="w-full">
            <a href={`mailto:${employee.email}`}>
              <Mail className="h-4 w-4 mr-2" />
              Enviar Email
            </a>
          </Button>
        )}
      </div>
    </Card>
  )
}
