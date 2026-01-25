/**
 * Reset Password Page
 * 
 * Página para definir nova senha usando token de recuperação.
 * O token é passado via query string: /reset-password?token=xxx
 */

import { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Redefinir Senha | DoendeVerde",
  description: "Defina uma nova senha para sua conta DoendeVerde",
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;

  return (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-default">
          Redefinir senha
        </h1>
        <p className="text-muted mt-2">
          Digite sua nova senha abaixo.
        </p>
      </div>

      {/* Form */}
      <ResetPasswordForm token={token} />
    </>
  );
}
