/**
 * PIX Waiting Step Component
 * 
 * Step displayed after user selects PIX payment.
 * Shows QR code, countdown timer, and polls for payment confirmation.
 * 
 * Flow:
 * 1. Display QR code and copy/paste code
 * 2. Start countdown timer (30 min default)
 * 3. Poll payment status every 5 seconds
 * 4. On confirmation: redirect to success
 * 5. On expiration: allow regeneration
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ArrowLeft, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { PixPaymentDisplay, type PixPaymentData } from "./PixPaymentDisplay";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type PixPaymentStatus = "pending" | "approved" | "rejected" | "expired";

interface PixWaitingStepProps {
  /** PIX payment data */
  pixData: PixPaymentData;
  /** Total amount */
  amount: number;
  /** Order ID for polling */
  orderId: string;
  /** Callback to go back to payment selection */
  onBack: () => void;
  /** Callback when payment is confirmed */
  onPaymentConfirmed: () => void;
  /** Callback when payment fails */
  onPaymentFailed: (error: string) => void;
  /** Callback to regenerate PIX */
  onRegeneratePix: () => Promise<void>;
  /** Whether regeneration is in progress */
  isRegenerating?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Polling Hook
// ─────────────────────────────────────────────────────────────────────────────

function usePaymentPolling(
  paymentId: string,
  orderId: string,
  enabled: boolean,
  onStatusChange: (status: PixPaymentStatus) => void
) {
  const [isPolling, setIsPolling] = useState(enabled);
  const pollCountRef = useRef(0);
  const maxPolls = 360; // 30 min with 5s interval

  useEffect(() => {
    if (!enabled || !paymentId) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    pollCountRef.current = 0;

    const poll = async () => {
      try {
        const response = await fetch(
          `/api/checkout/payment-status/${paymentId}?orderId=${orderId}`
        );

        if (!response.ok) {
          console.error("[PixWaitingStep] Poll error:", response.statusText);
          return;
        }

        const data = await response.json();

        if (data.status === "approved") {
          setIsPolling(false);
          onStatusChange("approved");
        } else if (data.status === "rejected" || data.status === "cancelled") {
          setIsPolling(false);
          onStatusChange("rejected");
        }
        // Continue polling for "pending" status
      } catch (error) {
        console.error("[PixWaitingStep] Poll error:", error);
      }
    };

    // Initial poll
    poll();

    // Set up interval
    const interval = setInterval(() => {
      pollCountRef.current += 1;

      if (pollCountRef.current >= maxPolls) {
        clearInterval(interval);
        setIsPolling(false);
        onStatusChange("expired");
        return;
      }

      poll();
    }, 5000); // Poll every 5 seconds

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [paymentId, orderId, enabled, onStatusChange]);

  return { isPolling };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function PixWaitingStep({
  pixData,
  amount,
  orderId,
  onBack,
  onPaymentConfirmed,
  onPaymentFailed,
  onRegeneratePix,
  isRegenerating = false,
}: PixWaitingStepProps) {
  const [status, setStatus] = useState<PixPaymentStatus>("pending");
  const [pollEnabled, setPollEnabled] = useState(true);

  // Handle status changes from polling
  const handleStatusChange = useCallback((newStatus: PixPaymentStatus) => {
    setStatus(newStatus);
    setPollEnabled(false);

    if (newStatus === "approved") {
      onPaymentConfirmed();
    } else if (newStatus === "rejected") {
      onPaymentFailed("Pagamento recusado. Tente novamente.");
    }
  }, [onPaymentConfirmed, onPaymentFailed]);

  // Set up polling
  const { isPolling } = usePaymentPolling(
    pixData.paymentId,
    orderId,
    pollEnabled,
    handleStatusChange
  );

  // Handle PIX expiration
  const handleExpired = useCallback(() => {
    setStatus("expired");
    setPollEnabled(false);
  }, []);

  // Handle PIX regeneration
  const handleRegenerate = useCallback(async () => {
    await onRegeneratePix();
    setStatus("pending");
    setPollEnabled(true);
  }, [onRegeneratePix]);

  // Render: Payment approved
  if (status === "approved") {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>

          <h3 className="text-xl font-semibold text-gray-900">
            Pagamento Confirmado!
          </h3>

          <p className="text-gray-600">
            Seu pagamento foi aprovado. Aguarde enquanto finalizamos sua assinatura...
          </p>

          <div className="flex items-center gap-2 text-primary-green">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Processando...</span>
          </div>
        </div>
      </div>
    );
  }

  // Render: Payment rejected
  if (status === "rejected") {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>

          <h3 className="text-xl font-semibold text-gray-900">
            Pagamento Não Aprovado
          </h3>

          <p className="text-gray-600">
            Houve um problema com o pagamento. Por favor, tente novamente.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="px-6 py-3 bg-primary-green text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                "Tentar Novamente"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render: PIX payment display (pending or expired)
  return (
    <div className="space-y-4">
      <PixPaymentDisplay
        pixData={pixData}
        amount={amount}
        onPaymentExpired={handleExpired}
        onRefresh={handleRegenerate}
        isPolling={isPolling}
      />

      {/* Back button */}
      <div className="flex justify-start">
        <button
          onClick={onBack}
          disabled={isRegenerating}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Escolher outro método de pagamento
        </button>
      </div>
    </div>
  );
}
