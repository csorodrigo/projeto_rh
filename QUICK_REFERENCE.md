# Enhanced Forms - Quick Reference

## Import Components

```tsx
import {
  FormField,
  MaskedInput,
  DateRangePicker,
  ConfirmationModal,
} from "@/components/ui"

import {
  toastSuccess,
  toastError,
  toastPromise,
} from "@/lib/toast-utils"

import {
  validateCPF,
  formatCPF,
  fetchAddressByCEP,
  getBusinessDays,
} from "@/lib/validation-utils"
```

## FormField - Enhanced Input

```tsx
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
  leftIcon={<User className="size-4" />}
  rightIcon={<Search className="size-4" />}
  {...field}
/>
```

## MaskedInput - Auto-formatting

```tsx
// CPF
<MaskedInput
  maskType="cpf"
  label="CPF"
  required
  value={cpf}
  onChange={setCpf}
  onValidChange={(valid) => console.log(valid)}
  validateOnBlur
/>

// Phone
<MaskedInput
  maskType="phone"
  label="Telefone"
  value={phone}
  onChange={setPhone}
  leftIcon={<Phone className="size-4" />}
/>

// CEP with auto-fetch
<MaskedInput
  maskType="cep"
  label="CEP"
  value={cep}
  onChange={setCep}
  onAddressFetch={(addr) => {
    setStreet(addr.logradouro)
    setCity(addr.cidade)
  }}
/>

// Email
<MaskedInput
  maskType="email"
  label="E-mail"
  value={email}
  onChange={setEmail}
  validateOnBlur
/>
```

## DateRangePicker

```tsx
<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
  label="Período"
  required
  showBusinessDays
  minDate={new Date()}
  maxDate={addMonths(new Date(), 12)}
  disabledDates={(date) => isWeekend(date)}
  error={errors.dateRange?.message}
/>
```

## ConfirmationModal

```tsx
const [show, setShow] = useState(false)
const [loading, setLoading] = useState(false)

<ConfirmationModal
  open={show}
  onOpenChange={setShow}
  onConfirm={async () => {
    setLoading(true)
    await deleteItem()
    setLoading(false)
  }}
  title="Excluir item"
  description="Esta ação não pode ser desfeita."
  confirmText="Sim, excluir"
  cancelText="Cancelar"
  variant="destructive"
  isLoading={loading}
/>
```

## Toast Notifications

```tsx
// Success (animated check)
toastSuccess("Salvo!", "Dados atualizados com sucesso")

// Error (shake animation)
toastError("Erro!", "Não foi possível salvar")

// Info
toastInfo("Atenção", "Verifique os campos")

// Warning
toastWarning("Cuidado", "Esta ação é irreversível")

// Promise (auto-transition)
await toastPromise(
  saveData(),
  {
    loading: "Salvando...",
    success: "Salvo com sucesso!",
    error: "Erro ao salvar",
  }
)
```

## Validation Utilities

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
const formatted = formatCPF("12345678900") // "123.456.789-00"

// Fetch address
const address = await fetchAddressByCEP("01310-100")
// { logradouro, bairro, cidade, uf }

// Business days
const days = getBusinessDays(startDate, endDate)
```

## Visual States

### Input States
```tsx
// Valid - green border + check icon
className="border-green-500 focus-visible:ring-green-500"

// Error - red border + shake
className="border-red-500 focus-visible:ring-red-500 animate-shake"

// Default
className=""
```

### Animations
```tsx
// Card entrance
<Card className="animate-in fade-in duration-300">

// Slide from top
<Alert className="animate-in slide-in-from-top-2 duration-300">

// Shake on error
<Input className="animate-shake" />

// Progress bar gradient
<div className="progress-gradient" />
```

## React Hook Form Integration

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(3),
  cpf: z.string().min(1),
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }),
})

const form = useForm({
  resolver: zodResolver(schema),
})

// In component
<FormField
  control={form.control}
  name="name"
  render={({ field, fieldState }) => (
    <FormItem>
      <FormField
        {...field}
        label="Nome"
        error={fieldState.error?.message}
        isValid={!fieldState.error && field.value}
      />
    </FormItem>
  )}
/>
```

## Common Patterns

### Full Form Example
```tsx
function MyForm() {
  const form = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    try {
      await saveData(data)
      toastSuccess("Salvo!")
    } catch (error) {
      toastError("Erro", error.message)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormField label="Nome" required {...form.register("name")} />

      <MaskedInput
        maskType="cpf"
        label="CPF"
        value={form.watch("cpf")}
        onChange={(v) => form.setValue("cpf", v)}
      />

      <DateRangePicker
        value={form.watch("dateRange")}
        onChange={(v) => form.setValue("dateRange", v)}
      />

      <Button type="submit">Enviar</Button>
    </form>
  )
}
```

### Address Form with CEP
```tsx
function AddressForm() {
  const [address, setAddress] = useState({})

  return (
    <>
      <MaskedInput
        maskType="cep"
        label="CEP"
        onAddressFetch={(data) => {
          setAddress(data)
          toastSuccess("CEP encontrado!")
        }}
      />

      <Input label="Rua" value={address.logradouro} />
      <Input label="Bairro" value={address.bairro} />
      <Input label="Cidade" value={address.cidade} />
    </>
  )
}
```

### Multi-step Form
```tsx
function Wizard() {
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState({})

  return (
    <WizardContainerEnhanced
      steps={steps}
      currentStep={step}
      onStepChange={setStep}
      stepErrors={errors}
      onNext={async () => {
        const valid = await validateStep(step)
        return valid
      }}
      onSubmit={handleSubmit}
    >
      {step === 0 && <PersonalDataStep />}
      {step === 1 && <AddressStep />}
      {step === 2 && <ReviewStep />}
    </WizardContainerEnhanced>
  )
}
```

## Styling Tips

```tsx
// Progress bar with gradient
<div className="h-2 bg-muted rounded-full overflow-hidden">
  <div
    className="h-full bg-primary transition-all duration-300 progress-gradient"
    style={{ width: `${progress}%` }}
  />
</div>

// Icon with background
<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
  <User className="size-5 text-primary" />
</div>

// Success alert
<Alert className="bg-green-50 border-green-200">
  <CheckCircle2 className="size-4 text-green-600" />
  <AlertDescription className="text-green-800">
    Sucesso!
  </AlertDescription>
</Alert>

// Error alert
<Alert className="border-red-500 bg-red-50">
  <AlertCircle className="size-4 text-red-600" />
  <AlertDescription className="text-red-800">
    Erro encontrado
  </AlertDescription>
</Alert>
```

## Performance Tips

1. **Debounce validations** - Use `validateOnBlur` instead of `onChange`
2. **Memoize calculations** - Use `useMemo` for business days
3. **Cache API results** - CEP fetch is auto-cached
4. **Optimize re-renders** - Use React Hook Form's optimization
5. **Lazy load** - Code split large forms

## Accessibility

All components include:
- ✅ ARIA labels
- ✅ ARIA descriptions
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ Screen reader support
- ✅ Error announcements

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## Demo

Visit `/demo-forms` to see all components in action!
