"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle, X } from "lucide-react";

interface PlanDeleteButtonProps {
  planId: string;
  planName: string;
  subscriptionsCount: number;
}

export function PlanDeleteButton({
  planId,
  planName,
  subscriptionsCount,
}: PlanDeleteButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/subscription-plans/${planId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao excluir plano");
      }

      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsDeleting(false);
    }
  };

  const canDelete = subscriptionsCount === 0;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`p-2 rounded-lg transition-colors ${
          canDelete
            ? "text-neutral-400 hover:text-red-400 hover:bg-red-500/10"
            : "text-neutral-600 cursor-not-allowed"
        }`}
        title={
          canDelete
            ? "Excluir"
            : "Não é possível excluir plano com assinaturas ativas"
        }
        disabled={!canDelete}
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Modal de confirmação */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !isDeleting && setIsOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-neutral-900 rounded-xl border border-neutral-800 p-6 w-full max-w-md">
            {/* Close button */}
            <button
              onClick={() => !isDeleting && setIsOpen(false)}
              className="absolute top-4 right-4 p-1 text-neutral-500 hover:text-white transition-colors"
              disabled={isDeleting}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Excluir Plano
                </h3>
                <p className="text-neutral-400 text-sm mb-4">
                  Tem certeza que deseja excluir o plano{" "}
                  <span className="text-white font-medium">{planName}</span>?
                  Esta ação não pode ser desfeita.
                </p>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setIsOpen(false)}
                    disabled={isDeleting}
                    className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 text-white font-medium rounded-lg transition-colors"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Excluindo...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
