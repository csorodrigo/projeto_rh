"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const ALL_VALUE = "__all__"

export function PublicJobFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [department, setDepartment] = useState(searchParams.get('department') || ALL_VALUE)
  const [location, setLocation] = useState(searchParams.get('location') || ALL_VALUE)
  const [jobType, setJobType] = useState(searchParams.get('job_type') || ALL_VALUE)
  const [locationType, setLocationType] = useState(searchParams.get('location_type') || ALL_VALUE)

  const [departments, setDepartments] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])

  const supabase = createClient()

  useEffect(() => {
    async function fetchFilterOptions() {
      // Fetch unique departments
      const { data: deptData } = await supabase
        .from('jobs')
        .select('department')
        .eq('publish_externally', true)
        .eq('status', 'open')
        .not('department', 'is', null)

      if (deptData) {
        const uniqueDepts = [...new Set(deptData.map(d => d.department).filter(Boolean))] as string[]
        setDepartments(uniqueDepts)
      }

      // Fetch unique locations
      const { data: locData } = await supabase
        .from('jobs')
        .select('location')
        .eq('publish_externally', true)
        .eq('status', 'open')
        .not('location', 'is', null)

      if (locData) {
        const uniqueLocs = [...new Set(locData.map(l => l.location).filter(Boolean))] as string[]
        setLocations(uniqueLocs)
      }
    }

    fetchFilterOptions()
  }, [supabase])

  const updateFilters = () => {
    const params = new URLSearchParams()

    if (search) params.set('search', search)
    if (department && department !== ALL_VALUE) params.set('department', department)
    if (location && location !== ALL_VALUE) params.set('location', location)
    if (jobType && jobType !== ALL_VALUE) params.set('job_type', jobType)
    if (locationType && locationType !== ALL_VALUE) params.set('location_type', locationType)

    router.push(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch('')
    setDepartment(ALL_VALUE)
    setLocation(ALL_VALUE)
    setJobType(ALL_VALUE)
    setLocationType(ALL_VALUE)
    router.push(pathname)
  }

  const hasActiveFilters = search ||
    (department && department !== ALL_VALUE) ||
    (location && location !== ALL_VALUE) ||
    (jobType && jobType !== ALL_VALUE) ||
    (locationType && locationType !== ALL_VALUE)

  return (
    <div className="bg-card border rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filtros</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 gap-1 text-xs"
          >
            <X className="h-3 w-3" />
            Limpar
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search">Buscar</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Palavra-chave..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && updateFilters()}
            className="pl-9"
          />
        </div>
      </div>

      {/* Department */}
      <div className="space-y-2">
        <Label htmlFor="department">Departamento</Label>
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger id="department">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todos</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location">Localização</Label>
        <Select value={location} onValueChange={setLocation}>
          <SelectTrigger id="location">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todas</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc} value={loc}>
                {loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Job Type */}
      <div className="space-y-2">
        <Label htmlFor="job_type">Tipo de Contratação</Label>
        <Select value={jobType} onValueChange={setJobType}>
          <SelectTrigger id="job_type">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todos</SelectItem>
            <SelectItem value="clt">CLT</SelectItem>
            <SelectItem value="pj">PJ</SelectItem>
            <SelectItem value="intern">Estágio</SelectItem>
            <SelectItem value="temporary">Temporário</SelectItem>
            <SelectItem value="apprentice">Jovem Aprendiz</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Location Type */}
      <div className="space-y-2">
        <Label htmlFor="location_type">Modalidade</Label>
        <Select value={locationType} onValueChange={setLocationType}>
          <SelectTrigger id="location_type">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todas</SelectItem>
            <SelectItem value="on_site">Presencial</SelectItem>
            <SelectItem value="remote">Remoto</SelectItem>
            <SelectItem value="hybrid">Híbrido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Apply Button */}
      <Button onClick={updateFilters} className="w-full">
        Aplicar Filtros
      </Button>
    </div>
  )
}
