"use client"

import { format } from 'date-fns'
import { Eye, Edit, XCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  ExpandableTable,
  ExpandableRow,
  TableCell,
} from '@/components/ui/data-table-expandable'

interface Absence {
  id: string
  employee: {
    name: string
    photo_url?: string
    initials: string
  }
  type: string
  type_label: string
  start_date: string
  end_date: string
  days: number
  status: 'pending' | 'approved' | 'rejected'
  status_label: string
  notes?: string
  document_url?: string
}

interface AbsenceExpandableTableProps {
  absences: Absence[]
  onAction: (id: string) => void
  onEdit: (id: string) => void
  onCancel: (id: string) => void
}

function getAbsenceVariant(type: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    vacation: 'default',
    sick_leave: 'secondary',
    personal: 'outline',
  }
  return variants[type] || 'default'
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'outline',
    approved: 'default',
    rejected: 'destructive',
  }
  return variants[status] || 'outline'
}

export function AbsenceExpandableTable({
  absences,
  onAction,
  onEdit,
  onCancel,
}: AbsenceExpandableTableProps) {
  return (
    <ExpandableTable headers={['Funcionário', 'Tipo', 'Período', 'Dias', 'Status']}>
      {absences.map((absence) => (
        <ExpandableRow
          key={absence.id}
          expandedContent={
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Observações</p>
                <p className="text-sm text-muted-foreground">
                  {absence.notes || 'Nenhuma observação registrada'}
                </p>
              </div>
              {absence.document_url && (
                <div>
                  <p className="text-sm font-medium">Documento anexado</p>
                  <a
                    href={absence.document_url}
                    className="text-sm text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver documento
                  </a>
                </div>
              )}
            </div>
          }
          actions={[
            {
              label: absence.status === 'pending' ? 'Aprovar' : 'Ver Detalhes',
              icon: Eye,
              onClick: () => onAction(absence.id),
            },
            {
              label: 'Editar',
              icon: Edit,
              onClick: () => onEdit(absence.id),
            },
            {
              label: 'Cancelar',
              icon: XCircle,
              onClick: () => onCancel(absence.id),
              variant: 'destructive',
              separator: true,
            },
          ]}
        >
          <TableCell>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={absence.employee.photo_url} />
                <AvatarFallback>{absence.employee.initials}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{absence.employee.name}</span>
            </div>
          </TableCell>
          <TableCell>
            <Badge variant={getAbsenceVariant(absence.type)}>
              {absence.type_label}
            </Badge>
          </TableCell>
          <TableCell>
            {format(new Date(absence.start_date), 'dd/MM/yyyy')} -{' '}
            {format(new Date(absence.end_date), 'dd/MM/yyyy')}
          </TableCell>
          <TableCell>{absence.days} dias</TableCell>
          <TableCell>
            <Badge variant={getStatusVariant(absence.status)}>
              {absence.status_label}
            </Badge>
          </TableCell>
        </ExpandableRow>
      ))}
    </ExpandableTable>
  )
}
