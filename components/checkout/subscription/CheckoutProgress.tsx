/**
 * Checkout Progress Component (Refatorado)
 * 
 * Visual stepper showing checkout progress through steps:
 * Preferences → Address → Payment
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * MELHORIAS DE UX:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * - SEM linhas conectoras (layout mais limpo e estável)
 * - Responsividade extrema (mobile-first)
 * - Sem "pulos" de layout entre etapas
 * - Labels adaptáveis em mobile
 */

"use client";

import { Settings, MapPin, CreditCard, Check } from "lucide-react";
import type { CheckoutStepId, StepConfig } from "@/types/subscription-checkout";

// ─────────────────────────────────────────────────────────────────────────────
// Step Configuration
// ─────────────────────────────────────────────────────────────────────────────

const STEPS: StepConfig[] = [
  { id: "preferences", label: "Preferências", shortLabel: "Pref.", icon: Settings },
  { id: "address", label: "Endereço", shortLabel: "End.", icon: MapPin },
  { id: "payment", label: "Pagamento", shortLabel: "Pagar", icon: CreditCard },
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
    <nav
      aria-label="Progresso do checkout"
      className="bg-white dark:bg-gray-900 rounded-xl shadow-sm"
    >
      {/* 
        Layout sem linhas conectoras:
        - justify-between garante espaçamento uniforme
        - Sem elementos visuais que possam causar overflow
        - Padding responsivo
      */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        {STEPS.map((step) => {
          const isActive = isStepActive(step.id, currentStep);
          const isPast = isStepPast(step.id, currentStep);
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
                ) : (
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
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
                {/* Label curto em mobile, completo em desktop */}
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
