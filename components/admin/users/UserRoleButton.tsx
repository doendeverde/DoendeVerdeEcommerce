"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Shield, ShieldOff } from "lucide-react";

interface UserRoleButtonProps {
  userId: string;
  currentRole: string;
}

/**
 * Botão para promover/rebaixar usuário de Admin
 */
export function UserRoleButton({ userId, currentRole }: UserRoleButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = currentRole === "ADMIN";
  const newRole = isAdmin ? "CUSTOMER" : "ADMIN";

  const handleRoleChange = async () => {
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao atualizar role");
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
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 ${
          isAdmin
            ? "bg-gray-100 hover:bg-gray-200 text-text-secondary border border-gray-border"
            : "bg-primary-purple hover:bg-primary-purple/90 text-white"
        }`}
      >
        {isAdmin ? (
          <>
            <ShieldOff className="w-4 h-4" />
            Remover Admin
          </>
        ) : (
          <>
            <Shield className="w-4 h-4" />
            Tornar Admin
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
            <div className="bg-white border border-gray-border rounded-xl p-6 max-w-sm w-full shadow-xl">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {isAdmin ? "Remover permissão de Admin?" : "Tornar Admin?"}
              </h3>
              <p className="text-text-secondary text-sm mb-6">
                {isAdmin
                  ? "O usuário perderá acesso ao painel administrativo."
                  : "O usuário terá acesso total ao painel administrativo."}
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
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-text-primary rounded-lg transition-colors disabled:opacity-50 border border-gray-border"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRoleChange}
                  disabled={isPending}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                    isAdmin
                      ? "bg-red-600 hover:bg-red-500 text-white"
                      : "bg-primary-purple hover:bg-primary-purple/90 text-white"
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
