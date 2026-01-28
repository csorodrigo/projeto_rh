# Enhanced Forms Guide

## Overview

This guide covers the enhanced form components with improved visual validation and user experience.

## Components

### 1. FormField Component

Enhanced input field with visual feedback states:

```tsx
import { FormField } from "@/components/ui/form-field"

<FormField
  label="Nome Completo"
  required
  placeholder="Digite seu nome"
  helperText="Mínimo de 3 caracteres"
  showCharacterCount
  maxCharacters={100}
  error={errors.name?.message}
  isValid={isValid}
  isValidating={isChecking}
/>
```

**Features:**
- ✅ Green border when valid
- ❌ Red border + shake animation on error
- ⏳ Loading spinner during async validation
- 📊 Character counter (optional)
- 💬 Helper text and error messages
- 🔴 Required field indicator (red asterisk)

### 2. MaskedInput Component

Automatic formatting and validation for common Brazilian data types:

```tsx
import { MaskedInput } from "@/components/ui/input-masked"

// CPF with validation
<MaskedInput
  maskType="cpf"
  label="CPF"
  required
  placeholder="000.000.000-00"
  value={cpf}
  onChange={setCpf}
  onValidChange={(isValid) => console.log(isValid)}
  validateOnBlur
/>

// CEP with address auto-fetch
<MaskedInput
  maskType="cep"
  label="CEP"
  value={cep}
  onChange={setCep}
  onAddressFetch={(address) => {
    setStreet(address.logradouro)
    setCity(address.cidade)
    setState(address.uf)
  }}
  validateOnBlur
/>
```

**Supported Mask Types:**
- `cpf` - Brazilian CPF (000.000.000-00)
- `cnpj` - Brazilian CNPJ (00.000.000/0000-00)
- `phone` - Phone number ((00) 00000-0000)
- `cep` - Postal code (00000-000)
- `email` - Email validation

**Features:**
- 🎭 Auto-formatting while typing
- ✅ Real-time validation
- 🌍 CEP auto-fetch (ViaCEP API)
- 📱 Phone number formatting
- 🔢 CPF/CNPJ validation

### 3. DateRangePicker Component

Enhanced date range selector with business days calculation:

```tsx
import { DateRangePicker } from "@/components/ui/date-range-picker"

<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
  label="Período de Férias"
  required
  showBusinessDays
  minDate={new Date()}
  maxDate={addMonths(new Date(), 12)}
  disabledDates={(date) => isWeekend(date)}
/>
```

**Features:**
- 📅 Dual calendar view
- 💼 Business days calculation
- ⏰ Min/max date limits
- 🚫 Disable specific dates
- 📊 Automatic day counting

### 4. ConfirmationModal Component

Modal for destructive or important actions:

```tsx
import { ConfirmationModal } from "@/components/ui/confirmation-modal"

<ConfirmationModal
  open={showModal}
  onOpenChange={setShowModal}
  onConfirm={handleDelete}
  title="Excluir funcionário"
  description="Esta ação não pode ser desfeita. Tem certeza?"
  confirmText="Sim, excluir"
  cancelText="Cancelar"
  variant="destructive"
  isLoading={isDeleting}
/>
```

**Features:**
- ⚠️ Warning icon for destructive actions
- 🔄 Loading state
- 🎨 Variant styles (default, destructive)
- ⌨️ Keyboard shortcuts (Esc to cancel)

## Validation Utilities

### validation-utils.ts

Helper functions for Brazilian data validation:

```tsx
import {
  validateCPF,
  validateCNPJ,
  validateEmail,
  validatePhone,
  validateCEP,
  formatCPF,
  formatCNPJ,
  formatPhone,
  formatCEP,
  fetchAddressByCEP,
  getBusinessDays,
} from "@/lib/validation-utils"

// Validate
const isValid = validateCPF("123.456.789-00")

// Format
const formatted = formatCPF("12345678900")

// Fetch address
const address = await fetchAddressByCEP("01310-100")

// Calculate business days
const days = getBusinessDays(startDate, endDate)
```

## Toast Utilities

### toast-utils.tsx

Enhanced toast notifications with animations:

```tsx
import {
  toastSuccess,
  toastError,
  toastInfo,
  toastWarning,
  toastLoading,
  toastPromise,
} from "@/lib/toast-utils"

// Success (with animated check icon)
toastSuccess("Salvo com sucesso!", "Dados atualizados")

// Error (with shake animation)
toastError("Erro ao salvar", "Tente novamente")

// Promise (loading → success/error)
await toastPromise(
  apiCall(),
  {
    loading: "Salvando...",
    success: "Salvo!",
    error: "Erro ao salvar",
  }
)
```

**Toast Types:**
- ✅ Success - Green with animated check
- ❌ Error - Red with shake animation
- ℹ️ Info - Blue with info icon
- ⚠️ Warning - Yellow with warning icon
- ⏳ Loading - Spinner animation
- 🎯 Promise - Auto-transitions

## Enhanced Wizard

