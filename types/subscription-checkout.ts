/**
 * Subscription Checkout Types
 * 
 * Types specific to the subscription checkout flow.
 * Separated from general checkout types for clarity.
 */

import type { Address } from "@prisma/client";
import type { PaymentMethod } from "./checkout";

// ─────────────────────────────────────────────────────────────────────────────
// Enum Types (matching UserPreferences table)
// ─────────────────────────────────────────────────────────────────────────────

export type PaperType = "WHITE" | "BROWN" | "CELLULOSE" | "MIXED";
export type PaperSize = "MINI" | "KING_SIZE_SLIM" | "KING_SIZE_TRADITIONAL" | "KING_SIZE_LONG" | "MIXED";
export type FilterPaperSize = "SHORT" | "MEDIUM" | "LONG" | "ULTRA_LONG" | "MIXED";
export type GlassFilterSize = "SHORT" | "MEDIUM" | "LONG" | "MIXED";
export type GlassFilterThickness = "THIN" | "MEDIUM" | "THICK" | "MIXED";
export type TobaccoUsage = "FULL_TIME" | "MIX_ONLY" | "NONE";
export type ConsumptionFrequency = "OCCASIONAL" | "WEEKLY" | "DAILY" | "HEAVY";
export type ConsumptionMoment = "MORNING" | "AFTERNOON" | "NIGHT" | "WEEKEND";

// ─────────────────────────────────────────────────────────────────────────────
// Plan Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PlanData {
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

// ─────────────────────────────────────────────────────────────────────────────
// User Types
// ─────────────────────────────────────────────────────────────────────────────

export interface UserData {
  id: string;
  fullName: string;
  email: string;
  whatsapp: string | null;
}

export interface UserPreferencesData {
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

// ─────────────────────────────────────────────────────────────────────────────
// Checkout Data Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SubscriptionCheckoutPageData {
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

// ─────────────────────────────────────────────────────────────────────────────
// Step Types
// ─────────────────────────────────────────────────────────────────────────────

export type CheckoutStepId = "address" | "preferences" | "payment" | "pix_waiting" | "processing" | "success" | "error";

export interface StepConfig {
  id: CheckoutStepId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Form Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AddressFormData {
  label: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface PreferencesFormData {
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

// ─────────────────────────────────────────────────────────────────────────────
// Component Props Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CheckoutProgressProps {
  currentStep: CheckoutStepId;
}

export interface OrderSummaryProps {
  plan: PlanData;
}

export interface PreferencesStepProps {
  initialPreferences: UserPreferencesData | null;
  hasExistingPreferences: boolean;
  onSubmit: () => void;
  onPreferencesChange: (form: PreferencesFormData) => void;
  preferencesForm: PreferencesFormData;
  isLoading: boolean;
  error: string | null;
}

export interface AddressStepProps {
  addresses: Address[];
  selectedAddressId: string | null;
  onAddressSelect: (id: string) => void;
  onAddressCreate: (address: Address) => void;
  onBack: () => void;
  onContinue: () => void;
}

export interface PaymentStepProps {
  selectedMethod: PaymentMethod | null;
  onMethodSelect: (method: PaymentMethod) => void;
  onBack: () => void;
  onSubmit: () => void;
  isProcessing: boolean;
}

export interface ProcessingStateProps {
  message?: string;
}

export interface SuccessStateProps {
  planName: string;
  benefits: string[];
  onNavigate: () => void;
}

export interface ErrorStateProps {
  error: string;
  isSubscriptionError?: boolean;
  onRetry?: () => void;
  onNavigate?: () => void;
}
