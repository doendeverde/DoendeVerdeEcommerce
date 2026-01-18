/**
 * Payment Step Component
 * 
 * Step 3 of subscription checkout: Payment method selection.
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * PAYMENT METHODS:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * - PIX: Pagamento instantâneo via QR Code (flow separado)
 * - Cartão de Crédito/Débito: Via Mercado Pago Checkout Bricks
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SEGURANÇA - POR QUE CHECKOUT BRICKS:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 1. Dados do cartão NUNCA tocam nosso backend
 * 2. A tokenização é feita 100% pelo SDK do Mercado Pago
 * 3. Nosso backend recebe apenas o TOKEN (não o número do cartão)
 * 4. Isso nos mantém FORA do escopo PCI-DSS
 * 5. O formulário é renderizado em iframe seguro do MP
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * FLUXO DE TOKENIZAÇÃO:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 1. Usuário seleciona cartão e preenche dados no Brick
 * 2. SDK do MP tokeniza os dados e retorna um token
 * 3. Callback onCardPaymentSubmit recebe apenas:
 *    - token (string criptografada)
 *    - payment_method_id (visa, master, etc)
 *    - installments (parcelas)
 * 4. Backend usa o token para criar o pagamento via API do MP
 * 5. Nenhum dado sensível trafega pelo nosso sistema
 */

"use client";

