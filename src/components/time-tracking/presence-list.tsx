"use client"

import * as React from "react"
import { Users, Play, Coffee, MapPin, UserX } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { PresenceStatus } from "@/types/database"

interface PresenceListProps {
  presenceData: PresenceStatus[]
  isLoading?: boolean
}

const statusConfig: Record<PresenceStatus['status'], { label: string; color: string; icon: React.ElementType }> = {
  working: { label: "Trabalhando", color: "bg-green-500", icon: Play },
  break: { label: "Intervalo", color: "bg-yellow-500", icon: Coffee },
  remote: { label: "Remoto", color: "bg-blue-500", icon: MapPin },
  absent: { label: "Ausente", color: "bg-gray-400", icon: UserX },
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatTime(dateString: string | null): string {
  if (!dateString) return '--:--'
  const date = new Date(dateString)
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function PresenceList({ presenceData, isLoading = false }: PresenceListProps) {
  const presentCount = presenceData.filter(p => p.status === 'working' || p.status === 'break').length

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Quem está na empresa
          </CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" />
              Quem está na empresa
            </CardTitle>
            <CardDescription>Colaboradores presentes agora</CardDescription>
          </div>
          <Badge variant="secondary">
            {presentCount} presente{presentCount !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {presenceData.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            Nenhum funcionário ativo encontrado
          </div>
        ) : (
          <div className="space-y-3">
            {presenceData.map((person) => {
              const config = statusConfig[person.status]
              const Icon = config.icon
              return (
                <div
                  key={person.employee_id}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="size-10">
                        <AvatarImage src={person.photo_url || undefined} />
                        <AvatarFallback>{getInitials(person.employee_name)}</AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background ${config.color}`} />
                    </div>
                    <div>
                      <span className="font-medium">{person.employee_name}</span>
                      {person.department && (
                        <p className="text-xs text-muted-foreground">{person.department}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon className="size-3" />
                    <span>{config.label}</span>
                    {person.clock_in && person.status !== 'absent' && (
                      <span>desde {formatTime(person.clock_in)}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
