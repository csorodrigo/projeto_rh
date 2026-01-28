# Migration Example: Updating Existing Forms

## Example: Migrating Absence Form

### Step 1: Import Enhanced Components

```tsx
// Before
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"

// After
import { FormField, DateRangePicker, ConfirmationModal } from "@/components/ui"
import { toastSuccess, toastError } from "@/lib/toast-utils"
```

### Step 2: Update Date Selection

```tsx
// Before
<div className="grid grid-cols-2 gap-4">
  <FormField
    control={form.control}
    name="start_date"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Data Início</FormLabel>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              {field.value ? format(field.value, "dd/MM/yyyy") : "Selecione"}
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <Calendar
              mode="single"
              selected={field.value}
              onSelect={field.onChange}
            />
          </PopoverContent>
        </Popover>
      </FormItem>
    )}
  />
  <FormField
    control={form.control}
    name="end_date"
    render={({ field }) => (
      // Same pattern for end date
    )}
  />
</div>

// After
<FormField
  control={form.control}
  name="dateRange"
  render={({ field }) => (
    <FormItem>
      <DateRangePicker
        value={field.value}
        onChange={field.onChange}
        label="Período"
        required
        showBusinessDays
        error={form.formState.errors.dateRange?.message}
        helperText="Selecione as datas de início e fim da ausência"
      />
    </FormItem>
  )}
/>
```

### Step 3: Add Validation Feedback

```tsx
// Before
<Input placeholder="Nome completo" {...field} />

// After
<Input
  placeholder="Nome completo"
  {...field}
  className={
    fieldState.error
      ? "border-red-500 focus-visible:ring-red-500 animate-shake"
      : field.value && !fieldState.error
      ? "border-green-500 focus-visible:ring-green-500"
      : ""
  }
/>
```

### Step 4: Replace Toast Notifications

```tsx
// Before
toast({
  title: "Sucesso",
  description: "Ausência criada com sucesso",
})

// After
toastSuccess("Ausência criada!", "Solicitação enviada para aprovação")
```

### Step 5: Add Confirmation Modal

```tsx
// Before
const handleSubmit = async (data) => {
  await createAbsence(data)
}

// After
const [showConfirm, setShowConfirm] = React.useState(false)
const [isSubmitting, setIsSubmitting] = React.useState(false)

const handleSubmit = async (data) => {
  setShowConfirm(true)
}

const handleConfirmSubmit = async () => {
  setIsSubmitting(true)
  try {
    await createAbsence(formData)
    toastSuccess("Ausência criada!", "Solicitação enviada")
    setShowConfirm(false)
    form.reset()
  } catch (error) {
    toastError("Erro ao criar ausência", error.message)
  } finally {
    setIsSubmitting(false)
  }
}

return (
  <>
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      {/* form fields */}
    </form>

    <ConfirmationModal
      open={showConfirm}
      onOpenChange={setShowConfirm}
      onConfirm={handleConfirmSubmit}
      title="Confirmar solicitação"
      description="Deseja enviar esta solicitação de ausência para aprovação?"
      confirmText="Sim, enviar"
      isLoading={isSubmitting}
    />
  </>
)
```

### Step 6: Add Business Days Calculation

```tsx
// Before
const totalDays = differenceInDays(endDate, startDate) + 1

// After
import { getBusinessDays } from "@/lib/validation-utils"

const businessDays = React.useMemo(() => {
  if (!dateRange?.from || !dateRange?.to) return 0
  return getBusinessDays(dateRange.from, dateRange.to)
}, [dateRange])
```

## Example: Migrating Admission Wizard Step

### Step 1: Add Icons and Visual Indicators

```tsx
// Before
<CardHeader>
  <CardTitle>Dados Pessoais</CardTitle>
</CardHeader>

// After
import { User } from "lucide-react"

<CardHeader>
  <div className="flex items-center gap-3">
    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
      <User className="size-5 text-primary" />
    </div>
    <div>
      <CardTitle>Dados Pessoais</CardTitle>
      <CardDescription>Informações pessoais do funcionário</CardDescription>
    </div>
  </div>
</CardHeader>
```

### Step 2: Replace CPF Input with MaskedInput

