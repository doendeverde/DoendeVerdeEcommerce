import { PropsWithChildren } from "react";

/**
 * Layout para páginas de autenticação (login/register)
 * Centraliza o conteúdo e aplica estilo consistente
 */
export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="bg-surface border border-default p-8 rounded-lg shadow-lg w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
