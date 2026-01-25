/**
 * Order PIX Payment Component
 * 
 * Shows PIX QR Code for pending payments with countdown timer.
 * Allows user to pay pending PIX or regenerate if expired.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { QrCode, Copy, ExternalLink, RefreshCw, Clock, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OrderPixPaymentProps {
  orderId: string;
  paymentId: string;
  amount: number;
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
  expiresAt: Date | null;
  transactionId: string | null;
  onPaymentConfirmed?: () => void;
  onClose?: () => void;
}

export function OrderPixPayment({
  orderId,
  paymentId,
  amount,
  qrCode,
  qrCodeBase64,
  ticketUrl,
  expiresAt,
  transactionId,
  onPaymentConfirmed,
  onClose,
}: OrderPixPaymentProps) {
  const [isExpired, setIsExpired] = useState(false);
  const [remainingTime, setRemainingTime] = useState<string>("");
  const [isPolling, setIsPolling] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [currentPixData, setCurrentPixData] = useState({
    qrCode,
    qrCodeBase64,
    ticketUrl,
    expiresAt,
    transactionId,
  });

  // Calculate remaining time
  useEffect(() => {
    if (!currentPixData.expiresAt) {
      setIsExpired(true);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(currentPixData.expiresAt!);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setRemainingTime("Expirado");
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setRemainingTime(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      setIsExpired(false);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentPixData.expiresAt]);

  // Poll for payment status
  useEffect(() => {
    if (!currentPixData.transactionId || isExpired) return;

    setIsPolling(true);
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/checkout/payment-status/${currentPixData.transactionId}?orderId=${orderId}`
        );
        const data = await response.json();

        if (data.status === "approved") {
          clearInterval(pollInterval);
          setIsPolling(false);
          toast.success("Pagamento confirmado!");
          onPaymentConfirmed?.();
        }
      } catch (error) {
        console.error("Error polling payment status:", error);
      }
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      setIsPolling(false);
    };
  }, [currentPixData.transactionId, orderId, isExpired, onPaymentConfirmed]);

  // Regenerate PIX
  const handleRegenerate = useCallback(async () => {
    setIsRegenerating(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/regenerate-pix`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Falha ao regenerar PIX");
      }

      const data = await response.json();

      if (data.success && data.pix) {
        setCurrentPixData({
          qrCode: data.pix.qrCode,
          qrCodeBase64: data.pix.qrCodeBase64,
          ticketUrl: data.pix.ticketUrl,
          expiresAt: data.pix.expiresAt ? new Date(data.pix.expiresAt) : null,
          transactionId: data.pix.transactionId,
        });
        toast.success("Novo PIX gerado com sucesso!");
      } else {
        throw new Error(data.error || "Erro ao regenerar PIX");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao regenerar PIX");
    } finally {
      setIsRegenerating(false);
    }
  }, [orderId]);

  // Copy PIX code
  const handleCopyPix = useCallback(() => {
    if (currentPixData.qrCode) {
      navigator.clipboard.writeText(currentPixData.qrCode);
      toast.success("Código PIX copiado!");
    }
  }, [currentPixData.qrCode]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // If no PIX data available
  if (!currentPixData.qrCode && !currentPixData.qrCodeBase64) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-700">
            <QrCode className="w-5 h-5" />
            <span className="font-medium">PIX não disponível</span>
          </div>
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
          >
            {isRegenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Gerar novo PIX
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card-bg rounded-xl border border-gray-border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <QrCode className="w-5 h-5" />
          <span className="font-semibold">Pagamento PIX</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Amount */}
        <div className="text-center">
          <p className="text-sm text-text-secondary">Valor a pagar</p>
          <p className="text-2xl font-bold text-text-primary">{formatCurrency(amount)}</p>
        </div>

        {/* Timer */}
        <div
          className={cn(
            "flex items-center justify-center gap-2 py-2 px-4 rounded-lg",
            isExpired ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"
          )}
        >
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">
            {isExpired ? "PIX expirado" : `Expira em ${remainingTime}`}
          </span>
        </div>

        {/* QR Code */}
        {!isExpired && currentPixData.qrCodeBase64 && (
          <div className="flex justify-center">
            <div className="p-3 bg-white dark:bg-gray-800 border-2 border-gray-border rounded-xl">
              <img
                src={`data:image/png;base64,${currentPixData.qrCodeBase64}`}
                alt="QR Code PIX"
                className="w-48 h-48"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        {!isExpired ? (
          <div className="space-y-2">
            {/* Copy Button */}
            <button
              onClick={handleCopyPix}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copiar código PIX
            </button>

            {/* Open in MP */}
            {currentPixData.ticketUrl && (
              <a
                href={currentPixData.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-border text-text-primary rounded-lg font-medium hover:bg-hover-bg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir no Mercado Pago
              </a>
            )}

            {/* Status indicator */}
            {isPolling && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Aguardando confirmação...
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            {isRegenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Gerar novo PIX
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Compact PIX pending badge for order cards
 */
interface PixPendingBadgeProps {
  onClick: () => void;
  expiresAt: Date | null;
}

export function PixPendingBadge({ onClick, expiresAt }: PixPendingBadgeProps) {
  const [remainingMinutes, setRemainingMinutes] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setRemainingMinutes(0);
      } else {
        setRemainingMinutes(Math.ceil(diff / 60000));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [expiresAt]);

  const isExpired = remainingMinutes === 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
        isExpired
          ? "bg-red-100 text-red-700 hover:bg-red-200"
          : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
      )}
    >
      <QrCode className="w-4 h-4" />
      {isExpired ? "PIX expirado" : `Pagar PIX (${remainingMinutes}min)`}
    </button>
  );
}
