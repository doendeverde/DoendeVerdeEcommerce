/**
 * Subscription Checkout Client Component
 * 
 * Main checkout flow orchestrator with steps:
 * 1. Preferences (REQUIRED - user must define or confirm preferences)
 * 2. Address selection/creation
 * 3. Payment method selection
 * 4. PIX QR Code display (if PIX selected) or card processing
 * 5. Confirmation
 * 
 * This component manages state and coordinates between step components.
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Address } from "@prisma/client";
import type { PaymentMethod } from "@/types/checkout";
import type {
  CheckoutStepId,
  SubscriptionCheckoutPageData,
} from "@/types/subscription-checkout";

// Import step and UI components
import {
  PreferencesStep,
  AddressStep,
  PaymentStep,
  PixWaitingStep,
  CheckoutProgress,
  OrderSummary,
  ProcessingState,
  SuccessState,
  SubscriptionErrorState,
  ErrorState,
  type CardPaymentData,
  type PixPaymentData,
} from "@/components/checkout/subscription";

// Types
interface SubscriptionCheckoutClientProps {
  data: SubscriptionCheckoutPageData;
}

// Component
export function SubscriptionCheckoutClient({ data }: SubscriptionCheckoutClientProps) {
  const router = useRouter();

  // State
  const [currentStep, setCurrentStep] = useState<CheckoutStepId>(
    data.hasActiveSubscription ? "error" : "preferences"
  );
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    data.defaultAddressId
  );
  const [addresses, setAddresses] = useState<Address[]>(data.addresses);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PIX specific state
  const [pixData, setPixData] = useState<PixPaymentData | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isRegeneratingPix, setIsRegeneratingPix] = useState(false);

  // Navigation Handlers
  const goToAddress = useCallback(() => setCurrentStep("address"), []);
  const goToPayment = useCallback(() => setCurrentStep("payment"), []);
  const goBackToPreferences = useCallback(() => setCurrentStep("preferences"), []);
  const goBackToAddress = useCallback(() => setCurrentStep("address"), []);
  const goBackToPayment = useCallback(() => {
    setCurrentStep("payment");
    setPixData(null);
  }, []);

  // Address Handlers
  const handleAddressCreate = useCallback((address: Address) => {
    setAddresses(prev => [address, ...prev]);
  }, []);

  const handleAddressSelect = useCallback((id: string) => {
    setSelectedAddressId(id);
  }, []);

  /**
   * Handler para pagamento PIX.
   * 
   * Cria o pagamento PIX no backend e exibe o QR Code.
   * O usuário terá 30 minutos para pagar.
   * Polling verifica o status a cada 5 segundos.
   */
  const handlePixCheckout = useCallback(async () => {
    if (!selectedAddressId) {
      setError("Selecione um endereço de entrega");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSlug: data.plan.slug,
          addressId: selectedAddressId,
          paymentData: { method: "pix" },
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Erro ao gerar PIX");
        return;
      }

      // Extract PIX data from response
      if (result.data.paymentPreference) {
        const pref = result.data.paymentPreference;
        setPixData({
          paymentId: pref.id,
          qrCode: pref.qrCode || pref.pixCopyPaste || "",
          qrCodeBase64: pref.qrCodeBase64 || "",
          ticketUrl: pref.initPoint || "",
          expirationDate: pref.expirationDate
            ? new Date(pref.expirationDate)
            : new Date(Date.now() + 30 * 60 * 1000),
        });
        setOrderId(result.data.orderId);
        setCurrentStep("pix_waiting");
      } else {
        setError("Erro ao gerar QR Code PIX");
      }
    } catch {
      setError("Erro ao processar pagamento. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  }, [selectedAddressId, data.plan.slug]);

  /**
   * Handler para regenerar PIX (quando expira).
   */
  const handleRegeneratePix = useCallback(async () => {
    setIsRegeneratingPix(true);
    await handlePixCheckout();
    setIsRegeneratingPix(false);
  }, [handlePixCheckout]);

  /**
   * Handler quando pagamento PIX é confirmado.
   */
  const handlePixConfirmed = useCallback(() => {
    setCurrentStep("success");
  }, []);

  /**
   * Handler quando pagamento PIX falha.
   */
  const handlePixFailed = useCallback((errorMsg: string) => {
    setError(errorMsg);
    setCurrentStep("error");
  }, []);

  /**
   * Handler para pagamento com cartão via Checkout Bricks.
   * 
   * Recebe dados TOKENIZADOS do Mercado Pago (não os dados reais do cartão).
   * Isso mantém nosso backend FORA do escopo PCI-DSS.
   * 
   * O token é válido apenas para uma transação e expira em minutos.
   */
  const handleCardPaymentSubmit = useCallback(async (cardData: CardPaymentData) => {
    if (!selectedAddressId) {
      setError("Selecione um endereço de entrega");
      return;
    }

    setIsProcessing(true);
    setCurrentStep("processing");
    setError(null);

    try {
      // Envia dados tokenizados para o backend criar o pagamento
      const response = await fetch("/api/checkout/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSlug: data.plan.slug,
          addressId: selectedAddressId,
          paymentData: {
            method: paymentMethod, // credit_card ou debit_card
            // Dados tokenizados seguros - NÃO contêm número do cartão
            token: cardData.token,
            paymentMethodId: cardData.paymentMethodId,
            issuerId: cardData.issuerId,
            installments: cardData.installments,
            payerEmail: cardData.payerEmail,
            identificationType: cardData.identificationType,
            identificationNumber: cardData.identificationNumber,
          },
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Erro ao processar pagamento");
        setCurrentStep("error");
        return;
      }

      setCurrentStep("success");
    } catch {
      setError("Erro ao processar pagamento. Tente novamente.");
      setCurrentStep("error");
    } finally {
      setIsProcessing(false);
    }
  }, [selectedAddressId, paymentMethod, data.plan.slug]);

  // Render: Error state (active subscription)
  if (currentStep === "error" && data.hasActiveSubscription) {
    return <SubscriptionErrorState />;
  }

  // Render: Success state
  if (currentStep === "success") {
    return (
      <SuccessState
        planName={data.plan.name}
        benefits={data.plan.benefits}
      />
    );
  }

  // Render: Processing state
  if (currentStep === "processing") {
    return <ProcessingState />;
  }

  // Render: PIX Waiting Step (shows QR code and polls for confirmation)
  if (currentStep === "pix_waiting" && pixData && orderId) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <CheckoutHeader
          planName={data.plan.name}
          onBack={() => router.back()}
        />

        <div className="grid md:grid-cols-3 gap-6">
          {/* PIX QR Code Display */}
          <div className="md:col-span-2">
            <PixWaitingStep
              pixData={pixData}
              amount={data.plan.price}
              orderId={orderId}
              onBack={goBackToPayment}
              onPaymentConfirmed={handlePixConfirmed}
              onPaymentFailed={handlePixFailed}
              onRegeneratePix={handleRegeneratePix}
              isRegenerating={isRegeneratingPix}
            />
          </div>

          {/* Sidebar - Order Summary */}
          <div className="md:col-span-1">
            <OrderSummary plan={data.plan} />
          </div>
        </div>
      </div>
    );
  }

  // Render: Main checkout flow
  return (
    <div className="space-y-6">
      {/* Header */}
      <CheckoutHeader
        planName={data.plan.name}
        onBack={() => router.back()}
      />

      {/* Progress Steps */}
      <CheckoutProgress currentStep={currentStep} />

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Error Alert */}
          {error && currentStep === "error" && (
            <ErrorState
              error={error}
              onRetry={() => setCurrentStep("payment")}
            />
          )}

          {/* Step 1: Preferences */}
          {currentStep === "preferences" && (
            <PreferencesStep
              initialPreferences={data.preferences}
              hasExistingPreferences={data.hasPreferences}
              onContinue={goToAddress}
            />
          )}

          {/* Step 2: Address */}
          {currentStep === "address" && (
            <AddressStep
              addresses={addresses}
              selectedAddressId={selectedAddressId}
              onAddressSelect={handleAddressSelect}
              onAddressCreate={handleAddressCreate}
              onBack={goBackToPreferences}
              onContinue={goToPayment}
            />
          )}

          {/* Step 3: Payment */}
          {currentStep === "payment" && (
            <PaymentStep
              selectedMethod={paymentMethod}
              onMethodSelect={setPaymentMethod}
              onBack={goBackToAddress}
              onSubmit={handlePixCheckout}
              onCardPaymentSubmit={handleCardPaymentSubmit}
              isProcessing={isProcessing}
              amount={data.plan.price}
              payerEmail={data.user.email}
            />
          )}
        </div>

        {/* Sidebar - Order Summary */}
        <div className="md:col-span-1">
          <OrderSummary plan={data.plan} />
        </div>
      </div>
    </div>
  );
}

// Sub-component: Checkout Header
interface CheckoutHeaderProps {
  planName: string;
  onBack: () => void;
}

function CheckoutHeader({ planName, onBack }: CheckoutHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={onBack}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Voltar"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Assinar {planName}
        </h1>
        <p className="text-gray-600">
          Complete os passos abaixo para ativar sua assinatura
        </p>
      </div>
    </div>
  );
}