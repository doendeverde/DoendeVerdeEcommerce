/**
 * Hook para verificar PIX pendente
 * 
 * Verifica se o usuário tem um pagamento PIX pendente e permite
 * recuperá-lo mesmo após refresh ou fechamento do navegador.
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * PROPÓSITO:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * - Evita que usuário perca PIX gerado se fechar a página
 * - Permite retomar pagamento pendente
 * - UX muito melhor: usuário pode continuar de onde parou
 */

"use client";

import { useState, useEffect, useCallback } from "react";

interface PendingPixData {
  paymentId: string;
  orderId: string;
  amount: number;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl?: string;
  expiresAt: Date;
  remainingSeconds: number;
  planInfo?: {
    planId: string;
    planName: string;
  };
}

interface UsePendingPixReturn {
  /** Se está verificando */
  isLoading: boolean;
  /** Se tem PIX pendente */
  hasPendingPix: boolean;
  /** Dados do PIX pendente */
  pendingPixData: PendingPixData | null;
  /** Erro, se houver */
  error: string | null;
  /** Recarrega dados */
  refresh: () => Promise<void>;
  /** Limpa estado (quando usuário decide não usar) */
  dismiss: () => void;
}

export function usePendingPix(): UsePendingPixReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [hasPendingPix, setHasPendingPix] = useState(false);
  const [pendingPixData, setPendingPixData] = useState<PendingPixData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const fetchPendingPix = useCallback(async () => {
    if (dismissed) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout/pending-pix");
      
      if (!response.ok) {
        throw new Error("Falha ao verificar pagamento pendente");
      }

      const result = await response.json();

      if (result.success && result.hasPendingPix && result.data) {
        setHasPendingPix(true);
        setPendingPixData({
          paymentId: result.data.paymentId,
          orderId: result.data.orderId,
          amount: result.data.amount,
          qrCode: result.data.qrCode,
          qrCodeBase64: result.data.qrCodeBase64,
          ticketUrl: result.data.ticketUrl,
          expiresAt: new Date(result.data.expiresAt),
          remainingSeconds: result.data.remainingSeconds,
          planInfo: result.data.planInfo,
        });
      } else {
        setHasPendingPix(false);
        setPendingPixData(null);
      }
    } catch (err) {
      console.error("[usePendingPix] Error:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setHasPendingPix(false);
      setPendingPixData(null);
    } finally {
      setIsLoading(false);
    }
  }, [dismissed]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    setHasPendingPix(false);
    setPendingPixData(null);
  }, []);

  const refresh = useCallback(async () => {
    setDismissed(false);
    await fetchPendingPix();
  }, [fetchPendingPix]);

  // Verifica na montagem
  useEffect(() => {
    fetchPendingPix();
  }, [fetchPendingPix]);

  return {
    isLoading,
    hasPendingPix,
    pendingPixData,
    error,
    refresh,
    dismiss,
  };
}
