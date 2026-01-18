/**
 * Checkout Progress Component
 * 
 * Visual stepper showing checkout progress through steps:
 * Preferences → Address → Payment
 */

"use client";

import { Settings, MapPin, CreditCard, Check } from "lucide-react";
import type { CheckoutStepId, StepConfig } from "@/types/subscription-checkout";

// ─────────────────────────────────────────────────────────────────────────────
// Step Configuration
// ─────────────────────────────────────────────────────────────────────────────

const STEPS: StepConfig[] = [
  { id: "preferences", label: "Preferências", icon: Settings },
  { id: "address", label: "Endereço", icon: MapPin },
  { id: "payment", label: "Pagamento", icon: CreditCard },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function isStepPast(stepId: CheckoutStepId, currentStep: CheckoutStepId): boolean {
  const stepOrder: CheckoutStepId[] = ["preferences", "address", "payment"];
  const stepIndex = stepOrder.indexOf(stepId);
  const currentIndex = stepOrder.indexOf(currentStep);

  // If current step is not in the main flow (pix_waiting, processing, success, error), 
  // all main steps are "past" (user completed them)
  if (currentIndex === -1) {
    return stepOrder.includes(stepId);
  }

  return stepIndex < currentIndex;
}

function isStepActive(stepId: CheckoutStepId, currentStep: CheckoutStepId): boolean {
  // pix_waiting is part of payment step visually
  if (currentStep === "pix_waiting" && stepId === "payment") {
    return true;
  }
  return stepId === currentStep;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface CheckoutProgressProps {
  currentStep: CheckoutStepId;
}

export function CheckoutProgress({ currentStep }: CheckoutProgressProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isActive = isStepActive(step.id, currentStep);
          const isPast = isStepPast(step.id, currentStep);
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-center">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isPast
                    ? "bg-primary-green text-white"
                    : isActive
                      ? "bg-primary-green/10 text-primary-green border-2 border-primary-green"
                      : "bg-gray-100 text-gray-400"
                    }`}
                >
                  {isPast ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={`text-xs mt-1 ${isActive ? "text-primary-green font-medium" : "text-gray-500"
                    }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line (except for last step) */}
              {index < STEPS.length - 1 && (
                <div
                  className={`w-16 md:w-24 h-1 mx-2 rounded ${isPast ? "bg-primary-green" : "bg-gray-200"
                    }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
