/**
 * Generic Checkout Progress Component (Refatorado)
 * 
 * Visual stepper showing checkout progress through custom steps.
 * Can be used by both subscription and product checkout.
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * MELHORIAS DE UX:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * - SEM linhas conectoras (layout mais limpo e estável)
 * - Responsividade extrema (mobile-first)
 * - Sem "pulos" de layout entre etapas
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
  shortLabel?: string;
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
    <nav
      aria-label="Progresso do checkout"
      className="bg-white dark:bg-gray-900 rounded-xl shadow-sm"
    >
      {/* Layout sem linhas conectoras, com justify-between */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        {steps.map((step, index) => {
          const isActive = step.id === resolvedCurrentStep;
          const isPast = index < currentIndex;
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center gap-1.5 min-w-0"
              aria-current={isActive ? "step" : undefined}
            >
              {/* Step Circle */}
              <div
                className={`
                  w-9 h-9 sm:w-10 sm:h-10 
                  rounded-full flex items-center justify-center 
                  transition-all duration-200 flex-shrink-0
                  ${isPast
                    ? "bg-primary-green text-white"
                    : isActive
                      ? "bg-primary-green/10 text-primary-green ring-2 ring-primary-green ring-offset-1 ring-offset-card-bg"
                      : "bg-gray-bg text-gray-muted"
                  }
                `}
              >
                {isPast ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                ) : Icon ? (
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>

              {/* Step Label - Responsivo */}
              <span
                className={`
                  text-[10px] sm:text-xs font-medium text-center
                  truncate max-w-[60px] sm:max-w-none
                  ${isActive
                    ? "text-primary-green"
                    : isPast
                      ? "text-text-primary"
                      : "text-text-secondary"
                  }
                `}
              >
                <span className="sm:hidden">{step.shortLabel || step.label}</span>
                <span className="hidden sm:inline">{step.label}</span>
              </span>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
