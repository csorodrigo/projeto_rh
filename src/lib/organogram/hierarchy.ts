/**
 * Hierarchy Utilities
 * Functions for building and manipulating organizational hierarchy
 */

import type { Employee } from '@/types/database'
import type { OrgNode, ValidationResult, OrgStatistics } from '@/types/organogram'

/**
 * Build hierarchical tree from flat employee list
 */
export function buildHierarchyTree(employees: Employee[]): OrgNode[] {
  const employeeMap = new Map<string, OrgNode>()
  const roots: OrgNode[] = []

  // First pass: create all nodes
  employees.forEach((emp) => {
    employeeMap.set(emp.id, {
      id: emp.id,
      name: emp.name,
      jobTitle: emp.position,
      department: emp.department,
      avatarUrl: emp.photo_url,
      managerId: emp.manager_id,
      level: 0,
      subordinates: [],
      isAbsent: false, // TODO: check actual absence status
      email: emp.email,
      phone: emp.phone,
      hireDate: emp.hire_date,
      employeeNumber: emp.employee_number,
    })
  })

  // Second pass: build parent-child relationships
  employeeMap.forEach((node) => {
    if (node.managerId && employeeMap.has(node.managerId)) {
      const manager = employeeMap.get(node.managerId)!
      manager.subordinates.push(node)
    } else {
      // No manager = root node (CEO, directors, etc)
      roots.push(node)
    }
  })

  // Calculate levels
  function setLevels(node: OrgNode, level: number) {
    node.level = level
    node.subordinates.forEach((child) => setLevels(child, level + 1))
  }

  roots.forEach((root) => setLevels(root, 0))

  // Sort subordinates by name
  function sortSubordinates(node: OrgNode) {
    node.subordinates.sort((a, b) => a.name.localeCompare(b.name))
    node.subordinates.forEach(sortSubordinates)
  }

  roots.forEach(sortSubordinates)

  return roots
}

/**
 * Find employee node in tree by ID
 */
export function findEmployeeInTree(
  tree: OrgNode[],
  employeeId: string
): OrgNode | null {
  for (const node of tree) {
    if (node.id === employeeId) return node

    const found = findEmployeeInTree(node.subordinates, employeeId)
    if (found) return found
  }

  return null
}

/**
 * Get all subordinates (direct and indirect) for an employee
 */
export function getSubordinates(
  employeeId: string,
  employees: Employee[]
): Employee[] {
  const subordinates: Employee[] = []
  const directReports = employees.filter((e) => e.manager_id === employeeId)

  directReports.forEach((report) => {
    subordinates.push(report)
    subordinates.push(...getSubordinates(report.id, employees))
  })

  return subordinates
}

/**
 * Get direct subordinates only
 */
export function getDirectSubordinates(
  employeeId: string,
  employees: Employee[]
): Employee[] {
  return employees.filter((e) => e.manager_id === employeeId)
}

/**
 * Get manager chain from employee to top
 */
export function getManagerChain(
  employeeId: string,
  employees: Employee[]
): Employee[] {
  const chain: Employee[] = []
  let current = employees.find((e) => e.id === employeeId)

  while (current?.manager_id) {
    const manager = employees.find((e) => e.id === current.manager_id)
    if (!manager) break

    chain.push(manager)
    current = manager
  }

  return chain
}

/**
 * Validate if changing manager would create a cycle
 */
export function validateHierarchyChange(
  employeeId: string,
  newManagerId: string | null,
  employees: Employee[]
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!newManagerId) {
    // Moving to root level is always valid
    return { valid: true, errors, warnings }
  }

  // Can't be your own manager
  if (employeeId === newManagerId) {
    errors.push('Um funcionário não pode ser seu próprio gestor')
    return { valid: false, errors, warnings }
  }

  // Check if new manager exists
  const newManager = employees.find((e) => e.id === newManagerId)
  if (!newManager) {
    errors.push('Gestor não encontrado')
    return { valid: false, errors, warnings }
  }

  // Check for cycle: new manager can't be a subordinate
  const subordinates = getSubordinates(employeeId, employees)
  const wouldCreateCycle = subordinates.some((s) => s.id === newManagerId)

  if (wouldCreateCycle) {
    errors.push(
      'Esta mudança criaria um ciclo na hierarquia (o novo gestor é subordinado deste funcionário)'
    )
    return { valid: false, errors, warnings }
  }

  // Warning: changing to different department
  const employee = employees.find((e) => e.id === employeeId)
  if (employee && employee.department !== newManager.department) {
    warnings.push(
      `Mudança de departamento: ${employee.department || 'N/A'} → ${newManager.department || 'N/A'}`
    )
  }

  return {
    valid: true,
    errors,
    warnings,
  }
}

