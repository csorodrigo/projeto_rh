import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Relatórios de Compliance | RH-RICKGAY',
  description: 'Gere relatórios AFD e AEJ conforme legislação brasileira',
}

export default function ComplianceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
