"use client"

import { useRouter } from 'next/navigation'
import { ReportsEmptyState } from '@/components/relatorios/empty-state'

export default function RelatorioPontoPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Registro de ponto</h1>
        <p className="text-muted-foreground">
          Relatórios de horas trabalhadas, banco de horas e frequência
        </p>
      </div>

      <ReportsEmptyState onBack={() => router.push('/relatorios')} />
    </div>
  )
}
