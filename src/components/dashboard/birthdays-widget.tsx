"use client"

import * as React from "react"
import { Cake } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface Birthday {
  id: string
  name: string
  photo_url?: string
  initials: string
  age: number
  date: string
}

interface BirthdaysWidgetProps {
  birthdays?: Birthday[]
}

export function BirthdaysWidget({ birthdays = [] }: BirthdaysWidgetProps) {
  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-pink-100 p-3 dark:bg-pink-950">
            <Cake className="h-6 w-6 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <CardTitle className="text-base">Aniversariantes</CardTitle>
            <CardDescription>Celebrações desta semana</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {birthdays.length === 0 ? (
          <div className="text-center py-8">
            <Cake className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhum aniversário esta semana
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {birthdays.map((person) => (
              <div key={person.id} className="flex items-center gap-3 group">
                <Avatar className="h-12 w-12 ring-2 ring-pink-100 dark:ring-pink-900 transition-all group-hover:ring-pink-200 dark:group-hover:ring-pink-800">
                  <AvatarImage src={person.photo_url} alt={person.name} />
                  <AvatarFallback className="bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300">
                    {person.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{person.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Completando {person.age} anos
                  </p>
                  <p className="text-xs text-muted-foreground">{person.date}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Mensagem
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
