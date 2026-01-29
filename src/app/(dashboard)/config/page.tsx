"use client"

import * as React from "react"
import {
  Building2,
  Users,
  Clock,
  Calendar,
  Smartphone,
  CreditCard,
  Loader2,
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getCurrentProfile,
  getCompanyData,
  updateCompanyData,
} from "@/lib/supabase/queries"
import type { Company, Address } from "@/types/database"
import { CompanySettings } from "@/components/config/company-settings"
import { ScheduleSettings } from "@/components/config/schedule-settings"
import { CalendarSettings } from "@/components/config/calendar-settings"
import { UsersSettings } from "@/components/config/users-settings"
import { DevicesSettings } from "@/components/config/devices-settings"
import { PlanSettings } from "@/components/config/plan-settings"
import { AutomationsSettings } from "@/components/config/automations-settings"

export default function ConfigPage() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [companyId, setCompanyId] = React.useState<string | null>(null)
  const [company, setCompany] = React.useState<Company | null>(null)

  const [formData, setFormData] = React.useState({
    name: "",
    cnpj: "",
    email: "",
    phone: "",
    cep: "",
    street: "",
    number: "",
    city: "",
    state: "",
    complement: "",
    neighborhood: "",
  })

  React.useEffect(() => {
    async function loadData() {
      try {
        const profileResult = await getCurrentProfile()
        if (profileResult.error || !profileResult.data?.company_id) {
          toast.error("Erro ao carregar perfil")
          setIsLoading(false)
          return
        }

        const cid = profileResult.data.company_id
        setCompanyId(cid)

        const companyResult = await getCompanyData(cid)
        if (companyResult.data) {
          setCompany(companyResult.data)
          const address = companyResult.data.address as Address | null
          setFormData({
            name: companyResult.data.name || "",
            cnpj: companyResult.data.cnpj || "",
            email: companyResult.data.email || "",
            phone: companyResult.data.phone || "",
            cep: address?.zip_code || "",
            street: address?.street || "",
            number: address?.number || "",
            city: address?.city || "",
            state: address?.state || "",
            complement: address?.complement || "",
            neighborhood: address?.neighborhood || "",
          })
        }
      } catch {
        toast.error("Erro ao carregar dados da empresa")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleSaveCompany = async (data: typeof formData) => {
    if (!companyId) return

    try {
      const result = await updateCompanyData(companyId, {
        name: data.name,
        cnpj: data.cnpj,
        email: data.email,
        phone: data.phone,
        address: {
          zip_code: data.cep,
          street: data.street,
          number: data.number,
          city: data.city,
          state: data.state,
          neighborhood: data.neighborhood || "",
          complement: data.complement || "",
        },
      })

      if (result.error) {
        throw new Error(result.error.message)
      }

      setCompany(result.data)
    } catch (error) {
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações do sistema e da empresa
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 lg:w-auto">
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="size-4" />
            <span className="hidden sm:inline">Empresa</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2">
            <Clock className="size-4" />
            <span className="hidden sm:inline">Horários</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="size-4" />
            <span className="hidden sm:inline">Calendários</span>
          </TabsTrigger>
          <TabsTrigger value="automations" className="gap-2">
            <Zap className="size-4" />
            <span className="hidden sm:inline">Automações</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="size-4" />
            <span className="hidden sm:inline">Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="devices" className="gap-2">
            <Smartphone className="size-4" />
            <span className="hidden sm:inline">Dispositivos</span>
          </TabsTrigger>
          <TabsTrigger value="plan" className="gap-2">
            <CreditCard className="size-4" />
            <span className="hidden sm:inline">Plano</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4">
          <CompanySettings
            companyId={companyId}
            initialData={formData}
            onSave={handleSaveCompany}
          />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <ScheduleSettings />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <CalendarSettings />
        </TabsContent>

        <TabsContent value="automations" className="space-y-4">
          <AutomationsSettings />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UsersSettings />
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <DevicesSettings />
        </TabsContent>

        <TabsContent value="plan" className="space-y-4">
          <PlanSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
