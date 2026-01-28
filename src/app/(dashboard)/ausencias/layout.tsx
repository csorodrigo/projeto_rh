"use client"

import { List, Kanban, Calendar } from "lucide-react"
import { ModuleTabs, type TabItem } from "@/components/layout/module-tabs"

const tabs: TabItem[] = [
  {
    label: "Lista",
    value: "lista",
    href: "/ausencias",
    icon: List,
  },
  {
    label: "Kanban",
    value: "kanban",
    href: "/ausencias/kanban",
    icon: Kanban,
  },
  {
    label: "Calendário",
    value: "calendario",
    href: "/ausencias/calendario",
    icon: Calendar,
  },
]

export default function AusenciasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-6">
      <ModuleTabs tabs={tabs} />
      <div>{children}</div>
    </div>
  )
}
