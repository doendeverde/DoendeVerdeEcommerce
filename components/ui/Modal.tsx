"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Modal Base Component
 *
 * Componente reutilizável de modal com:
 * - Overlay escuro com backdrop
 * - Click-outside para fechar
 * - Escape key handler
 * - Focus trap básico
 * - Prevenção de scroll no body
 * - Bloqueio de fechamento durante loading
 *
 * Design Decisions:
 * - Implementação manual (sem lib externa) para controle total e bundle size reduzido
 * - Portal implícito via fixed positioning (simplifica vs React Portal)
 * - Focus trap simples via refs (suficiente para casos 90%, evita dependência)
 * - Sem animações inicialmente (pode adicionar depois via Framer Motion se necessário)
 */

interface ModalProps {
  /** Modal aberto/fechado */
  isOpen: boolean;

  /** Callback ao fechar */
  onClose: () => void;

  /** Conteúdo do modal */
  children: React.ReactNode;

  /** Título do modal (opcional) */
  title?: string;

  /** Bloqueia fechamento (durante loading) */
  preventClose?: boolean;

  /** Classes customizadas para o container interno */
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  preventClose = false,
  className,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Previne scroll do body quando modal está aberto
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";

      // Focus no modal
      setTimeout(() => {
        modalRef.current?.focus();
      }, 10);

      return () => {
        document.body.style.overflow = "";
        // Restaura focus anterior
        previousFocusRef.current?.focus();
      };
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen || preventClose) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, preventClose]);

  // Click-outside handler
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (preventClose) return;
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={cn(
          "relative w-full max-w-md bg-white rounded-xl shadow-2xl",
          "max-h-[90vh] overflow-y-auto",
          "focus:outline-none",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header com botão fechar */}
        {(title || !preventClose) && (
          <div className="sticky top-0 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-border rounded-t-xl">
            {title && (
              <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                {title}
              </h2>
            )}
            {!title && <div />}

            {!preventClose && (
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100"
                aria-label="Fechar modal"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Conteúdo */}
        <div className="p-6">{children}</div>

        {/* Overlay de loading quando preventClose está ativo */}
        {preventClose && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-primary-green border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-600 font-medium">
                Processando...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