### WizardContainerEnhanced

Improved wizard with progress tracking and validation:

```tsx
import { WizardContainerEnhanced } from "@/components/admission-wizard/wizard-container-enhanced"

<WizardContainerEnhanced
  steps={steps}
  currentStep={currentStep}
  onStepChange={setCurrentStep}
  onNext={handleNext}
  onBack={handleBack}
  onSubmit={handleSubmit}
  stepErrors={{
    0: ["CPF inválido", "Nome obrigatório"],
    2: ["CEP não encontrado"],
  }}
  completedSteps={[0, 1]}
/>
```

**Features:**
- 📊 Overall progress bar
- ✅ Step completion indicators
- ❌ Error summary per step
- 🔄 Smooth transitions
- 🚫 Block navigation with errors

## Usage Examples

### Basic Form with Validation

```tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { FormField, MaskedInput } from "@/components/ui"
import { toastSuccess, toastError } from "@/lib/toast-utils"

const schema = z.object({
  name: z.string().min(3, "Nome muito curto"),
  cpf: z.string().min(1, "CPF obrigatório"),
  email: z.string().email("E-mail inválido"),
})

export function MyForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    try {
      await saveData(data)
      toastSuccess("Salvo com sucesso!")
    } catch (error) {
      toastError("Erro ao salvar", error.message)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormField
        label="Nome"
        required
        {...form.register("name")}
        error={form.formState.errors.name?.message}
      />

      <MaskedInput
        maskType="cpf"
        label="CPF"
        required
        value={form.watch("cpf")}
        onChange={(value) => form.setValue("cpf", value)}
      />

      <MaskedInput
        maskType="email"
        label="E-mail"
        required
        value={form.watch("email")}
        onChange={(value) => form.setValue("email", value)}
      />
    </form>
  )
}
```

### Address Form with CEP Auto-fill

```tsx
export function AddressForm() {
  const [address, setAddress] = React.useState({
    street: "",
    neighborhood: "",
    city: "",
    state: "",
  })

  const handleCEPFetch = (data) => {
    setAddress({
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.cidade,
      state: data.uf,
    })
    toastSuccess("CEP encontrado!", "Endereço preenchido automaticamente")
  }

  return (
    <>
      <MaskedInput
        maskType="cep"
        label="CEP"
        onAddressFetch={handleCEPFetch}
        validateOnBlur
      />

      <Input
        label="Rua"
        value={address.street}
        onChange={(e) => setAddress({ ...address, street: e.target.value })}
      />

      <Input
        label="Bairro"
        value={address.neighborhood}
        onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
      />
    </>
  )
}
```

### Absence Request Form

```tsx
export function AbsenceForm() {
  const [dateRange, setDateRange] = React.useState({ from: undefined, to: undefined })
  const [showConfirm, setShowConfirm] = React.useState(false)

  const handleSubmit = () => {
    setShowConfirm(true)
  }

  return (
    <>
      <DateRangePicker
        value={dateRange}
        onChange={setDateRange}
        label="Período"
        required
        showBusinessDays
        minDate={new Date()}
      />

      <Button onClick={handleSubmit}>
        Enviar Solicitação
      </Button>

      <ConfirmationModal
        open={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirm={async () => {
          await submitRequest(dateRange)
          toastSuccess("Solicitação enviada!")
        }}
        title="Confirmar solicitação"
        description="Deseja enviar esta solicitação de ausência?"
      />
    </>
  )
}
```

## Animation Classes

Available animation utilities:

```css
/* Shake animation for errors */
.animate-shake

/* Fade animations */
.animate-fade-in
.animate-fade-out

/* Slide animations */
.animate-slide-up
.animate-slide-down
.animate-slide-left
.animate-slide-right

/* Scale animations */
.animate-scale-in
.animate-scale-out

/* Progress bar gradient */
.progress-gradient
```

## Best Practices

1. **Always validate on blur** for better UX
2. **Show success states** to confirm valid input
3. **Use helper text** to guide users
4. **Provide clear error messages**
5. **Auto-fill when possible** (CEP, phone formatting)
6. **Show progress** in multi-step forms
7. **Confirm destructive actions** with modals
8. **Use toast notifications** for feedback

## Demo Page

Visit `/demo-forms` to see all components in action with interactive examples.

## Migration Guide

### From old Input to FormField:

```tsx
// Before
<Input {...field} />
<FormMessage />

// After
<FormField
  {...field}
  error={fieldState.error?.message}
  isValid={!fieldState.error && field.value}
/>
```

### From old date picker to DateRangePicker:

```tsx
// Before
<Popover>
  <Calendar mode="range" selected={range} onSelect={setRange} />
</Popover>

// After
<DateRangePicker
  value={range}
  onChange={setRange}
  showBusinessDays
/>
```

## Performance Notes

- Validations are debounced on blur to avoid excessive API calls
- CEP fetch is cached for 5 minutes
- Animations use CSS transitions for better performance
- Form state is optimized with React Hook Form
