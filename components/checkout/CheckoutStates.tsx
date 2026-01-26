/**
 * Generic Checkout State Components
 * 
 * Reusable components for terminal states: Processing, Success, Error
 * These work for both subscription and product checkouts.
 */

"use client";

import { useRouter } from "next/navigation";
import { Loader2, Check, AlertCircle, Package, ShoppingBag } from "lucide-react";
import { ClearCartOnMount } from "./ClearCartOnMount";

// ─────────────────────────────────────────────────────────────────────────────
// Processing State
// ─────────────────────────────────────────────────────────────────────────────

export interface ProcessingStateProps {
  message?: string;
}

export function ProcessingState({ message = "Processando..." }: ProcessingStateProps) {
  return (
    <div className="bg-surface rounded-2xl shadow-sm p-8 text-center">
      <Loader2 className="w-12 h-12 text-primary-green animate-spin mx-auto mb-4" />
      <h1 className="text-xl font-bold text-default mb-2">{message}</h1>
      <p className="text-muted">
        Aguarde enquanto processamos sua solicitação.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic Success State
// ─────────────────────────────────────────────────────────────────────────────

interface SuccessAction {
  label: string;
  href: string;
  variant?: "primary" | "secondary";
}

export interface GenericSuccessStateProps {
  title: string;
  message: string;
  orderId?: string;
  primaryAction?: SuccessAction;
  secondaryAction?: SuccessAction;
  /** Optional list of items or benefits */
  items?: string[];
  /** Icon type */
  icon?: "check" | "package" | "bag";
}

export function GenericSuccessState({
  title,
  message,
  orderId,
  primaryAction,
  secondaryAction,
  items,
  icon = "check",
}: GenericSuccessStateProps) {
  const router = useRouter();

  const IconComponent = {
    check: Check,
    package: Package,
    bag: ShoppingBag,
  }[icon];

  return (
    <div className="bg-surface rounded-2xl shadow-sm p-8 text-center">
      {/* Limpa o carrinho automaticamente após checkout bem-sucedido */}
      <ClearCartOnMount />
      <div className="w-16 h-16 bg-green-bg rounded-full flex items-center justify-center mx-auto mb-4">
        <IconComponent className="w-8 h-8 text-primary-green" />
      </div>

      <h1 className="text-2xl font-bold text-default mb-2">
        {title}
      </h1>

      <p className="text-muted mb-2">{message}</p>

      {orderId && (
        <p className="text-sm text-muted mb-6">
          Pedido: <span className="font-mono font-medium">{orderId.slice(0, 8).toUpperCase()}</span>
        </p>
      )}

      {items && items.length > 0 && (
        <div className="bg-primary-green/10 rounded-xl p-4 mb-6 text-left max-w-md mx-auto">
          <h3 className="font-semibold text-default mb-2">Incluído no pedido:</h3>
          <ul className="space-y-1">
            {items.slice(0, 5).map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted">
                <Check className="w-4 h-4 text-primary-green flex-shrink-0" />
                {item}
              </li>
            ))}
            {items.length > 5 && (
              <li className="text-sm text-muted italic">
                +{items.length - 5} mais itens
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {secondaryAction && (
          <button
            onClick={() => router.push(secondaryAction.href)}
            className="px-6 py-3 bg-page text-muted rounded-lg font-medium hover-bg transition-colors"
          >
            {secondaryAction.label}
          </button>
        )}
        {primaryAction && (
          <button
            onClick={() => router.push(primaryAction.href)}
            className="px-6 py-3 bg-primary-green text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            {primaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic Error State
// ─────────────────────────────────────────────────────────────────────────────

export interface GenericErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
}

export function GenericErrorState({
  title,
  message,
  onRetry,
  retryLabel = "Tentar novamente",
  showBackButton = false,
  backHref = "/",
  backLabel = "Voltar",
}: GenericErrorStateProps) {
  const router = useRouter();

  return (
    <div className="bg-surface rounded-2xl shadow-sm p-8 text-center">
      <div className="w-16 h-16 bg-red-bg rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8 text-red-text" />
      </div>

      <h1 className="text-2xl font-bold text-default mb-2">
        {title}
      </h1>

      <p className="text-muted mb-6">{message}</p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {showBackButton && (
          <button
            onClick={() => router.push(backHref)}
            className="px-6 py-3 bg-page text-muted rounded-lg font-medium hover-bg transition-colors"
          >
            {backLabel}
          </button>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-3 bg-primary-green text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            {retryLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline Error Alert (for non-blocking errors)
// ─────────────────────────────────────────────────────────────────────────────

export interface InlineErrorAlertProps {
  error: string;
  onDismiss?: () => void;
}

export function InlineErrorAlert({ error, onDismiss }: InlineErrorAlertProps) {
  return (
    <div className="bg-red-bg border border-red-border rounded-xl p-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-red-text flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-red-text font-medium">Erro</p>
        <p className="text-red-text/80 text-sm">{error}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 text-sm"
        >
          ✕
        </button>
      )}
    </div>
  );
}
