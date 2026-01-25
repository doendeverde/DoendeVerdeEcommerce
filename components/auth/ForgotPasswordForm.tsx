/**
 * Forgot Password Form Component
 * 
 * Formulário para solicitar recuperação de senha.
 * Envia email para o backend que dispara o fluxo de reset.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle, AlertCircle } from "lucide-react";

type FormState = "idle" | "loading" | "success" | "error";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setErrorMessage("Email é obrigatório");
      setFormState("error");
      return;
    }

    setFormState("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "Erro ao enviar solicitação");
        setFormState("error");
        return;
      }

      setFormState("success");
    } catch {
      setErrorMessage("Erro de conexão. Tente novamente.");
      setFormState("error");
    }
  };

  // Success State
  if (formState === "success") {
    return (
      <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-green-bg rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-text" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-default">
            Email enviado!
          </h2>
          <p className="text-muted">
            Se o email <strong>{email}</strong> estiver cadastrado, você receberá um link para recuperação.
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <strong>Dica:</strong> Verifique também a pasta de spam.
            O link expira em 1 hora.
          </p>
        </div>

        <div className="pt-4 space-y-3">
          <button
            onClick={() => {
              setFormState("idle");
              setEmail("");
            }}
            className="w-full py-2.5 px-4 text-primary-green font-medium hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
          >
            Enviar para outro email
          </button>

          <Link
            href="/login"
            className="block w-full py-2.5 px-4 text-center text-muted hover:text-default hover:bg-hover-bg rounded-lg transition-colors"
          >
            Voltar para o login
          </Link>
        </div>
      </div>
    );
  }

  // Form State
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {formState === "error" && errorMessage && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-text flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-text">{errorMessage}</p>
        </div>
      )}

      {/* Email Input */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-default">
          Email
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-muted" />
          </div>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            disabled={formState === "loading"}
            className="block w-full pl-10 pr-4 py-3 bg-surface border border-gray-border rounded-lg text-default placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            autoComplete="email"
            autoFocus
          />
        </div>
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
            Enviando...
          </>
        ) : (
          "Enviar link de recuperação"
        )}
      </button>

      {/* Back to Login */}
      <Link
        href="/login"
        className="flex items-center justify-center gap-2 w-full py-2.5 text-muted hover:text-default transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para o login
      </Link>
    </form>
  );
}
