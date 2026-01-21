/**
 * Checkout Types
 * 
 * Types for subscription and product checkout flows.
 * Includes address, preferences, payment, and order data structures.
 */

import type { Address, UserPreferences, PaymentProvider, PaymentStatus } from "@prisma/client";
import type { SelectedShippingOption } from "./shipping";

// ─────────────────────────────────────────────────────────────────────────────
// Address Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AddressFormData {
  label?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  isDefault?: boolean;
}

export interface AddressDisplay extends AddressFormData {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Preferences Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PreferencesFormData {
  yearsSmoking?: number;
  favoritePaperType?: string;
  favoritePaperSize?: string;
  paperFilterSize?: string;
  glassFilterSize?: string;
  glassFilterThickness?: string;
  favoriteColors?: string[];
  tobaccoUsage?: string;
  consumptionFrequency?: string;
  consumptionMoment?: string[];
  consumesFlower?: boolean;
  consumesSkunk?: boolean;
  consumesHash?: boolean;
  consumesExtracts?: boolean;
  consumesOilEdibles?: boolean;
  likesAccessories?: boolean;
  likesCollectibles?: boolean;
  likesPremiumItems?: boolean;
  notes?: string;
}

export interface PreferencesDisplay extends PreferencesFormData {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment Types
// ─────────────────────────────────────────────────────────────────────────────

export type PaymentMethod = "credit_card" | "debit_card" | "pix";

export interface PaymentFormData {
  method: PaymentMethod;
  // Credit/Debit card fields (via Mercado Pago SDK)
  cardToken?: string;
  cardBrand?: string;
  cardLastFour?: string;
  installments?: number;
  // PIX doesn't need additional fields
}

export interface PaymentPreference {
  id: string;
  initPoint: string;
  sandboxInitPoint?: string;
  externalReference: string;
  // PIX specific
  qrCode?: string;
  qrCodeBase64?: string;
  pixCopyPaste?: string;
  expirationDate?: Date;
}

export interface PaymentResult {
  id: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  transactionId?: string;
  amount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Checkout Session Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CheckoutStep {
  id: "address" | "preferences" | "payment" | "confirmation";
  title: string;
  description: string;
  completed: boolean;
  enabled: boolean;
}

export interface SubscriptionCheckoutData {
  planSlug: string;
  planId: string;
  planName: string;
  planPrice: number;
  billingCycle: string;
  // User data status
  hasAddress: boolean;
  hasPreferences: boolean;
  // Selected data
  selectedAddressId?: string;
  // Payment
  paymentMethod?: PaymentMethod;
  paymentData?: PaymentFormData;
}

export interface SubscriptionCheckoutRequest {
  planSlug: string;
  addressId: string;
  paymentData: PaymentFormData;
  /** Selected shipping option with price and details */
  shippingOption?: SelectedShippingOption;
}

export interface SubscriptionCheckoutResponse {
  success: boolean;
  subscriptionId?: string;
  orderId?: string;
  paymentId?: string;
  // For PIX payments
  paymentPreference?: PaymentPreference;
  // Error handling
  error?: string;
  errorCode?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Product Checkout Types (Cart)
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductCheckoutRequest {
  addressId: string;
  paymentData: PaymentFormData;
  notes?: string;
  /** Selected shipping option with price and details */
  shippingOption?: SelectedShippingOption;
}

export interface ProductCheckoutResponse {
  success: boolean;
  orderId?: string;
  paymentId?: string;
  // For PIX payments
  paymentPreference?: PaymentPreference;
  // Error handling
  error?: string;
  errorCode?: string;
}

export interface CartCheckoutData {
  items: {
    productId: string;
    variantId?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    image?: string;
  }[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  hasAddress: boolean;
  addresses: {
    id: string;
    label?: string;
    street: string;
    number: string;
    complement?: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    isDefault: boolean;
  }[];
  defaultAddressId: string | null;
}

export type ProductCheckoutStepId = "address" | "payment" | "pix_waiting" | "success" | "error";

// ─────────────────────────────────────────────────────────────────────────────
// Order Types (for subscription orders)
// ─────────────────────────────────────────────────────────────────────────────

export interface SubscriptionOrderData {
  userId: string;
  planId: string;
  planName: string;
  planPrice: number;
  addressId: string;
}

export interface OrderSummary {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  currency: string;
  items: {
    title: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}
