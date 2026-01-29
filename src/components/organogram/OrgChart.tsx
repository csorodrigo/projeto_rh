/**
 * Org Chart Component
 * Main interactive organizational chart using React Flow
 */

'use client'

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useMemo, useEffect } from 'react'
import OrgNode from './OrgNode'
import type { OrgNode as OrgNodeType, LayoutType } from '@/types/organogram'
import {
  topDownLayout,
  leftRightLayout,
  compactLayout,
  radialLayout,
} from '@/lib/organogram/layouts'

const nodeTypes = {
  employee: OrgNode,
}

interface OrgChartProps {
  hierarchy: OrgNodeType[]
  layout?: LayoutType
  onNodeClick?: (nodeId: string) => void
  selectedNodeId?: string | null
  highlightPath?: string[] // IDs to highlight
}

export default function OrgChart({
  hierarchy,
  layout = 'top-down',
  onNodeClick,
  selectedNodeId,
  highlightPath = [],
}: OrgChartProps) {
  // Convert hierarchy to nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = []
    const edges: Edge[] = []

    // Flatten tree and create nodes
    function flattenTree(tree: OrgNodeType[]): OrgNodeType[] {
      const result: OrgNodeType[] = []

      function traverse(node: OrgNodeType) {
        result.push(node)
        node.subordinates.forEach(traverse)
      }

      tree.forEach(traverse)
      return result
    }

    const flatNodes = flattenTree(hierarchy)

    // Apply layout algorithm
    let layoutResult
    switch (layout) {
      case 'left-right':
        layoutResult = leftRightLayout(hierarchy)
        break
      case 'compact':
        layoutResult = compactLayout(hierarchy)
        break
      case 'radial':
        layoutResult = radialLayout(hierarchy)
        break
      case 'top-down':
      default:
        layoutResult = topDownLayout(hierarchy)
        break
    }

    // Create React Flow nodes
    flatNodes.forEach((orgNode) => {
      const position = layoutResult.nodes.get(orgNode.id)

      if (position) {
        nodes.push({
          id: orgNode.id,
          type: 'employee',
          position: { x: position.x, y: position.y },
          data: {
            name: orgNode.name,
            jobTitle: orgNode.jobTitle,
            department: orgNode.department,
            avatarUrl: orgNode.avatarUrl,
            subordinateCount: orgNode.subordinates.length,
            isAbsent: orgNode.isAbsent || false,
            level: orgNode.level,
            email: orgNode.email,
            phone: orgNode.phone,
          },
        })
      }
    })

    // Create edges
    layoutResult.connections.forEach((conn) => {
      const isHighlighted =
        highlightPath.includes(conn.from) && highlightPath.includes(conn.to)

      edges.push({
        id: `${conn.from}-${conn.to}`,
        source: conn.from,
        target: conn.to,
        type: 'smoothstep',
        animated: isHighlighted,
        style: {
          stroke: isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--border))',
          strokeWidth: isHighlighted ? 2 : 1,
        },
      })
    })

    return { initialNodes: nodes, initialEdges: edges }
  }, [hierarchy, layout, highlightPath])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Update nodes when hierarchy or layout changes
  useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  // Update selection
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId,
      }))
    )
  }, [selectedNodeId, setNodes])

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeClick?.(node.id)
    },
    [onNodeClick]
  )

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const level = (node.data as { level: number }).level
            if (level === 0) return 'hsl(var(--primary))'
            if (level === 1) return 'hsl(var(--primary) / 0.7)'
            return 'hsl(var(--muted-foreground) / 0.5)'
          }}
          maskColor="hsl(var(--background) / 0.8)"
        />
      </ReactFlow>
    </div>
  )
}
