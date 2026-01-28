"use client"

import * as React from "react"
import { Calendar, Clock, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { AbsenceStatus, AbsenceType } from "@/types/database"

// Types
export interface KanbanItem {
  id: string
  title: string
  description?: string
  status: AbsenceStatus
  type: AbsenceType
  startDate: string
  endDate: string
  employee: {
    id: string
    name: string
    avatar_url?: string | null
    department?: string
  }
  metadata?: Record<string, any>
}

export interface KanbanColumn {
  id: AbsenceStatus
  title: string
  color: string
  bgColor: string
  textColor: string
}

interface KanbanBoardProps {
  items: KanbanItem[]
  columns: KanbanColumn[]
  onItemMove?: (itemId: string, newStatus: AbsenceStatus) => void
  onItemClick?: (item: KanbanItem) => void
  className?: string
}

interface KanbanColumnProps {
  column: KanbanColumn
  items: KanbanItem[]
  onItemMove?: (itemId: string, newStatus: AbsenceStatus) => void
  onItemClick?: (item: KanbanItem) => void
}

interface KanbanCardProps {
  item: KanbanItem
  onItemClick?: (item: KanbanItem) => void
}

// Format type labels
const typeLabels: Record<AbsenceType, string> = {
  vacation: "Férias",
  vacation_advance: "Férias Antecipadas",
  vacation_sold: "Abono Pecuniário",
  sick_leave: "Licença Médica",
  maternity_leave: "Licença Maternidade",
  paternity_leave: "Licença Paternidade",
  adoption_leave: "Licença Adoção",
  bereavement: "Licença Nojo",
  marriage_leave: "Licença Gala",
  jury_duty: "Serviço Júri",
  military_service: "Serviço Militar",
  election_duty: "Mesário",
  blood_donation: "Doação Sangue",
  union_leave: "Licença Sindical",
  medical_appointment: "Consulta Médica",
  prenatal: "Pré-natal",
  child_sick: "Filho Doente",
  legal_obligation: "Obrigação Legal",
  study_leave: "Licença Estudos",
  unjustified: "Não Justificada",
  time_bank: "Banco de Horas",
  compensatory: "Folga Compensatória",
  other: "Outro",
}

// Format dates
function formatDate(date: string): string {
  const d = new Date(date)
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}

function getDaysCount(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}

// Kanban Card Component
export function KanbanCard({ item, onItemClick }: KanbanCardProps) {
  const [isDragging, setIsDragging] = React.useState(false)

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("application/json", JSON.stringify(item))
    setIsDragging(true)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleClick = () => {
    onItemClick?.(item)
  }

  const daysCount = getDaysCount(item.startDate, item.endDate)

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      className={cn(
        "cursor-grab active:cursor-grabbing border-l-4 transition-all duration-200",
        "hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5",
        isDragging && "opacity-50 scale-95"
      )}
      style={{
        borderLeftColor: item.type.includes("vacation")
          ? "#3b82f6"
          : item.type.includes("leave")
          ? "#8b5cf6"
          : "#6b7280",
      }}
    >
      <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        {/* Header with Avatar */}
        <div className="flex items-start gap-3">
          <Avatar className="size-10 flex-shrink-0">
            <AvatarImage src={item.employee.avatar_url || undefined} />
            <AvatarFallback className="text-xs">
              {getInitials(item.employee.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{item.employee.name}</p>
            {item.employee.department && (
              <p className="text-xs text-muted-foreground truncate">
                {item.employee.department}
              </p>
            )}
          </div>
        </div>

        {/* Type Badge */}
        <Badge variant="secondary" className="text-xs">
          {typeLabels[item.type]}
        </Badge>

        {/* Date Range */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="size-3 flex-shrink-0" />
          <span className="truncate">
            {formatDate(item.startDate)} - {formatDate(item.endDate)}
          </span>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-3 flex-shrink-0" />
          <span>
            {daysCount} {daysCount === 1 ? "dia" : "dias"}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// Kanban Column Component
export function KanbanColumn({
  column,
  items,
  onItemMove,
  onItemClick,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = React.useState(false)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)

    try {
      const data = e.dataTransfer.getData("application/json")
      const item: KanbanItem = JSON.parse(data)

      if (item.status !== column.id) {
        onItemMove?.(item.id, column.id)
      }
    } catch (error) {
      console.error("Error dropping item:", error)
    }
  }

  return (
    <div className="flex flex-col h-full min-w-[280px] sm:min-w-[300px] max-w-[320px] w-[calc(100vw-3rem)] sm:w-auto">
      {/* Column Header */}
      <div
        className={cn("flex items-center justify-between p-3 sm:p-4 rounded-t-lg", column.bgColor)}
      >
        <div className="flex items-center gap-2">
          <h3 className={cn("font-semibold text-sm sm:text-base", column.textColor)}>
            {column.title}
          </h3>
          <Badge
            variant="secondary"
            className={cn("size-6 flex items-center justify-center p-0 text-xs", column.color)}
          >
            {items.length}
          </Badge>
        </div>
      </div>

      {/* Column Content */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex-1 p-2 sm:p-3 space-y-2 sm:space-y-3 bg-muted/30 rounded-b-lg border-2 border-dashed transition-all duration-200 min-h-[200px] max-h-[calc(100vh-24rem)] overflow-y-auto",
          isDragOver ? "border-primary bg-primary/5 scale-[1.02]" : "border-transparent"
        )}
      >
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-xs sm:text-sm text-muted-foreground">
            Nenhuma solicitação
          </div>
        ) : (
          items.map((item) => (
            <KanbanCard key={item.id} item={item} onItemClick={onItemClick} />
          ))
        )}
      </div>
    </div>
  )
}

// Kanban Board Component
export function KanbanBoard({
  items,
  columns,
  onItemMove,
  onItemClick,
  className,
}: KanbanBoardProps) {
  const groupedItems = React.useMemo(() => {
    const groups: Record<AbsenceStatus, KanbanItem[]> = {} as Record<
      AbsenceStatus,
      KanbanItem[]
    >

    columns.forEach((col) => {
      groups[col.id] = []
    })

    items.forEach((item) => {
      if (groups[item.status]) {
        groups[item.status].push(item)
      }
    })

    return groups
  }, [items, columns])

  return (
    <div
      className={cn(
        "flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory",
        "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100",
        className
      )}
    >
      {columns.map((column) => (
        <div key={column.id} className="snap-start">
          <KanbanColumn
            column={column}
            items={groupedItems[column.id] || []}
            onItemMove={onItemMove}
            onItemClick={onItemClick}
          />
        </div>
      ))}
    </div>
  )
}

// Default columns configuration
export const defaultAbsenceColumns: KanbanColumn[] = [
  {
    id: "pending",
    title: "Pendentes",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-900",
  },
  {
    id: "approved",
    title: "Aprovados",
    color: "text-green-700",
    bgColor: "bg-green-100",
    textColor: "text-green-900",
  },
  {
    id: "rejected",
    title: "Rejeitados",
    color: "text-red-700",
    bgColor: "bg-red-100",
    textColor: "text-red-900",
  },
  {
    id: "in_progress",
    title: "Em Andamento",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    textColor: "text-blue-900",
  },
]
