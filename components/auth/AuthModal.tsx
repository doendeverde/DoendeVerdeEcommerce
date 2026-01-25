"use client";

import { useAuthModalStore } from "@/stores/authModal";
import { Modal } from "@/components/ui/Modal";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

/**
 * Auth Modal Orchestrator
 *
 * Componente que orquestra a experiência de autenticação em modal.
 *
 * Responsabilidades:
 * - Renderiza Modal com LoginForm ou RegisterForm baseado no estado Zustand
 * - Gerencia transição entre views (login ↔ register)
 * - Passa callbacks para os forms (onSuccess, onSwitchView)
 * - Controla fechamento baseado em estado de submit
 *
 * Design Decisions:
 * - Forms permanecem "puros" e reutilizáveis via inversão de controle (callbacks)
 * - Único ponto de montagem global (chamado em app/layout.tsx)
 * - Callback URL é propagado do store para o form
 * - preventClose sincronizado com isSubmitting previne perda de dados
 */

export function AuthModal() {
  const {
    isOpen,
    view,
    callbackUrl,
    isSubmitting,
    close,
    forceClose,
    switchView,
  } = useAuthModalStore();

  // Handler de sucesso: força fechamento após autenticação
  const handleSuccess = () => {
    forceClose();
  };

  // Handler de troca de view: alterna entre login/register
  const handleSwitchView = () => {
    switchView();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      preventClose={isSubmitting}
      className="max-w-md"
    >
      <div className="space-y-6">
        {/* Header com título dinâmico */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-default">
            {view === "login" ? "Entrar na sua conta" : "Criar conta"}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {view === "login"
              ? "Acesse sua conta para continuar"
              : "Preencha os dados para criar sua conta"}
          </p>
        </div>

        {/* Form condicional */}
        {view === "login" ? (
          <LoginForm
            onSuccess={handleSuccess}
            onSwitchView={handleSwitchView}
            callbackUrl={callbackUrl}
          />
        ) : (
          <RegisterForm
            onSuccess={handleSuccess}
            onSwitchView={handleSwitchView}
          />
        )}
      </div>
    </Modal>
  );
}
