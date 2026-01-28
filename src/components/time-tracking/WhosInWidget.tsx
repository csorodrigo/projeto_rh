"use client"

import * as React from "react"
import {
  Users,
  Coffee,
  Briefcase,
  Home,
  RefreshCw,
  Loader2,
  ChevronRight,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn, getInitials } from "@/lib/utils"
import { getPresenceStatus } from "@/lib/supabase/queries"
import type { PresenceStatus } from "@/types/database"

interface WhosInWidgetProps {
  companyId: string
  className?: string
  refreshInterval?: number
}

type TabKey = "working" | "break" | "remote"

const tabConfig: Record<
  TabKey,
  {
    label: string
    icon: React.ElementType
    color: string
    bgColor: string
    statuses: PresenceStatus["status"][]
  }
> = {
  working: {
    label: "Trabalhando",
    icon: Briefcase,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-950",
    statuses: ["working"],
  },
  break: {
    label: "Intervalo",
    icon: Coffee,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-950",
    statuses: ["break"],
  },
  remote: {
    label: "Remoto",
    icon: Home,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-950",
    statuses: ["remote"],
  },
}

export function WhosInWidget({
  companyId,
  className,
  refreshInterval = 30000,
}: WhosInWidgetProps) {
  const [presenceData, setPresenceData] = React.useState<PresenceStatus[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)
  const [activeTab, setActiveTab] = React.useState<TabKey>("working")

  const loadData = React.useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      try {
        const result = await getPresenceStatus(companyId)
        if (result.data) {
          setPresenceData(result.data)
          setLastUpdated(new Date())
        }
      } catch (error) {
        console.error("Erro ao carregar presenca:", error)
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [companyId]
  )

  // Initial load
  React.useEffect(() => {
    loadData()
  }, [loadData])

  // Auto-refresh
  React.useEffect(() => {
    if (refreshInterval <= 0) return

    const interval = setInterval(() => {
      loadData(true)
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [loadData, refreshInterval])

  const groupedData = React.useMemo(() => {
    const groups: Record<TabKey, PresenceStatus[]> = {
      working: [],
      break: [],
      remote: [],
    }

    presenceData.forEach((person) => {
      Object.entries(tabConfig).forEach(([key, config]) => {
        if (config.statuses.includes(person.status)) {
          groups[key as TabKey].push(person)
        }
      })
    })

    return groups
  }, [presenceData])

  const counts = React.useMemo(
    () => ({
      working: groupedData.working.length,
      break: groupedData.break.length,
      remote: groupedData.remote.length,
      total:
        groupedData.working.length +
        groupedData.break.length +
        groupedData.remote.length,
    }),
    [groupedData]
  )

  const formatTime = (dateString: string | null): string => {
    if (!dateString) return "--:--"
    const date = new Date(dateString)
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatLastUpdated = (): string => {
    if (!lastUpdated) return ""
    return lastUpdated.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleManualRefresh = () => {
    loadData(true)
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
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" aria-hidden="true" />
              Quem esta trabalhando
            </CardTitle>
            <CardDescription>
              {counts.total} colaboradores ativos agora
              {lastUpdated && (
                <span className="ml-2">
                  - Atualizado as {formatLastUpdated()}
                </span>
              )}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            aria-label="Atualizar lista"
          >
            <RefreshCw
              className={cn("size-4", isRefreshing && "animate-spin")}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Counter Cards */}
        <div className="grid grid-cols-3 gap-3">
          {(Object.keys(tabConfig) as TabKey[]).map((key) => {
            const config = tabConfig[key]
            const Icon = config.icon
            const count = counts[key]
            const isActive = activeTab === key

            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  "flex flex-col items-center rounded-lg p-3 transition-all",
                  "hover:ring-2 hover:ring-ring/20",
                  isActive
                    ? cn(config.bgColor, "ring-2 ring-ring/40")
                    : "bg-muted/50 hover:bg-muted"
                )}
                aria-pressed={isActive}
                aria-label={`${config.label}: ${count} colaboradores`}
              >
                <Icon
                  className={cn("size-5 mb-1", isActive ? config.color : "text-muted-foreground")}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "text-2xl font-bold tabular-nums",
                    isActive ? config.color : "text-foreground"
                  )}
                >
                  {count}
                </span>
                <span className="text-xs text-muted-foreground">
                  {config.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* People List */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
          <TabsList className="sr-only">
            {(Object.keys(tabConfig) as TabKey[]).map((key) => (
              <TabsTrigger key={key} value={key}>
                {tabConfig[key].label}
              </TabsTrigger>
            ))}
          </TabsList>

          {(Object.keys(tabConfig) as TabKey[]).map((key) => {
            const config = tabConfig[key]
            const people = groupedData[key]

            return (
              <TabsContent key={key} value={key} className="mt-4 space-y-2">
                {people.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    Nenhum colaborador {config.label.toLowerCase()}
                  </div>
                ) : (
                  <div
                    className="space-y-2 max-h-64 overflow-y-auto"
                    role="list"
                    aria-label={`Lista de colaboradores ${config.label.toLowerCase()}`}
                  >
                    {people.map((person) => (
                      <div
                        key={person.employee_id}
                        className="flex items-center gap-3 rounded-lg bg-muted/30 p-2 hover:bg-muted/50 transition-colors"
                        role="listitem"
                      >
                        <div className="relative">
                          <Avatar>
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
                          <span
                            className={cn(
                              "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background",
                              config.bgColor.replace("bg-", "bg-").replace("-100", "-500").replace("-950", "-500")
                            )}
                            aria-hidden="true"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {person.employee_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {person.department || "Sem departamento"}
                          </p>
                        </div>

                        <div className="flex flex-col items-end">
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] px-1.5 py-0", config.color)}
                          >
                            {config.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground tabular-nums mt-1">
                            Entrada: {formatTime(person.clock_in)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            )
          })}
        </Tabs>

        {/* View All Link */}
        {counts.total > 0 && (
          <Button
            variant="ghost"
            className="w-full justify-between"
            asChild
          >
            <a href="/ponto/presenca" aria-label="Ver todos os colaboradores">
              <span>Ver todos os colaboradores</span>
              <ChevronRight className="size-4" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
