import { create } from "zustand";

/**
 * Auth Modal Store
 *
 * Gerencia o estado global do modal de autenticação (login/registro).
 *
 * Design Decisions:
 * - Zustand foi escolhido sobre Context API por performance (sem re-renders desnecessários)
 * - Store separado permite uso em qualquer componente sem prop drilling
 * - isSubmitting previne fechamento acidental durante submit (UX crítica)
 * - callbackUrl permite fluxos de autenticação contextual (ex: carrinho → login → carrinho)
 */

export type AuthView = "login" | "register";

interface AuthModalStore {
  /** Modal aberto/fechado */
  isOpen: boolean;

  /** View atual: login ou registro */
  view: AuthView;

  /** URL para redirect após login bem-sucedido */
  callbackUrl?: string;

  /** Flag de submit em andamento (bloqueia fechamento) */
  isSubmitting: boolean;

  /**
   * Abre o modal com a view especificada
   * @param view - 'login' ou 'register'
   * @param callbackUrl - URL opcional para redirect após autenticação
   */
  open: (view: AuthView, callbackUrl?: string) => void;

  /**
   * Fecha o modal (apenas se não estiver submetendo)
   */
  close: () => void;

  /**
   * Força fechamento (usado após sucesso de submit)
   */
  forceClose: () => void;

  /**
   * Alterna entre login e registro
   */
  switchView: () => void;

  /**
   * Marca início de submit (previne fechamento)
   */
  setSubmitting: (isSubmitting: boolean) => void;
}

export const useAuthModalStore = create<AuthModalStore>((set, get) => ({
  isOpen: false,
  view: "login",
  callbackUrl: undefined,
  isSubmitting: false,

  open: (view: AuthView, callbackUrl?: string) => {
    set({
      isOpen: true,
      view,
      callbackUrl,
      isSubmitting: false,
    });
  },

  close: () => {
    const { isSubmitting } = get();
    // Previne fechamento durante submit
    if (!isSubmitting) {
      set({
        isOpen: false,
        callbackUrl: undefined,
      });
    }
  },

  forceClose: () => {
    set({
      isOpen: false,
      callbackUrl: undefined,
      isSubmitting: false,
    });
  },

  switchView: () => {
    set((state) => ({
      view: state.view === "login" ? "register" : "login",
      // Mantém callbackUrl ao trocar de view
    }));
  },

  setSubmitting: (isSubmitting: boolean) => {
    set({ isSubmitting });
  },
}));
