"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { registerSchema, type RegisterInput } from "@/schemas/auth.schema";
import { z } from "zod";
import { useAuthModalStore } from "@/stores/authModal";
import { OAuthButtons } from "./OAuthButtons";

/**
 * RegisterForm Props
 * 
 * Props opcionais permitem uso em dois contextos:
 * 1. Modal mode: recebe callbacks via props
 * 2. Standalone page mode: redireciona normalmente
 */
interface RegisterFormProps {
  /** Callback após registro bem-sucedido (para fechar modal) */
  onSuccess?: () => void;

  /** Callback para trocar para view de login */
  onSwitchView?: () => void;
}

export function RegisterForm({ onSuccess, onSwitchView }: RegisterFormProps = {}) {
  const router = useRouter();
  const { setSubmitting } = useAuthModalStore();

  const [formData, setFormData] = useState<RegisterInput>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    birthDate: "",
    whatsapp: "",
    acceptTerms: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof RegisterInput, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Limpar erro do campo quando usuário começar a digitar
    if (errors[name as keyof RegisterInput]) {
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
      const validatedData = registerSchema.parse(formData);

      // Registrar usuário
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          // Erros de campo específicos
          setErrors(data.errors);
        } else {
          setGeneralError(data.message || "Erro ao criar conta");
        }
        return;
      }

      // Sucesso! Fazer login automático
      const signInResult = await signIn("credentials", {
        email: validatedData.email,
        password: validatedData.password,
        redirect: false,
      });

      if (signInResult?.ok) {
        // Sucesso: chamar callback (modal) ou redirecionar (página)
        if (onSuccess) {
          onSuccess();
        }
        router.push("/dashboard");
        router.refresh();
      } else {
        // Registro OK mas login falhou - redirecionar para login manual
        router.push("/login?message=Conta criada com sucesso! Faça login.");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Erros de validação do Zod
        const fieldErrors: Partial<Record<keyof RegisterInput, string>> = {};
        error.issues.forEach((err) => {
          const field = err.path[0] as keyof RegisterInput;
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        setGeneralError("Erro ao criar conta. Tente novamente.");
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
        <label htmlFor="fullName" className="block text-sm font-medium mb-1">
          Nome Completo *
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          value={formData.fullName}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.fullName
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:ring-blue-500"
            }`}
          disabled={isLoading}
        />
        {errors.fullName && (
          <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.email
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:ring-blue-500"
            }`}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="birthDate" className="block text-sm font-medium mb-1">
          Data de Nascimento * <span className="text-gray-500 text-xs">(maiores de 18 anos)</span>
        </label>
        <input
          id="birthDate"
          name="birthDate"
          type="date"
          value={formData.birthDate}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.birthDate
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:ring-blue-500"
            }`}
          disabled={isLoading}
        />
        {errors.birthDate && (
          <p className="text-red-500 text-sm mt-1">{errors.birthDate}</p>
        )}
      </div>

      <div>
        <label htmlFor="whatsapp" className="block text-sm font-medium mb-1">
          WhatsApp <span className="text-gray-500 text-xs">(opcional)</span>
        </label>
        <input
          id="whatsapp"
          name="whatsapp"
          type="tel"
          placeholder="(11) 99999-9999"
          value={formData.whatsapp}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.whatsapp
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:ring-blue-500"
            }`}
          disabled={isLoading}
        />
        {errors.whatsapp && (
          <p className="text-red-500 text-sm mt-1">{errors.whatsapp}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Senha *
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.password
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:ring-blue-500"
            }`}
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500 mt-1">
          Mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial
        </p>
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
          Confirmar Senha *
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.confirmPassword
            ? "border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:ring-blue-500"
            }`}
          disabled={isLoading}
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
        )}
      </div>

      <div className="flex items-start">
        <input
          id="acceptTerms"
          name="acceptTerms"
          type="checkbox"
          checked={formData.acceptTerms}
          onChange={handleChange}
          className={`mt-1 h-4 w-4 rounded border-gray-300 ${errors.acceptTerms ? "border-red-500" : ""
            }`}
          disabled={isLoading}
        />
        <label htmlFor="acceptTerms" className="ml-2 text-sm">
          Eu aceito os{" "}
          <a href="/terms" className="text-blue-600 hover:underline" target="_blank">
            Termos de Uso
          </a>{" "}
          e a{" "}
          <a href="/privacy" className="text-blue-600 hover:underline" target="_blank">
            Política de Privacidade
          </a>
          *
        </label>
      </div>
      {errors.acceptTerms && (
        <p className="text-red-500 text-sm">{errors.acceptTerms}</p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary-green text-white py-2 px-4 rounded-md hover:bg-primary-green-hover disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Criando conta..." : "Criar Conta"}
      </button>

      <p className="text-center text-sm text-gray-600">
        Já tem uma conta?{" "}
        {onSwitchView ? (
          <button
            type="button"
            onClick={onSwitchView}
            className="text-primary-green hover:text-primary-green-hover font-medium hover:underline"
          >
            Entrar
          </button>
        ) : (
          <a href="/login" className="text-primary-green hover:text-primary-green-hover font-medium hover:underline">
            Entrar
          </a>
        )}
      </p>
    </form>
  );
}
