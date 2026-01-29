"use client"

import * as React from "react"
import { Plane, Heart, Ban } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface AbsentPerson {
  id: string
  name: string
  photo_url?: string
  initials: string
  reason: "vacation" | "medical" | "absence"
  reason_label: string
}

interface AbsentTodayWidgetProps {
  absentees?: AbsentPerson[]
}

const reasonConfig = {
  vacation: {
    icon: Plane,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-950",
    variant: "default" as const,
  },
  medical: {
    icon: Heart,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-950",
    variant: "destructive" as const,
  },
  absence: {
    icon: Ban,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-950",
    variant: "secondary" as const,
  },
}

export function AbsentTodayWidget({ absentees = [] }: AbsentTodayWidgetProps) {
  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-950">
            <Plane className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <CardTitle className="text-base">Funcionários Ausentes</CardTitle>
            <CardDescription>Ausências registradas hoje</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {absentees.length === 0 ? (
          <div className="text-center py-8">
            <Plane className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhum funcionário ausente hoje
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {absentees.map((person) => {
              const config = reasonConfig[person.reason]
              const Icon = config.icon

              return (
                <div key={person.id} className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-muted">
                    <AvatarImage src={person.photo_url} alt={person.name} />
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {person.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{person.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={config.variant} className="text-xs">
                        <Icon className="mr-1 h-3 w-3" />
                        {person.reason_label}
                      </Badge>
                    </div>
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
