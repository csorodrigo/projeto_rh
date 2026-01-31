"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  Target,
  Heart,
  DollarSign,
  BarChart3,
  Settings,
  Building2,
  ChevronUp,
  ChevronDown,
  LogOut,
  User,
  UserPlus,
  FileText,
  History,
  ClipboardList,
  TrendingUp,
  Briefcase,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface NavigationItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  badge?: {
    count: number
    variant?: "default" | "destructive" | "outline" | "secondary"
  }
  iconColor?: string
  items?: {
    title: string
    url: string
  }[]
}

const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    iconColor: "text-purple-600",
  },
  {
    title: "Funcionários",
    url: "/funcionarios",
    icon: Users,
    iconColor: "text-blue-600",
    items: [
      { title: "Lista", url: "/funcionarios" },
      { title: "Organograma", url: "/funcionarios/organograma" },
      { title: "Importar", url: "/funcionarios/importar" },
    ],
  },
  {
    title: "Ponto",
    url: "/ponto",
    icon: Clock,
    iconColor: "text-green-600",
    items: [
      { title: "Hoje", url: "/ponto" },
      { title: "Histórico", url: "/ponto/historico" },
      { title: "Configurações", url: "/ponto/configuracoes" },
    ],
  },
  {
    title: "Ausências",
    url: "/ausencias",
    icon: Calendar,
    iconColor: "text-orange-600",
    badge: { count: 5, variant: "destructive" },
    items: [
      { title: "Lista", url: "/ausencias" },
      { title: "Kanban", url: "/ausencias/kanban" },
      { title: "Calendário", url: "/ausencias/calendario" },
    ],
  },
  {
    title: "PDI",
    url: "/pdi",
    icon: Target,
    iconColor: "text-pink-600",
  },
  {
    title: "Saúde",
    url: "/saude",
    icon: Heart,
    iconColor: "text-red-600",
    badge: { count: 3, variant: "secondary" },
  },
  {
    title: "Folha",
    url: "/folha",
    icon: DollarSign,
    iconColor: "text-emerald-600",
    items: [
      { title: "Mensal", url: "/folha" },
      { title: "Rescisão", url: "/folha/rescisao" },
    ],
  },
  {
    title: "Recrutamento",
    url: "/recrutamento",
    icon: Briefcase,
    iconColor: "text-purple-500",
    items: [
      { title: "Dashboard", url: "/recrutamento" },
      { title: "Vagas", url: "/recrutamento/vagas" },
      { title: "Pipeline", url: "/recrutamento/pipeline" },
      { title: "Candidatos", url: "/recrutamento/candidatos" },
      { title: "Admissões", url: "/recrutamento/admissao" },
    ],
  },
  {
    title: "Relatórios",
    url: "/relatorios",
    icon: BarChart3,
    iconColor: "text-indigo-600",
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: TrendingUp,
    iconColor: "text-cyan-600",
    items: [
      { title: "Dashboard", url: "/analytics" },
      { title: "Executivo", url: "/analytics/executivo" },
      { title: "Departamentos", url: "/analytics/departamentos" },
    ],
  },
]

const settingsItems = [
  {
    title: "Configuracoes",
    url: "/config",
    icon: Settings,
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string
    email: string
    avatar?: string
  }
  company?: {
    name: string
    logo?: string
  }
}

export function AppSidebar({
  user = {
    name: "Usuario",
    email: "usuario@empresa.com",
  },
  company = {
    name: "Empresa",
  },
  ...props
}: AppSidebarProps) {
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const [openItems, setOpenItems] = React.useState<string[]>([])

  const isActiveRoute = (url: string) => {
    if (url === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/"
    }
    return pathname.startsWith(url)
  }

  const toggleItem = (title: string) => {
    setOpenItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    )
  }

  React.useEffect(() => {
    // Auto-expand active section
    navigationItems.forEach((item) => {
      if (item.items && isActiveRoute(item.url)) {
        setOpenItems((prev) =>
          prev.includes(item.title) ? prev : [...prev, item.title]
        )
      }
    })
  }, [pathname])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Building2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{company.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  Sistema RH
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const hasSubItems = item.items && item.items.length > 0
                const isOpen = openItems.includes(item.title)
                const isActive = isActiveRoute(item.url)

                if (hasSubItems) {
                  return (
                    <Collapsible
                      key={item.title}
                      open={isOpen}
                      onOpenChange={() => toggleItem(item.title)}
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            isActive={isActive}
                            tooltip={item.title}
                            className="group"
                          >
                            <item.icon className={cn("transition-colors", item.iconColor)} />
                            <span className="flex-1">{item.title}</span>
                            {item.badge && !isCollapsed && (
                              <Badge
                                variant={item.badge.variant || "default"}
                                className="ml-auto h-5 px-1.5 text-xs"
                              >
                                {item.badge.count}
                              </Badge>
                            )}
                            <ChevronDown
                              className={cn(
                                "ml-auto size-4 transition-transform",
                                isOpen && "rotate-180"
                              )}
                            />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="transition-all data-[state=closed]:animate-out data-[state=open]:animate-in">
                          <SidebarMenu className="pl-4 border-l ml-4">
                            {item.items?.map((subItem) => (
                              <SidebarMenuItem key={subItem.url}>
                                <SidebarMenuButton
                                  asChild
                                  isActive={pathname === subItem.url}
                                  className="text-sm"
                                >
                                  <Link href={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            ))}
                          </SidebarMenu>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.url} className="group">
                        <item.icon className={cn("transition-colors", item.iconColor)} />
                        <span className="flex-1">{item.title}</span>
                        {item.badge && !isCollapsed && (
                          <Badge
                            variant={item.badge.variant || "default"}
                            className="ml-auto h-5 px-1.5 text-xs"
                          >
                            {item.badge.count}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActiveRoute(item.url)}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isCollapsed ? "right" : "top"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href="/perfil" className="cursor-pointer">
                    <User className="mr-2 size-4" />
                    Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/config" className="cursor-pointer">
                    <Settings className="mr-2 size-4" />
                    Configuracoes
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 size-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
