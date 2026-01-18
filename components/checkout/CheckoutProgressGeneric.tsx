/**
 * Generic Checkout Progress Component
 * 
 * Visual stepper showing checkout progress through custom steps.
 * Can be used by both subscription and product checkout.
 */

"use client";

import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ProgressStep {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface CheckoutProgressGenericProps {
  steps: ProgressStep[];
  currentStep: string;
  /** Special step IDs that should visually show as another step (e.g., pix_waiting → payment) */
  stepAliases?: Record<string, string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function CheckoutProgressGeneric({
  steps,
  currentStep,
  stepAliases = {}
}: CheckoutProgressGenericProps) {
  // Resolve current step via alias if needed
  const resolvedCurrentStep = stepAliases[currentStep] || currentStep;

  // Get current step index
  const currentIndex = steps.findIndex(s => s.id === resolvedCurrentStep);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = step.id === resolvedCurrentStep;
          const isPast = index < currentIndex;
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
                  ) : Icon ? (
                    <Icon className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
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
              {index < steps.length - 1 && (
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
