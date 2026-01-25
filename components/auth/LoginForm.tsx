"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginSchema, type LoginInput } from "@/schemas/auth.schema";
import { z } from "zod";
import { useAuthModalStore } from "@/stores/authModal";
import { OAuthButtons } from "./OAuthButtons";

/**
 * LoginForm Props
 * 
 * Props opcionais permitem uso em dois contextos:
 * 1. Modal mode: recebe callbacks e callbackUrl via props
 * 2. Standalone page mode: lê searchParams e redireciona normalmente
 */
interface LoginFormProps {
  /** Callback após login bem-sucedido (para fechar modal) */
  onSuccess?: () => void;

  /** Callback para trocar para view de registro */
  onSwitchView?: () => void;

  /** URL para redirect após login (override searchParams) */
  callbackUrl?: string;
}

export function LoginForm({ onSuccess, onSwitchView, callbackUrl: callbackUrlProp }: LoginFormProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSubmitting } = useAuthModalStore();

  // Prioriza callbackUrl de prop (modal) sobre searchParams (página)
  const callbackUrl = callbackUrlProp || searchParams?.get("callbackUrl") || "/";

  // Check for blocked user error
  const errorParam = searchParams?.get("error");
  const isBlocked = errorParam === "blocked";

  const [formData, setFormData] = useState<LoginInput>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(
    isBlocked ? "Sua conta foi bloqueada. Entre em contato com o suporte." : null
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Limpar erro do campo quando usuário começar a digitar
    if (errors[name as keyof LoginInput]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (generalError) {
      setGeneralError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);
    setIsLoading(true);

    // Bloqueia fechamento do modal durante submit
    setSubmitting(true);

    try {
      // Validar com Zod
      const validatedData = loginSchema.parse(formData);

      // Tentar login com NextAuth
      const result = await signIn("credentials", {
        email: validatedData.email,
        password: validatedData.password,
        redirect: false,
      });

      if (result?.error) {
        setGeneralError("Email ou senha inválidos");
      } else if (result?.ok) {
        // Sucesso: chamar callback (modal) ou redirecionar (página)
        if (onSuccess) {
          onSuccess();
        }
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Erros de validação do Zod
        const fieldErrors: Partial<Record<keyof LoginInput, string>> = {};
        error.issues.forEach((err) => {
          const field = err.path[0] as keyof LoginInput;
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        setGeneralError("Erro ao fazer login. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      {generalError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {generalError}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg bg-card-bg text-text-primary focus:outline-none focus:ring-2 ${errors.email
            ? "border-error focus:ring-error/20"
            : "border-gray-border focus:ring-primary-green/20 focus:border-primary-green"
            }`}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg bg-card-bg text-text-primary focus:outline-none focus:ring-2 ${errors.password
            ? "border-error focus:ring-error/20"
            : "border-gray-border focus:ring-primary-green/20 focus:border-primary-green"
            }`}
          disabled={isLoading}
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary-green text-white py-2 px-4 rounded-md hover:bg-primary-green-hover disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Entrando..." : "Entrar"}
      </button>

      <p className="text-center text-sm text-gray-600">
        Não tem uma conta?{" "}
        {onSwitchView ? (
          <button
            type="button"
            onClick={onSwitchView}
            className="text-primary-green hover:text-primary-green-hover font-medium hover:underline"
          >
            Cadastre-se
          </button>
        ) : (
          <a href="/register" className="text-primary-green hover:text-primary-green-hover font-medium hover:underline">
            Cadastre-se
          </a>
        )}
      </p>
    </form>
  );
}
