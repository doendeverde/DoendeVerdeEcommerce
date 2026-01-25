"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Crown,
  Calendar,
  CreditCard,
  Gift,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import type { SubscriptionWithDetails } from "@/types/subscription";
import type { PlanBenefitWithBenefit } from "@/types/benefit";

interface SubscriptionDashboardProps {
  subscription: SubscriptionWithDetails | null;
  benefits: PlanBenefitWithBenefit[];
  recentOrders?: {
    id: string;
    createdAt: Date;
    totalAmount: number;
    status: string;
  }[];
}

/**
 * Format date in Brazilian format
 */
function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Format currency in Brazilian Real
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Get status badge styles
 */
function getStatusBadge(status: string): { text: string; className: string; icon: React.ReactNode } {
  switch (status) {
    case "ACTIVE":
      return {
        text: "Ativa",
        className: "bg-green-500/10 text-green-400 border-green-500/20",
        icon: <CheckCircle className="w-4 h-4" />,
      };
    case "PAUSED":
      return {
        text: "Pausada",
        className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        icon: <Clock className="w-4 h-4" />,
      };
    case "PENDING_CANCELLATION":
      return {
        text: "Cancelamento Pendente",
        className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        icon: <AlertCircle className="w-4 h-4" />,
      };
    case "CANCELED":
      return {
        text: "Cancelada",
        className: "bg-red-500/10 text-red-400 border-red-500/20",
        icon: <AlertCircle className="w-4 h-4" />,
      };
    case "EXPIRED":
      return {
        text: "Expirada",
        className: "bg-gray-500/10 text-gray-400 border-gray-500/20",
        icon: <Clock className="w-4 h-4" />,
      };
    default:
      return {
        text: status,
        className: "bg-gray-500/10 text-gray-400 border-gray-500/20",
        icon: <Clock className="w-4 h-4" />,
      };
  }
}

/**
 * Icon mapping for benefits
 */
function getBenefitIcon(iconName: string): React.ReactNode {
  const iconClass = "w-5 h-5";
  switch (iconName) {
    case "truck":
      return <Package className={iconClass} />;
    case "percent":
      return <Crown className={iconClass} />;
    case "gift":
      return <Gift className={iconClass} />;
    case "star":
      return <Sparkles className={iconClass} />;
    case "credit-card":
      return <CreditCard className={iconClass} />;
    default:
      return <CheckCircle className={iconClass} />;
  }
}

export function SubscriptionDashboard({
  subscription,
  benefits,
  recentOrders = [],
}: SubscriptionDashboardProps) {
  const [showAllBenefits, setShowAllBenefits] = useState(false);

  // No subscription - show CTA
  if (!subscription) {
    return (
      <div className="bg-card-bg rounded-2xl border border-gray-border p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
          <Crown className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Você ainda não é assinante
        </h2>
        <p className="text-text-secondary mb-6 max-w-md mx-auto">
          Assine um de nossos planos e aproveite descontos exclusivos, frete grátis,
          brindes mensais e muito mais!
        </p>
        <Link
          href="/subscriptions"
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors"
        >
          <Sparkles className="w-5 h-5" />
          Ver Planos Disponíveis
        </Link>
      </div>
    );
  }

  const statusBadge = getStatusBadge(subscription.status);
  const enabledBenefits = benefits.filter((b) => b.enabled);
  const displayBenefits = showAllBenefits ? enabledBenefits : enabledBenefits.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className="bg-gradient-to-br from-purple-600/20 via-card-bg to-green-600/20 rounded-2xl border border-purple-500/30 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Crown className="w-7 h-7 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Seu Plano</p>
                <h2 className="text-2xl font-bold text-text-primary">
                  {subscription.plan.name}
                </h2>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusBadge.className}`}>
              {statusBadge.icon}
              <span className="text-sm font-medium">{statusBadge.text}</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black/20 rounded-xl p-4">
              <p className="text-sm text-text-secondary mb-1">Valor Mensal</p>
              <p className="text-lg font-semibold text-text-primary">
                {formatCurrency(Number(subscription.plan.price))}
              </p>
            </div>
            <div className="bg-black/20 rounded-xl p-4">
              <p className="text-sm text-text-secondary mb-1">Desconto em Produtos</p>
              <p className="text-lg font-semibold text-green-400">
                {subscription.plan.discountPercent > 0
                  ? `${subscription.plan.discountPercent}%`
                  : "—"}
              </p>
            </div>
            <div className="bg-black/20 rounded-xl p-4">
              <p className="text-sm text-text-secondary mb-1">Membro desde</p>
              <p className="text-lg font-semibold text-text-primary">
                {formatDate(subscription.createdAt)}
              </p>
            </div>
            <div className="bg-black/20 rounded-xl p-4">
              <p className="text-sm text-text-secondary mb-1">Próxima Cobrança</p>
              <p className="text-lg font-semibold text-text-primary">
                {formatDate(subscription.nextBillingAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-black/20 border-t border-white/10 flex flex-wrap gap-3">
          <Link
            href="/subscriptions"
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            Alterar Plano
          </Link>
          <span className="text-gray-600">•</span>
          <button className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            Gerenciar Pagamento
          </button>
          {subscription.status === "ACTIVE" && (
            <>
              <span className="text-gray-600">•</span>
              <button className="text-sm text-red-400 hover:text-red-300 transition-colors">
                Cancelar Assinatura
              </button>
            </>
          )}
        </div>
      </div>

      {/* Benefits Section */}
      {enabledBenefits.length > 0 && (
        <div className="bg-card-bg rounded-2xl border border-gray-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <Gift className="w-5 h-5 text-green-400" />
              Seus Benefícios
            </h3>
            {enabledBenefits.length > 4 && (
              <button
                onClick={() => setShowAllBenefits(!showAllBenefits)}
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                {showAllBenefits ? "Ver menos" : `Ver todos (${enabledBenefits.length})`}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayBenefits.map((pb) => (
              <div
                key={pb.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-bg/50 hover:bg-gray-bg transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                  {getBenefitIcon(pb.benefit.icon || "star")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">
                    {pb.benefit.name}
                  </p>
                  <p className="text-sm text-text-secondary truncate">
                    {pb.customValue || pb.benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="bg-card-bg rounded-2xl border border-gray-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" />
              Pedidos Recentes
            </h3>
            <Link
              href="/orders"
              className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              Ver Todos
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-bg/50 hover:bg-gray-bg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">
                      Pedido #{order.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-text-primary">
                    {formatCurrency(order.totalAmount)}
                  </p>
                  <p className={`text-sm ${order.status === "PAID" ? "text-green-400" :
                    order.status === "PENDING" ? "text-yellow-400" : "text-text-secondary"
                    }`}>
                    {order.status === "PAID" ? "Pago" :
                      order.status === "PENDING" ? "Pendente" :
                        order.status === "PROCESSING" ? "Processando" :
                          order.status === "SHIPPED" ? "Enviado" :
                            order.status === "DELIVERED" ? "Entregue" : order.status}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Payment History Link */}
      <div className="flex justify-center">
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <Calendar className="w-4 h-4" />
          Ver histórico completo de pagamentos
        </Link>
      </div>
    </div>
  );
}
