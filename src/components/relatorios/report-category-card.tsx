import { LucideIcon } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ReportCategoryCardProps {
  title: string
  description: string
  icon: LucideIcon
  iconColor: string
  iconBgColor: string
  reportCount: number
  onClick: () => void
}

export function ReportCategoryCard({
  title,
  description,
  icon: Icon,
  iconColor,
  iconBgColor,
  reportCount,
  onClick,
}: ReportCategoryCardProps) {
  return (
    <Card className="transition-all duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer" onClick={onClick}>
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className={`rounded-full ${iconBgColor} p-3`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
            <p className="text-xs text-muted-foreground mt-2">
              {reportCount} {reportCount === 1 ? 'relatório' : 'relatórios'}
            </p>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}
