"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, Unlock } from "lucide-react";

interface UserStatusButtonProps {
  userId: string;
  currentStatus: string;
}

/**
 * Botão para bloquear/desbloquear usuário
 */
export function UserStatusButton({ userId, currentStatus }: UserStatusButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBlocked = currentStatus === "BLOCKED";
  const newStatus = isBlocked ? "ACTIVE" : "BLOCKED";

  const handleStatusChange = async () => {
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
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

    setShowConfirm(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 ${isBlocked
          ? "bg-primary-green hover:bg-primary-green/90 text-white"
          : "bg-red-100 hover:bg-red-200 text-red-700 border border-red-200"
          }`}
      >
        {isBlocked ? (
          <>
            <Unlock className="w-4 h-4" />
            Desbloquear
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Bloquear
          </>
        )}
      </button>

      {/* Modal de Confirmação */}
      {showConfirm && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setShowConfirm(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-surface border border-default rounded-xl p-6 max-w-sm w-full shadow-xl">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {isBlocked ? "Desbloquear usuário?" : "Bloquear usuário?"}
              </h3>
              <p className="text-text-secondary text-sm mb-6">
                {isBlocked
                  ? "O usuário poderá acessar a plataforma novamente."
                  : "O usuário não poderá mais acessar a plataforma."}
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={isPending}
                  className="flex-1 px-4 py-2 bg-gray-bg hover-bg text-text-primary rounded-lg transition-colors disabled:opacity-50 border border-default"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleStatusChange}
                  disabled={isPending}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${isBlocked
                    ? "bg-primary-green hover:bg-primary-green/90 text-white"
                    : "bg-red-600 hover:bg-red-500 text-white"
                    }`}
                >
                  {isPending ? "Salvando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
