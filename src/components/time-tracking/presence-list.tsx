"use client"

import * as React from "react"
import { Users, Coffee, Briefcase, UserX, Loader2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn, getInitials } from "@/lib/utils"
import type { PresenceStatus } from "@/types/database"

interface PresenceListProps {
  presenceData: PresenceStatus[]
  isLoading?: boolean
  maxDisplay?: number
  className?: string
}

const statusConfig = {
  working: {
    label: "Trabalhando",
    icon: Briefcase,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-950",
    badgeVariant: "default" as const,
  },
  break: {
    label: "Intervalo",
    icon: Coffee,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-950",
    badgeVariant: "secondary" as const,
  },
  remote: {
    label: "Remoto",
    icon: Users,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-950",
    badgeVariant: "outline" as const,
  },
  absent: {
    label: "Ausente",
    icon: UserX,
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    badgeVariant: "secondary" as const,
  },
}

export function PresenceList({
  presenceData,
  isLoading = false,
  maxDisplay = 10,
  className,
}: PresenceListProps) {
  const groupedPresence = React.useMemo(() => {
    const groups: Record<PresenceStatus["status"], PresenceStatus[]> = {
      working: [],
      break: [],
      remote: [],
      absent: [],
    }

    presenceData.forEach((person) => {
      if (groups[person.status]) {
        groups[person.status].push(person)
      }
    })

    return groups
  }, [presenceData])

  const counts = React.useMemo(() => ({
    working: groupedPresence.working.length,
    break: groupedPresence.break.length,
    remote: groupedPresence.remote.length,
    absent: groupedPresence.absent.length,
  }), [groupedPresence])

  const formatTime = (dateString: string | null): string => {
    if (!dateString) return "--:--"
    const date = new Date(dateString)
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Quem esta trabalhando
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-5" aria-hidden="true" />
          Quem esta trabalhando
        </CardTitle>
        <CardDescription>
          {counts.working + counts.break + counts.remote} colaboradores ativos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Counters */}
        <div
          className="grid grid-cols-4 gap-2"
          role="list"
          aria-label="Contadores de status"
        >
          {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map(
            (status) => {
              const config = statusConfig[status]
              const Icon = config.icon
              return (
                <div
                  key={status}
                  className={cn(
                    "flex flex-col items-center rounded-lg p-2",
                    config.bgColor
                  )}
                  role="listitem"
                >
                  <Icon
                    className={cn("size-4", config.color)}
                    aria-hidden="true"
                  />
                  <span
                    className={cn("text-lg font-bold tabular-nums", config.color)}
                    aria-label={`${counts[status]} ${config.label.toLowerCase()}`}
                  >
                    {counts[status]}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-full">
                    {config.label}
                  </span>
                </div>
              )
            }
          )}
        </div>

        <Separator />

        {/* People List */}
        <div className="space-y-3">
          {(["working", "break", "remote"] as const).map((status) => {
            const people = groupedPresence[status]
            if (people.length === 0) return null

            const config = statusConfig[status]
            const displayPeople = people.slice(0, maxDisplay)
            const remaining = people.length - maxDisplay

            return (
              <div key={status} className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <span
                    className={cn("size-2 rounded-full", config.bgColor)}
                    aria-hidden="true"
                  />
                  {config.label} ({people.length})
                </h4>
                <div
                  className="flex flex-wrap gap-2"
                  role="list"
                  aria-label={`Lista de ${config.label.toLowerCase()}`}
                >
                  {displayPeople.map((person) => (
                    <div
                      key={person.employee_id}
                      className="flex items-center gap-2 rounded-lg bg-muted/50 px-2 py-1"
                      role="listitem"
                    >
                      <Avatar size="sm">
                        {person.photo_url && (
                          <AvatarImage
                            src={person.photo_url}
                            alt={person.employee_name}
                          />
                        )}
                        <AvatarFallback>
                          {getInitials(person.employee_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium truncate max-w-[100px]">
                          {person.employee_name.split(" ")[0]}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatTime(person.clock_in)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {remaining > 0 && (
                    <Badge variant="outline" className="self-center">
                      +{remaining}
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}

          {counts.working + counts.break + counts.remote === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              Nenhum colaborador ativo no momento
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
