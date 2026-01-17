/**
 * Subscription Checkout Client Component
 * 
 * Main checkout flow with steps:
 * 1. Preferences (REQUIRED - user must define or confirm preferences)
 * 2. Address selection/creation
 * 3. Payment method selection
 * 4. Confirmation
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Settings,
  CreditCard,
  Check,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Loader2,
  Crown,
} from "lucide-react";
import type { Address } from "@prisma/client";
import type { PaymentMethod } from "@/types/checkout";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface PlanData {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  billingCycle: string;
  discountPercent: number;
  monthlyPoints: number;
  benefits: string[];
  badge?: string;
}

interface UserData {
  id: string;
  fullName: string;
  email: string;
  whatsapp: string | null;
}

// Tipos que refletem a tabela UserPreferences
type PaperType = "WHITE" | "BROWN" | "CELLULOSE" | "MIXED";
type PaperSize = "MINI" | "KING_SIZE_SLIM" | "KING_SIZE_TRADITIONAL" | "KING_SIZE_LONG" | "MIXED";
type FilterPaperSize = "SHORT" | "MEDIUM" | "LONG" | "ULTRA_LONG" | "MIXED";
type GlassFilterSize = "SHORT" | "MEDIUM" | "LONG" | "MIXED";
type GlassFilterThickness = "THIN" | "MEDIUM" | "THICK" | "MIXED";
type TobaccoUsage = "FULL_TIME" | "MIX_ONLY" | "NONE";
type ConsumptionFrequency = "OCCASIONAL" | "WEEKLY" | "DAILY" | "HEAVY";
type ConsumptionMoment = "MORNING" | "AFTERNOON" | "NIGHT" | "WEEKEND";

interface UserPreferencesData {
  yearsSmoking: number | null;
  favoritePaperType: PaperType | null;
  favoritePaperSize: PaperSize | null;
  paperFilterSize: FilterPaperSize | null;
  glassFilterSize: GlassFilterSize | null;
  glassFilterThickness: GlassFilterThickness | null;
  favoriteColors: string[];
  tobaccoUsage: TobaccoUsage | null;
  consumptionFrequency: ConsumptionFrequency | null;
  consumptionMoment: ConsumptionMoment[];
  consumesFlower: boolean;
  consumesSkunk: boolean;
  consumesHash: boolean;
  consumesExtracts: boolean;
  consumesOilEdibles: boolean;
  likesAccessories: boolean;
  likesCollectibles: boolean;
  likesPremiumItems: boolean;
  notes: string | null;
}

interface CheckoutData {
  plan: PlanData;
  user: UserData;
  addresses: Address[];
  hasAddress: boolean;
  defaultAddressId: string | null;
  hasPreferences: boolean;
  preferencesComplete: boolean;
  preferencesSummary: string[];
  preferences: UserPreferencesData | null;
  hasActiveSubscription: boolean;
}

interface SubscriptionCheckoutClientProps {
  data: CheckoutData;
}

type CheckoutStep = "address" | "preferences" | "payment" | "processing" | "success" | "error";

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function SubscriptionCheckoutClient({ data }: SubscriptionCheckoutClientProps) {
  const router = useRouter();

  // State
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(
    data.hasActiveSubscription ? "error" : "preferences"
  );
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    data.defaultAddressId
  );
  const [addresses, setAddresses] = useState<Address[]>(data.addresses);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(
    data.hasActiveSubscription
      ? "Você já possui uma assinatura ativa. Cancele a atual antes de assinar outro plano."
      : null
  );

  // Preferences form state - reflete a tabela UserPreferences
  const [preferencesForm, setPreferencesForm] = useState({
    yearsSmoking: data.preferences?.yearsSmoking ?? null as number | null,
    favoritePaperType: data.preferences?.favoritePaperType ?? null as PaperType | null,
    favoritePaperSize: data.preferences?.favoritePaperSize ?? null as PaperSize | null,
    paperFilterSize: data.preferences?.paperFilterSize ?? null as FilterPaperSize | null,
    glassFilterSize: data.preferences?.glassFilterSize ?? null as GlassFilterSize | null,
    glassFilterThickness: data.preferences?.glassFilterThickness ?? null as GlassFilterThickness | null,
    favoriteColors: data.preferences?.favoriteColors ?? [] as string[],
    tobaccoUsage: data.preferences?.tobaccoUsage ?? null as TobaccoUsage | null,
    consumptionFrequency: data.preferences?.consumptionFrequency ?? null as ConsumptionFrequency | null,
    consumptionMoment: data.preferences?.consumptionMoment ?? [] as ConsumptionMoment[],
    consumesFlower: data.preferences?.consumesFlower ?? false,
    consumesSkunk: data.preferences?.consumesSkunk ?? false,
    consumesHash: data.preferences?.consumesHash ?? false,
    consumesExtracts: data.preferences?.consumesExtracts ?? false,
    consumesOilEdibles: data.preferences?.consumesOilEdibles ?? false,
    likesAccessories: data.preferences?.likesAccessories ?? false,
    likesCollectibles: data.preferences?.likesCollectibles ?? false,
    likesPremiumItems: data.preferences?.likesPremiumItems ?? false,
    notes: data.preferences?.notes ?? null as string | null,
  });
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const [preferencesTouched, setPreferencesTouched] = useState(false);

  // Address form state
  const [showAddressForm, setShowAddressForm] = useState(!data.hasAddress);
  const [addressForm, setAddressForm] = useState({
    label: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // Address Handlers
  // ─────────────────────────────────────────────────────────────────────────────

  const handleAddressSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressLoading(true);
    setAddressError(null);

    try {
      const response = await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressForm),
      });

      const result = await response.json();

      if (!result.success) {
        setAddressError(result.error || "Erro ao salvar endereço");
        return;
      }

      // Add new address to list and select it
      setAddresses(prev => [result.data, ...prev]);
      setSelectedAddressId(result.data.id);
      setShowAddressForm(false);

      // Reset form
      setAddressForm({
        label: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        zipCode: "",
      });
    } catch (err) {
      setAddressError("Erro ao salvar endereço. Tente novamente.");
    } finally {
      setAddressLoading(false);
    }
  }, [addressForm]);

  const handleAddressChange = useCallback((field: string, value: string) => {
    setAddressForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // CEP lookup
  const handleCepBlur = useCallback(async () => {
    const cep = addressForm.zipCode.replace(/\D/g, "");
    if (cep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setAddressForm(prev => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      }
    } catch {
      // Ignore CEP lookup errors
    }
  }, [addressForm.zipCode]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Checkout Handler
  // ─────────────────────────────────────────────────────────────────────────────

  const handleCheckout = useCallback(async () => {
    if (!selectedAddressId || !paymentMethod) {
      setError("Selecione um endereço e método de pagamento");
      return;
    }

    setIsProcessing(true);
    setCurrentStep("processing");
    setError(null);

    try {
      const response = await fetch("/api/checkout/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSlug: data.plan.slug,
          addressId: selectedAddressId,
          paymentData: {
            method: paymentMethod,
            // TODO: Add card token from Mercado Pago SDK for card payments
            cardToken: paymentMethod !== "pix" ? "test_token_placeholder" : undefined,
            cardBrand: paymentMethod !== "pix" ? "visa" : undefined,
            cardLastFour: paymentMethod !== "pix" ? "1234" : undefined,
            installments: 1,
          },
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Erro ao processar assinatura");
        setCurrentStep("error");
        return;
      }

      // Success!
      if (result.data.paymentPreference?.qrCode) {
        // PIX payment - show QR code
        // TODO: Implement PIX payment UI
        setCurrentStep("success");
      } else {
        // Card payment - subscription created
        setCurrentStep("success");
      }
    } catch (err) {
      setError("Erro ao processar pagamento. Tente novamente.");
      setCurrentStep("error");
    } finally {
      setIsProcessing(false);
    }
  }, [selectedAddressId, paymentMethod, data.plan.slug]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Navigation
  // ─────────────────────────────────────────────────────────────────────────────

  // Validação mínima de preferências (pelo menos frequência de consumo definida)
  const hasMinimumPreferences = 
    (data.hasPreferences || preferencesTouched) && 
    (preferencesForm.consumptionFrequency !== null);

  const canProceedFromPreferences = hasMinimumPreferences;
  const canProceedFromAddress = selectedAddressId !== null;
  const canProceedFromPayment = paymentMethod !== null;

  const goToAddress = () => setCurrentStep("address");
  const goToPayment = () => setCurrentStep("payment");
  const goBackToPreferences = () => setCurrentStep("preferences");
  const goBackToAddress = () => setCurrentStep("address");

  // Handler para salvar preferências e avançar
  const handlePreferencesSubmit = useCallback(async () => {
    if (!hasMinimumPreferences) return;
    
    setPreferencesLoading(true);
    setPreferencesError(null);

    try {
      const response = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferencesForm),
      });

      const result = await response.json();

      if (!result.success) {
        setPreferencesError(result.error || "Erro ao salvar preferências");
        return;
      }

      // Avançar para próxima etapa
      setCurrentStep("address");
    } catch (err) {
      setPreferencesError("Erro ao salvar preferências. Tente novamente.");
    } finally {
      setPreferencesLoading(false);
    }
  }, [preferencesForm, hasMinimumPreferences]);

  const handlePreferencesChange = useCallback(<T extends keyof typeof preferencesForm>(
    field: T, 
    value: typeof preferencesForm[T]
  ) => {
    setPreferencesTouched(true);
    setPreferencesForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  // Error state (e.g., already has subscription)
  if (currentStep === "error" && data.hasActiveSubscription) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-yellow-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Você já possui uma assinatura
        </h1>
        <p className="text-gray-600 mb-6">
          Cancele sua assinatura atual antes de assinar outro plano.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push("/subscriptions")}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Ver minha assinatura
          </button>
          <button
            onClick={() => router.push("/subscriptions")}
            className="px-6 py-3 bg-primary-green text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            Ver outros planos
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (currentStep === "success") {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-primary-green" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Assinatura realizada com sucesso! 🎉
        </h1>
        <p className="text-gray-600 mb-6">
          Bem-vindo ao plano <strong>{data.plan.name}</strong>!
          Agora você tem acesso a todos os benefícios exclusivos.
        </p>
        <div className="bg-green-50 rounded-xl p-4 mb-6 text-left max-w-md mx-auto">
          <h3 className="font-semibold text-gray-900 mb-2">Seus benefícios:</h3>
          <ul className="space-y-1">
            {data.plan.benefits.slice(0, 4).map((benefit, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-primary-green flex-shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-6 py-3 bg-primary-green text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
        >
          Ir para o Dashboard
        </button>
      </div>
    );
  }

  // Processing state
  if (currentStep === "processing") {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
        <Loader2 className="w-12 h-12 text-primary-green animate-spin mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Processando pagamento...
        </h1>
        <p className="text-gray-600">
          Aguarde enquanto processamos sua assinatura.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Assinar {data.plan.name}
          </h1>
          <p className="text-gray-600">
            Complete os passos abaixo para ativar sua assinatura
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          {[
            { id: "preferences", label: "Preferências", icon: Settings },
            { id: "address", label: "Endereço", icon: MapPin },
            { id: "payment", label: "Pagamento", icon: CreditCard },
          ].map((step, index) => {
            const isActive = currentStep === step.id;
            const isPast =
              (step.id === "preferences" && (currentStep === "address" || currentStep === "payment")) ||
              (step.id === "address" && currentStep === "payment");
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isPast
                        ? "bg-primary-green text-white"
                        : isActive
                          ? "bg-primary-green/10 text-primary-green border-2 border-primary-green"
                          : "bg-gray-100 text-gray-400"
                      }`}
                  >
                    {isPast ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs mt-1 ${isActive ? "text-primary-green font-medium" : "text-gray-500"}`}>
                    {step.label}
                  </span>
                </div>
                {index < 2 && (
                  <div className={`w-16 md:w-24 h-1 mx-2 rounded ${isPast ? "bg-primary-green" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Error Alert */}
          {error && currentStep === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">Erro ao processar</p>
                <p className="text-red-600 text-sm">{error}</p>
                <button
                  onClick={() => setCurrentStep("payment")}
                  className="text-red-700 text-sm font-medium hover:underline mt-2"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Address */}
          {currentStep === "address" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-green" />
                Endereço de entrega
              </h2>

              {/* Existing addresses */}
              {addresses.length > 0 && !showAddressForm && (
                <div className="space-y-3 mb-4">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${selectedAddressId === address.id
                          ? "border-primary-green bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={address.id}
                        checked={selectedAddressId === address.id}
                        onChange={() => setSelectedAddressId(address.id)}
                        className="mt-1 text-primary-green focus:ring-primary-green"
                      />
                      <div className="flex-1">
                        {address.label && (
                          <span className="text-sm font-medium text-gray-900">{address.label}</span>
                        )}
                        <p className="text-sm text-gray-600">
                          {address.street}, {address.number}
                          {address.complement && ` - ${address.complement}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          {address.neighborhood} - {address.city}/{address.state}
                        </p>
                        <p className="text-sm text-gray-500">CEP: {address.zipCode}</p>
                      </div>
                      {address.isDefault && (
                        <span className="text-xs bg-primary-green/10 text-primary-green px-2 py-1 rounded-full">
                          Padrão
                        </span>
                      )}
                    </label>
                  ))}
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-green hover:text-primary-green transition-colors"
                  >
                    + Adicionar novo endereço
                  </button>
                </div>
              )}

              {/* Address Form */}
              {(showAddressForm || addresses.length === 0) && (
                <form onSubmit={handleAddressSubmit} className="space-y-4">
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Voltar para endereços salvos
                    </button>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apelido (opcional)
                    </label>
                    <input
                      type="text"
                      value={addressForm.label}
                      onChange={(e) => handleAddressChange("label", e.target.value)}
                      placeholder="Ex: Casa, Trabalho"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CEP *
                      </label>
                      <input
                        type="text"
                        value={addressForm.zipCode}
                        onChange={(e) => handleAddressChange("zipCode", e.target.value.replace(/\D/g, "").slice(0, 8))}
                        onBlur={handleCepBlur}
                        placeholder="00000-000"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado *
                      </label>
                      <input
                        type="text"
                        value={addressForm.state}
                        onChange={(e) => handleAddressChange("state", e.target.value.toUpperCase().slice(0, 2))}
                        placeholder="UF"
                        required
                        maxLength={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => handleAddressChange("city", e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bairro *
                    </label>
                    <input
                      type="text"
                      value={addressForm.neighborhood}
                      onChange={(e) => handleAddressChange("neighborhood", e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rua *
                      </label>
                      <input
                        type="text"
                        value={addressForm.street}
                        onChange={(e) => handleAddressChange("street", e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número *
                      </label>
                      <input
                        type="text"
                        value={addressForm.number}
                        onChange={(e) => handleAddressChange("number", e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={addressForm.complement}
                      onChange={(e) => handleAddressChange("complement", e.target.value)}
                      placeholder="Apto, Bloco, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                    />
                  </div>

                  {addressError && (
                    <p className="text-sm text-red-600">{addressError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={addressLoading}
                    className="w-full py-3 bg-primary-green text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {addressLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar endereço"
                    )}
                  </button>
                </form>
              )}

              {/* Navigation buttons */}
              {!showAddressForm && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={goBackToPreferences}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={goToPayment}
                    disabled={!canProceedFromAddress}
                    className="flex-1 py-3 bg-primary-green text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Preferences (PRIMEIRO PASSO) */}
          {currentStep === "preferences" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary-green" />
                {data.hasPreferences ? "Revisar suas Preferências" : "Definir Preferências"}
              </h2>

              <p className="text-gray-600 mb-6">
                {data.hasPreferences 
                  ? "Confira se suas preferências estão atualizadas. Você pode editá-las antes de continuar."
                  : "Para personalizar sua experiência e kit, precisamos conhecer suas preferências."}
              </p>

              {/* Formulário de Preferências - reflete a tabela UserPreferences */}
              <div className="space-y-6">
                
                {/* Seção: Consumo */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-800 border-b pb-2">Sobre seu consumo</h3>
                  
                  {/* Frequência de consumo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequência de consumo *
                    </label>
                    <select
                      value={preferencesForm.consumptionFrequency ?? ""}
                      onChange={(e) => handlePreferencesChange("consumptionFrequency", e.target.value as ConsumptionFrequency || null)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                    >
                      <option value="">Selecione...</option>
                      <option value="OCCASIONAL">Ocasional</option>
                      <option value="WEEKLY">Semanal</option>
                      <option value="DAILY">Diário</option>
                      <option value="HEAVY">Frequente</option>
                    </select>
                  </div>

                  {/* Momentos de consumo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quando você costuma consumir?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "MORNING" as ConsumptionMoment, label: "Manhã" },
                        { value: "AFTERNOON" as ConsumptionMoment, label: "Tarde" },
                        { value: "NIGHT" as ConsumptionMoment, label: "Noite" },
                        { value: "WEEKEND" as ConsumptionMoment, label: "Final de semana" },
                      ].map((moment) => (
                        <label
                          key={moment.value}
                          className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                            preferencesForm.consumptionMoment.includes(moment.value)
                              ? "border-primary-green bg-green-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={preferencesForm.consumptionMoment.includes(moment.value)}
                            onChange={(e) => {
                              const newMoments = e.target.checked
                                ? [...preferencesForm.consumptionMoment, moment.value]
                                : preferencesForm.consumptionMoment.filter(m => m !== moment.value);
                              handlePreferencesChange("consumptionMoment", newMoments);
                            }}
                            className="text-primary-green focus:ring-primary-green rounded"
                          />
                          <span className="text-sm text-gray-700">{moment.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Anos fumando */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Há quantos anos você fuma?
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={preferencesForm.yearsSmoking ?? ""}
                      onChange={(e) => handlePreferencesChange("yearsSmoking", e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="Ex: 5"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Seção: O que você consome */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-800 border-b pb-2">O que você consome?</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { field: "consumesFlower" as const, label: "Flor" },
                      { field: "consumesSkunk" as const, label: "Skunk" },
                      { field: "consumesHash" as const, label: "Hash" },
                      { field: "consumesExtracts" as const, label: "Extratos" },
                      { field: "consumesOilEdibles" as const, label: "Óleos/Comestíveis" },
                    ].map((item) => (
                      <label
                        key={item.field}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          preferencesForm[item.field]
                            ? "border-primary-green bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={preferencesForm[item.field]}
                          onChange={(e) => handlePreferencesChange(item.field, e.target.checked)}
                          className="text-primary-green focus:ring-primary-green rounded"
                        />
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Seção: Preferências de papel */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-800 border-b pb-2">Preferências de seda</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de seda preferido
                      </label>
                      <select
                        value={preferencesForm.favoritePaperType ?? ""}
                        onChange={(e) => handlePreferencesChange("favoritePaperType", e.target.value as PaperType || null)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                      >
                        <option value="">Selecione...</option>
                        <option value="WHITE">Branca</option>
                        <option value="BROWN">Marrom</option>
                        <option value="CELLULOSE">Celulose</option>
                        <option value="MIXED">Variado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tamanho preferido
                      </label>
                      <select
                        value={preferencesForm.favoritePaperSize ?? ""}
                        onChange={(e) => handlePreferencesChange("favoritePaperSize", e.target.value as PaperSize || null)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                      >
                        <option value="">Selecione...</option>
                        <option value="MINI">Mini</option>
                        <option value="KING_SIZE_SLIM">King Size Slim</option>
                        <option value="KING_SIZE_TRADITIONAL">King Size Tradicional</option>
                        <option value="KING_SIZE_LONG">King Size Long</option>
                        <option value="MIXED">Variado</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tamanho de filtro de papel
                    </label>
                    <select
                      value={preferencesForm.paperFilterSize ?? ""}
                      onChange={(e) => handlePreferencesChange("paperFilterSize", e.target.value as FilterPaperSize || null)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                    >
                      <option value="">Selecione...</option>
                      <option value="SHORT">Curto</option>
                      <option value="MEDIUM">Médio</option>
                      <option value="LONG">Longo</option>
                      <option value="ULTRA_LONG">Ultra Longo</option>
                      <option value="MIXED">Variado</option>
                    </select>
                  </div>
                </div>

                {/* Seção: Piteira de vidro */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-800 border-b pb-2">Piteira de vidro</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tamanho
                      </label>
                      <select
                        value={preferencesForm.glassFilterSize ?? ""}
                        onChange={(e) => handlePreferencesChange("glassFilterSize", e.target.value as GlassFilterSize || null)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                      >
                        <option value="">Selecione...</option>
                        <option value="SHORT">Curta (2-4cm)</option>
                        <option value="MEDIUM">Média (4-6cm)</option>
                        <option value="LONG">Longa (6cm+)</option>
                        <option value="MIXED">Variado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Espessura
                      </label>
                      <select
                        value={preferencesForm.glassFilterThickness ?? ""}
                        onChange={(e) => handlePreferencesChange("glassFilterThickness", e.target.value as GlassFilterThickness || null)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                      >
                        <option value="">Selecione...</option>
                        <option value="THIN">Fina (2-4mm)</option>
                        <option value="MEDIUM">Média (4-6mm)</option>
                        <option value="THICK">Grossa (6mm+)</option>
                        <option value="MIXED">Variado</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Seção: Uso de tabaco */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-800 border-b pb-2">Tabaco</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Você usa tabaco?
                    </label>
                    <select
                      value={preferencesForm.tobaccoUsage ?? ""}
                      onChange={(e) => handlePreferencesChange("tobaccoUsage", e.target.value as TobaccoUsage || null)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                    >
                      <option value="">Selecione...</option>
                      <option value="FULL_TIME">Sempre</option>
                      <option value="MIX_ONLY">Só para misturar</option>
                      <option value="NONE">Não uso</option>
                    </select>
                  </div>
                </div>

                {/* Seção: Interesses */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-800 border-b pb-2">Seus interesses</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { field: "likesAccessories" as const, label: "Gosto de acessórios (dichavadores, piteiras, etc.)" },
                      { field: "likesCollectibles" as const, label: "Gosto de itens colecionáveis" },
                      { field: "likesPremiumItems" as const, label: "Prefiro itens premium" },
                    ].map((item) => (
                      <label
                        key={item.field}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          preferencesForm[item.field]
                            ? "border-primary-green bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={preferencesForm[item.field]}
                          onChange={(e) => handlePreferencesChange(item.field, e.target.checked)}
                          className="text-primary-green focus:ring-primary-green rounded"
                        />
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Cores favoritas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cores favoritas (para acessórios)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["Verde", "Preto", "Roxo", "Azul", "Vermelho", "Amarelo", "Rosa", "Branco"].map((color) => (
                      <label
                        key={color}
                        className={`px-3 py-1.5 rounded-full border-2 cursor-pointer transition-colors text-sm ${
                          preferencesForm.favoriteColors.includes(color.toLowerCase())
                            ? "border-primary-green bg-green-50 text-primary-green"
                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={preferencesForm.favoriteColors.includes(color.toLowerCase())}
                          onChange={(e) => {
                            const newColors = e.target.checked
                              ? [...preferencesForm.favoriteColors, color.toLowerCase()]
                              : preferencesForm.favoriteColors.filter(c => c !== color.toLowerCase());
                            handlePreferencesChange("favoriteColors", newColors);
                          }}
                          className="hidden"
                        />
                        {color}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações adicionais
                  </label>
                  <textarea
                    value={preferencesForm.notes ?? ""}
                    onChange={(e) => handlePreferencesChange("notes", e.target.value || null)}
                    placeholder="Algo mais que devemos saber sobre suas preferências?"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent resize-none"
                  />
                </div>
              </div>

              {/* Mensagem de validação */}
              {!hasMinimumPreferences && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    Selecione pelo menos sua frequência de consumo para continuar.
                  </p>
                </div>
              )}

              {preferencesError && (
                <p className="mt-4 text-sm text-red-600">{preferencesError}</p>
              )}

              <button
                onClick={handlePreferencesSubmit}
                disabled={!hasMinimumPreferences || preferencesLoading}
                className="w-full mt-6 py-3 bg-primary-green text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {preferencesLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 3: Payment */}
          {currentStep === "payment" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary-green" />
                Método de pagamento
              </h2>

              <div className="space-y-3">
                {/* PIX */}
                <label
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${paymentMethod === "pix"
                      ? "border-primary-green bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="pix"
                    checked={paymentMethod === "pix"}
                    onChange={() => setPaymentMethod("pix")}
                    className="text-primary-green focus:ring-primary-green"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">PIX</span>
                    <p className="text-sm text-gray-500">Pagamento instantâneo</p>
                  </div>
                  <div className="bg-green-100 text-primary-green text-xs px-2 py-1 rounded-full font-medium">
                    Instantâneo
                  </div>
                </label>

                {/* Credit Card */}
                <label
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${paymentMethod === "credit_card"
                      ? "border-primary-green bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="credit_card"
                    checked={paymentMethod === "credit_card"}
                    onChange={() => setPaymentMethod("credit_card")}
                    className="text-primary-green focus:ring-primary-green"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">Cartão de Crédito</span>
                    <p className="text-sm text-gray-500">Até 12x sem juros</p>
                  </div>
                </label>

                {/* Debit Card */}
                <label
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${paymentMethod === "debit_card"
                      ? "border-primary-green bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="debit_card"
                    checked={paymentMethod === "debit_card"}
                    onChange={() => setPaymentMethod("debit_card")}
                    className="text-primary-green focus:ring-primary-green"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">Cartão de Débito</span>
                    <p className="text-sm text-gray-500">Débito à vista</p>
                  </div>
                </label>
              </div>

              {/* Card form placeholder */}
              {(paymentMethod === "credit_card" || paymentMethod === "debit_card") && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 text-center">
                    {/* TODO: Integrate Mercado Pago card form */}
                    Formulário de cartão será carregado aqui via Mercado Pago SDK
                  </p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={goBackToAddress}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={!canProceedFromPayment || isProcessing}
                  className="flex-1 py-3 bg-primary-green text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      Finalizar assinatura
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Order Summary */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
            <h3 className="font-semibold text-gray-900 mb-4">Resumo</h3>

            {/* Plan Info */}
            <div className="flex items-start gap-3 pb-4 border-b border-gray-200">
              <div className="w-12 h-12 bg-primary-green/10 rounded-xl flex items-center justify-center">
                <Crown className="w-6 h-6 text-primary-green" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{data.plan.name}</h4>
                <p className="text-sm text-gray-500">{data.plan.description}</p>
                {data.plan.badge && (
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${data.plan.badge === "premium"
                      ? "bg-purple-100 text-primary-purple"
                      : "bg-green-100 text-primary-green"
                    }`}>
                    {data.plan.badge === "premium" ? "Premium" : "Mais popular"}
                  </span>
                )}
              </div>
            </div>

            {/* Benefits preview */}
            <div className="py-4 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Inclui:</p>
              <ul className="space-y-1">
                {data.plan.benefits.slice(0, 3).map((benefit, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-primary-green flex-shrink-0 mt-0.5" />
                    {benefit}
                  </li>
                ))}
                {data.plan.benefits.length > 3 && (
                  <li className="text-xs text-gray-500">
                    +{data.plan.benefits.length - 3} benefícios
                  </li>
                )}
              </ul>
            </div>

            {/* Pricing */}
            <div className="pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Plano mensal</span>
                <span className="text-gray-900">
                  R$ {data.plan.price.toFixed(2).replace(".", ",")}
                </span>
              </div>
              {data.plan.discountPercent > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Desconto em compras</span>
                  <span className="text-primary-green font-medium">
                    {data.plan.discountPercent}%
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="text-primary-green">
                  R$ {data.plan.price.toFixed(2).replace(".", ",")}/mês
                </span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Check className="w-4 h-4 text-primary-green" />
                Cancele quando quiser
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <Check className="w-4 h-4 text-primary-green" />
                Pagamento seguro
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
