"use client"

import { List, Kanban, Calendar, User, Plus, CheckSquare } from "lucide-react"
import { ModuleTabs, type TabItem } from "@/components/layout/module-tabs"

const tabs: TabItem[] = [
  {
    label: "Lista",
    value: "lista",
    href: "/ausencias",
    icon: List,
  },
  {
    label: "Minhas Solicitações",
    value: "minhas",
    href: "/ausencias/minhas",
    icon: User,
  },
  {
    label: "Nova Solicitação",
    value: "solicitar",
    href: "/ausencias/solicitar",
    icon: Plus,
  },
  {
    label: "Aprovações",
    value: "aprovacoes",
    href: "/ausencias/aprovacoes",
    icon: CheckSquare,
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
