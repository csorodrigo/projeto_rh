/**
 * Layout Algorithms
 * Different algorithms for positioning nodes in the org chart
 */

import type { OrgNode, OrgPosition, OrgLayout } from '@/types/organogram'

const NODE_WIDTH = 240
const NODE_HEIGHT = 100
const HORIZONTAL_SPACING = 40
const VERTICAL_SPACING = 80

/**
 * Top-down hierarchical layout (default)
 */
export function topDownLayout(tree: OrgNode[]): OrgLayout {
  const nodes = new Map<string, OrgPosition>()
  const connections: Array<{ from: string; to: string }> = []

  let maxWidth = 0
  let maxHeight = 0

  function layoutNode(
    node: OrgNode,
    level: number,
    offsetX: number
  ): number {
    const y = level * (NODE_HEIGHT + VERTICAL_SPACING)

    if (node.subordinates.length === 0) {
      // Leaf node
      const x = offsetX
      nodes.set(node.id, { x, y, width: NODE_WIDTH, height: NODE_HEIGHT })

      maxWidth = Math.max(maxWidth, x + NODE_WIDTH)
      maxHeight = Math.max(maxHeight, y + NODE_HEIGHT)

      return x + NODE_WIDTH + HORIZONTAL_SPACING
    }

    // Layout children first
    let childX = offsetX
    const childPositions: number[] = []

    node.subordinates.forEach((child) => {
      const childCenterX = childX + NODE_WIDTH / 2
      childPositions.push(childCenterX)
      childX = layoutNode(child, level + 1, childX)

      // Add connection
      connections.push({ from: node.id, to: child.id })
    })

    // Center parent over children
    const firstChildX = childPositions[0]
    const lastChildX = childPositions[childPositions.length - 1]
    const x = (firstChildX + lastChildX) / 2 - NODE_WIDTH / 2

    nodes.set(node.id, { x, y, width: NODE_WIDTH, height: NODE_HEIGHT })

    maxWidth = Math.max(maxWidth, childX - HORIZONTAL_SPACING)
    maxHeight = Math.max(maxHeight, y + NODE_HEIGHT)

    return childX
  }

  let currentX = 0
  tree.forEach((root) => {
    currentX = layoutNode(root, 0, currentX)
  })

  return {
    nodes,
    connections,
    bounds: { width: maxWidth, height: maxHeight },
  }
}

/**
 * Left-to-right layout
 */
export function leftRightLayout(tree: OrgNode[]): OrgLayout {
  const nodes = new Map<string, OrgPosition>()
  const connections: Array<{ from: string; to: string }> = []

  let maxWidth = 0
  let maxHeight = 0

  function layoutNode(
    node: OrgNode,
    level: number,
    offsetY: number
  ): number {
    const x = level * (NODE_WIDTH + HORIZONTAL_SPACING)

    if (node.subordinates.length === 0) {
      const y = offsetY
      nodes.set(node.id, { x, y, width: NODE_WIDTH, height: NODE_HEIGHT })

      maxWidth = Math.max(maxWidth, x + NODE_WIDTH)
      maxHeight = Math.max(maxHeight, y + NODE_HEIGHT)

      return y + NODE_HEIGHT + VERTICAL_SPACING
    }

    let childY = offsetY
    const childPositions: number[] = []

    node.subordinates.forEach((child) => {
      const childCenterY = childY + NODE_HEIGHT / 2
      childPositions.push(childCenterY)
      childY = layoutNode(child, level + 1, childY)

      connections.push({ from: node.id, to: child.id })
    })

    const firstChildY = childPositions[0]
    const lastChildY = childPositions[childPositions.length - 1]
    const y = (firstChildY + lastChildY) / 2 - NODE_HEIGHT / 2

    nodes.set(node.id, { x, y, width: NODE_WIDTH, height: NODE_HEIGHT })

    maxWidth = Math.max(maxWidth, x + NODE_WIDTH)
    maxHeight = Math.max(maxHeight, childY - VERTICAL_SPACING)

    return childY
  }

  let currentY = 0
  tree.forEach((root) => {
    currentY = layoutNode(root, 0, currentY)
  })

  return {
    nodes,
    connections,
    bounds: { width: maxWidth, height: maxHeight },
  }
}

