"use client"

import * as React from "react"
import { ArrowLeft, ArrowRight, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { WizardProgress, type WizardStep } from "./wizard-progress"
import { cn } from "@/lib/utils"

interface WizardContainerProps {
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
}

export function WizardContainer({
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
}: WizardContainerProps) {
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  const handleNext = async () => {
    const canProceed = await onNext()
    if (canProceed && !isLastStep) {
      onStepChange(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (!isFirstStep) {
      onBack()
      onStepChange(currentStep - 1)
    }
  }

  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      onStepChange(step)
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <Card>
        <CardContent className="pt-6">
          <WizardProgress
            steps={steps}
            currentStep={currentStep}
            onStepClick={handleStepClick}
          />
        </CardContent>
      </Card>

      {/* Step content */}
      <div className="min-h-[400px]">
        {children}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={isFirstStep || isSubmitting}
          className={cn(isFirstStep && "invisible")}
        >
          <ArrowLeft className="mr-2 size-4" />
          Voltar
        </Button>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Passo {currentStep + 1} de {steps.length}</span>
        </div>

        {isLastStep ? (
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || !canGoNext}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Salvar Funcionario
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting || !canGoNext}
          >
            Proximo
            <ArrowRight className="ml-2 size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
