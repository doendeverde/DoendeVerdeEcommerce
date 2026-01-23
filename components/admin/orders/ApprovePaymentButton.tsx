"use client";

import { useState } from "react";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApprovePaymentButtonProps {
  orderId: string;
  paymentId: string;
  transactionId: string | null;
  currentStatus: string;
  onApproved?: () => void;
}

/**
 * Botão para aprovar pagamento manualmente (Admin)
 * 
 * Útil quando o webhook do Mercado Pago falha mas o pagamento
 * foi aprovado no gateway.
 */
export function ApprovePaymentButton({
  orderId,
  paymentId,
  transactionId,
  currentStatus,
  onApproved,
}: ApprovePaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Não mostrar se já está pago
  if (currentStatus === "PAID" || success) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600">
        <CheckCircle className="w-3.5 h-3.5" />
        Aprovado
      </span>
    );
  }

  async function handleApprove() {
    if (!confirm(
      "Tem certeza que deseja aprovar este pagamento manualmente?\n\n" +
      "Isso irá:\n" +
      "• Marcar o pagamento como PAID\n" +
      "• Atualizar o status do pedido\n" +
      "• Criar a subscription (se aplicável)\n\n" +
      "O sistema verificará o status no Mercado Pago antes de aprovar."
    )) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/approve-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: transactionId || paymentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao aprovar pagamento");
      }

      setSuccess(true);
      onApproved?.();

      // Reload page to show updated status
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleApprove}
        disabled={isLoading}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
          "bg-green-600 text-white hover:bg-green-700",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Verificando...
          </>
        ) : (
          <>
            <CheckCircle className="w-3.5 h-3.5" />
            Aprovar Pagamento
          </>
        )}
      </button>

      {error && (
        <span className="inline-flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </span>
      )}
    </div>
  );
}