/**
 * Compact layout - minimizes vertical space
 */
export function compactLayout(tree: OrgNode[]): OrgLayout {
  const nodes = new Map<string, OrgPosition>()
  const connections: Array<{ from: string; to: string }> = []

  let maxWidth = 0
  let maxHeight = 0

  const COMPACT_SPACING_Y = 50

  function layoutNode(
    node: OrgNode,
    level: number,
    offsetX: number
  ): number {
    const y = level * (NODE_HEIGHT + COMPACT_SPACING_Y)

    if (node.subordinates.length === 0) {
      const x = offsetX
      nodes.set(node.id, { x, y, width: NODE_WIDTH, height: NODE_HEIGHT })

      maxWidth = Math.max(maxWidth, x + NODE_WIDTH)
      maxHeight = Math.max(maxHeight, y + NODE_HEIGHT)

      return x + NODE_WIDTH + HORIZONTAL_SPACING
    }

    let childX = offsetX
    const childPositions: number[] = []

    node.subordinates.forEach((child) => {
      const childCenterX = childX + NODE_WIDTH / 2
      childPositions.push(childCenterX)
      childX = layoutNode(child, level + 1, childX)

      connections.push({ from: node.id, to: child.id })
    })

    const firstChildX = childPositions[0]
    const lastChildX = childPositions[childPositions.length - 1]
    const x = (firstChildX + lastChildX) / 2 - NODE_WIDTH / 2

    nodes.set(node.id, { x, y, width: NODE_WIDTH, height: NODE_HEIGHT })

    maxWidth = Math.max(maxWidth, childX - HORIZONTAL_SPACING)
    maxHeight = Math.max(maxHeight, y + NODE_HEIGHT)

    return childX
  }

  let currentX = 0
  tree.forEach((root) => {
    currentX = layoutNode(root, 0, currentX)
  })

  return {
    nodes,
    connections,
    bounds: { width: maxWidth, height: maxHeight },
  }
}

/**
 * Radial/circular layout
 */
export function radialLayout(tree: OrgNode[]): OrgLayout {
  const nodes = new Map<string, OrgPosition>()
  const connections: Array<{ from: string; to: string }> = []

  if (tree.length === 0) {
    return { nodes, connections, bounds: { width: 0, height: 0 } }
  }

  // For simplicity, radial layout works best with single root
  const root = tree[0]

  const centerX = 500
  const centerY = 500
  const levelRadius = 200

  function layoutNode(
    node: OrgNode,
    level: number,
    angleStart: number,
    angleEnd: number,
    parentX?: number,
    parentY?: number
  ) {
    const angle = (angleStart + angleEnd) / 2
    const radius = level === 0 ? 0 : level * levelRadius

    const x = centerX + radius * Math.cos(angle) - NODE_WIDTH / 2
    const y = centerY + radius * Math.sin(angle) - NODE_HEIGHT / 2

    nodes.set(node.id, { x, y, width: NODE_WIDTH, height: NODE_HEIGHT })

    if (parentX !== undefined && parentY !== undefined && level > 0) {
      connections.push({ from: node.managerId!, to: node.id })
    }

    const childCount = node.subordinates.length
    if (childCount > 0) {
      const angleStep = (angleEnd - angleStart) / childCount

      node.subordinates.forEach((child, i) => {
        const childAngleStart = angleStart + i * angleStep
        const childAngleEnd = childAngleStart + angleStep

        layoutNode(
          child,
          level + 1,
          childAngleStart,
          childAngleEnd,
          x + NODE_WIDTH / 2,
          y + NODE_HEIGHT / 2
        )
      })
    }
  }

  layoutNode(root, 0, 0, 2 * Math.PI)

  const maxRadius = (root.level + 1) * levelRadius
  const bounds = {
    width: centerX * 2 + maxRadius,
    height: centerY * 2 + maxRadius,
  }

  return { nodes, connections, bounds }
}

/**
 * Calculate positions for React Flow nodes
 */
export function convertToFlowPositions(
  layout: OrgLayout
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()

  layout.nodes.forEach((position, id) => {
    positions.set(id, { x: position.x, y: position.y })
  })

  return positions
}
