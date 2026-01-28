"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface TabItem {
  label: string
  value: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
}

interface ModuleTabsProps {
  tabs: TabItem[]
  className?: string
}

export function ModuleTabs({ tabs, className }: ModuleTabsProps) {
  const pathname = usePathname()

  const activeTab = React.useMemo(() => {
    const active = tabs.find((tab) => pathname === tab.href)
    return active?.value || tabs[0]?.value
  }, [pathname, tabs])

  return (
    <Tabs value={activeTab} className={cn("w-full", className)}>
      <TabsList className="h-12 w-full justify-start rounded-none border-b bg-transparent p-0">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href

          return (
            <Link key={tab.value} href={tab.href} className="h-full">
              <TabsTrigger
                value={tab.value}
                className={cn(
                  "h-full rounded-none border-b-2 border-transparent px-4 pb-3 pt-3 font-medium transition-all",
                  "data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none",
                  "hover:border-muted-foreground/50 hover:text-foreground",
                  isActive && "border-primary text-primary"
                )}
              >
                <div className="flex items-center gap-2">
                  {tab.icon && <tab.icon className="size-4" />}
                  <span>{tab.label}</span>
                </div>
              </TabsTrigger>
            </Link>
          )
        })}
      </TabsList>
    </Tabs>
  )
}
