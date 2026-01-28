"use client"

import * as React from "react"
import { ArrowLeft, ArrowRight, Loader2, Save, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { WizardProgress, type WizardStep } from "./wizard-progress"
import { cn } from "@/lib/utils"

interface WizardContainerEnhancedProps {
  steps: WizardStep[]
  currentStep: number
  onStepChange: (step: number) => void
  onNext: () => Promise<boolean> | boolean
  onBack: () => void
  onSubmit: () => Promise<void>
  isSubmitting?: boolean
  children: React.ReactNode
  canGoBack?: boolean
  canGoNext?: boolean
  stepErrors?: Record<number, string[]>
  completedSteps?: number[]
}

export function WizardContainerEnhanced({
  steps,
  currentStep,
  onStepChange,
  onNext,
  onBack,
  onSubmit,
  isSubmitting = false,
  children,
  canGoBack = true,
  canGoNext = true,
  stepErrors = {},
  completedSteps = [],
}: WizardContainerEnhancedProps) {
  const [isTransitioning, setIsTransitioning] = React.useState(false)
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1
  const currentStepErrors = stepErrors[currentStep] || []
  const hasErrors = currentStepErrors.length > 0

  const handleNext = async () => {
    setIsTransitioning(true)
    try {
      const canProceed = await onNext()
      if (canProceed && !isLastStep) {
        onStepChange(currentStep + 1)
      }
    } finally {
      setIsTransitioning(false)
    }
  }

  const handleBack = () => {
    if (!isFirstStep) {
      setIsTransitioning(true)
      onBack()
      onStepChange(currentStep - 1)
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }

  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      setIsTransitioning(true)
      onStepChange(step)
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }

  // Calculate overall progress
  const overallProgress = React.useMemo(() => {
    const completedCount = completedSteps.length
    const totalSteps = steps.length
    return Math.round((completedCount / totalSteps) * 100)
  }, [completedSteps, steps])

  return (
    <div className="space-y-6">
      {/* Overall Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso Geral</span>
              <span className="font-medium">{overallProgress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 progress-gradient"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Progress */}
      <Card>
        <CardContent className="pt-6">
          <WizardProgress
            steps={steps}
            currentStep={currentStep}
            onStepClick={handleStepClick}
          />
        </CardContent>
      </Card>

      {/* Step Errors Alert */}
      {hasErrors && (
        <Alert className="border-red-500 bg-red-50 animate-in slide-in-from-top-2 duration-300">
          <AlertCircle className="size-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Atenção:</strong> Corrija os erros abaixo antes de continuar.
            <ul className="mt-2 list-disc list-inside space-y-1">
              {currentStepErrors.map((error, idx) => (
                <li key={idx} className="text-sm">
                  {error}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Step content */}
      <div
        className={cn(
          "min-h-[400px] transition-opacity duration-300",
          isTransitioning && "opacity-50"
        )}
      >
        {children}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={isFirstStep || isSubmitting || isTransitioning}
          className={cn(isFirstStep && "invisible")}
        >
          <ArrowLeft className="mr-2 size-4" />
          Voltar
        </Button>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Passo {currentStep + 1} de {steps.length}
          </span>
          {completedSteps.includes(currentStep) && (
            <span className="text-green-600 font-medium">✓</span>
          )}
        </div>

        {isLastStep ? (
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || !canGoNext || isTransitioning}
            className="min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Salvar Funcionário
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting || !canGoNext || isTransitioning || hasErrors}
            className="min-w-[140px]"
          >
            {isTransitioning ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                Próximo
                <ArrowRight className="ml-2 size-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
