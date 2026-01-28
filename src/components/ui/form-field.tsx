"use client"

import * as React from "react"
import {
  AlertCircle,
  Check,
  Loader2,
  Info
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export interface FormFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  isValid?: boolean
  isValidating?: boolean
  showCharacterCount?: boolean
  maxCharacters?: number
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      error,
      helperText,
      required = false,
      isValid = false,
      isValidating = false,
      showCharacterCount = false,
      maxCharacters,
      leftIcon,
      rightIcon,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId()
    const currentLength = (props.value?.toString() || "").length

    const hasError = !!error
    const showSuccess = isValid && !hasError && !isValidating && props.value

    return (
      <div className="space-y-2">
        {/* Label */}
        {label && (
          <Label htmlFor={inputId} className="flex items-center gap-1">
            {label}
            {required && <span className="text-red-500 text-sm">*</span>}
          </Label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <Input
            ref={ref}
            id={inputId}
            className={cn(
              "transition-all duration-200",
              leftIcon && "pl-10",
              (rightIcon || isValidating || showSuccess || hasError) && "pr-10",
              hasError && "border-red-500 focus-visible:ring-red-500 animate-shake",
              showSuccess && "border-green-500 focus-visible:ring-green-500",
              className
            )}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />

          {/* Right Icons/Status */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {isValidating && (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            )}
            {showSuccess && !isValidating && (
              <Check className="size-4 text-green-500 animate-in fade-in duration-200" />
            )}
            {hasError && !isValidating && (
              <AlertCircle className="size-4 text-red-500 animate-in fade-in duration-200" />
            )}
            {rightIcon && !isValidating && !showSuccess && !hasError && (
              <div className="text-muted-foreground">{rightIcon}</div>
            )}
          </div>
        </div>

        {/* Helper Text / Error Message / Character Count */}
        <div className="flex items-start justify-between gap-2 min-h-[20px]">
          <div className="flex-1">
            {/* Error Message */}
            {hasError && (
              <p
                id={`${inputId}-error`}
                className="text-sm text-red-500 flex items-start gap-1.5 animate-in slide-in-from-top-1 duration-200"
              >
                <AlertCircle className="size-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}

            {/* Helper Text */}
            {!hasError && helperText && (
              <p
                id={`${inputId}-helper`}
                className="text-sm text-muted-foreground flex items-start gap-1.5"
              >
                <Info className="size-4 mt-0.5 shrink-0" />
                <span>{helperText}</span>
              </p>
            )}
          </div>

          {/* Character Count */}
          {showCharacterCount && maxCharacters && (
            <p
              className={cn(
                "text-xs text-muted-foreground shrink-0",
                currentLength > maxCharacters && "text-red-500 font-medium"
              )}
            >
              {currentLength}/{maxCharacters}
            </p>
          )}
        </div>
      </div>
    )
  }
)

FormField.displayName = "FormField"
