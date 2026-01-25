/**
 * Forgot Password Page
 * 
 * Página para solicitar recuperação de senha.
 * Usuário informa email e recebe link para redefinir.
 */

import { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Esqueci Minha Senha | DoendeVerde",
  description: "Recupere sua senha da conta DoendeVerde",
};

export default function ForgotPasswordPage() {
  return (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-default">
          Esqueceu sua senha?
        </h1>
        <p className="text-muted mt-2">
          Digite seu email e enviaremos um link para recuperação.
        </p>
      </div>

      {/* Form */}
      <ForgotPasswordForm />
    </>
  );
}
