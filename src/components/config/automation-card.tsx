"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { LucideIcon } from 'lucide-react'

interface AutomationCardProps {
  icon: LucideIcon
  title: string
  description: string
  enabled: boolean
  onToggle: (enabled: boolean) => void
}

export function AutomationCard({
  icon: Icon,
  title,
  description,
  enabled,
  onToggle,
}: AutomationCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-6">
        <div className="flex gap-4">
          <div className="mt-1">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="font-semibold">{title}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          className="ml-4"
        />
      </CardContent>
    </Card>
  )
}
