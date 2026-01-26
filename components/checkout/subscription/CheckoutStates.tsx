/**
 * Checkout State Components
 * 
 * Components for terminal states: Processing, Success, Error
 */

"use client";

import { useRouter } from "next/navigation";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { ClearCartOnMount } from "../ClearCartOnMount";

// ─────────────────────────────────────────────────────────────────────────────
// Processing State
// ─────────────────────────────────────────────────────────────────────────────

interface ProcessingStateProps {
  message?: string;
}

export function ProcessingState({ message = "Processando pagamento..." }: ProcessingStateProps) {
  return (
    <div className="bg-surface rounded-2xl shadow-sm p-8 text-center">
      <Loader2 className="w-12 h-12 text-primary-green animate-spin mx-auto mb-4" />
      <h1 className="text-xl font-bold text-default mb-2">{message}</h1>
      <p className="text-muted">
        Aguarde enquanto processamos sua assinatura.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Success State
// ─────────────────────────────────────────────────────────────────────────────

interface BenefitData {
  name: string;
  slug?: string;
}

interface SuccessStateProps {
  planName: string;
  benefits: (string | BenefitData)[];
}

export function SuccessState({ planName, benefits }: SuccessStateProps) {
  const router = useRouter();

  // Helper to get benefit text
  const getBenefitText = (benefit: string | BenefitData) =>
    typeof benefit === 'string' ? benefit : benefit.name;

  return (
    <div className="bg-surface rounded-2xl shadow-sm p-8 text-center">
      {/* Limpa o carrinho automaticamente após assinatura bem-sucedida */}
      <ClearCartOnMount />
      <div className="w-16 h-16 bg-green-bg rounded-full flex items-center justify-center mx-auto mb-4">
        <Check className="w-8 h-8 text-primary-green" />
      </div>
      <h1 className="text-2xl font-bold text-default mb-2">
        Assinatura realizada com sucesso! 🎉
      </h1>
      <p className="text-muted mb-6">
        Bem-vindo ao plano <strong>{planName}</strong>!
        Agora você tem acesso a todos os benefícios exclusivos.
      </p>
      <div className="bg-green-bg rounded-xl p-4 mb-6 text-left max-w-md mx-auto">
        <h3 className="font-semibold text-default mb-2">Seus benefícios:</h3>
        <ul className="space-y-1">
          {benefits.slice(0, 4).map((benefit, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-muted">
              <Check className="w-4 h-4 text-primary-green flex-shrink-0" />
              {getBenefitText(benefit)}
            </li>
          ))}
        </ul>
      </div>
      <button
        onClick={() => router.push("/subscriptions")}
        className="px-6 py-3 bg-primary-green text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
      >
        Ver minha assinatura
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Error State (Subscription Already Active)
// ─────────────────────────────────────────────────────────────────────────────

interface SubscriptionErrorStateProps {
  // No props needed, static content
}

export function SubscriptionErrorState({ }: SubscriptionErrorStateProps) {
  const router = useRouter();

  return (
    <div className="bg-surface rounded-2xl shadow-sm p-8 text-center">
      <div className="w-16 h-16 bg-yellow-bg rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8 text-yellow-text" />
      </div>
      <h1 className="text-2xl font-bold text-default mb-2">
        Você já possui uma assinatura
      </h1>
      <p className="text-muted mb-6">
        Cancele sua assinatura atual antes de assinar outro plano.
      </p>
      <div className="flex gap-4 justify-center">
        <button
          onClick={() => router.push("/subscriptions")}
          className="px-6 py-3 bg-gray-bg text-text-primary rounded-lg font-medium hover:bg-hover-bg transition-colors"
        >
          Ver minha assinatura
        </button>
        <button
          onClick={() => router.push("/subscriptions")}
          className="px-6 py-3 bg-primary-green text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
        >
          Ver outros planos
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic Error State
// ─────────────────────────────────────────────────────────────────────────────

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="bg-red-bg border border-red-border rounded-xl p-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-red-text flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-red-text font-medium">Erro ao processar</p>
        <p className="text-red-text/80 text-sm">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-red-text text-sm font-medium hover:underline mt-2"
          >
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  );
}
