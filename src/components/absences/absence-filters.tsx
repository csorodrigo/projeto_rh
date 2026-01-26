"use client"

import * as React from "react"
import { Filter, X, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  ABSENCE_TYPE_LABELS,
  ABSENCE_STATUS_LABELS,
  ABSENCE_TYPE_GROUPS,
} from "@/lib/constants"
import type { AbsenceType, AbsenceStatus } from "@/types/database"

interface AbsenceFiltersProps {
  filters: {
    status?: AbsenceStatus
    type?: AbsenceType
    startDate?: Date
    endDate?: Date
  }
  onFiltersChange: (filters: AbsenceFiltersProps["filters"]) => void
  employees?: Array<{ id: string; name: string }>
  departments?: string[]
}

export function AbsenceFilters({
  filters,
  onFiltersChange,
  departments = [],
}: AbsenceFiltersProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const activeFiltersCount = Object.values(filters).filter(Boolean).length

  const clearFilters = () => {
    onFiltersChange({})
  }

  const updateFilter = <K extends keyof AbsenceFiltersProps["filters"]>(
    key: K,
    value: AbsenceFiltersProps["filters"][K]
  ) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  // Agrupar tipos de ausência para melhor UX
  const groupedTypes = [
    { label: "Férias", types: ABSENCE_TYPE_GROUPS.vacation },
    { label: "Médico", types: ABSENCE_TYPE_GROUPS.medical },
    { label: "Licenças Legais", types: ABSENCE_TYPE_GROUPS.legal_leave },
    { label: "Justificadas", types: ABSENCE_TYPE_GROUPS.justified },
    { label: "Não Justificadas", types: ABSENCE_TYPE_GROUPS.unjustified },
    { label: "Outros", types: ABSENCE_TYPE_GROUPS.other },
  ]

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="size-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filtros</h4>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                >
                  Limpar todos
                </Button>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  updateFilter("status", value === "all" ? undefined : (value as AbsenceStatus))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {Object.entries(ABSENCE_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Ausência</label>
              <Select
                value={filters.type || "all"}
                onValueChange={(value) =>
                  updateFilter("type", value === "all" ? undefined : (value as AbsenceType))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {groupedTypes.map((group) => (
                    <React.Fragment key={group.label}>
                      <SelectItem value={`__group_${group.label}`} disabled className="font-medium">
                        {group.label}
                      </SelectItem>
                      {group.types.map((type) => (
                        <SelectItem key={type} value={type} className="pl-6">
                          {ABSENCE_TYPE_LABELS[type as AbsenceType]}
                        </SelectItem>
                      ))}
                    </React.Fragment>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Departamento */}
            {departments.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Departamento</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os departamentos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os departamentos</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Data Início */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {filters.startDate
                      ? format(filters.startDate, "dd/MM/yyyy", { locale: ptBR })
                      : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.startDate}
                    onSelect={(date) => updateFilter("startDate", date)}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data Fim */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Fim</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {filters.endDate
                      ? format(filters.endDate, "dd/MM/yyyy", { locale: ptBR })
                      : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.endDate}
                    onSelect={(date) => updateFilter("endDate", date)}
                    locale={ptBR}
                    disabled={(date) =>
                      filters.startDate ? date < filters.startDate : false
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active filters badges */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-1">
          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              {ABSENCE_STATUS_LABELS[filters.status]}
              <X
                className="size-3 cursor-pointer"
                onClick={() => updateFilter("status", undefined)}
              />
            </Badge>
          )}
          {filters.type && (
            <Badge variant="secondary" className="gap-1">
              {ABSENCE_TYPE_LABELS[filters.type]}
              <X
                className="size-3 cursor-pointer"
                onClick={() => updateFilter("type", undefined)}
              />
            </Badge>
          )}
          {filters.startDate && (
            <Badge variant="secondary" className="gap-1">
              Início: {format(filters.startDate, "dd/MM/yy")}
              <X
                className="size-3 cursor-pointer"
                onClick={() => updateFilter("startDate", undefined)}
              />
            </Badge>
          )}
          {filters.endDate && (
            <Badge variant="secondary" className="gap-1">
              Fim: {format(filters.endDate, "dd/MM/yy")}
              <X
                className="size-3 cursor-pointer"
                onClick={() => updateFilter("endDate", undefined)}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
