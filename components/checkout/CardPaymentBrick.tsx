/**
 * Card Payment Brick Component
 * 
 * Componente isolado para o Checkout Bricks do Mercado Pago.
 * 
 * ⚠️ SEGURANÇA:
 * - Usa apenas public key (exposta no cliente)
 * - Retorna apenas token de pagamento
 * - Nunca armazena dados do cartão
 * - Backend é responsável por criar o pagamento real
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, AlertCircle, ShieldCheck } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CardPaymentFormData {
  token: string;
  paymentMethodId: string;
  issuerId: string;
  installments: number;
  payerEmail: string;
  identificationType?: string;
  identificationNumber?: string;
}

interface CardPaymentBrickProps {
  /** Valor total em reais (ex: 99.90) */
  amount: number;
  /** Email do pagador (pré-preenchido) */
  payerEmail?: string;
  /** Callback quando pagamento é submetido com sucesso */
  onSubmit: (data: CardPaymentFormData) => Promise<void>;
  /** Callback quando há erro */
  onError?: (error: Error) => void;
  /** Se o brick está desabilitado */
  disabled?: boolean;
  /** Máximo de parcelas permitidas */
  maxInstallments?: number;
}

type BrickStatus = "loading" | "ready" | "processing" | "error";

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function CardPaymentBrick({
  amount,
  payerEmail,
  onSubmit,
  onError,
  disabled = false,
  maxInstallments = 12,
}: CardPaymentBrickProps) {
  const brickContainerRef = useRef<HTMLDivElement>(null);
  const brickControllerRef = useRef<any>(null);
  const [status, setStatus] = useState<BrickStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  // Cleanup brick on unmount
  useEffect(() => {
    return () => {
      if (brickControllerRef.current) {
        brickControllerRef.current.unmount?.();
      }
    };
  }, []);

  // Initialize Mercado Pago Brick
  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

    if (!publicKey) {
      setError("Configuração de pagamento não encontrada");
      setStatus("error");
      return;
    }

    // Validação: verificar se está usando credenciais corretas
    const isProduction = process.env.MP_USE_PRODUCTION === "true";
    if (isProduction && !publicKey.startsWith("APP_USR-")) {
      console.error("⚠️  AVISO: MP_USE_PRODUCTION=true mas public key não começa com APP_USR-");
    } else if (!isProduction && !publicKey.startsWith("TEST-")) {
      console.error("⚠️  AVISO: MP_USE_PRODUCTION=false mas public key não começa com TEST-");
    }

    console.log(`[CardPaymentBrick] Inicializando em modo: ${isProduction ? "PRODUÇÃO" : "TESTE"}`);
    console.log(`[CardPaymentBrick] Public Key: ${publicKey.substring(0, 20)}...`);

    if (!brickContainerRef.current) return;

    let isMounted = true;

    const initializeBrick = async () => {
      try {
        // Dynamically import Mercado Pago SDK
        // Documentação: https://www.mercadopago.com.br/developers/pt/docs/sdks-library/client-side/mp-js-v2
        const { loadMercadoPago } = await import("@mercadopago/sdk-js");

        // loadMercadoPago() carrega o SDK e adiciona MercadoPago ao objeto window
        await loadMercadoPago();

        // Após carregar, instanciamos com a public key
        const mp = new (window as any).MercadoPago(publicKey);

        if (!isMounted) return;

        const bricksBuilder = mp.bricks();

        // Create Card Payment Brick
        const cardPaymentBrick = await bricksBuilder.create(
          "cardPayment",
          brickContainerRef.current!.id,
          {
            initialization: {
              amount,
              payer: {
                email: payerEmail || "",
              },
            },
            customization: {
              visual: {
                style: {
                  theme: "default",
                  customVariables: {
                    formBackgroundColor: "#ffffff",
                    baseColor: "#16a34a", // primary-green
                    formPadding: "16px",
                    borderRadius: "8px",
                  },
                },
                hideFormTitle: true,
                hidePaymentButton: false,
                texts: {
                  formTitle: "",
                  cardNumber: {
                    label: "Número do cartão",
                    placeholder: "0000 0000 0000 0000",
                  },
                  expirationDate: {
                    label: "Validade",
                    placeholder: "MM/AA",
                  },
                  securityCode: {
                    label: "CVV",
                    placeholder: "123",
                  },
                  cardholderName: {
                    label: "Nome no cartão",
                    placeholder: "Nome como está no cartão",
                  },
                  cardholderIdentification: {
                    label: "CPF",
                    placeholder: "000.000.000-00",
                  },
                  email: {
                    label: "E-mail",
                    placeholder: "seu@email.com",
                  },
                  installments: {
                    label: "Parcelas",
                  },
                },
              },
              paymentMethods: {
                maxInstallments,
                minInstallments: 1,
              },
            },
            callbacks: {
              onReady: () => {
                if (isMounted) {
                  setStatus("ready");
                }
              },
              onSubmit: async (formData: any) => {
                if (!isMounted) return;

                setStatus("processing");

                try {
                  // Extract only safe data
                  const paymentData: CardPaymentFormData = {
                    token: formData.token,
                    paymentMethodId: formData.payment_method_id,
                    issuerId: formData.issuer_id,
                    installments: formData.installments,
                    payerEmail: formData.payer?.email || payerEmail || "",
                    identificationType: formData.payer?.identification?.type,
                    identificationNumber: formData.payer?.identification?.number,
                  };

                  await onSubmit(paymentData);
                } catch (err) {
                  const error = err instanceof Error ? err : new Error("Erro ao processar pagamento");
                  setError(error.message);
                  setStatus("error");
                  onError?.(error);
                }
              },
              onError: (brickError: any) => {
                if (!isMounted) return;

                console.error("[CardPaymentBrick] Error:", brickError);
                const message = getBrickErrorMessage(brickError);
                setError(message);
                setStatus("error");
                onError?.(new Error(message));
              },
            },
          }
        );

        if (isMounted) {
          brickControllerRef.current = cardPaymentBrick;
        }
      } catch (err) {
        if (!isMounted) return;

        console.error("[CardPaymentBrick] Initialization error:", err);
        const message = err instanceof Error ? err.message : "Erro ao carregar formulário de pagamento";
        setError(message);
        setStatus("error");
        onError?.(err instanceof Error ? err : new Error(message));
      }
    };

    initializeBrick();

    return () => {
      isMounted = false;
    };
  }, [amount, payerEmail, maxInstallments, onSubmit, onError]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  if (status === "error" && error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Erro no pagamento</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm text-red-700 underline hover:no-underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Loading State */}
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary-green" />
            <span className="text-sm text-gray-500">Carregando formulário seguro...</span>
          </div>
        </div>
      )}

      {/* Processing State */}
      {status === "processing" && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10 rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary-green" />
            <span className="text-sm font-medium text-gray-700">Processando pagamento...</span>
            <span className="text-xs text-gray-500">Não feche esta página</span>
          </div>
        </div>
      )}

      {/* Disabled Overlay */}
      {disabled && (
        <div className="absolute inset-0 bg-gray-100/80 z-10 rounded-lg cursor-not-allowed" />
      )}

      {/* Brick Container */}
      <div
        id="cardPaymentBrick_container"
        ref={brickContainerRef}
        className="min-h-[400px]"
      />

      {/* Security Badge */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
        <ShieldCheck className="w-4 h-4" />
        <span>Pagamento seguro via Mercado Pago</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function getBrickErrorMessage(error: any): string {
  const errorMessages: Record<string, string> = {
    INVALID_CARD_NUMBER: "Número do cartão inválido",
    INVALID_CARD_EXPIRATION: "Data de validade inválida",
    INVALID_CARD_HOLDER_NAME: "Nome do titular inválido",
    INVALID_SECURITY_CODE: "Código de segurança inválido",
    INVALID_IDENTIFICATION: "CPF/CNPJ inválido",
    INVALID_EMAIL: "E-mail inválido",
    EMPTY_CARD_NUMBER: "Informe o número do cartão",
    EMPTY_SECURITY_CODE: "Informe o CVV",
    EMPTY_CARD_HOLDER_NAME: "Informe o nome do titular",
    EMPTY_CARD_EXPIRATION: "Informe a validade",
    CARD_TOKEN_CREATION_ERROR: "Erro ao processar cartão. Verifique os dados.",
    PAYMENT_METHOD_NOT_ALLOWED: "Método de pagamento não permitido",
    INSUFFICIENT_AMOUNT: "Valor inválido para pagamento",
  };

  if (typeof error === "string") {
    return errorMessages[error] || error;
  }

  if (error?.message) {
    return errorMessages[error.message] || error.message;
  }

  if (error?.cause) {
    return errorMessages[error.cause] || error.cause;
  }

  return "Erro ao processar pagamento";
}

export default CardPaymentBrick;
