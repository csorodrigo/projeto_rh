/**
 * Export Button Component
 * Reusable button with CSV and PDF export options
 */

"use client"

import * as React from "react"
import { Download, FileText, Table2, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface ExportButtonProps {
  onExportCSV?: () => void | Promise<void>
  onExportPDF?: () => void | Promise<void>
  disabled?: boolean
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  label?: string
  showIcon?: boolean
  className?: string
}

export function ExportButton({
  onExportCSV,
  onExportPDF,
  disabled = false,
  variant = "outline",
  size = "default",
  label = "Exportar",
  showIcon = true,
  className,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = React.useState(false)

  const handleExport = async (type: "csv" | "pdf", handler?: () => void | Promise<void>) => {
    if (!handler || isExporting) return

    setIsExporting(true)
    const loadingToast = toast.loading(`Gerando ${type.toUpperCase()}...`)

    try {
      await handler()
      toast.success(`Relatório ${type.toUpperCase()} gerado com sucesso!`, {
        id: loadingToast,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao gerar relatório"
      toast.error(message, { id: loadingToast })
    } finally {
      setIsExporting(false)
    }
  }

  // If neither export function is provided, don't render
  if (!onExportCSV && !onExportPDF) {
    return null
  }

  // If only one export option is available, render a simple button
  if (onExportCSV && !onExportPDF) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => handleExport("csv", onExportCSV)}
        disabled={disabled || isExporting}
        className={className}
      >
        {isExporting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Gerando...
          </>
        ) : (
          <>
            {showIcon && <Table2 className="mr-2 size-4" />}
            {label} CSV
          </>
        )}
      </Button>
    )
  }

  if (onExportPDF && !onExportCSV) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => handleExport("pdf", onExportPDF)}
        disabled={disabled || isExporting}
        className={className}
      >
        {isExporting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Gerando...
          </>
        ) : (
          <>
            {showIcon && <FileText className="mr-2 size-4" />}
            {label} PDF
          </>
        )}
      </Button>
    )
  }

  // If both options are available, render a dropdown menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || isExporting}
          className={className}
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              {showIcon && <Download className="mr-2 size-4" />}
              {label}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuLabel>Formato</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {onExportCSV && (
          <DropdownMenuItem onClick={() => handleExport("csv", onExportCSV)}>
            <Table2 className="mr-2 size-4" />
            Exportar CSV
          </DropdownMenuItem>
        )}
        {onExportPDF && (
          <DropdownMenuItem onClick={() => handleExport("pdf", onExportPDF)}>
            <FileText className="mr-2 size-4" />
            Exportar PDF
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
