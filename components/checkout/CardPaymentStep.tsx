/**
 * Card Payment Step Component
 * 
 * Integra o Card Payment Brick do Mercado Pago no checkout.
 * 
 * ⚠️ FLUXO:
 * 1. Brick captura dados do cartão (nunca trafegam pelo nosso backend)
 * 2. Brick gera token via SDK do Mercado Pago
 * 3. Token é enviado para nossa API /api/payments/create
 * 4. Backend cria pagamento no Mercado Pago
 * 5. Webhook confirma status final
 */

"use client";

import { useCallback, useState } from "react";
import { ArrowLeft, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { CardPaymentBrick, type CardPaymentFormData } from "@/components/checkout";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface PaymentStepProps {
  /** Valor a pagar em reais */
  amount: number;
  /** Email do pagador */
  payerEmail: string;
  /** ID do pedido já criado */
  orderId: string;
  /** Callback para voltar ao passo anterior */
  onBack: () => void;
  /** Callback quando pagamento é concluído */
  onComplete: (result: PaymentResult) => void;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  status?: "approved" | "pending" | "rejected" | "in_process";
  statusDetail?: string;
  error?: string;
}

type PaymentState = "idle" | "processing" | "awaiting_confirmation" | "success" | "error";

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function CardPaymentStep({
  amount,
  payerEmail,
  orderId,
  onBack,
  onComplete,
}: PaymentStepProps) {
  const [state, setState] = useState<PaymentState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  // Handle payment submission from Brick
  const handlePaymentSubmit = useCallback(async (formData: CardPaymentFormData) => {
    setState("processing");
    setError(null);

    try {
      // Enviar apenas dados seguros para o backend
      // ⚠️ Token expira em ~7 minutos, usar imediatamente
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: formData.token,
          email: formData.payerEmail,
          installments: formData.installments,
          orderId: orderId,
          paymentMethodId: formData.paymentMethodId,
          issuerId: formData.issuerId,
          identificationType: formData.identificationType,
          identificationNumber: formData.identificationNumber,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Erro ao processar pagamento");
      }

      // Processar resultado
      const paymentStatus = result.data.status;

      setPaymentResult({
        success: paymentStatus === "approved",
        paymentId: result.data.paymentId,
        status: paymentStatus,
        statusDetail: result.data.statusDetail,
      });

      // Atualizar estado baseado no status do pagamento
      if (paymentStatus === "approved") {
        setState("success");
        onComplete({
          success: true,
          paymentId: result.data.paymentId,
          status: "approved",
        });
      } else if (paymentStatus === "pending" || paymentStatus === "in_process") {
        // Pagamento pendente - aguardar webhook
        setState("awaiting_confirmation");
        onComplete({
          success: false,
          paymentId: result.data.paymentId,
          status: paymentStatus,
          statusDetail: result.data.statusDetail,
        });
      } else {
        // Pagamento rejeitado
        setState("error");
        const errorMessage = getPaymentErrorMessage(result.data.statusDetail);
        setError(errorMessage);
        onComplete({
          success: false,
          status: "rejected",
          error: errorMessage,
        });
      }
    } catch (err) {
      setState("error");
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      onComplete({
        success: false,
        error: errorMessage,
      });
    }
  }, [orderId, onComplete]);

  // Handle brick error
  const handleBrickError = useCallback((err: Error) => {
    setState("error");
    setError(err.message);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  // Success State
  if (state === "success") {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Pagamento Aprovado!
        </h2>
        <p className="text-gray-600 mb-4">
          Seu pagamento foi processado com sucesso.
        </p>
        {paymentResult?.paymentId && (
          <p className="text-sm text-gray-500">
            ID: {paymentResult.paymentId}
          </p>
        )}
      </div>
    );
  }

  // Awaiting Confirmation State
  if (state === "awaiting_confirmation") {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-yellow-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Pagamento em Processamento
        </h2>
        <p className="text-gray-600 mb-4">
          Seu pagamento está sendo analisado. Você receberá uma confirmação em breve.
        </p>
        {paymentResult?.paymentId && (
          <p className="text-sm text-gray-500">
            ID: {paymentResult.paymentId}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-4">
          Não se preocupe, você não será cobrado duas vezes.
        </p>
      </div>
    );
  }

  // Error State (can retry)
  if (state === "error" && error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Pagamento não aprovado</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>

        {/* Allow retry */}
        <CardPaymentBrick
          amount={amount}
          payerEmail={payerEmail}
          onSubmit={handlePaymentSubmit}
          onError={handleBrickError}
        />

        <button
          onClick={onBack}
          className="w-full mt-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
      </div>
    );
  }

  // Default: Show Payment Brick
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Dados do Cartão
      </h2>

      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total a pagar:</span>
          <span className="text-xl font-bold text-primary-green">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(amount)}
          </span>
        </div>
      </div>

      {/* Card Payment Brick */}
      <CardPaymentBrick
        amount={amount}
        payerEmail={payerEmail}
        onSubmit={handlePaymentSubmit}
        onError={handleBrickError}
        disabled={state === "processing"}
      />

      {/* Back Button */}
      <button
        onClick={onBack}
        disabled={state === "processing"}
        className="w-full mt-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function getPaymentErrorMessage(statusDetail: string): string {
  const errorMessages: Record<string, string> = {
    cc_rejected_bad_filled_card_number: "Verifique o número do cartão",
    cc_rejected_bad_filled_date: "Verifique a data de validade",
    cc_rejected_bad_filled_other: "Verifique os dados do cartão",
    cc_rejected_bad_filled_security_code: "Verifique o código de segurança",
    cc_rejected_blacklist: "Cartão não autorizado. Use outro cartão.",
    cc_rejected_call_for_authorize: "Autorize o pagamento com seu banco",
    cc_rejected_card_disabled: "Cartão desabilitado. Contate seu banco.",
    cc_rejected_duplicated_payment: "Pagamento duplicado detectado",
    cc_rejected_high_risk: "Pagamento recusado por segurança",
    cc_rejected_insufficient_amount: "Saldo insuficiente",
    cc_rejected_invalid_installments: "Parcelas inválidas para este cartão",
    cc_rejected_max_attempts: "Limite de tentativas excedido",
    cc_rejected_other_reason: "Cartão recusado. Tente outro cartão.",
    pending_contingency: "Pagamento pendente de revisão",
    pending_review_manual: "Pagamento em análise",
  };

  return errorMessages[statusDetail] || "Pagamento não autorizado. Tente novamente.";
}

export default CardPaymentStep;
