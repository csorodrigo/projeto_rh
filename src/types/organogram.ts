/**
 * Organogram Types
 * Type definitions for organizational chart visualization
 */

export interface OrgNode {
  id: string
  name: string
  jobTitle: string
  department: string | null
  avatarUrl?: string | null
  managerId?: string | null
  level: number
  subordinates: OrgNode[]
  isAbsent?: boolean
  email?: string
  phone?: string
  hireDate?: string
  employeeNumber?: string
}

export interface OrgPosition {
  x: number
  y: number
  width: number
  height: number
}

export interface OrgConnection {
  from: string
  to: string
}

export interface OrgLayout {
  nodes: Map<string, OrgPosition>
  connections: OrgConnection[]
  bounds: { width: number; height: number }
}

export type LayoutType = 'top-down' | 'left-right' | 'radial' | 'compact'

export interface OrgChartFilters {
  department?: string
  managerId?: string
  searchQuery?: string
}

export interface OrgChartSettings {
  layout: LayoutType
  showPhotos: boolean
  showSubordinateCount: boolean
  nodeSpacingX: number
  nodeSpacingY: number
}

export interface HierarchyChange {
  employeeId: string
  oldManagerId: string | null
  newManagerId: string | null
  timestamp: string
  performedBy: string
}

export interface OrgExportOptions {
  format: 'png' | 'pdf' | 'json'
  quality?: number
  includePhotos?: boolean
  paperSize?: 'a4' | 'a3' | 'letter'
}

// React Flow compatible types
export interface OrgFlowNode {
  id: string
  type: 'employee'
  position: { x: number; y: number }
  data: {
    name: string
    jobTitle: string
    department: string | null
    avatarUrl?: string | null
    subordinateCount: number
    isAbsent: boolean
    level: number
    email?: string
    phone?: string
  }
}

export interface OrgFlowEdge {
  id: string
  source: string
  target: string
  type: 'smoothstep'
  animated?: boolean
}

// Statistics
export interface OrgStatistics {
  totalEmployees: number
  departments: number
  averageSpanOfControl: number
  maxTreeDepth: number
  employeesWithoutManager: number
}

// Validation
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}
