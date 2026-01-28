"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import type { DateRange } from "react-day-picker"

interface ReportGeneratorDialogProps {
  reportType: "aej" | "afd" | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const REPORT_CONFIG = {
  aej: {
    title: "Gerar Relatório AEJ",
    description: "Registro Eletrônico de Jornada (AFD - Arquivo Fonte de Dados)",
    apiEndpoint: "/api/reports/aej",
    filename: "aej",
  },
  afd: {
    title: "Gerar Relatório AFD",
    description: "Arquivo Fonte de Dados do Sistema de Ponto Eletrônico",
    apiEndpoint: "/api/reports/afd",
    filename: "afd",
  },
}

export function ReportGeneratorDialog({
  reportType,
  open,
  onOpenChange,
}: ReportGeneratorDialogProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [isGenerating, setIsGenerating] = useState(false)

  const config = reportType ? REPORT_CONFIG[reportType] : null

  const handleGenerate = async () => {
    if (!config || !dateRange?.from || !dateRange?.to) {
      toast.error("Selecione um período válido")
      return
    }

    setIsGenerating(true)

    try {
      const params = new URLSearchParams({
        startDate: format(dateRange.from, "yyyy-MM-dd"),
        endDate: format(dateRange.to, "yyyy-MM-dd"),
      })

      const response = await fetch(`${config.apiEndpoint}?${params}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao gerar relatório")
      }

      // Criar blob e fazer download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${config.filename}_${format(dateRange.from, "yyyy-MM-dd")}_${format(dateRange.to, "yyyy-MM-dd")}.txt`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Relatório gerado com sucesso!")
      onOpenChange(false)
      setDateRange(undefined)
    } catch (error) {
      console.error("Erro ao gerar relatório:", error)
      toast.error(error instanceof Error ? error.message : "Erro ao gerar relatório")
    } finally {
      setIsGenerating(false)
    }
  }

  if (!config) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Período</Label>
            <DateRangePicker
              date={dateRange}
              onDateChange={setDateRange}
              placeholder="Selecione o período"
              locale={ptBR}
            />
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p>
              Este relatório está em conformidade com a Portaria 671 do MTE e contém
              os registros de ponto eletrônico no formato exigido pela legislação.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              setDateRange(undefined)
            }}
            disabled={isGenerating}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!dateRange?.from || !dateRange?.to || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="mr-2 size-4" />
                Gerar Relatório
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
