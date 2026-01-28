"use client"

import * as React from "react"
import { FormField, type FormFieldProps } from "./form-field"
import {
  formatCPF,
  formatCNPJ,
  formatPhone,
  formatCEP,
  validateCPF,
  validateCNPJ,
  validateEmail,
  validatePhone,
  validateCEP,
  fetchAddressByCEP,
} from "@/lib/validation-utils"

type MaskType = "cpf" | "cnpj" | "phone" | "cep" | "email"

interface MaskedInputProps extends Omit<FormFieldProps, "onChange" | "value"> {
  maskType: MaskType
  value?: string
  onChange?: (value: string) => void
  onValidChange?: (isValid: boolean) => void
  onAddressFetch?: (address: {
    logradouro: string
    bairro: string
    cidade: string
    uf: string
  }) => void
  validateOnBlur?: boolean
}

export const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  (
    {
      maskType,
      value = "",
      onChange,
      onValidChange,
      onAddressFetch,
      validateOnBlur = true,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = React.useState(value)
    const [isValid, setIsValid] = React.useState(false)
    const [isValidating, setIsValidating] = React.useState(false)
    const [error, setError] = React.useState<string>()
    const [hasBlurred, setHasBlurred] = React.useState(false)

    // Format function based on mask type
    const formatValue = React.useCallback(
      (rawValue: string): string => {
        switch (maskType) {
          case "cpf":
            return formatCPF(rawValue)
          case "cnpj":
            return formatCNPJ(rawValue)
          case "phone":
            return formatPhone(rawValue)
          case "cep":
            return formatCEP(rawValue)
          case "email":
            return rawValue
          default:
            return rawValue
        }
      },
      [maskType]
    )

    // Validate function based on mask type
    const validateValue = React.useCallback(
      (rawValue: string): boolean => {
        if (!rawValue) return false

        switch (maskType) {
          case "cpf":
            return validateCPF(rawValue)
          case "cnpj":
            return validateCNPJ(rawValue)
          case "phone":
            return validatePhone(rawValue)
          case "cep":
            return validateCEP(rawValue)
          case "email":
            return validateEmail(rawValue)
          default:
            return false
        }
      },
      [maskType]
    )

    // Get error message based on mask type
    const getErrorMessage = React.useCallback(
      (rawValue: string): string | undefined => {
        if (!rawValue) return undefined

        switch (maskType) {
          case "cpf":
            return validateCPF(rawValue) ? undefined : "CPF inválido"
          case "cnpj":
            return validateCNPJ(rawValue) ? undefined : "CNPJ inválido"
          case "phone":
            return validatePhone(rawValue) ? undefined : "Telefone inválido"
          case "cep":
            return validateCEP(rawValue) ? undefined : "CEP inválido"
          case "email":
            return validateEmail(rawValue) ? undefined : "E-mail inválido"
          default:
            return undefined
        }
      },
      [maskType]
    )

    // Handle CEP address fetch
    const handleCEPFetch = React.useCallback(
      async (cepValue: string) => {
        if (maskType !== "cep" || !onAddressFetch) return

        const cleanCEP = cepValue.replace(/[^\d]/g, "")
        if (cleanCEP.length !== 8) return

        setIsValidating(true)
        try {
          const address = await fetchAddressByCEP(cepValue)
          if (address && !address.erro) {
            onAddressFetch(address)
            setIsValid(true)
            setError(undefined)
          } else {
            setError("CEP não encontrado")
            setIsValid(false)
          }
        } catch (err) {
          setError("Erro ao buscar CEP")
          setIsValid(false)
        } finally {
          setIsValidating(false)
        }
      },
      [maskType, onAddressFetch]
    )

    // Handle input change
    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value
        const formatted = formatValue(rawValue)

        setDisplayValue(formatted)
        onChange?.(formatted)

        // Real-time validation for email
        if (maskType === "email" && hasBlurred) {
          const valid = validateValue(rawValue)
          setIsValid(valid)
          setError(getErrorMessage(rawValue))
          onValidChange?.(valid)
        }
      },
      [formatValue, onChange, maskType, hasBlurred, validateValue, getErrorMessage, onValidChange]
    )

    // Handle blur validation
    const handleBlur = React.useCallback(
      async (e: React.FocusEvent<HTMLInputElement>) => {
        setHasBlurred(true)

        if (!validateOnBlur) return

        const rawValue = e.target.value
        const valid = validateValue(rawValue)

        setIsValid(valid)
        setError(getErrorMessage(rawValue))
        onValidChange?.(valid)

        // Fetch address for CEP
        if (valid && maskType === "cep") {
          await handleCEPFetch(rawValue)
        }

        props.onBlur?.(e)
      },
      [validateOnBlur, validateValue, getErrorMessage, onValidChange, maskType, handleCEPFetch, props]
    )

    // Update display value when external value changes
    React.useEffect(() => {
      setDisplayValue(formatValue(value))
    }, [value, formatValue])

    return (
      <FormField
        ref={ref}
        {...props}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        error={hasBlurred ? error : undefined}
        isValid={isValid}
        isValidating={isValidating}
      />
    )
  }
)

MaskedInput.displayName = "MaskedInput"
