/**
 * Org Node Component
 * Individual employee card in the org chart
 */

'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Users } from 'lucide-react'
import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'

interface OrgNodeProps {
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
  selected?: boolean
}

function OrgNode({ data, selected }: OrgNodeProps) {
  const initials = data.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Determine node size based on level (CEO larger, employees smaller)
  const sizeClass = data.level === 0 ? 'w-72' : data.level === 1 ? 'w-64' : 'w-60'

  return (
    <Card
      className={`${sizeClass} transition-all hover:shadow-lg cursor-pointer ${
        selected ? 'ring-2 ring-primary' : ''
      }`}
    >
      {/* Top handle for incoming connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-primary !w-3 !h-3 !border-2 !border-background"
      />

      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Avatar className={data.level === 0 ? 'h-14 w-14' : 'h-12 w-12'}>
            <AvatarImage src={data.avatarUrl || undefined} alt={data.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3
              className={`font-semibold truncate ${
                data.level === 0 ? 'text-base' : 'text-sm'
              }`}
            >
              {data.name}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {data.jobTitle}
            </p>
            {data.department && (
              <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
                {data.department}
              </p>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {data.isAbsent && (
            <Badge variant="destructive" className="text-xs">
              Ausente
            </Badge>
          )}

          {data.subordinateCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              {data.subordinateCount} subordinado
              {data.subordinateCount !== 1 ? 's' : ''}
            </Badge>
          )}

          {data.level === 0 && (
            <Badge className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20">
              CEO
            </Badge>
          )}
        </div>
      </div>

      {/* Bottom handle for outgoing connections */}
      {data.subordinateCount > 0 && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-primary !w-3 !h-3 !border-2 !border-background"
        />
      )}
    </Card>
  )
}

// Memoize to prevent unnecessary re-renders
export default memo(OrgNode)
