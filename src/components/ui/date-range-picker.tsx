"use client"

import * as React from "react"
import { format, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon, Info } from "lucide-react"
import type { DateRange as DayPickerDateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getBusinessDays } from "@/lib/validation-utils"

export type DateRange = DayPickerDateRange

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange) => void
  label?: string
  required?: boolean
  error?: string
  helperText?: string
  disabled?: boolean
  disabledDates?: (date: Date) => boolean
  showBusinessDays?: boolean
  minDate?: Date
  maxDate?: Date
}

export function DateRangePicker({
  value,
  onChange,
  label,
  required = false,
  error,
  helperText,
  disabled = false,
  disabledDates,
  showBusinessDays = false,
  minDate,
  maxDate,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const totalDays = React.useMemo(() => {
    if (!value?.from || !value?.to) return 0
    return differenceInDays(value.to, value.from) + 1
  }, [value])

  const businessDays = React.useMemo(() => {
    if (!value?.from || !value?.to || !showBusinessDays) return 0
    return getBusinessDays(value.from, value.to)
  }, [value, showBusinessDays])

  const handleSelect = (range: DateRange | undefined) => {
    onChange?.(range || { from: undefined, to: undefined })
  }

  const isDateDisabled = React.useCallback(
    (date: Date) => {
      if (disabledDates?.(date)) return true
      if (minDate && date < minDate) return true
      if (maxDate && date > maxDate) return true
      return false
    },
    [disabledDates, minDate, maxDate]
  )

  return (
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <Label className="flex items-center gap-1">
          {label}
          {required && <span className="text-red-500 text-sm">*</span>}
        </Label>
      )}

      {/* Date Range Button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value?.from && "text-muted-foreground",
              error && "border-red-500 focus-visible:ring-red-500"
            )}
          >
            <CalendarIcon className="mr-2 size-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                  {format(value.to, "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : (
                format(value.from, "dd/MM/yyyy", { locale: ptBR })
              )
            ) : (
              <span>Selecione o período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={handleSelect}
            numberOfMonths={2}
            disabled={isDateDisabled}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>

      {/* Days Summary */}
      {totalDays > 0 && (
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="size-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            <div className="flex items-center gap-4">
              <span>
                <strong>Total:</strong> {totalDays} dia(s)
              </span>
              {showBusinessDays && businessDays > 0 && (
                <>
                  <span className="text-blue-300">•</span>
                  <span>
                    <strong>Dias úteis:</strong> {businessDays}
                  </span>
                </>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-500 flex items-start gap-1.5 animate-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}

      {/* Helper Text */}
      {!error && helperText && (
        <p className="text-sm text-muted-foreground flex items-start gap-1.5">
          <Info className="size-4 mt-0.5 shrink-0" />
          <span>{helperText}</span>
        </p>
      )}
    </div>
  )
}
