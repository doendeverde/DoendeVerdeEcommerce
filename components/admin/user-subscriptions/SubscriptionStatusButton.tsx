"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play, XCircle, MoreHorizontal } from "lucide-react";

interface SubscriptionStatusButtonProps {
  subscriptionId: string;
  currentStatus: string;
}

/**
 * Botão com dropdown para alterar status da assinatura
 * Status disponíveis: ACTIVE, CANCELED
 */
export function SubscriptionStatusButton({
  subscriptionId,
  currentStatus,
}: SubscriptionStatusButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: string) => {
    setError(null);

    try {
      const response = await fetch(`/api/admin/user-subscriptions/${subscriptionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao atualizar status");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    }

    setIsOpen(false);
  };

  // Opções disponíveis com base no status atual (apenas ACTIVE e CANCELED)
  const getAvailableActions = () => {
    const actions = [];

    if (currentStatus !== "ACTIVE") {
      actions.push({
        status: "ACTIVE",
        label: "Ativar",
        icon: <Play className="w-4 h-4" />,
        className: "text-green-text hover:bg-green-bg",
      });
    }

    if (currentStatus !== "CANCELED") {
      actions.push({
        status: "CANCELED",
        label: "Cancelar",
        icon: <XCircle className="w-4 h-4" />,
        className: "text-red-text hover:bg-red-bg",
      });
    }

    return actions;
  };

  const actions = getAvailableActions();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="p-2 hover:bg-gray-bg rounded-lg text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop para fechar */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1 z-20 w-40 bg-surface border border-default rounded-lg shadow-lg overflow-hidden">
            {actions.map((action) => (
              <button
                key={action.status}
                onClick={() => handleStatusChange(action.status)}
                disabled={isPending}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors disabled:opacity-50 ${action.className}`}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}

      {error && (
        <div className="absolute right-0 top-full mt-1 z-20 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}
