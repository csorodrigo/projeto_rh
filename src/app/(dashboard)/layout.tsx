import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Header } from "@/components/layout/header"
import { ChatbotWidget } from "@/components/ai/ChatbotWidget"
import { PWAInitializer } from "@/components/pwa/PWAInitializer"
import { InstallPrompt } from "@/components/pwa/InstallPrompt"
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator"
import { BottomNav } from "@/components/pwa/BottomNav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: Get user and company from auth context/session
  const user = {
    name: "Admin Usuario",
    email: "admin@empresa.com",
  }

  const company = {
    name: "Minha Empresa",
  }

  return (
    <SidebarProvider>
      <PWAInitializer />
      <OfflineIndicator />
      <AppSidebar user={user} company={company} />
      <SidebarInset>
        <Header user={user} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </SidebarInset>
      <ChatbotWidget />
      <InstallPrompt />
      <BottomNav />
    </SidebarProvider>
  )
}
