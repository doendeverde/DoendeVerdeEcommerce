/**
 * Reset Password Form Component
 * 
 * Formulário para definir nova senha.
 * Valida o token e permite redefinir a senha.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";

type FormState = "validating" | "idle" | "loading" | "success" | "error" | "invalid-token" | "expired-token";

interface ResetPasswordFormProps {
  token?: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>("validating");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Valida token ao carregar
  useEffect(() => {
    if (!token) {
      setFormState("invalid-token");
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`);
        const data = await response.json();

        if (!response.ok || !data.valid) {
          if (response.status === 410) {
            setFormState("expired-token");
          } else {
            setFormState("invalid-token");
          }
          return;
        }

        setFormState("idle");
      } catch {
        setFormState("invalid-token");
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear errors
    setFieldErrors({});
    setErrorMessage("");

    // Client-side validation
    const errors: Record<string, string> = {};

    if (password.length < 8) {
      errors.password = "Senha deve ter no mínimo 8 caracteres";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      errors.password = "Senha deve conter letra maiúscula, minúscula e número";
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "As senhas não conferem";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFormState("loading");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          confirmPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 410) {
          setFormState("expired-token");
          return;
        }
        if (response.status === 404) {
          setFormState("invalid-token");
          return;
        }
        setErrorMessage(data.error || "Erro ao redefinir senha");
        setFormState("error");
        return;
      }

      setFormState("success");

      // Redireciona para login após 3 segundos
      setTimeout(() => {
        router.push("/login?reset=success");
      }, 3000);
    } catch {
      setErrorMessage("Erro de conexão. Tente novamente.");
      setFormState("error");
    }
  };

  // Token Inválido
  if (formState === "invalid-token") {
    return (
      <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-red-bg rounded-full flex items-center justify-center">
          <XCircle className="w-8 h-8 text-red-text" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-default">
            Link inválido
          </h2>
          <p className="text-muted">
            Este link de recuperação é inválido ou já foi utilizado.
          </p>
        </div>

        <Link
          href="/forgot-password"
          className="inline-block w-full py-3 px-4 bg-primary-green hover:bg-green-600 text-white font-medium rounded-lg transition-colors text-center"
        >
          Solicitar novo link
        </Link>
      </div>
    );
  }

  // Token Expirado
  if (formState === "expired-token") {
    return (
      <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-amber-bg rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-amber-text" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-default">
            Link expirado
          </h2>
          <p className="text-muted">
            Este link de recuperação expirou. Por segurança, links expiram após 1 hora.
          </p>
        </div>

        <Link
          href="/forgot-password"
          className="inline-block w-full py-3 px-4 bg-primary-green hover:bg-green-600 text-white font-medium rounded-lg transition-colors text-center"
        >
          Solicitar novo link
        </Link>
      </div>
    );
  }

  // Validando Token
  if (formState === "validating") {
    return (
      <div className="text-center space-y-4 py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary-green mx-auto" />
        <p className="text-muted">Validando link...</p>
      </div>
    );
  }

  // Sucesso
  if (formState === "success") {
    return (
      <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-green-bg rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-text" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-default">
            Senha alterada!
          </h2>
          <p className="text-muted">
            Sua senha foi redefinida com sucesso. Você será redirecionado para o login.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Redirecionando...</span>
        </div>
      </div>
    );
  }

  // Formulário
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {formState === "error" && errorMessage && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-text flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-text">{errorMessage}</p>
        </div>
      )}

      {/* Password Input */}
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-default">
          Nova senha
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-muted" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={formState === "loading"}
            className={`block w-full pl-10 pr-12 py-3 bg-surface border rounded-lg text-default placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${fieldErrors.password ? "border-red-500" : "border-gray-border"
              }`}
            autoComplete="new-password"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-default transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {fieldErrors.password && (
          <p className="text-sm text-red-text">{fieldErrors.password}</p>
        )}
        <p className="text-xs text-muted">
          Mínimo 8 caracteres, com letra maiúscula, minúscula e número.
        </p>
      </div>

      {/* Confirm Password Input */}
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-default">
          Confirmar nova senha
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-muted" />
          </div>
          <input
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            disabled={formState === "loading"}
            className={`block w-full pl-10 pr-12 py-3 bg-surface border rounded-lg text-default placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${fieldErrors.confirmPassword ? "border-red-500" : "border-gray-border"
              }`}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-default transition-colors"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {fieldErrors.confirmPassword && (
          <p className="text-sm text-red-text">{fieldErrors.confirmPassword}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={formState === "loading"}
        className="w-full py-3 px-4 bg-primary-green hover:bg-green-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {formState === "loading" ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Redefinindo...
          </>
        ) : (
          "Redefinir senha"
        )}
      </button>

      {/* Back to Login */}
      <Link
        href="/login"
        className="block w-full py-2.5 text-center text-muted hover:text-default transition-colors"
      >
        Voltar para o login
      </Link>
    </form>
  );
}
