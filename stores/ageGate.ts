import { create } from "zustand";
import { isAgeVerified, setAgeVerified } from "@/lib/age-gate";

/**
 * Age Gate Store
 *
 * Gerencia o estado do modal de verificação de idade (+18).
 *
 * Design Decisions:
 * - Zustand para consistência com authModal.ts e outros stores
 * - Inicia showGate como false (SSR safe, sem flash)
 * - Após mount, init() lê localStorage e ativa o gate se necessário
 * - O site renderiza normalmente — o modal apenas sobrepõe com blur
 */

interface AgeGateStore {
  /** Se o modal de age gate deve ser exibido */
  showGate: boolean;

  /**
   * Inicializa o store lendo localStorage.
   * Deve ser chamado uma vez após mount.
   */
  init: () => void;

  /**
   * Confirma que o usuário é maior de 18 anos.
   * Salva no localStorage e fecha o gate.
   */
  confirmAge: () => void;

  /**
   * Nega idade — redireciona para fora do site.
   */
  denyAge: () => void;
}

export const useAgeGateStore = create<AgeGateStore>((set) => ({
  showGate: false,

  init: () => {
    if (!isAgeVerified()) {
      set({ showGate: true });
    }
  },

  confirmAge: () => {
    setAgeVerified();
    set({ showGate: false });
  },

  denyAge: () => {
    window.history.back();
  },
}));