import { useState, useCallback } from "react";
import { CreditCard, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import type { PaymentMethod } from "@/types/checkout";
import { CardPaymentBrick, type CardPaymentFormData } from "@/components/checkout/CardPaymentBrick";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dados de pagamento com cartão retornados pelo Brick.
 * Contém APENAS dados seguros (token, não o número do cartão).
 */
export interface CardPaymentData {
  token: string;
  paymentMethodId: string;
  issuerId: string;
  installments: number;
  payerEmail: string;
  identificationType?: string;
  identificationNumber?: string;
}

interface PaymentStepProps {
  /** Método selecionado (pix, credit_card, debit_card) */
  selectedMethod: PaymentMethod | null;
  /** Callback para mudar método */
  onMethodSelect: (method: PaymentMethod) => void;
  /** Voltar para step anterior */
  onBack: () => void;
  /** Callback para PIX (sem dados de cartão) */
  onSubmit: () => void;
  /** Callback para cartão (com dados tokenizados) */
  onCardPaymentSubmit?: (data: CardPaymentData) => Promise<void>;
  /** Se está processando */
  isProcessing: boolean;
  /** Valor total do pagamento (para o Brick) */
  amount: number;
  /** Email do pagador (pré-preenchido no Brick) */
  payerEmail?: string;
  /** Se é checkout de assinatura (afeta descrições e parcelas) */
  isSubscription?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment Method Options
// ─────────────────────────────────────────────────────────────────────────────

interface PaymentOption {
  value: PaymentMethod;
  title: string;
  subscriptionDescription: string;
  productDescription: string;
  subscriptionBadge?: string;
  productBadge?: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    value: "pix",
    title: "PIX",
    subscriptionDescription: "Pagamento instantâneo via QR Code",
    productDescription: "Pagamento instantâneo via QR Code",
    productBadge: "Instantâneo",
    subscriptionBadge: "Instantâneo",
  },
  {
    value: "credit_card",
    title: "Cartão de Crédito",
    subscriptionDescription: "Cobrança recorrente mensal",
    productDescription: "Pague em até 12x sem juros",
    subscriptionBadge: "Assinatura",
  },
  {
    value: "debit_card",
    title: "Cartão de Débito",
    subscriptionDescription: "Débito mensal recorrente",
    productDescription: "Pagamento à vista no débito",
    subscriptionBadge: "Assinatura",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function PaymentStep({
  selectedMethod,
  onMethodSelect,
  onBack,
  onSubmit,
  onCardPaymentSubmit,
  isProcessing,
  amount,
  payerEmail,
  isSubscription = true,
}: PaymentStepProps) {
  // Estado local para controlar se o Brick já submeteu
  const [cardSubmitted, setCardSubmitted] = useState(false);

  // Verifica se é método de cartão
  const isCardMethod = selectedMethod === "credit_card" || selectedMethod === "debit_card";

  // Pode submeter: PIX precisa apenas estar selecionado
  // Cartão precisa do Brick (o botão do Brick faz o submit)
  const canSubmitPix = selectedMethod === "pix";

  // Max installments: 1 para assinatura, 12 para produtos
  const maxInstallments = isSubscription ? 1 : 12;

  /**
   * Handler para quando o Brick do Mercado Pago retorna dados tokenizados.
   * 
   * IMPORTANTE: Os dados recebidos aqui são SEGUROS:
   * - token: string criptografada que representa o cartão
   * - paymentMethodId: bandeira do cartão (visa, master, etc)
   * - installments: número de parcelas selecionadas
   * 
   * NÃO contém: número do cartão, CVV, data de validade em texto plano
   */
  const handleCardPaymentSubmit = useCallback(async (data: CardPaymentFormData) => {
    if (!onCardPaymentSubmit) {
      console.error("[PaymentStep] onCardPaymentSubmit não definido");
      return;
    }

    setCardSubmitted(true);

    // Repassa os dados tokenizados para o componente pai
    await onCardPaymentSubmit({
      token: data.token,
      paymentMethodId: data.paymentMethodId,
      issuerId: data.issuerId,
      installments: data.installments,
      payerEmail: data.payerEmail,
      identificationType: data.identificationType,
      identificationNumber: data.identificationNumber,
    });
  }, [onCardPaymentSubmit]);

  /**
   * Handler de erro do Brick.
   * Reseta o estado de submit para permitir nova tentativa.
   */
  const handleCardPaymentError = useCallback((error: Error) => {
    console.error("[PaymentStep] Card payment error:", error);
    setCardSubmitted(false);
  }, []);

  /**
   * Handler para botão de submit (apenas para PIX).
   * Para cartão, o próprio Brick tem o botão de submit.
   */
  const handlePixSubmit = useCallback(() => {
    if (canSubmitPix) {
      onSubmit();
    }
  }, [canSubmitPix, onSubmit]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-primary-green" />
        Método de pagamento
      </h2>

      {/* Payment Options */}
      <div className="space-y-3">
        {PAYMENT_OPTIONS.map((option) => (
          <PaymentOptionCard
            key={option.value}
            option={option}
            isSelected={selectedMethod === option.value}
            onSelect={() => {
              // Reseta estado ao mudar método
              setCardSubmitted(false);
              onMethodSelect(option.value);
            }}
            disabled={isProcessing || cardSubmitted}
            isSubscription={isSubscription}
          />
        ))}
      </div>

      {/* 
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        MERCADO PAGO CHECKOUT BRICK (para cartão de crédito/débito)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        Este componente renderiza um formulário SEGURO do Mercado Pago.
        - O formulário é carregado em um iframe controlado pelo SDK do MP
        - Os dados do cartão são capturados e tokenizados DENTRO do iframe
        - Nosso código JavaScript NUNCA tem acesso aos dados reais do cartão
        - Recebemos apenas um token que representa o cartão de forma segura
        
        MODELO DE ASSINATURA:
        - maxInstallments=1 (sem parcelamento - cobrança mensal recorrente)
        - O cartão é tokenizado para cobranças futuras automáticas
        - A cada ciclo, o Mercado Pago processa a cobrança automaticamente
        
        Por que não usar redirect (Checkout Pro)?
        - Checkout Bricks mantém o usuário na página
        - Melhor UX (sem saída do site)
        - Mesmo nível de segurança (PCI compliance via MP)
      */}
      {isCardMethod && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
            <ShieldCheck className="w-4 h-4 text-primary-green" />
            <span>Preencha os dados do cartão de forma segura</span>
          </div>

          <CardPaymentBrick
            amount={amount}
            payerEmail={payerEmail}
            onSubmit={handleCardPaymentSubmit}
            onError={handleCardPaymentError}
            disabled={isProcessing || cardSubmitted}
            maxInstallments={maxInstallments}
          />
        </div>
      )}

      {/* Navigation - Botões de navegação */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={onBack}
          disabled={isProcessing || cardSubmitted}
          className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Voltar
        </button>

        {/* 
          Botão de submit mostrado APENAS para PIX.
          Para cartão, o Brick tem seu próprio botão de "Pagar".
        */}
        {selectedMethod === "pix" && (
          <button
            onClick={handlePixSubmit}
            disabled={!canSubmitPix || isProcessing}
            className="flex-1 py-3 bg-primary-green text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                Continuar com PIX
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        )}

        {/* Indicador de processamento para cartão */}
        {isCardMethod && (isProcessing || cardSubmitted) && (
          <div className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-lg font-medium flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processando pagamento...
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Payment Option Card
// ─────────────────────────────────────────────────────────────────────────────

interface PaymentOptionCardProps {
  option: PaymentOption;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  isSubscription: boolean;
}

function PaymentOptionCard({ option, isSelected, onSelect, disabled, isSubscription }: PaymentOptionCardProps) {
  const description = isSubscription ? option.subscriptionDescription : option.productDescription;
  const badge = isSubscription ? option.subscriptionBadge : option.productBadge;

  return (
    <label
      className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : ""
        } ${isSelected
          ? "border-primary-green bg-green-50"
          : "border-gray-200 hover:border-gray-300"
        }`}
    >
      <input
        type="radio"
        name="payment"
        value={option.value}
        checked={isSelected}
        onChange={onSelect}
        disabled={disabled}
        className="text-primary-green focus:ring-primary-green"
      />
      <div className="flex-1">
        <span className="font-medium text-gray-900">{option.title}</span>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      {badge && (
        <div className="bg-green-100 text-primary-green text-xs px-2 py-1 rounded-full font-medium">
          {badge}
        </div>
      )}
    </label>
  );
}
