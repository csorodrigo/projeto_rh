"use client"

import { useRouter } from 'next/navigation'
import { ReportsEmptyState } from '@/components/relatorios/empty-state'

export default function RelatorioAusenciasPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Férias e ausências</h1>
        <p className="text-muted-foreground">
          Relatórios de férias, atestados e faltas
        </p>
      </div>

      <ReportsEmptyState onBack={() => router.push('/relatorios')} />
    </div>
  )
}
