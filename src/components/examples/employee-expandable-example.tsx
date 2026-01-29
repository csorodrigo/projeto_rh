"use client"

import { Mail, Phone, MapPin, Calendar, Eye, Edit, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  ExpandableTable,
  ExpandableRow,
  TableCell,
} from '@/components/ui/data-table-expandable'

interface Employee {
  id: string
  name: string
  email: string
  phone: string
  position: string
  department: string
  status: 'active' | 'inactive'
  photo_url?: string
  initials: string
  address: string
  hire_date: string
  time_bank: string
}

interface EmployeeExpandableTableProps {
  employees: Employee[]
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDeactivate: (id: string) => void
}

export function EmployeeExpandableTable({
  employees,
  onView,
  onEdit,
  onDeactivate,
}: EmployeeExpandableTableProps) {
  return (
    <ExpandableTable headers={['Funcionário', 'Email', 'Cargo', 'Departamento', 'Status']}>
      {employees.map((employee) => (
        <ExpandableRow
          key={employee.id}
          expandedContent={
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.address}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Admissão: {employee.hire_date}</span>
                </div>
                <div className="text-sm">
                  <p className="font-medium">Banco de Horas</p>
                  <p className="text-muted-foreground">{employee.time_bank}</p>
                </div>
              </div>
            </div>
          }
          actions={[
            {
              label: 'Ver Perfil',
              icon: Eye,
              onClick: () => onView(employee.id),
            },
            {
              label: 'Editar',
              icon: Edit,
              onClick: () => onEdit(employee.id),
            },
            {
              label: 'Desativar',
              icon: Trash2,
              onClick: () => onDeactivate(employee.id),
              variant: 'destructive',
              separator: true,
            },
          ]}
        >
          <TableCell>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={employee.photo_url} alt={employee.name} />
                <AvatarFallback>{employee.initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{employee.name}</p>
              </div>
            </div>
          </TableCell>
          <TableCell>{employee.email}</TableCell>
          <TableCell>{employee.position}</TableCell>
          <TableCell>{employee.department}</TableCell>
          <TableCell>
            <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
              {employee.status === 'active' ? 'Ativo' : 'Inativo'}
            </Badge>
          </TableCell>
        </ExpandableRow>
      ))}
    </ExpandableTable>
  )
}
