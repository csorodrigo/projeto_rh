/**
 * Search Panel Component
 * Search and filter employees in org chart
 */

'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import type { OrgNode } from '@/types/organogram'
import { Search, X, Filter } from 'lucide-react'
import { useState, useMemo } from 'react'

interface SearchPanelProps {
  employees: OrgNode[]
  departments: string[]
  onSelectEmployee: (employeeId: string) => void
  onClose?: () => void
}

export default function SearchPanel({
  employees,
  departments,
  onSelectEmployee,
  onClose,
}: SearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')

  // Get unique levels
  const levels = useMemo(() => {
    const uniqueLevels = new Set(employees.map((e) => e.level))
    return Array.from(uniqueLevels).sort((a, b) => a - b)
  }, [employees])

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchQuery.toLowerCase())

      // Department filter
      const matchesDepartment =
        selectedDepartment === 'all' || emp.department === selectedDepartment

      // Level filter
      const matchesLevel =
        selectedLevel === 'all' || emp.level === parseInt(selectedLevel)

      return matchesSearch && matchesDepartment && matchesLevel
    })
  }, [employees, searchQuery, selectedDepartment, selectedLevel])

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedDepartment('all')
    setSelectedLevel('all')
  }

  const hasActiveFilters =
    searchQuery !== '' || selectedDepartment !== 'all' || selectedLevel !== 'all'

  return (
    <Card className="w-80 h-full flex flex-col">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Buscar Funcionário</h3>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nome, cargo, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-3 w-3" />
            <span>Filtros</span>
          </div>

          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger>
              <SelectValue placeholder="Departamento" />
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

          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger>
              <SelectValue placeholder="Nível Hierárquico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os níveis</SelectItem>
              {levels.map((level) => (
                <SelectItem key={level} value={String(level)}>
                  Nível {level}
                  {level === 0 ? ' (CEO)' : level === 1 ? ' (Diretoria)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="w-full"
            >
              <X className="h-3 w-3 mr-2" />
              Limpar filtros
            </Button>
          )}
        </div>

        <Separator />

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          {filteredEmployees.length} funcionário
          {filteredEmployees.length !== 1 ? 's' : ''} encontrado
          {filteredEmployees.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Results List */}
      <ScrollArea className="flex-1">
        <div className="p-4 pt-0 space-y-2">
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Nenhum funcionário encontrado
            </div>
          ) : (
            filteredEmployees.map((emp) => (
              <button
                key={emp.id}
                onClick={() => onSelectEmployee(emp.id)}
                className="w-full p-3 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={emp.avatarUrl || undefined} alt={emp.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {emp.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{emp.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {emp.jobTitle}
                    </div>
                    {emp.department && (
                      <div className="text-xs text-muted-foreground/70 truncate mt-0.5">
                        {emp.department}
                      </div>
                    )}

                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        Nível {emp.level}
                      </Badge>
                      {emp.subordinates.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {emp.subordinates.length} subordinado
                          {emp.subordinates.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                      {emp.isAbsent && (
                        <Badge variant="destructive" className="text-xs">
                          Ausente
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  )
}
