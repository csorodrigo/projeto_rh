"use client"

import { useState, useEffect, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImportSettings } from '@/components/settings/ImportSettings'
import { NotificationSettings } from '@/components/settings/NotificationSettings'
import { WorkflowSettings } from '@/components/settings/WorkflowSettings'
import { ReportSettings } from '@/components/settings/ReportSettings'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { debounce } from '@/lib/utils/debounce'
import {
  getImportSettings,
  saveImportSettings,
  getNotificationPreferences,
  saveNotificationPreferences,
  getWorkflowRules,
  saveWorkflowRules,
  getReportDefaults,
  saveReportDefaults,
  getActiveDelegations,
  revokeDelegation,
  getFavoriteTemplates,
  getActiveSchedules,
  disableSchedule,
  type ImportSettings as ImportSettingsType,
  type NotificationPreferences,
  type WorkflowRules as WorkflowRulesType,
  type ReportDefaults as ReportDefaultsType,
} from '@/lib/supabase/queries/settings'
import { createClient } from '@/lib/supabase/client'

export default function ProductivitySettingsPage() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('import')

  // Estados para configurações
  const [importSettings, setImportSettings] = useState<ImportSettingsType | null>(null)
  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferences | null>(null)
  const [workflowRules, setWorkflowRules] = useState<WorkflowRulesType | null>(null)
  const [reportDefaults, setReportDefaults] = useState<ReportDefaultsType | null>(null)

  // Estados para dados auxiliares
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([])
  const [managers, setManagers] = useState<Array<{ id: string; name: string }>>([])
  const [hrManagers, setHrManagers] = useState<Array<{ id: string; name: string }>>([])
  const [activeDelegations, setActiveDelegations] = useState<any[]>([])
  const [favoriteTemplates, setFavoriteTemplates] = useState<any[]>([])
  const [activeSchedules, setActiveSchedules] = useState<any[]>([])

  // IDs do usuário e empresa (mock - substituir por auth real)
  const userId = 'current-user-id'
  const companyId = 'current-company-id'

  // Carregar dados iniciais
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)

      // Carregar configurações em paralelo
      const [
        importData,
        notificationData,
        workflowData,
        reportData,
        depts,
        delegations,
        templates,
        schedules,
      ] = await Promise.all([
        getImportSettings(companyId),
        getNotificationPreferences(userId),
        getWorkflowRules(companyId),
        getReportDefaults(userId),
        loadDepartments(),
        getActiveDelegations(companyId),
        getFavoriteTemplates(userId),
        getActiveSchedules(userId),
      ])

      setImportSettings(importData)
      setNotificationPreferences(notificationData)
      setWorkflowRules(workflowData)
      setReportDefaults(reportData)
      setDepartments(depts)
      setActiveDelegations(delegations)
      setFavoriteTemplates(templates)
      setActiveSchedules(schedules)

      // Carregar managers (simplificado)
      const mockManagers = [
        { id: '1', name: 'João Silva' },
        { id: '2', name: 'Maria Santos' },
        { id: '3', name: 'Pedro Costa' },
      ]
      setManagers(mockManagers)
      setHrManagers(mockManagers)
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  const loadDepartments = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('departamentos')
      .select('id, nome')
      .order('nome')

    return (
      data?.map(d => ({
        id: d.id,
        name: d.nome,
      })) || []
    )
  }

  // Auto-save com debounce para Import Settings
  const debouncedSaveImport = useMemo(
    () =>
      debounce(async (settings: ImportSettingsType) => {
        try {
          await saveImportSettings(companyId, settings)
          toast.success('Configurações de importação salvas')
        } catch (error) {
          console.error('Error saving import settings:', error)
          toast.error('Erro ao salvar configurações de importação')
        }
      }, 1000),
    [companyId]
  )

  // Auto-save com debounce para Notification Preferences
  const debouncedSaveNotifications = useMemo(
    () =>
      debounce(async (preferences: NotificationPreferences) => {
        try {
          await saveNotificationPreferences(userId, preferences)
          toast.success('Preferências de notificação salvas')
        } catch (error) {
          console.error('Error saving notification preferences:', error)
          toast.error('Erro ao salvar preferências de notificação')
        }
      }, 1000),
    [userId]
  )

  // Auto-save com debounce para Workflow Rules
  const debouncedSaveWorkflow = useMemo(
    () =>
      debounce(async (rules: WorkflowRulesType) => {
        try {
          await saveWorkflowRules(companyId, rules)
          toast.success('Regras de workflow salvas')
        } catch (error) {
          console.error('Error saving workflow rules:', error)
          toast.error('Erro ao salvar regras de workflow')
        }
      }, 1000),
    [companyId]
  )

  // Auto-save com debounce para Report Defaults
  const debouncedSaveReports = useMemo(
    () =>
      debounce(async (defaults: ReportDefaultsType) => {
        try {
          await saveReportDefaults(userId, defaults)
          toast.success('Configurações de relatórios salvas')
        } catch (error) {
          console.error('Error saving report defaults:', error)
          toast.error('Erro ao salvar configurações de relatórios')
        }
      }, 1000),
    [userId]
  )

  // Handlers
  const handleImportChange = (settings: ImportSettingsType) => {
    setImportSettings(settings)
    debouncedSaveImport(settings)
  }

  const handleNotificationChange = (preferences: NotificationPreferences) => {
    setNotificationPreferences(preferences)
    debouncedSaveNotifications(preferences)
  }

  const handleWorkflowChange = (rules: WorkflowRulesType) => {
    setWorkflowRules(rules)
    debouncedSaveWorkflow(rules)
  }

  const handleReportChange = (defaults: ReportDefaultsType) => {
    setReportDefaults(defaults)
    debouncedSaveReports(defaults)
  }

  const handleRevokeDelegation = async (id: string) => {
    await revokeDelegation(id)
    setActiveDelegations(prev => prev.filter(d => d.id !== id))
  }

  const handleGenerateReport = (templateId: string) => {
    toast.info('Gerando relatório...', {
      description: 'Esta funcionalidade será implementada em breve',
    })
  }

  const handleUnfavorite = (templateId: string) => {
    setFavoriteTemplates(prev => prev.filter(t => t.id !== templateId))
    toast.success('Template removido dos favoritos')
  }

  const handleDisableSchedule = async (scheduleId: string) => {
    await disableSchedule(scheduleId)
    setActiveSchedules(prev => prev.filter(s => s.id !== scheduleId))
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Configurações de Produtividade
        </h1>
        <p className="text-muted-foreground">
          Configure importações, notificações, workflows e relatórios
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="import">Importação</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-4">
          {importSettings && (
            <ImportSettings settings={importSettings} onChange={handleImportChange} />
          )}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          {notificationPreferences && (
            <NotificationSettings
              preferences={notificationPreferences}
              onChange={handleNotificationChange}
            />
          )}
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          {workflowRules && (
            <WorkflowSettings
              rules={workflowRules}
              onChange={handleWorkflowChange}
              departments={departments}
              managers={managers}
              hrManagers={hrManagers}
              activeDelegations={activeDelegations}
              onRevokeDelegation={handleRevokeDelegation}
            />
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {reportDefaults && (
            <ReportSettings
              defaults={reportDefaults}
              onChange={handleReportChange}
              favoriteTemplates={favoriteTemplates}
              activeSchedules={activeSchedules}
              onGenerateReport={handleGenerateReport}
              onUnfavorite={handleUnfavorite}
              onDisableSchedule={handleDisableSchedule}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
