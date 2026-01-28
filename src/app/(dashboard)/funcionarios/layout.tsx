"use client"

import { usePathname } from "next/navigation"
import { List, Network, Upload } from "lucide-react"
import { ModuleTabs, type TabItem } from "@/components/layout/module-tabs"

const tabs: TabItem[] = [
  {
    label: "Lista",
    value: "list",
    href: "/funcionarios",
    icon: List,
  },
  {
    label: "Organograma",
    value: "organograma",
    href: "/funcionarios/organograma",
    icon: Network,
  },
  {
    label: "Importar",
    value: "importar",
    href: "/funcionarios/importar",
    icon: Upload,
  },
]

export default function FuncionariosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Don't show tabs in specific routes (novo, edit, detail)
  const shouldShowTabs = pathname === "/funcionarios" ||
                         pathname === "/funcionarios/organograma" ||
                         pathname === "/funcionarios/importar"

  if (!shouldShowTabs) {
    return <>{children}</>
  }

  return (
    <div className="flex flex-col">
      <ModuleTabs tabs={tabs} className="mb-6" />
      <div>{children}</div>
    </div>
  )
}
