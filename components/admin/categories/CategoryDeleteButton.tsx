"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle, X } from "lucide-react";

interface CategoryDeleteButtonProps {
  categoryId: string;
  categoryName: string;
  productsCount: number;
}

export function CategoryDeleteButton({
  categoryId,
  categoryName,
  productsCount,
}: CategoryDeleteButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao excluir categoria");
      }

      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsDeleting(false);
    }
  };

  const canDelete = productsCount === 0;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`p-2 rounded-lg transition-colors ${canDelete
          ? "text-gray-500 dark:text-gray-400 hover:text-red-400 hover:bg-red-500/10"
          : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
          }`}
        title={canDelete ? "Excluir" : "Não é possível excluir categoria com produtos"}
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
          <div className="relative bg-card-bg rounded-xl border border-gray-border p-6 w-full max-w-md">
            {/* Close button */}
            <button
              onClick={() => !isDeleting && setIsOpen(false)}
              className="absolute top-4 right-4 p-1 text-text-secondary hover:text-text-primary transition-colors"
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
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Excluir Categoria
                </h3>
                <p className="text-text-secondary text-sm mb-4">
                  Tem certeza que deseja excluir a categoria{" "}
                  <span className="text-text-primary font-medium">{categoryName}</span>?
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
                    className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
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
