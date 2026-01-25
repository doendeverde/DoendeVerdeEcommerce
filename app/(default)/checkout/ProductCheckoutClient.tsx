/**
 * Product Checkout Client Component
 *
 * Main checkout flow orchestrator for cart products with steps:
 * 1. Address selection/creation
 * 2. Payment method selection
 * 3. PIX QR Code display (if PIX selected) or card processing
 * 4. Confirmation
 *
 * This component manages state and coordinates between step components.
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShoppingBag,
  MapPin,
  CreditCard,
  CheckCircle,
} from "lucide-react";
import { roundMoney } from "@/lib/utils";
import type { Address } from "@prisma/client";
import type {
  PaymentMethod,
  CartCheckoutData,
  ProductCheckoutStepId,
} from "@/types/checkout";
import type { SelectedShippingOption } from "@/types/shipping";

// Reuse components from subscription checkout
import {
  AddressStep,
  PaymentStep,
  PixWaitingStep,
  type CardPaymentData,
  type PixPaymentData,
} from "@/components/checkout/subscription";

// Generic checkout components
import {
  CheckoutProgressGeneric,
  ProcessingState,
  GenericSuccessState,
  GenericErrorState,
} from "@/components/checkout";

// Local components
import { CheckoutCartSummary } from "./CheckoutCartSummary";

// Types
interface ProductCheckoutClientProps {
  data: CartCheckoutData;
}

// Checkout steps configuration
const CHECKOUT_STEPS = [
  { id: "address", label: "Endereço", icon: MapPin },
  { id: "payment", label: "Pagamento", icon: CreditCard },
  { id: "success", label: "Confirmação", icon: CheckCircle },
];

// Step aliases for progress display
const STEP_ALIASES: Record<string, string> = {
  pix_waiting: "payment",
};

// Component
export function ProductCheckoutClient({ data }: ProductCheckoutClientProps) {
  const router = useRouter();

  // State
  const [currentStep, setCurrentStep] =
    useState<ProductCheckoutStepId>("address");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    data.defaultAddressId
  );
  const [addresses, setAddresses] = useState(
    data.addresses.map((a) => ({
      ...a,
      userId: "",
      complement: a.complement ?? null,
      neighborhood: a.neighborhood,
      zipCode: a.zipCode,
      country: "BR",
      createdAt: new Date(),
      updatedAt: new Date(),
    })) as Address[]
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Shipping state
  const [selectedShippingOption, setSelectedShippingOption] = useState<SelectedShippingOption | null>(null);
  const [isShippingLoading, setIsShippingLoading] = useState(false);

  // PIX specific state
  const [pixData, setPixData] = useState<PixPaymentData | null>(null);
  const [isRegeneratingPix, setIsRegeneratingPix] = useState(false);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  // Navigation Handlers
  const goToPayment = useCallback(() => setCurrentStep("payment"), []);
  const goBackToAddress = useCallback(() => setCurrentStep("address"), []);
  const goBackToPayment = useCallback(() => {
    setCurrentStep("payment");
    setPixData(null);
  }, []);

  // Address Handlers
  const handleAddressCreate = useCallback((address: Address) => {
    setAddresses((prev) => [address, ...prev]);
    setSelectedAddressId(address.id);
  }, []);

  const handleAddressSelect = useCallback((id: string) => {
    // Clear shipping when address changes
    if (id !== selectedAddressId) {
      setSelectedShippingOption(null);
    }
    setSelectedAddressId(id);
  }, [selectedAddressId]);

  // Shipping Handlers
  const handleShippingSelect = useCallback((option: SelectedShippingOption | null) => {
    setSelectedShippingOption(option);
  }, []);

  const handleShippingLoadingChange = useCallback((loading: boolean) => {
    setIsShippingLoading(loading);
  }, []);

  /**
   * Handler para pagamento PIX.
   */
  const handlePixCheckout = useCallback(async () => {
    if (!selectedAddressId) {
      setError("Selecione um endereço de entrega");
      return;
    }

    if (!selectedShippingOption) {
      setError("Selecione uma opção de frete");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddressId,
          paymentData: { method: "pix" },
          shippingOption: selectedShippingOption,
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
  }, [selectedAddressId, selectedShippingOption]);

  /**
   * Handler para regenerar PIX (quando expira).
   */
  const handleRegeneratePix = useCallback(async () => {
    setIsRegeneratingPix(true);
    await handlePixCheckout();
    setIsRegeneratingPix(false);
  }, [handlePixCheckout]);

  /**
   * Handler para pagamento com cartão.
   */
  const handleCardCheckout = useCallback(
    async (cardData: CardPaymentData) => {
      if (!selectedAddressId) {
        setError("Selecione um endereço de entrega");
        return;
      }

      if (!selectedShippingOption) {
        setError("Selecione uma opção de frete");
        return;
      }

      if (!paymentMethod) {
        setError("Selecione um método de pagamento");
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const response = await fetch("/api/checkout/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            addressId: selectedAddressId,
            paymentData: {
              method: paymentMethod,
              token: cardData.token,
              paymentMethodId: cardData.paymentMethodId,
              issuerId: cardData.issuerId,
              installments: cardData.installments || 1,
              payerEmail: cardData.payerEmail,
              identificationType: cardData.identificationType,
              identificationNumber: cardData.identificationNumber,
            },
            shippingOption: selectedShippingOption,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          setError(result.error || "Erro ao processar pagamento");
          return;
        }

        setOrderId(result.data.orderId);
        setCurrentStep("success");
      } catch {
        setError("Erro ao processar pagamento. Tente novamente.");
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedAddressId, selectedShippingOption, paymentMethod]
  );

  /**
   * Handler para pagamento PIX confirmado.
   */
  const handlePixConfirmed = useCallback(() => {
    setCurrentStep("success");
  }, []);

  /**
   * Handler para pagamento PIX falhou.
   */
  const handlePixFailed = useCallback((errorMsg: string) => {
    setError(errorMsg);
    setCurrentStep("error");
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  // Processing state
  if (isProcessing) {
    return <ProcessingState message="Processando seu pedido..." />;
  }

  // Error state
  if (currentStep === "error") {
    return (
      <GenericErrorState
        title="Erro no Checkout"
        message={error || "Ocorreu um erro ao processar seu pedido."}
        onRetry={() => {
          setError(null);
          setCurrentStep("address");
        }}
        showBackButton
        backHref="/cart"
        backLabel="Voltar ao Carrinho"
      />
    );
  }

  // Success state
  if (currentStep === "success") {
    return (
      <GenericSuccessState
        title="Pedido Confirmado!"
        message="Seu pedido foi realizado com sucesso. Você receberá um email com os detalhes."
        orderId={orderId || undefined}
        icon="package"
        items={data.items.map((item) => `${item.quantity}x ${item.name}`)}
        primaryAction={{
          label: "Ver Meus Pedidos",
          href: "/orders",
        }}
        secondaryAction={{
          label: "Continuar Comprando",
          href: "/products",
        }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Steps */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push("/cart")}
            className="p-2 rounded-full hover-bg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-default" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-green/10 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-primary-green" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-default">
                Finalizar Compra
              </h1>
              <p className="text-sm text-muted">
                {data.items.length}{" "}
                {data.items.length === 1 ? "item" : "itens"} no carrinho
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <CheckoutProgressGeneric
          steps={CHECKOUT_STEPS}
          currentStep={currentStep}
          stepAliases={STEP_ALIASES}
        />

        {/* Error Alert (non-blocking errors) */}
        {error && (
          <div className="bg-red-bg border border-red-border rounded-lg p-4 text-red-text text-sm">
            {error}
          </div>
        )}

        {/* Step Content */}
        {currentStep === "address" && (
          <AddressStep
            addresses={addresses}
            selectedAddressId={selectedAddressId}
            onAddressSelect={handleAddressSelect}
            onAddressCreate={handleAddressCreate}
            onBack={() => router.push("/cart")}
            onContinue={goToPayment}
            productIds={data.items.map(item => item.productId)}
            selectedShippingOption={selectedShippingOption}
            onShippingSelect={handleShippingSelect}
            onShippingLoadingChange={handleShippingLoadingChange}
          />
        )}

        {currentStep === "payment" && (
          <PaymentStep
            selectedMethod={paymentMethod}
            onMethodSelect={setPaymentMethod}
            onSubmit={handlePixCheckout}
            onCardPaymentSubmit={handleCardCheckout}
            onBack={goBackToAddress}
            isProcessing={isProcessing}
            amount={roundMoney(data.subtotal - data.discount + (selectedShippingOption?.price || 0))}
            payerEmail={data.userEmail}
            isSubscription={false}
          />
        )}

        {currentStep === "pix_waiting" && pixData && orderId && (
          <PixWaitingStep
            pixData={pixData}
            amount={roundMoney(data.subtotal - data.discount + (selectedShippingOption?.price || 0))}
            orderId={orderId}
            onPaymentConfirmed={handlePixConfirmed}
            onPaymentFailed={handlePixFailed}
            onRegeneratePix={handleRegeneratePix}
            onBack={goBackToPayment}
            isRegenerating={isRegeneratingPix}
          />
        )}
      </div>

      {/* Right Column: Order Summary */}
      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <CheckoutCartSummary
            items={data.items}
            subtotal={data.subtotal}
            discount={data.discount}
            discountLabel={data.discountLabel}
            total={data.total}
            shippingOption={selectedShippingOption}
            isLoadingShipping={isShippingLoading}
          />
        </div>
      </div>
    </div>
  );
}