/**
 * Calculate maximum depth of the tree
 */
export function calculateTreeDepth(node: OrgNode): number {
  if (node.subordinates.length === 0) return 1

  const childDepths = node.subordinates.map(calculateTreeDepth)
  return 1 + Math.max(...childDepths)
}

/**
 * Get all employees at a specific level
 */
export function getEmployeesAtLevel(tree: OrgNode[], level: number): OrgNode[] {
  const result: OrgNode[] = []

  function traverse(node: OrgNode) {
    if (node.level === level) {
      result.push(node)
    }
    node.subordinates.forEach(traverse)
  }

  tree.forEach(traverse)
  return result
}

/**
 * Flatten tree to array
 */
export function flattenTree(tree: OrgNode[]): OrgNode[] {
  const result: OrgNode[] = []

  function traverse(node: OrgNode) {
    result.push(node)
    node.subordinates.forEach(traverse)
  }

  tree.forEach(traverse)
  return result
}

/**
 * Calculate organizational statistics
 */
export function calculateStatistics(
  tree: OrgNode[],
  employees: Employee[]
): OrgStatistics {
  const flatNodes = flattenTree(tree)

  // Count unique departments
  const departments = new Set(
    employees.map((e) => e.department).filter((d) => d !== null)
  )

  // Calculate average span of control (subordinates per manager)
  const managersWithSubordinates = flatNodes.filter(
    (n) => n.subordinates.length > 0
  )
  const totalSubordinates = managersWithSubordinates.reduce(
    (sum, n) => sum + n.subordinates.length,
    0
  )
  const averageSpanOfControl =
    managersWithSubordinates.length > 0
      ? totalSubordinates / managersWithSubordinates.length
      : 0

  // Max depth
  const maxTreeDepth = Math.max(...tree.map(calculateTreeDepth), 0)

  // Employees without manager
  const employeesWithoutManager = employees.filter(
    (e) => e.manager_id === null
  ).length

  return {
    totalEmployees: employees.length,
    departments: departments.size,
    averageSpanOfControl: Math.round(averageSpanOfControl * 10) / 10,
    maxTreeDepth,
    employeesWithoutManager,
  }
}

/**
 * Search employees in tree
 */
export function searchInTree(
  tree: OrgNode[],
  query: string
): OrgNode[] {
  const results: OrgNode[] = []
  const lowerQuery = query.toLowerCase()

  function traverse(node: OrgNode) {
    if (
      node.name.toLowerCase().includes(lowerQuery) ||
      node.jobTitle.toLowerCase().includes(lowerQuery) ||
      node.department?.toLowerCase().includes(lowerQuery) ||
      node.email?.toLowerCase().includes(lowerQuery)
    ) {
      results.push(node)
    }
    node.subordinates.forEach(traverse)
  }

  tree.forEach(traverse)
  return results
}

/**
 * Filter tree by department
 */
export function filterByDepartment(
  tree: OrgNode[],
  department: string
): OrgNode[] {
  const result: OrgNode[] = []

  function traverse(node: OrgNode): OrgNode | null {
    // Check if this node or any descendant matches
    const filteredSubordinates = node.subordinates
      .map(traverse)
      .filter((n): n is OrgNode => n !== null)

    if (node.department === department || filteredSubordinates.length > 0) {
      return {
        ...node,
        subordinates: filteredSubordinates,
      }
    }

    return null
  }

  tree.forEach((node) => {
    const filtered = traverse(node)
    if (filtered) result.push(filtered)
  })

  return result
}
