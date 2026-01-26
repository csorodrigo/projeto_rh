"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface WizardStep {
  id: string
  title: string
  description?: string
}

interface WizardProgressProps {
  steps: WizardStep[]
  currentStep: number
  onStepClick?: (step: number) => void
}

export function WizardProgress({ steps, currentStep, onStepClick }: WizardProgressProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol role="list" className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isClickable = onStepClick && index < currentStep

          return (
            <li
              key={step.id}
              className={cn(
                "relative flex-1",
                index !== steps.length - 1 && "pr-8 sm:pr-20"
              )}
            >
              {/* Connector line */}
              {index !== steps.length - 1 && (
                <div
                  className="absolute top-4 left-0 -right-8 sm:-right-20 h-0.5 w-full"
                  aria-hidden="true"
                >
                  <div
                    className={cn(
                      "h-full w-full transition-colors duration-200",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )}
                  />
                </div>
              )}

              {/* Step indicator */}
              <div className="relative flex flex-col items-center group">
                <button
                  type="button"
                  onClick={() => isClickable && onStepClick(index)}
                  disabled={!isClickable}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border-2 transition-all duration-200",
                    isCompleted && "border-primary bg-primary text-primary-foreground",
                    isCurrent && "border-primary bg-background",
                    !isCompleted && !isCurrent && "border-muted bg-background",
                    isClickable && "cursor-pointer hover:scale-110"
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-4" />
                  ) : (
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isCurrent ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {index + 1}
                    </span>
                  )}
                </button>

                {/* Step label */}
                <div className="mt-2 text-center">
                  <span
                    className={cn(
                      "text-xs font-medium transition-colors",
                      isCurrent ? "text-primary" : "text-muted-foreground",
                      isCompleted && "text-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
