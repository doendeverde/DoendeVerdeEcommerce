/**
 * PIX Payment Display Component
 * 
 * Displays PIX payment QR Code with countdown timer.
 * 
 * Features:
 * - QR Code image from base64
 * - Copy/paste PIX code button
 * - Countdown timer showing time remaining
 * - Auto-refresh when timer expires
 * - Visual feedback for copy action
 */

"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  QrCode,
  Copy,
  Check,
  Clock,
  AlertCircle,
  RefreshCw,
  ExternalLink
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PixPaymentData {
  /** PIX payment ID from Mercado Pago */
  paymentId: string;
  /** QR Code string for Pix Copia e Cola */
  qrCode: string;
  /** Base64 encoded QR Code image */
  qrCodeBase64: string;
  /** URL to payment ticket page */
  ticketUrl?: string;
  /** Expiration date/time */
  expirationDate: Date;
}

interface PixPaymentDisplayProps {
  /** PIX payment data from backend */
  pixData: PixPaymentData;
  /** Callback when payment is confirmed */
  onPaymentConfirmed?: () => void;
  /** Callback when payment expires */
  onPaymentExpired?: () => void;
  /** Callback to refresh/regenerate PIX */
  onRefresh?: () => void;
  /** Total amount being paid */
  amount: number;
  /** Whether payment status is being checked */
  isPolling?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Countdown Hook
// ─────────────────────────────────────────────────────────────────────────────

function useCountdown(expirationDate: Date, onExpire?: () => void) {
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const now = new Date().getTime();
    const expiration = new Date(expirationDate).getTime();
    return Math.max(0, Math.floor((expiration - now) / 1000));
  });

  const isExpired = timeLeft <= 0;

  useEffect(() => {
    if (isExpired) {
      onExpire?.();
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiration = new Date(expirationDate).getTime();
      const remaining = Math.max(0, Math.floor((expiration - now) / 1000));

      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expirationDate, isExpired, onExpire]);

  // Format time as MM:SS or HH:MM:SS
  const formattedTime = useMemo(() => {
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;

    const pad = (n: number) => n.toString().padStart(2, "0");

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  }, [timeLeft]);

  return { timeLeft, formattedTime, isExpired };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function PixPaymentDisplay({
  pixData,
  onPaymentExpired,
  onRefresh,
  amount,
  isPolling = false,
}: PixPaymentDisplayProps) {
  const [copied, setCopied] = useState(false);

  const { formattedTime, isExpired } = useCountdown(
    pixData.expirationDate,
    onPaymentExpired
  );

  // Copy PIX code to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy PIX code:", error);
    }
  }, [pixData.qrCode]);

  // Format currency
  const formattedAmount = useMemo(() => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  }, [amount]);

  // Render expired state
  if (isExpired) {
    return (
      <div className="bg-surface rounded-xl shadow-sm p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-red-bg rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-text" />
          </div>

          <h3 className="text-lg font-semibold text-default">
            PIX Expirado
          </h3>

          <p className="text-muted">
            O tempo para pagamento expirou. Gere um novo código PIX para continuar.
          </p>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="mt-4 px-6 py-3 bg-primary-green text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Gerar novo PIX
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-primary-green" />
          <h3 className="text-lg font-semibold text-default">
            Pagamento PIX
          </h3>
        </div>

        {/* Countdown Timer */}
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-muted" />
          <span className={`font-mono font-medium ${parseInt(formattedTime.split(":")[0]) < 5
            ? "text-red-500"
            : "text-default"
            }`}>
            {formattedTime}
          </span>
        </div>
      </div>

      {/* Amount */}
      <div className="text-center mb-6">
        <p className="text-sm text-muted mb-1">Valor a pagar</p>
        <p className="text-2xl font-bold text-default">{formattedAmount}</p>
      </div>

      {/* QR Code */}
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-white border-2 border-default rounded-lg">
          {pixData.qrCodeBase64 ? (
            <img
              src={`data:image/png;base64,${pixData.qrCodeBase64}`}
              alt="QR Code PIX"
              className="w-48 h-48"
            />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded">
              <QrCode className="w-16 h-16 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center mb-6">
        <p className="text-sm text-muted">
          Escaneie o QR Code acima com o app do seu banco
          <br />
          ou copie o código abaixo
        </p>
      </div>

      {/* PIX Code + Copy Button */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-muted mb-2">
          Pix Copia e Cola
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={pixData.qrCode}
            readOnly
            className="flex-1 px-3 py-2 border-default rounded-lg bg-page text-sm text-muted truncate"
          />
          <button
            onClick={handleCopy}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${copied
              ? "bg-green-bg text-green-text"
              : "bg-primary-green text-white hover:bg-green-600"
              }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Polling Status */}
      {isPolling && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted mb-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Aguardando confirmação do pagamento...
        </div>
      )}

      {/* External Link */}
      {pixData.ticketUrl && (
        <div className="text-center">
          <a
            href={pixData.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary-green hover:underline"
          >
            Ver comprovante completo
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Security Notice */}
      <div className="mt-6 pt-4 border-t border-default">
        <p className="text-xs text-muted text-center">
          🔒 Pagamento processado com segurança pelo Mercado Pago
        </p>
      </div>
    </div>
  );
}
