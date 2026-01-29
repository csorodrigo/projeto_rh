"use client"

import { useRouter } from 'next/navigation'
import { ReportsEmptyState } from '@/components/relatorios/empty-state'

export default function RelatorioDadosPessoaisPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dados pessoais</h1>
        <p className="text-muted-foreground">
          Relatórios de aniversariantes, documentos e informações cadastrais
        </p>
      </div>

      <ReportsEmptyState onBack={() => router.push('/relatorios')} />
    </div>
  )
}
