"use client"

import { useState, useEffect } from 'react'
import { FileText, Shield } from 'lucide-react'
import { ComplianceReportForm } from '@/components/relatorios/compliance/ComplianceReportForm'
import { ComplianceHistory, type ComplianceHistoryItem } from '@/components/relatorios/compliance/ComplianceHistory'
import { ComplianceValidation, type ComplianceValidationData } from '@/components/relatorios/compliance/ComplianceValidation'
import { generateAFD, type AFDData } from '@/lib/compliance/afd-generator'
import { generateAEJ, type AEJData } from '@/lib/compliance/aej-generator'
import type { DateRange } from 'react-day-picker'
import { toast } from 'sonner'

// Mock data - Em produção, buscar do Supabase
const MOCK_COMPANY = {
  id: '1',
  name: 'Empresa Exemplo LTDA',
  cnpj: '12.345.678/0001-90',
  address: {
    street: 'Rua Exemplo',
    number: '123',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '01234-567',
  },
}

export default function CompliancePage() {
  const [history, setHistory] = useState<ComplianceHistoryItem[]>([])
  const [validation, setValidation] = useState<ComplianceValidationData | null>(null)
  const [isLoadingValidation, setIsLoadingValidation] = useState(false)

  // Carrega histórico do localStorage na montagem
  useEffect(() => {
    const storedHistory = localStorage.getItem('compliance-history')
    if (storedHistory) {
      try {
        const parsed = JSON.parse(storedHistory)
        // Converte strings de data para objetos Date
        const converted = parsed.map((item: any) => ({
          ...item,
          generatedAt: new Date(item.generatedAt),
          startDate: new Date(item.startDate),
          endDate: new Date(item.endDate),
        }))
        setHistory(converted)
      } catch (error) {
        console.error('Erro ao carregar histórico:', error)
      }
    }
  }, [])

  // Salva histórico no localStorage quando mudar
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('compliance-history', JSON.stringify(history))
    }
  }, [history])

  const fetchEmployeesAndRecords = async (dateRange: DateRange) => {
    // Em produção, fazer chamadas reais ao Supabase
    // const { data: employees } = await supabase
    //   .from('employees')
    //   .select('*')
    //   .eq('company_id', companyId)
    //   .eq('status', 'active')

    // const { data: timeRecords } = await supabase
    //   .from('time_records')
    //   .select('*')
    //   .gte('recorded_at', dateRange.from)
    //   .lte('recorded_at', dateRange.to)

    // Mock data para demonstração
    return {
      employees: [
        {
          id: '1',
          name: 'João Silva',
          cpf: '123.456.789-00',
          pis: '123.45678.90-1',
          employee_number: '001',
          position: 'Desenvolvedor',
          department: 'TI',
          hire_date: '2023-01-15',
          salary: 5000,
          weekly_hours: 44,
          status: 'active',
          email: 'joao@example.com',
          phone: '11999999999',
          birth_date: '1990-01-01',
          contract_type: 'clt',
          company_id: '1',
          manager_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      timeRecords: [
        {
          id: '1',
          employee_id: '1',
          company_id: '1',
          recorded_at: new Date().toISOString(),
          type: 'clock_in',
          source: 'web',
          status: 'approved',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      dailyRecords: [],
      workSchedules: [],
    }
  }

  const handleGenerate = async (type: 'afd' | 'aej', dateRange: DateRange) => {
    if (!dateRange.from || !dateRange.to) {
      throw new Error('Período inválido')
    }

    setIsLoadingValidation(true)

    try {
      // Busca dados do banco
      const { employees, timeRecords, dailyRecords, workSchedules } = await fetchEmployeesAndRecords(dateRange)

      // Valida dados
      const employeesWithoutPis = employees.filter(e => !e.pis).length
      const incompleteRecords = timeRecords.filter(r => r.status === 'pending').length

      setValidation({
        allEmployeesHavePis: employeesWithoutPis === 0,
        allRecordsComplete: incompleteRecords === 0,
        hasViolations: employeesWithoutPis > 0 || incompleteRecords > 0,
        issues: [
          ...(employeesWithoutPis > 0 ? [{
            id: '1',
            type: 'error' as const,
            message: 'Funcionários sem PIS cadastrado',
            count: employeesWithoutPis,
            details: 'É obrigatório cadastrar o PIS de todos os funcionários para gerar relatórios de compliance.',
          }] : []),
          ...(incompleteRecords > 0 ? [{
            id: '2',
            type: 'warning' as const,
            message: 'Registros de ponto pendentes de aprovação',
            count: incompleteRecords,
            details: 'Existem registros de ponto que ainda não foram aprovados pelo gestor.',
          }] : []),
        ],
        stats: {
          totalEmployees: employees.length,
          employeesWithPis: employees.length - employeesWithoutPis,
          completeRecords: timeRecords.length - incompleteRecords,
          totalRecords: timeRecords.length,
          violations: employeesWithoutPis + incompleteRecords,
        },
      })

      // Gera o relatório
      let result
      if (type === 'afd') {
        const afdData: AFDData = {
          company: MOCK_COMPANY as any,
          employees: employees as any,
          timeRecords: timeRecords as any,
          dailyRecords: dailyRecords as any,
          startDate: dateRange.from,
          endDate: dateRange.to,
        }
        result = generateAFD(afdData)
      } else {
        const aejData: AEJData = {
          company: MOCK_COMPANY as any,
          employees: employees as any,
          dailyRecords: dailyRecords as any,
          workSchedules: workSchedules as any,
          holidays: [],
          startDate: dateRange.from,
          endDate: dateRange.to,
        }
        result = generateAEJ(aejData)
      }

      // Adiciona ao histórico
      const newHistoryItem: ComplianceHistoryItem = {
        id: Date.now().toString(),
        type,
        generatedAt: new Date(),
        startDate: dateRange.from,
        endDate: dateRange.to,
        status: 'success',
        filename: result.filename,
        totalEmployees: employees.length,
        totalRecords: timeRecords.length,
      }

      setHistory(prev => [newHistoryItem, ...prev.slice(0, 9)])

    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      throw error
    } finally {
      setIsLoadingValidation(false)
    }
  }

  const handleDownload = async (type: 'afd' | 'aej', dateRange: DateRange) => {
    if (!dateRange.from || !dateRange.to) {
      throw new Error('Período inválido')
    }

    try {
      // Busca dados e gera relatório
      const { employees, timeRecords, dailyRecords, workSchedules } = await fetchEmployeesAndRecords(dateRange)

      let result
      let mimeType
      if (type === 'afd') {
        const afdData: AFDData = {
          company: MOCK_COMPANY as any,
          employees: employees as any,
          timeRecords: timeRecords as any,
          dailyRecords: dailyRecords as any,
          startDate: dateRange.from,
          endDate: dateRange.to,
        }
        result = generateAFD(afdData)
        mimeType = 'text/plain'
      } else {
        const aejData: AEJData = {
          company: MOCK_COMPANY as any,
          employees: employees as any,
          dailyRecords: dailyRecords as any,
          workSchedules: workSchedules as any,
          holidays: [],
          startDate: dateRange.from,
          endDate: dateRange.to,
        }
        result = generateAEJ(aejData)
        mimeType = 'text/plain'
      }

      // Cria blob e faz download
      const blob = new Blob([result.content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Erro ao baixar relatório:', error)
      throw error
    }
  }

  const handleDownloadFromHistory = async (item: ComplianceHistoryItem) => {
    await handleDownload(item.type, {
      from: item.startDate,
      to: item.endDate,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Relatórios de Compliance</h1>
          <p className="text-muted-foreground mt-1">
            Gere relatórios AFD e AEJ conforme legislação brasileira (Portaria 671/2021 MTE)
          </p>
        </div>
      </div>

      {/* Formulário de geração */}
      <ComplianceReportForm
        onGenerate={handleGenerate}
        onDownload={handleDownload}
      />

      {/* Validação */}
      <ComplianceValidation
        validation={validation}
        isLoading={isLoadingValidation}
      />

      {/* Histórico */}
      <ComplianceHistory
        history={history}
        onDownload={handleDownloadFromHistory}
      />
    </div>
  )
}
