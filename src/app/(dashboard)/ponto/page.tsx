"use client"

import * as React from "react"
import { Smartphone, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ClockWidget,
  TimeEntriesList,
  TimeSummaryCard,
  PresenceList,
} from "@/components/time-tracking"

import {
  recordTimeEntry,
  getTodayTimeRecords,
  getCurrentClockStatus,
  getTimeBankBalance,
  getPresenceStatus,
  getDailyTimeTracking,
  getCurrentProfile,
  getCurrentCompany,
} from "@/lib/supabase/queries"

import type { TimeRecord, PresenceStatus as PresenceStatusType, ClockType } from "@/types/database"

export default function PontoPage() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [currentStatus, setCurrentStatus] = React.useState<'not_started' | 'working' | 'break' | 'finished'>('not_started')
  const [todayRecords, setTodayRecords] = React.useState<TimeRecord[]>([])
  const [workedMinutes, setWorkedMinutes] = React.useState(0)
  const [bankMinutes, setBankMinutes] = React.useState(0)
  const [presenceData, setPresenceData] = React.useState<PresenceStatusType[]>([])
  const [presenceLoading, setPresenceLoading] = React.useState(true)
  const [employeeId, setEmployeeId] = React.useState<string | null>(null)
  const [companyId, setCompanyId] = React.useState<string | null>(null)

  // Load initial data
  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      // Get current profile and company
      const [profileResult, companyResult] = await Promise.all([
        getCurrentProfile(),
        getCurrentCompany(),
      ])

      if (!profileResult.data || !companyResult.data) {
        console.error("Erro ao carregar perfil ou empresa")
        return
      }

      // For now, use the profile ID as employee ID (should be linked in profiles table)
      // In production, you'd have a proper employee_id field in profiles
      const empId = profileResult.data.id
      const compId = companyResult.data.id

      setEmployeeId(empId)
      setCompanyId(compId)

      // Load all data in parallel
      const [statusResult, recordsResult, bankResult, dailyResult] = await Promise.all([
        getCurrentClockStatus(empId),
        getTodayTimeRecords(empId),
        getTimeBankBalance(empId),
        getDailyTimeTracking(empId, new Date().toISOString().split('T')[0]),
      ])

      if (statusResult.data) {
        setCurrentStatus(statusResult.data.status)
      }

      if (recordsResult.data) {
        setTodayRecords(recordsResult.data)
      }

      if (bankResult.data) {
        setBankMinutes(bankResult.data.balance_minutes)
      }

      if (dailyResult.data) {
        setWorkedMinutes(dailyResult.data.worked_minutes)
      }

      // Load presence data separately (can be slower)
      loadPresenceData(compId)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadPresenceData = async (compId: string) => {
    setPresenceLoading(true)
    try {
      const presenceResult = await getPresenceStatus(compId)
      if (presenceResult.data) {
        setPresenceData(presenceResult.data)
      }
    } catch (error) {
      console.error("Erro ao carregar presença:", error)
    } finally {
      setPresenceLoading(false)
    }
  }

  // Load data on mount
  React.useEffect(() => {
    loadData()
  }, [loadData])

  // Handle clock action
  const handleClockAction = async (action: ClockType) => {
    if (!employeeId || !companyId) {
      throw new Error("Usuário não identificado")
    }

    const result = await recordTimeEntry(employeeId, companyId, action, {
      source: 'web',
      deviceInfo: {
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        device_type: 'desktop',
      },
    })

    if (result.error) {
      throw new Error(result.error.message)
    }

    // Reload data after recording
    await loadData()
  }

  // Refresh presence data
  const handleRefreshPresence = () => {
    if (companyId) {
      loadPresenceData(companyId)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Controle de Ponto</h1>
        <p className="text-muted-foreground">
          Registre suas entradas e saídas
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Clock Card */}
        <Card>
          <CardHeader>
            <CardTitle>Registrar Ponto</CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ClockWidget
              currentStatus={currentStatus}
              onClockAction={handleClockAction}
              isLoading={isLoading}
            />

            <TimeEntriesList entries={todayRecords} />
          </CardContent>
        </Card>

        {/* Stats and Who's In */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <TimeSummaryCard
              type="worked"
              minutes={workedMinutes}
              label="Horas hoje"
            />
            <TimeSummaryCard
              type="bank"
              minutes={bankMinutes}
              label="Banco de horas"
            />
          </div>

          {/* Who's In */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 z-10"
              onClick={handleRefreshPresence}
              disabled={presenceLoading}
            >
              <RefreshCw className={`size-4 ${presenceLoading ? 'animate-spin' : ''}`} />
            </Button>
            <PresenceList
              presenceData={presenceData}
              isLoading={presenceLoading}
            />
          </div>

          {/* Device Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Smartphone className="size-4" />
                <span>
                  Dispositivo: {typeof navigator !== 'undefined'
                    ? `${navigator.userAgent.includes('Chrome') ? 'Chrome' :
                        navigator.userAgent.includes('Firefox') ? 'Firefox' :
                        navigator.userAgent.includes('Safari') ? 'Safari' : 'Navegador'} - ${
                        navigator.platform}`
                    : 'Carregando...'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
