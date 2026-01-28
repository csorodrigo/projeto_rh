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

      // Use employee_id from profile (FK to employees table)
      const empId = profileResult.data.employee_id
      const compId = companyResult.data.id

      // Validar se usuário tem employee_id vinculado
      if (!empId) {
        toast.error("Funcionário não vinculado. Entre em contato com RH.")
        return
      }

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
      {/* Quick Summary Widget */}
      <Card className="border-2 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 shadow-lg">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Status */}
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-xl shadow-md ${
                currentStatus === 'working' ? 'bg-gradient-to-br from-emerald-500 to-green-500 animate-pulse' :
                currentStatus === 'break' ? 'bg-gradient-to-br from-blue-400 to-cyan-400 animate-pulse' :
                currentStatus === 'finished' ? 'bg-gradient-to-br from-slate-500 to-gray-500' :
                'bg-gradient-to-br from-slate-300 to-gray-400'
              }`}>
                <div className="size-8 rounded-full bg-white/20 flex items-center justify-center">
                  {currentStatus === 'working' ? '🟢' :
                   currentStatus === 'break' ? '🔵' :
                   currentStatus === 'finished' ? '✅' : '⏸️'}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-bold">
                  {currentStatus === 'not_started' && 'Aguardando'}
                  {currentStatus === 'working' && 'Trabalhando'}
                  {currentStatus === 'break' && 'Intervalo'}
                  {currentStatus === 'finished' && 'Finalizado'}
                </p>
              </div>
            </div>

            {/* Worked Today */}
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 shadow-md">
                <div className="size-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                  {Math.floor(workedMinutes / 60)}h
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trabalhado Hoje</p>
                <p className="text-lg font-bold tabular-nums">
                  {Math.floor(workedMinutes / 60)}h {workedMinutes % 60}min
                </p>
              </div>
            </div>

            {/* Time Bank */}
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-xl shadow-md ${
                bankMinutes > 0 ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
                bankMinutes < 0 ? 'bg-gradient-to-br from-orange-500 to-red-500' :
                'bg-gradient-to-br from-slate-400 to-gray-400'
              }`}>
                <div className="size-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                  {bankMinutes > 0 ? '+' : bankMinutes < 0 ? '-' : '0'}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Banco de Horas</p>
                <p className="text-lg font-bold tabular-nums">
                  {Math.abs(Math.floor(bankMinutes / 60))}h {Math.abs(bankMinutes % 60)}min
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Clock Card */}
        <Card className="shadow-lg">
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
