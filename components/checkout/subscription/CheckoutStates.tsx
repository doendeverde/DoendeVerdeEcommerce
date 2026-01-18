/**
 * Checkout State Components
 * 
 * Components for terminal states: Processing, Success, Error
 */

"use client";

import { useRouter } from "next/navigation";
import { Loader2, Check, AlertCircle } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Processing State
// ─────────────────────────────────────────────────────────────────────────────

interface ProcessingStateProps {
  message?: string;
}

export function ProcessingState({ message = "Processando pagamento..." }: ProcessingStateProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
      <Loader2 className="w-12 h-12 text-primary-green animate-spin mx-auto mb-4" />
      <h1 className="text-xl font-bold text-gray-900 mb-2">{message}</h1>
      <p className="text-gray-600">
        Aguarde enquanto processamos sua assinatura.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Success State
// ─────────────────────────────────────────────────────────────────────────────

interface SuccessStateProps {
  planName: string;
  benefits: string[];
}

export function SuccessState({ planName, benefits }: SuccessStateProps) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Check className="w-8 h-8 text-primary-green" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Assinatura realizada com sucesso! 🎉
      </h1>
      <p className="text-gray-600 mb-6">
        Bem-vindo ao plano <strong>{planName}</strong>!
        Agora você tem acesso a todos os benefícios exclusivos.
      </p>
      <div className="bg-green-50 rounded-xl p-4 mb-6 text-left max-w-md mx-auto">
        <h3 className="font-semibold text-gray-900 mb-2">Seus benefícios:</h3>
        <ul className="space-y-1">
          {benefits.slice(0, 4).map((benefit, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
              <Check className="w-4 h-4 text-primary-green flex-shrink-0" />
              {benefit}
            </li>
          ))}
        </ul>
      </div>
      <button
        onClick={() => router.push("/dashboard")}
        className="px-6 py-3 bg-primary-green text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
      >
        Ir para o Dashboard
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
    <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8 text-yellow-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Você já possui uma assinatura
      </h1>
      <p className="text-gray-600 mb-6">
        Cancele sua assinatura atual antes de assinar outro plano.
      </p>
      <div className="flex gap-4 justify-center">
        <button
          onClick={() => router.push("/subscriptions")}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
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
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-red-800 font-medium">Erro ao processar</p>
        <p className="text-red-600 text-sm">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-red-700 text-sm font-medium hover:underline mt-2"
          >
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  );
}
