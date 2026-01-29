/**
 * Organogram Page
 * Interactive organizational chart with search, filters, and export
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import OrgChart from '@/components/organogram/OrgChart'
import OrgDetailPanel from '@/components/organogram/OrgDetailPanel'
import SearchPanel from '@/components/organogram/SearchPanel'
import ZoomControls from '@/components/organogram/ZoomControls'
import {
  buildHierarchyTree,
  calculateStatistics,
  findEmployeeInTree,
  getManagerChain,
  flattenTree,
} from '@/lib/organogram/hierarchy'
import {
  exportToPNG,
  exportToPDF,
  exportToJSON,
  exportToCSV,
  shareOrgChart,
} from '@/lib/organogram/export'
import type { Employee } from '@/types/database'
import type { LayoutType, OrgNode } from '@/types/organogram'
import {
  Download,
  Network,
  Search,
  Share2,
  LayoutGrid,
  Users,
  Building2,
  TrendingUp,
  Layers,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

export default function OrganogramaPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [layout, setLayout] = useState<LayoutType>('top-down')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [highlightPath, setHighlightPath] = useState<string[]>([])

  // Fetch employees
  useEffect(() => {
    async function fetchEmployees() {
      try {
        const response = await fetch('/api/organogram/hierarchy')
        if (!response.ok) throw new Error('Failed to fetch')

        const data = await response.json()
        setEmployees(data.employees || [])
      } catch (error) {
        console.error('Error fetching employees:', error)
        toast.error('Erro ao carregar organograma')
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  // Build hierarchy tree
  const hierarchy = useMemo(() => {
    if (employees.length === 0) return []
    return buildHierarchyTree(employees)
  }, [employees])

  // Calculate statistics
  const stats = useMemo(() => {
    if (hierarchy.length === 0) return null
    return calculateStatistics(hierarchy, employees)
  }, [hierarchy, employees])

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set(
      employees.map((e) => e.department).filter((d): d is string => d !== null)
    )
    return Array.from(depts).sort()
  }, [employees])

  // Get selected employee and related data
  const selectedEmployee = useMemo(() => {
    if (!selectedNodeId) return null
    return findEmployeeInTree(hierarchy, selectedNodeId)
  }, [selectedNodeId, hierarchy])

  const selectedManager = useMemo(() => {
    if (!selectedEmployee?.managerId) return null
    return findEmployeeInTree(hierarchy, selectedEmployee.managerId)
  }, [selectedEmployee, hierarchy])

  const managerChain = useMemo(() => {
    if (!selectedNodeId) return []
    const chain = getManagerChain(selectedNodeId, employees)
    return chain.map((emp) => findEmployeeInTree(hierarchy, emp.id)).filter((n): n is OrgNode => n !== null)
  }, [selectedNodeId, employees, hierarchy])

  // Handle node selection
  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId)
    setShowDetails(true)

    // Highlight path to root
    const node = employees.find((e) => e.id === nodeId)
    if (node) {
      const path = [nodeId]
      let current = node
      while (current.manager_id) {
        path.push(current.manager_id)
        current = employees.find((e) => e.id === current.manager_id)!
        if (!current) break
      }
      setHighlightPath(path)
    }
  }, [employees])

  // Export handlers
  const handleExport = async (format: 'png' | 'pdf' | 'json' | 'csv') => {
    try {
      const svgElement = document.querySelector('.react-flow__viewport svg') as SVGSVGElement

      switch (format) {
        case 'png':
          await exportToPNG(svgElement, 'organograma.png', 2)
          toast.success('Organograma exportado como PNG')
          break
        case 'pdf':
          await exportToPDF(svgElement, 'organograma.pdf', 'a4')
          toast.success('Organograma exportado como PDF')
          break
        case 'json':
          exportToJSON(hierarchy, 'organograma.json')
          toast.success('Estrutura exportada como JSON')
          break
        case 'csv':
          exportToCSV(hierarchy, 'organograma.csv')
          toast.success('Dados exportados como CSV')
          break
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Erro ao exportar organograma')
    }
  }

  const handleShare = async () => {
    try {
      const url = await shareOrgChart()
      toast.success('Link copiado para a área de transferência')
    } catch (error) {
      toast.error('Erro ao compartilhar organograma')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card className="p-6">
          <Skeleton className="h-[600px] w-full" />
        </Card>
      </div>
    )
  }

  if (employees.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organograma</h1>
          <p className="text-muted-foreground">
            Visualize a estrutura hierárquica da empresa
          </p>
        </div>

        <Card>
          <div className="flex flex-col items-center justify-center py-20">
            <Network className="size-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum funcionário cadastrado</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Cadastre funcionários para visualizar a estrutura organizacional.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  const flatEmployees = flattenTree(hierarchy)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organograma</h1>
          <p className="text-muted-foreground">
            Visualize e navegue pela estrutura hierárquica da empresa
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowSearch(!showSearch)}>
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Formato de Exportação</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport('png')}>
                Exportar como PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                Exportar como PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                Exportar como JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Exportar como CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalEmployees}</div>
                <div className="text-xs text-muted-foreground">Funcionários</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.departments}</div>
                <div className="text-xs text-muted-foreground">Departamentos</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.averageSpanOfControl}</div>
                <div className="text-xs text-muted-foreground">Média Subordinados</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Layers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.maxTreeDepth}</div>
                <div className="text-xs text-muted-foreground">Níveis Hierárquicos</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Network className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.employeesWithoutManager}</div>
                <div className="text-xs text-muted-foreground">Sem Gestor</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Layout:</span>
          <Select value={layout} onValueChange={(v) => setLayout(v as LayoutType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top-down">De Cima para Baixo</SelectItem>
              <SelectItem value="left-right">Esquerda para Direita</SelectItem>
              <SelectItem value="compact">Compacto</SelectItem>
              <SelectItem value="radial">Radial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {highlightPath.length > 0 && (
          <Badge variant="secondary">
            Caminho destacado: {highlightPath.length} níveis
          </Badge>
        )}
      </div>

      {/* Main Content */}
      <div className="relative">
        <Card className="h-[700px] overflow-hidden">
          <div className="flex h-full">
            {/* Search Panel */}
            {showSearch && (
              <div className="border-r">
                <SearchPanel
                  employees={flatEmployees}
                  departments={departments}
                  onSelectEmployee={handleNodeClick}
                  onClose={() => setShowSearch(false)}
                />
              </div>
            )}

            {/* Org Chart */}
            <div className="flex-1 relative">
              <OrgChart
                hierarchy={hierarchy}
                layout={layout}
                onNodeClick={handleNodeClick}
                selectedNodeId={selectedNodeId}
                highlightPath={highlightPath}
              />

              <ZoomControls
                onZoomIn={() => {}}
                onZoomOut={() => {}}
                onZoomReset={() => {}}
                onFitView={() => {}}
                currentZoom={1}
              />
            </div>

            {/* Detail Panel */}
            {showDetails && selectedEmployee && (
              <div className="border-l">
                <OrgDetailPanel
                  employee={selectedEmployee}
                  manager={selectedManager}
                  managerChain={managerChain}
                  onClose={() => {
                    setShowDetails(false)
                    setSelectedNodeId(null)
                    setHighlightPath([])
                  }}
                  onSelectEmployee={handleNodeClick}
                />
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
