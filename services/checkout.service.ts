/**
 * Checkout Service
 * 
 * Orchestrates the checkout flow for subscriptions and products.
 * Handles validation, order creation, payment processing.
 */

import { prisma } from "@/lib/prisma";
import { subscriptionRepository } from "@/repositories/subscription.repository";
import { cartRepository } from "@/repositories/cart.repository";
import * as addressRepository from "@/repositories/address.repository";
import * as orderRepository from "@/repositories/order.repository";
import * as paymentRepository from "@/repositories/payment.repository";
import { createSubscriptionPayment, createPixPaymentDirect } from "./payment.service";
import { cartService } from "./cart.service";
import type {
  SubscriptionCheckoutRequest,
  SubscriptionCheckoutResponse,
  ProductCheckoutRequest,
  ProductCheckoutResponse,
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
 * Create PIX payment preference using Mercado Pago SDK
 */
async function createPixPayment(
  orderId: string,
  paymentId: string,
  amount: number,
  user: UserCheckoutData
): Promise<PaymentPreference> {
  try {
    const result = await createPixPaymentDirect({
      amount,
      description: `Pagamento pedido #${orderId}`,
      email: user.email,
      externalReference: orderId,
    });

    return {
      id: result.paymentId,
      initPoint: result.ticketUrl || "",
      externalReference: orderId,
      qrCode: result.qrCode,
      qrCodeBase64: result.qrCodeBase64,
      pixCopyPaste: result.pixCopyPaste,
      expirationDate: result.expirationDate,
    };
  } catch (error) {
    console.error("Error creating PIX payment:", error);
    // Return placeholder for error cases - frontend should handle this
    return {
      id: `pix_error_${paymentId}`,
      initPoint: "",
      externalReference: orderId,
      qrCode: "",
      qrCodeBase64: "",
      pixCopyPaste: "",
      expirationDate: new Date(Date.now() + 30 * 60 * 1000),
    };
  }
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
// Product Checkout Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate product checkout data
 */
async function validateProductCheckout(
  userId: string,
  data: ProductCheckoutRequest
): Promise<CheckoutValidationResult> {
  // 1. Get and validate cart
  const cart = await cartRepository.findOrCreateByUserId(userId);
  if (!cart || cart.items.length === 0) {
    return {
      valid: false,
      error: "Carrinho vazio",
      errorCode: "EMPTY_CART",
    };
  }

  // 2. Validate cart items (stock, availability)
  const cartValidation = await cartService.validateCartForCheckout(userId);
  if (!cartValidation.valid) {
    const issueMessages = cartValidation.issues.map(
      (i) => `${i.productName}: ${i.issue === "out_of_stock" ? "sem estoque" : i.details || i.issue}`
    );
    return {
      valid: false,
      error: `Problemas no carrinho: ${issueMessages.join(", ")}`,
      errorCode: "CART_VALIDATION_FAILED",
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

/**
 * Process product checkout from cart
 * Creates order, payment, and handles stock
 */
async function processProductCheckout(
  userId: string,
  user: UserCheckoutData,
  data: ProductCheckoutRequest
): Promise<ProductCheckoutResponse> {
  // 1. Validate checkout data
  const validation = await validateProductCheckout(userId, data);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
      errorCode: validation.errorCode,
    };
  }

  // 2. Get cart and address details
  const cart = await cartRepository.findOrCreateByUserId(userId);
  const address = await addressRepository.findAddressById(data.addressId, userId);
  if (!address) {
    return { success: false, error: "Endereço não encontrado", errorCode: "ADDRESS_NOT_FOUND" };
  }

  // 3. Calculate totals
  const subtotal = cart.items.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
    0
  );
  const shipping = 0; // TODO: Calculate shipping based on address
  const discount = 0; // TODO: Apply user subscription discount
  const total = subtotal + shipping - discount;

  try {
    // 4. Create order with items and address snapshot
    const orderItems = cart.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId || undefined,
      title: item.product.name + (item.variant ? ` - ${item.variant.name}` : ""),
      sku: item.variant?.sku,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.unitPrice) * item.quantity,
    }));

    const order = await orderRepository.createOrder(
      {
        userId,
        subtotalAmount: subtotal,
        discountAmount: discount,
        shippingAmount: shipping,
        totalAmount: total,
        notes: data.notes,
      },
      orderItems,
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

    // 5. Create payment record
    const payment = await paymentRepository.createPayment({
      orderId: order.id,
      provider: "MERCADO_PAGO",
      amount: total,
    });

    // 6. Process payment based on method
    let paymentPreference: PaymentPreference | undefined;

    if (data.paymentData.method === "pix") {
      // Generate PIX payment
      paymentPreference = await createPixPayment(order.id, payment.id, total, user);
      
      // Return - user needs to pay
      return {
        success: true,
        orderId: order.id,
        paymentId: payment.id,
        paymentPreference,
      };
    } else {
      // Process card payment (credit/debit)
      const cardResult = await processCardPayment(
        order.id,
        payment.id,
        total,
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

      // Card payment approved - update payment
      await paymentRepository.markPaymentAsPaid(
        payment.id,
        cardResult.transactionId,
        cardResult.payload
      );

      // Mark order as paid
      await orderRepository.markOrderAsPaid(order.id);

      // Decrease stock for each item
      await decreaseStock(cart.items);

      // Clear cart
      await cartRepository.clearCart(cart.id);

      return {
        success: true,
        orderId: order.id,
        paymentId: payment.id,
      };
    }
  } catch (error) {
    console.error("Product checkout error:", error);
    return {
      success: false,
      error: "Erro ao processar pedido. Tente novamente.",
      errorCode: "INTERNAL_ERROR",
    };
  }
}

/**
 * Decrease product stock after successful payment
 */
async function decreaseStock(
  items: Array<{
    productId: string;
    variantId: string | null;
    quantity: number;
  }>
): Promise<void> {
  for (const item of items) {
    if (item.variantId) {
      // Decrease variant stock
      await prisma.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      });
    } else {
      // Decrease product stock
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
  }
}

/**
 * Handle product payment confirmation (PIX webhook)
 */
async function handleProductPaymentConfirmation(
  orderId: string,
  paymentId: string,
  transactionId: string,
  payload: any
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get order with items
    const order = await orderRepository.findOrderById(orderId);
    if (!order) {
      return { success: false, error: "Pedido não encontrado" };
    }

    // Update payment as paid
    await paymentRepository.markPaymentAsPaid(paymentId, transactionId, payload);

    // Mark order as paid
    await orderRepository.markOrderAsPaid(orderId);

    // Decrease stock for each item
    const stockItems = order.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
    }));
    await decreaseStock(stockItems);

    // Clear user's cart (find cart by userId)
    const cart = await cartRepository.findOrCreateByUserId(order.userId);
    await cartRepository.clearCart(cart.id);

    return { success: true };
  } catch (error) {
    console.error("Product payment confirmation error:", error);
    return { success: false, error: "Erro ao confirmar pagamento" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────

export const checkoutService = {
  validateSubscriptionCheckout,
  processSubscriptionCheckout,
  handlePaymentWebhook,
  // Product checkout
  validateProductCheckout,
  processProductCheckout,
  handleProductPaymentConfirmation,
};
