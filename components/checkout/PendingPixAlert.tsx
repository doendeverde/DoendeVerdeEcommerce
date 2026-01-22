/**
 * Pending PIX Alert Component
 * 
 * Alerta que aparece quando o usuário tem um PIX pendente.
 * Permite continuar o pagamento sem perder o QR Code gerado.
 */

"use client";

import { useState } from "react";
import { AlertCircle, Clock, X, ArrowRight, QrCode } from "lucide-react";

interface PendingPixAlertProps {
  /** Valor do pagamento */
  amount: number;
  /** Segundos restantes */
  remainingSeconds: number;
  /** Nome do plano (se for assinatura) */
  planName?: string;
  /** Callback para continuar com o PIX pendente */
  onContinue: () => void;
  /** Callback para descartar e gerar novo */
  onDismiss: () => void;
}

export function PendingPixAlert({
  amount,
  remainingSeconds,
  planName,
  onContinue,
  onDismiss,
}: PendingPixAlertProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Formata tempo restante
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Formata valor
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);

  if (!isExpanded) {
    // Versão minimizada
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-4 right-4 z-50 bg-amber-500 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 hover:bg-amber-600 transition-colors animate-pulse"
      >
        <QrCode className="w-5 h-5" />
        <span className="font-medium">PIX pendente</span>
      </button>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 relative">
      {/* Botão de fechar/minimizar */}
      <button
        onClick={() => setIsExpanded(false)}
        className="absolute top-3 right-3 text-amber-600 hover:text-amber-800 transition-colors"
        aria-label="Minimizar"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-amber-600" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-amber-900 pr-8">
            Você tem um PIX pendente
          </h3>

          <p className="text-sm text-amber-700 mt-1">
            {planName ? (
              <>Pagamento de <strong>{formattedAmount}</strong> para o plano <strong>{planName}</strong></>
            ) : (
              <>Pagamento de <strong>{formattedAmount}</strong> aguardando confirmação</>
            )}
          </p>

          {/* Timer */}
          <div className="flex items-center gap-1.5 mt-2 text-amber-800">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              Expira em {formatTime(remainingSeconds)}
            </span>
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <button
              onClick={onContinue}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
            >
              <QrCode className="w-4 h-4" />
              Ver QR Code
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onDismiss}
              className="px-4 py-2 text-amber-700 hover:text-amber-900 font-medium transition-colors text-sm"
            >
              Gerar novo PIX
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
