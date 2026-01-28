"use client"

import { Clock, History, Settings } from "lucide-react"
import { ModuleTabs, type TabItem } from "@/components/layout/module-tabs"

const tabs: TabItem[] = [
  {
    label: "Hoje",
    value: "hoje",
    href: "/ponto",
    icon: Clock,
  },
  {
    label: "Histórico",
    value: "historico",
    href: "/ponto/historico",
    icon: History,
  },
  {
    label: "Configurações",
    value: "config",
    href: "/ponto/configuracoes",
    icon: Settings,
  },
]

export default function PontoLayout({
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
