"use client";

import { useEffect } from "react";
import { useAgeGateStore } from "@/stores/ageGate";
import { ShieldCheck, XCircle } from "lucide-react";

/**
 * Age Gate Modal — Verificação de Idade (+18)
 *
 * Overlay com blur que aparece sobre o site quando o usuário
 * ainda não confirmou ser maior de 18 anos.
 *
 * Design Decisions:
 * - O site carrega normalmente (todo conteúdo público renderiza)
 * - Se não houver flag no localStorage, exibe overlay com backdrop-blur + modal
 * - Ao confirmar, salva no localStorage e remove o overlay
 * - Negar redireciona para fora do site
 * - Não-fechável: sem X, sem ESC, sem click-outside
 * - z-index [100] garante que fica acima de tudo (header, cart drawer, etc.)
 */
export function AgeGateModal() {
  const { showGate, init, confirmAge, denyAge } = useAgeGateStore();

  // Lê localStorage após mount para decidir se exibe o gate
  useEffect(() => {
    init();
  }, [init]);

  // Bloqueia scroll do body enquanto o gate está ativo
  useEffect(() => {
    if (showGate) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [showGate]);

  if (!showGate) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      aria-modal="true"
      role="dialog"
      aria-labelledby="age-gate-title"
      aria-describedby="age-gate-description"
    >
      <div
        className="
          relative w-full max-w-sm
          bg-surface rounded-2xl shadow-2xl
          overflow-hidden
          age-gate-animate-in
        "
      >
        {/* ── Header decorativo (gradiente roxo) ── */}
        <div className="bg-gradient-to-r from-primary-purple-dark to-primary-purple px-6 py-5 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 mb-3">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h2
            id="age-gate-title"
            className="text-xl font-bold text-white"
          >
            Verificação de Idade
          </h2>
        </div>

        {/* ── Corpo ── */}
        <div className="px-6 py-6 text-center space-y-4">
          <p
            id="age-gate-description"
            className="text-base text-default leading-relaxed"
          >
            Este site contém produtos destinados a{" "}
            <strong>maiores de 18 anos</strong>.
          </p>
          <p className="text-sm text-muted">
            Ao continuar, você declara que tem 18 anos ou mais
            e concorda com nossos termos de uso.
          </p>

          {/* ── Botões ── */}
          <div className="flex flex-col gap-3 pt-2">
            {/* Botão principal — Confirmar */}
            <button
              onClick={confirmAge}
              autoFocus
              className="
                w-full py-3 px-6
                bg-primary-green text-white
                font-semibold text-base
                rounded-xl
                hover:bg-primary-green-hover
                focus:outline-none focus:ring-2 focus:ring-primary-green/50 focus:ring-offset-2
                transition-colors duration-200
                cursor-pointer
              "
            >
              Sim, tenho 18 anos ou mais
            </button>

            {/* Botão secundário — Negar */}
            <button
              onClick={denyAge}
              className="
                w-full py-3 px-6
                bg-transparent text-muted
                font-medium text-sm
                rounded-xl
                border border-gray-border
                hover:bg-hover-bg hover:text-default
                focus:outline-none focus:ring-2 focus:ring-gray-muted/50 focus:ring-offset-2
                transition-colors duration-200
                cursor-pointer
              "
            >
              <span className="inline-flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Não, sou menor de idade
              </span>
            </button>
          </div>
        </div>

        {/* ── Footer legal ── */}
        <div className="px-6 pb-5">
          <p className="text-xs text-muted text-center leading-relaxed">
            A venda de produtos para menores de 18 anos é proibida.
            Ao confirmar, você assume responsabilidade legal.
          </p>
        </div>
      </div>
    </div>
  );
}