```tsx
// Before
<FormField
  control={form.control}
  name="cpf"
  render={({ field }) => (
    <FormItem>
      <FormLabel>CPF</FormLabel>
      <FormControl>
        <Input
          placeholder="000.000.000-00"
          {...field}
          onChange={(e) => {
            const formatted = formatCPF(e.target.value)
            field.onChange(formatted)
          }}
          maxLength={14}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

// After
<FormField
  control={form.control}
  name="cpf"
  render={({ field }) => (
    <FormItem>
      <FormControl>
        <MaskedInput
          maskType="cpf"
          value={field.value}
          onChange={field.onChange}
          label="CPF"
          required
          placeholder="000.000.000-00"
          validateOnBlur
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Step 3: Add Progress Indicator

```tsx
// Add at the end of the card
<div className="mt-6 pt-4 border-t">
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">Progresso do formulário</span>
    <span className="font-medium">
      {Object.values(form.watch()).filter(Boolean).length} /
      {Object.keys(form.watch()).length} campos preenchidos
    </span>
  </div>
  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
    <div
      className="h-full bg-primary transition-all duration-300 progress-gradient"
      style={{
        width: `${
          (Object.values(form.watch()).filter(Boolean).length /
            Object.keys(form.watch()).length) * 100
        }%`,
      }}
    />
  </div>
</div>
```

### Step 4: Add Fade-in Animation

```tsx
// Before
<Card>

// After
<Card className="animate-in fade-in duration-300">
```

## Example: Migrating Address Step

### Complete Migration

```tsx
// Before
<FormField
  control={form.control}
  name="address.zipCode"
  render={({ field }) => (
    <FormItem>
      <FormLabel>CEP</FormLabel>
      <FormControl>
        <Input
          placeholder="00000-000"
          {...field}
          onChange={(e) => {
            const formatted = formatCEP(e.target.value)
            field.onChange(formatted)
          }}
          maxLength={9}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

// After
const [cepFetched, setCepFetched] = React.useState(false)

const handleAddressFetch = (address) => {
  form.setValue("address.street", address.logradouro)
  form.setValue("address.neighborhood", address.bairro)
  form.setValue("address.city", address.cidade)
  form.setValue("address.state", address.uf)

  setCepFetched(true)
  toastSuccess("CEP encontrado!", "Endereço preenchido automaticamente")

  setTimeout(() => setCepFetched(false), 3000)
}

<FormField
  control={form.control}
  name="address.zipCode"
  render={({ field }) => (
    <FormItem>
      <FormControl>
        <MaskedInput
          maskType="cep"
          value={field.value}
          onChange={field.onChange}
          onAddressFetch={handleAddressFetch}
          label="CEP"
          placeholder="00000-000"
          validateOnBlur
          helperText="O endereço será preenchido automaticamente"
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

{cepFetched && (
  <Alert className="bg-green-50 border-green-200 animate-in slide-in-from-top-2">
    <CheckCircle2 className="size-4 text-green-600" />
    <AlertDescription className="text-green-800">
      Endereço preenchido automaticamente a partir do CEP
    </AlertDescription>
  </Alert>
)}
```

## Checklist for Migration

- [ ] Replace manual formatting with MaskedInput
- [ ] Add visual validation states (green/red borders)
- [ ] Replace dual date pickers with DateRangePicker
- [ ] Add business days calculation where needed
- [ ] Replace toast() with enhanced toast utilities
- [ ] Add ConfirmationModal for destructive actions
- [ ] Add progress indicators for multi-step forms
- [ ] Add fade-in animations for cards
- [ ] Add helper text and required indicators
- [ ] Add CEP auto-fetch for address forms
- [ ] Add character counters for text areas
- [ ] Test error animations (shake on invalid)
- [ ] Test success animations (check icon)
- [ ] Ensure accessibility (ARIA labels, keyboard nav)

## Testing the Migration

1. Test all validation scenarios:
   - Valid input → green border + check icon
   - Invalid input → red border + shake + error message
   - Empty required field → error on blur
   - CEP → address auto-fill

2. Test animations:
   - Shake on error
   - Fade in on mount
   - Progress bar smooth transition
   - Toast slide-in

3. Test user flows:
   - Complete form from start to finish
   - Navigate back/forward in wizard
   - Submit with validation errors
   - Submit successfully

4. Test edge cases:
   - Very long text in character-limited fields
   - Invalid date ranges
   - Network error on CEP fetch
   - Rapid typing in masked inputs
