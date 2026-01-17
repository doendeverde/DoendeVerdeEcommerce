/**
 * Checkout Service
 * 
 * Orchestrates the checkout flow for subscriptions.
 * Handles validation, order creation, payment processing.
 */

import { prisma } from "@/lib/prisma";
import { subscriptionRepository } from "@/repositories/subscription.repository";
import * as addressRepository from "@/repositories/address.repository";
import * as orderRepository from "@/repositories/order.repository";
import * as paymentRepository from "@/repositories/payment.repository";
import type {
  SubscriptionCheckoutRequest,
  SubscriptionCheckoutResponse,
  PaymentPreference,
} from "@/types/checkout";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CheckoutValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: string;
}

interface UserCheckoutData {
  id: string;
  fullName: string;
  email: string;
  whatsapp: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate subscription checkout data
 */
async function validateSubscriptionCheckout(
  userId: string,
  data: SubscriptionCheckoutRequest
): Promise<CheckoutValidationResult> {
  // 1. Validate plan exists and is active
  const plan = await subscriptionRepository.findPlanBySlug(data.planSlug);
  if (!plan) {
    return {
      valid: false,
      error: "Plano não encontrado ou inativo",
      errorCode: "PLAN_NOT_FOUND",
    };
  }

  // 2. Check if user already has active subscription
  const hasActive = await subscriptionRepository.userHasAnyActiveSubscription(userId);
  if (hasActive) {
    return {
      valid: false,
      error: "Você já possui uma assinatura ativa. Cancele a atual antes de assinar outro plano.",
      errorCode: "ALREADY_SUBSCRIBED",
    };
  }

  // 3. Validate address exists and belongs to user
  const address = await addressRepository.findAddressById(data.addressId, userId);
  if (!address) {
    return {
      valid: false,
      error: "Endereço não encontrado",
      errorCode: "ADDRESS_NOT_FOUND",
    };
  }

  return { valid: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Checkout Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Process subscription checkout
 * Creates order, payment, and subscription records
 */
async function processSubscriptionCheckout(
  userId: string,
  user: UserCheckoutData,
  data: SubscriptionCheckoutRequest
): Promise<SubscriptionCheckoutResponse> {
  // 1. Validate checkout data
  const validation = await validateSubscriptionCheckout(userId, data);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
      errorCode: validation.errorCode,
    };
  }

  // 2. Get plan and address details
  const plan = await subscriptionRepository.findPlanBySlug(data.planSlug);
  if (!plan) {
    return { success: false, error: "Plano não encontrado", errorCode: "PLAN_NOT_FOUND" };
  }

  const address = await addressRepository.findAddressById(data.addressId, userId);
  if (!address) {
    return { success: false, error: "Endereço não encontrado", errorCode: "ADDRESS_NOT_FOUND" };
  }

  const planPrice = Number(plan.price);

  try {
    // 3. Create order with address snapshot
    const order = await orderRepository.createSubscriptionOrder(
      userId,
      plan.id,
      plan.name,
      planPrice,
      {
        fullName: user.fullName,
        whatsapp: user.whatsapp || "",
        street: address.street,
        number: address.number,
        complement: address.complement || undefined,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country,
      }
    );

    // 4. Create payment record
    const payment = await paymentRepository.createPayment({
      orderId: order.id,
      provider: "MERCADO_PAGO",
      amount: planPrice,
    });

    // 5. Process payment based on method
    let paymentPreference: PaymentPreference | undefined;

    if (data.paymentData.method === "pix") {
      // Generate PIX payment
      paymentPreference = await createPixPayment(order.id, payment.id, planPrice, user);
    } else {
      // Process card payment (credit/debit)
      const cardResult = await processCardPayment(
        order.id,
        payment.id,
        planPrice,
        data.paymentData,
        user
      );

      if (!cardResult.success) {
        // Mark payment as failed
        await paymentRepository.markPaymentAsFailed(payment.id, { error: cardResult.error });
        return {
          success: false,
          error: cardResult.error || "Falha ao processar pagamento",
          errorCode: "PAYMENT_FAILED",
        };
      }

      // Card payment approved - update payment and create subscription
      await paymentRepository.markPaymentAsPaid(
        payment.id,
        cardResult.transactionId,
        cardResult.payload
      );

      // Mark order as paid
      await orderRepository.markOrderAsPaid(order.id);

      // Create subscription
      const subscription = await subscriptionRepository.createSubscription({
        userId,
        planId: plan.id,
        provider: "MERCADO_PAGO",
        providerSubId: cardResult.transactionId,
      });

      // Create first cycle as paid
      await subscriptionRepository.createFirstCycle({
        subscriptionId: subscription.id,
        amount: planPrice,
        paymentId: payment.id,
      });

      return {
        success: true,
        subscriptionId: subscription.id,
        orderId: order.id,
        paymentId: payment.id,
      };
    }

    // For PIX: Return payment preference (user needs to pay)
    return {
      success: true,
      orderId: order.id,
      paymentId: payment.id,
      paymentPreference,
    };
  } catch (error) {
    console.error("Subscription checkout error:", error);
    return {
      success: false,
      error: "Erro ao processar assinatura. Tente novamente.",
      errorCode: "INTERNAL_ERROR",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment Processing (Mercado Pago Integration)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create PIX payment preference
 * TODO: Implement Mercado Pago SDK integration
 */
async function createPixPayment(
  orderId: string,
  paymentId: string,
  amount: number,
  user: UserCheckoutData
): Promise<PaymentPreference> {
  // TODO: Integrate with Mercado Pago SDK
  // const mp = new MercadoPago(process.env.MERCADO_PAGO_ACCESS_TOKEN);
  // const payment = await mp.payment.create({
  //   transaction_amount: amount,
  //   payment_method_id: 'pix',
  //   payer: { email: user.email },
  //   external_reference: orderId,
  // });

  // Placeholder response - replace with actual MP integration
  return {
    id: `pix_${paymentId}`,
    initPoint: `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=placeholder`,
    externalReference: orderId,
    qrCode: "00020126580014BR.GOV.BCB.PIX0136PLACEHOLDER_PIX_CODE",
    qrCodeBase64: "", // Base64 encoded QR code image
    pixCopyPaste: "00020126580014BR.GOV.BCB.PIX0136PLACEHOLDER_COPY_PASTE",
    expirationDate: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
  };
}

/**
 * Process card payment (credit/debit)
 * TODO: Implement Mercado Pago SDK integration
 */
async function processCardPayment(
  orderId: string,
  paymentId: string,
  amount: number,
  paymentData: SubscriptionCheckoutRequest["paymentData"],
  user: UserCheckoutData
): Promise<{ success: boolean; transactionId?: string; payload?: any; error?: string }> {
  // TODO: Integrate with Mercado Pago SDK
  // const mp = new MercadoPago(process.env.MERCADO_PAGO_ACCESS_TOKEN);
  // const payment = await mp.payment.create({
  //   transaction_amount: amount,
  //   token: paymentData.cardToken,
  //   installments: paymentData.installments || 1,
  //   payment_method_id: paymentData.method === 'credit_card' ? 'visa' : 'debvisa',
  //   payer: { email: user.email },
  //   external_reference: orderId,
  // });

  // Placeholder - in production, this should call Mercado Pago API
  if (!paymentData.cardToken) {
    return { success: false, error: "Token do cartão não fornecido" };
  }

  // Simulate successful payment for development
  // In production: Check payment.status from MP response
  return {
    success: true,
    transactionId: `mp_${Date.now()}`,
    payload: {
      method: paymentData.method,
      brand: paymentData.cardBrand,
      lastFour: paymentData.cardLastFour,
      installments: paymentData.installments,
      orderId,
    },
  };
}

/**
 * Handle Mercado Pago webhook notification
 * Called when payment status changes (especially for PIX)
 */
async function handlePaymentWebhook(
  paymentId: string,
  status: "approved" | "pending" | "rejected" | "cancelled",
  transactionId: string,
  payload: any
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find payment by transaction ID
    const payment = await paymentRepository.findPaymentByTransactionId(transactionId);
    
    if (!payment) {
      // Try finding by our internal payment ID stored in external_reference
      // This depends on how we set up the MP payment
      return { success: false, error: "Pagamento não encontrado" };
    }

    if (status === "approved") {
      // Update payment as paid
      await paymentRepository.markPaymentAsPaid(payment.id, transactionId, payload);

      // Update order as paid
      await orderRepository.markOrderAsPaid(payment.orderId);

      // Get order to find user
      const order = await orderRepository.findOrderById(payment.orderId);
      if (!order) {
        return { success: false, error: "Pedido não encontrado" };
      }

      // Find the plan from order items (subscription order has plan as item)
      const planItem = order.items[0];
      if (!planItem) {
        return { success: false, error: "Item do pedido não encontrado" };
      }

      // Check if subscription already exists (avoid duplicates)
      const hasSubscription = await subscriptionRepository.userHasActivePlanSubscription(
        order.userId,
        planItem.productId
      );

      if (!hasSubscription) {
        // Create subscription
        const subscription = await subscriptionRepository.createSubscription({
          userId: order.userId,
          planId: planItem.productId,
          provider: "MERCADO_PAGO",
          providerSubId: transactionId,
        });

        // Create first cycle
        await subscriptionRepository.createFirstCycle({
          subscriptionId: subscription.id,
          amount: Number(payment.amount),
          paymentId: payment.id,
        });
      }
    } else if (status === "rejected" || status === "cancelled") {
      await paymentRepository.markPaymentAsFailed(payment.id, payload);
    }

    return { success: true };
  } catch (error) {
    console.error("Webhook processing error:", error);
    return { success: false, error: "Erro ao processar webhook" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────

export const checkoutService = {
  validateSubscriptionCheckout,
  processSubscriptionCheckout,
  handlePaymentWebhook,
};
