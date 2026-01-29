"use client"

import * as React from "react"
import { Filter, X } from "lucide-react"
import { JobFilters as JobFiltersType, JobStatus, JobType, JobLocation } from "@/lib/types/recruitment"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

interface JobFiltersProps {
  filters: JobFiltersType
  onFiltersChange: (filters: JobFiltersType) => void
  departments?: string[]
}

const statusOptions = [
  { value: "open", label: "Aberta" },
  { value: "paused", label: "Pausada" },
  { value: "closed", label: "Fechada" },
  { value: "draft", label: "Rascunho" },
]

const jobTypeOptions = [
  { value: "full_time", label: "Tempo Integral" },
  { value: "part_time", label: "Meio Período" },
  { value: "contract", label: "Contrato" },
  { value: "temporary", label: "Temporário" },
  { value: "internship", label: "Estágio" },
]

const locationTypeOptions = [
  { value: "onsite", label: "Presencial" },
  { value: "remote", label: "Remoto" },
  { value: "hybrid", label: "Híbrido" },
]

export function JobFilters({ filters, onFiltersChange, departments = [] }: JobFiltersProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const hasActiveFilters = React.useMemo(() => {
    return (
      (filters.status && filters.status.length > 0) ||
      (filters.department && filters.department.length > 0) ||
      (filters.job_type && filters.job_type.length > 0) ||
      (filters.location_type && filters.location_type.length > 0) ||
      filters.date_from ||
      filters.date_to
    )
  }, [filters])

  const activeFiltersCount = React.useMemo(() => {
    let count = 0
    if (filters.status && filters.status.length > 0) count++
    if (filters.department && filters.department.length > 0) count++
    if (filters.job_type && filters.job_type.length > 0) count++
    if (filters.location_type && filters.location_type.length > 0) count++
    if (filters.date_from) count++
    if (filters.date_to) count++
    return count
  }, [filters])

  const handleClearFilters = () => {
    onFiltersChange({})
  }

  const toggleArrayFilter = <K extends keyof JobFiltersType>(
    key: K,
    value: string
  ) => {
    const currentValues = (filters[key] as string[]) || []
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value]

    onFiltersChange({
      ...filters,
      [key]: newValues.length > 0 ? newValues : undefined,
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="size-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription>
              Filtre as vagas por status, departamento, tipo e mais
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 py-6">
            {/* Status */}
            <div className="space-y-3">
              <Label>Status</Label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => {
                  const isSelected = filters.status?.includes(option.value as JobStatus)
                  return (
                    <Button
                      key={option.value}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleArrayFilter("status", option.value)}
                    >
                      {option.label}
                    </Button>
                  )
                })}
              </div>
            </div>

            <Separator />

            {/* Department */}
            {departments.length > 0 && (
              <>
                <div className="space-y-3">
                  <Label>Departamento</Label>
                  <Select
                    value={filters.department?.[0] || ""}
                    onValueChange={(value) =>
                      onFiltersChange({
                        ...filters,
                        department: value ? [value] : undefined,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os departamentos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os departamentos</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
              </>
            )}

            {/* Job Type */}
            <div className="space-y-3">
              <Label>Tipo de Contratação</Label>
              <div className="flex flex-wrap gap-2">
                {jobTypeOptions.map((option) => {
                  const isSelected = filters.job_type?.includes(option.value as JobType)
                  return (
                    <Button
                      key={option.value}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleArrayFilter("job_type", option.value)}
                    >
                      {option.label}
                    </Button>
                  )
                })}
              </div>
            </div>

            <Separator />

            {/* Location Type */}
            <div className="space-y-3">
              <Label>Modelo de Trabalho</Label>
              <div className="flex flex-wrap gap-2">
                {locationTypeOptions.map((option) => {
                  const isSelected = filters.location_type?.includes(
                    option.value as JobLocation
                  )
                  return (
                    <Button
                      key={option.value}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleArrayFilter("location_type", option.value)}
                    >
                      {option.label}
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
            >
              Limpar Filtros
            </Button>
            <Button className="flex-1" onClick={() => setIsOpen(false)}>
              Aplicar Filtros
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="gap-2"
        >
          <X className="size-4" />
          Limpar
        </Button>
      )}
    </div>
  )
}
