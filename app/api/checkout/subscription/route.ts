/**
 * Subscription Checkout API
 * 
 * POST /api/checkout/subscription - Process subscription checkout
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * FLUXO DE PAGAMENTO:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * PIX:
 *   1. Cria Order + Payment pendente
 *   2. Gera PIX via Mercado Pago
 *   3. Retorna QR Code para frontend
 *   4. Webhook confirma pagamento → Cria Subscription
 * 
 * CARTÃO:
 *   1. Frontend tokeniza cartão (Checkout Bricks)
 *   2. Cria Order + Payment pendente
 *   3. Processa pagamento com token
 *   4. Se aprovado: Cria Subscription imediatamente
 *   5. Se pendente: Webhook confirma → Cria Subscription
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SEGURANÇA:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * - Requer autenticação
 * - Valida ownership de endereço
 * - Preços calculados no SERVER (nunca confiar no client)
 * - Token de cartão validado pelo Mercado Pago
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schemas
import {
  selectedShippingOptionSchema,
  validatePaymentData,
  isPixPayment,
  isCardPayment,
} from "@/schemas/checkout.schema";

// Services
import {
  createPixPayment,
  // Card payment imports removidos - agora usamos Preapproval para subscriptions
} from "@/services/mercadopago.service";

// Repositories
import { subscriptionRepository } from "@/repositories/subscription.repository";
import * as addressRepository from "@/repositories/address.repository";
import * as orderRepository from "@/repositories/order.repository";
import * as paymentRepository from "@/repositories/payment.repository";

// Utils
import { shippingService } from "@/services/shipping.service";

// ─────────────────────────────────────────────────────────────────────────────
// Request Schema
// ─────────────────────────────────────────────────────────────────────────────

const requestSchema = z.object({
  planSlug: z.string().min(1, "Plano é obrigatório"),
  addressId: z.string().uuid("ID de endereço inválido"),
  paymentData: z.unknown(), // Validado separadamente com discriminated union
  shippingOption: selectedShippingOptionSchema.optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// POST - Process subscription checkout
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    console.log("[Checkout Subscription] ════════════════════════════════════════");
    console.log("[Checkout Subscription] Starting subscription checkout...");
    
    // ═══════════════════════════════════════════════════════════════════════
    // 1. AUTENTICAÇÃO + VERIFICAÇÃO DE BLOQUEIO
    // ═══════════════════════════════════════════════════════════════════════
    const session = await auth();
    
    console.log("[Checkout Subscription] Session:", session?.user?.id ? "✓ Authenticated" : "✗ Not authenticated");
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Não autorizado. Faça login para continuar.",
          errorCode: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    // Check if user is blocked
    if (session.user.status === "BLOCKED") {
      console.log("[Checkout Subscription] User is BLOCKED - rejecting");
      return NextResponse.json(
        { 
          success: false, 
          error: "Conta bloqueada. Entre em contato com o suporte.",
          errorCode: "USER_BLOCKED",
        },
        { status: 403 }
      );
    }

    const userId = session.user.id;
    console.log("[Checkout Subscription] User ID:", userId);

    // ═══════════════════════════════════════════════════════════════════════
    // 2. PARSE E VALIDAÇÃO DO BODY
    // ═══════════════════════════════════════════════════════════════════════
    let body: unknown;
    try {
      body = await request.json();
      console.log("[Checkout Subscription] Request body:", JSON.stringify(body, null, 2));
    } catch (err) {
      console.error("[Checkout Subscription] Failed to parse JSON:", err);
      return NextResponse.json(
        { 
          success: false, 
          error: "Body da requisição inválido",
          errorCode: "INVALID_JSON",
        },
        { status: 400 }
      );
    }

    // Validação do schema base
    const baseValidation = requestSchema.safeParse(body);
    if (!baseValidation.success) {
      const details = baseValidation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      
      return NextResponse.json(
        {
          success: false,
          error: details[0]?.message || "Dados inválidos",
          errorCode: "VALIDATION_ERROR",
          details,
        },
        { status: 400 }
      );
    }

    const { planSlug, addressId, shippingOption } = baseValidation.data;
    console.log("[Checkout Subscription] Validated input:", { planSlug, addressId, hasShipping: !!shippingOption });

    // ═══════════════════════════════════════════════════════════════════════
    // 3. VALIDAÇÃO DO PAYMENT DATA (discriminated union)
    // ═══════════════════════════════════════════════════════════════════════
    console.log("[Checkout Subscription] Validating payment data...");
    const paymentValidation = validatePaymentData((body as any).paymentData);
    if (!paymentValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: paymentValidation.error,
          errorCode: "PAYMENT_VALIDATION_ERROR",
          details: paymentValidation.details,
        },
        { status: 400 }
      );
    }

    const paymentData = paymentValidation.data;
    console.log("[Checkout Subscription] Payment method:", paymentData.method);

    // ═══════════════════════════════════════════════════════════════════════
    // 4. BUSCA E VALIDAÇÃO DE DADOS
    // ═══════════════════════════════════════════════════════════════════════
    console.log("[Checkout Subscription] Fetching user, plan, and address...");
    
    // Usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        whatsapp: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Usuário não encontrado",
          errorCode: "USER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Plano
    console.log("[Checkout Subscription] Searching for plan:", planSlug);
    const plan = await subscriptionRepository.findPlanBySlug(planSlug);
    console.log("[Checkout Subscription] Plan found:", plan ? `✓ ${plan.name} (ID: ${plan.id})` : "✗ Not found");
    if (!plan) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Plano não encontrado ou inativo",
          errorCode: "PLAN_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Verifica assinatura ativa
    console.log("[Checkout Subscription] Checking for active subscriptions...");
    const hasActiveSubscription = await subscriptionRepository.userHasAnyActiveSubscription(userId);
    console.log("[Checkout Subscription] Active subscription:", hasActiveSubscription ? "✗ Already has one" : "✓ None");
    if (hasActiveSubscription) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Você já possui uma assinatura ativa. Cancele a atual antes de assinar outro plano.",
          errorCode: "ALREADY_SUBSCRIBED",
        },
        { status: 400 }
      );
    }

    // Endereço (valida ownership)
    console.log("[Checkout Subscription] Fetching address:", addressId);
    const address = await addressRepository.findAddressById(addressId, userId);
    console.log("[Checkout Subscription] Address:", address ? `✓ ${address.street}, ${address.number}` : "✗ Not found");
    if (!address) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Endereço não encontrado",
          errorCode: "ADDRESS_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 5. CÁLCULO DE VALORES (SERVER É FONTE DA VERDADE)
    // ═══════════════════════════════════════════════════════════════════════
    const planPrice = Number(plan.price);
    const shippingAmount = shippingOption?.price || 0;
    const totalAmount = Math.round((planPrice + shippingAmount) * 100) / 100;
    
    console.log("[Checkout Subscription] Amounts:", {
      planPrice,
      shippingAmount,
      totalAmount,
    });

    const orderShippingData = shippingOption
      ? shippingService.buildOrderShippingData(shippingOption, address.zipCode)
      : null;

    // ═══════════════════════════════════════════════════════════════════════
    // 6. CRIA ORDER
    // ═══════════════════════════════════════════════════════════════════════
    console.log("[Checkout Subscription] Creating order...");
    console.log("[Checkout Subscription] Order data:", {
      userId,
      planId: plan.id,
      planName: plan.name,
      planPrice,
      shippingAmount,
    });
    
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
      },
      shippingAmount,
      orderShippingData as Record<string, unknown> | null
    );
    
    console.log("[Checkout Subscription] Order created:", order.id);

    // ═══════════════════════════════════════════════════════════════════════
    // 7. CRIA PAYMENT PENDENTE
    // ═══════════════════════════════════════════════════════════════════════
    console.log("[Checkout Subscription] Creating payment record...");
    const payment = await paymentRepository.createPayment({
      orderId: order.id,
      provider: "MERCADO_PAGO",
      amount: totalAmount,
    });
    
    console.log("[Checkout Subscription] Payment created:", payment.id);

    // ═══════════════════════════════════════════════════════════════════════
    // 8. PROCESSA PAGAMENTO
    // ═══════════════════════════════════════════════════════════════════════
    console.log("[Checkout Subscription] Processing payment with Mercado Pago...");
    
    const nameParts = user.fullName.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const basePaymentRequest = {
      amount: totalAmount,
      description: `Assinatura ${plan.name}`,
      externalReference: order.id,
      payer: {
        email: user.email,
        firstName,
        lastName,
      },
      metadata: {
        type: "subscription",
        planId: plan.id,
        planSlug: plan.slug,
        userId: user.id,
        orderId: order.id,
        paymentId: payment.id,
      },
    };

    // ───────────────────────────────────────────────────────────────────────
    // PAGAMENTO PIX
    // ───────────────────────────────────────────────────────────────────────
    if (isPixPayment(paymentData)) {
      console.log("[Checkout] Processing PIX payment for order:", order.id);
      
      const pixResult = await createPixPayment(basePaymentRequest);
      
      if (!pixResult.success) {
        await paymentRepository.markPaymentAsFailed(payment.id, { 
          error: pixResult.error,
          errorCode: pixResult.errorCode,
        });
        
        return NextResponse.json(
          {
            success: false,
            error: pixResult.error || "Erro ao gerar PIX",
            errorCode: pixResult.errorCode || "PIX_ERROR",
          },
          { status: 400 }
        );
      }

      // Atualiza payment com transactionId do MP E dados do PIX para recuperação
      if (pixResult.paymentId) {
        const pixExpiresAt = pixResult.expirationDate || new Date(Date.now() + 30 * 60 * 1000);
        
        await prisma.payment.update({
          where: { id: payment.id },
          data: { 
            transactionId: pixResult.paymentId,
            // Persistir dados PIX para recuperação futura
            pixQrCode: pixResult.qrCode || pixResult.pixCopyPaste || null,
            pixQrCodeBase64: pixResult.qrCodeBase64 || null,
            pixTicketUrl: pixResult.ticketUrl || null,
            pixExpiresAt: pixExpiresAt,
          },
        });
        
        // Log destacado para testes de webhook
        console.log("\n" + "=".repeat(80));
        console.log("🔵 PIX PAYMENT ID (Subscription - use para webhook):", pixResult.paymentId);
        console.log("   Order ID:", order.id);
        console.log("   Plan:", plan.name);
        console.log("   Amount: R$", order.totalAmount);
        if (pixResult.ticketUrl) {
          console.log("\n   🎫 TICKET URL (abra para aprovar com conta teste):");
          console.log("   ", pixResult.ticketUrl);
        }
        console.log("=".repeat(80) + "\n");
      }

      return NextResponse.json({
        success: true,
        data: {
          orderId: order.id,
          paymentId: payment.id,
          status: pixResult.status || "pending",
          paymentPreference: {
            id: pixResult.paymentId || payment.id,
            qrCode: pixResult.qrCode || "",
            qrCodeBase64: pixResult.qrCodeBase64 || "",
            pixCopyPaste: pixResult.pixCopyPaste || "",
            initPoint: pixResult.ticketUrl || "",
            expirationDate: pixResult.expirationDate || new Date(Date.now() + 30 * 60 * 1000),
          },
        },
      });
    }

    // ───────────────────────────────────────────────────────────────────────
    // PAGAMENTO COM CARTÃO - USANDO PREAPPROVAL (RECORRÊNCIA REAL)
    // ───────────────────────────────────────────────────────────────────────
    if (isCardPayment(paymentData)) {
      console.log("[Checkout] Processing card subscription with PREAPPROVAL for order:", order.id);
      console.log("[Checkout] ⚠️ Using Mercado Pago Subscriptions API (not Checkout Pro)");
      console.log("[Checkout] Card token received:", paymentData.token ? `${paymentData.token.substring(0, 20)}...` : "❌ MISSING!");
      
      // Validação: token é obrigatório
      if (!paymentData.token) {
        return NextResponse.json(
          { success: false, error: "Token do cartão é obrigatório", errorCode: "MISSING_CARD_TOKEN" },
          { status: 400 }
        );
      }
      
      // Import do serviço de subscription com Preapproval
      const { createRecurringSubscription } = await import("@/services/subscription-mp.service");
      
      // Cria assinatura recorrente REAL via Preapproval API
      // MP irá:
      // 1. Validar o cartão e fazer primeira cobrança
      // 2. Cobrar automaticamente todo mês
      // 3. Fazer retry automático se falhar
      // 4. Enviar webhook a cada cobrança (subscription_authorized_payment)
      const subscriptionResult = await createRecurringSubscription({
        cardToken: paymentData.token,
        payerEmail: user.email,
        planName: plan.name,
        amount: totalAmount,
        externalReference: order.id,
        frequencyMonths: 1, // Mensal
      });
      
      if (!subscriptionResult.success) {
        console.log("[Checkout] ❌ Preapproval subscription creation failed:", subscriptionResult.error);
        
        await paymentRepository.markPaymentAsFailed(payment.id, {
          error: subscriptionResult.error,
          errorCode: subscriptionResult.errorCode,
        });
        
        return NextResponse.json(
          {
            success: false,
            error: subscriptionResult.error || "Erro ao criar assinatura recorrente",
            errorCode: subscriptionResult.errorCode || "SUBSCRIPTION_ERROR",
          },
          { status: 400 }
        );
      }

      console.log("[Checkout] ✅ Preapproval subscription created:", subscriptionResult.mpSubscriptionId);
      console.log("[Checkout] Status:", subscriptionResult.status);
      console.log("[Checkout] Next payment:", subscriptionResult.nextPaymentDate);

      // Atualiza payment com dados do Preapproval
      await prisma.payment.update({
        where: { id: payment.id },
        data: { 
          transactionId: subscriptionResult.mpSubscriptionId,
          payload: {
            type: "preapproval",
            mpSubscriptionId: subscriptionResult.mpSubscriptionId,
            status: subscriptionResult.status,
            nextPaymentDate: subscriptionResult.nextPaymentDate,
          },
        },
      });

      // Se status = authorized, a assinatura está ativa e primeira cobrança será feita
      if (subscriptionResult.status === "authorized") {
        console.log("[Checkout] Preapproval AUTHORIZED - Creating subscription record");
        
        // Marca pagamento como pago (primeira parcela será cobrada pelo MP)
        await paymentRepository.markPaymentAsPaid(
          payment.id,
          subscriptionResult.mpSubscriptionId || "",
          { 
            status: "authorized",
            type: "preapproval",
          }
        );

        await orderRepository.markOrderAsPaid(order.id);

        // Cria subscription no banco com providerSubId = ID do Preapproval do MP
        const subscription = await subscriptionRepository.createSubscription({
          userId,
          planId: plan.id,
          provider: "MERCADO_PAGO",
          providerSubId: subscriptionResult.mpSubscriptionId!, // ID real do MP Subscriptions
        });

        // Cria primeiro ciclo
        await subscriptionRepository.createFirstCycle({
          subscriptionId: subscription.id,
          amount: totalAmount,
          paymentId: payment.id,
        });

        console.log("\n" + "=".repeat(80));
        console.log("🟢 ASSINATURA RECORRENTE CRIADA COM SUCESSO (PREAPPROVAL)");
        console.log("   MP Subscription ID:", subscriptionResult.mpSubscriptionId);
        console.log("   Internal Subscription ID:", subscription.id);
        console.log("   Plan:", plan.name);
        console.log("   Amount: R$", totalAmount);
        console.log("   Next Payment:", subscriptionResult.nextPaymentDate);
        console.log("\n   ⚠️ IMPORTANTE: O Mercado Pago irá:");
        console.log("   - Cobrar automaticamente todo mês");
        console.log("   - Enviar webhook 'subscription_authorized_payment' a cada cobrança");
        console.log("   - Fazer retry automático se pagamento falhar");
        console.log("=".repeat(80) + "\n");

        return NextResponse.json({
          success: true,
          data: {
            subscriptionId: subscription.id,
            mpSubscriptionId: subscriptionResult.mpSubscriptionId,
            orderId: order.id,
            paymentId: payment.id,
            status: "authorized",
            nextPaymentDate: subscriptionResult.nextPaymentDate,
            message: "Assinatura recorrente criada com sucesso! O Mercado Pago irá cobrar automaticamente.",
          },
        });
      }

      // Status pending = aguardando processamento
      if (subscriptionResult.status === "pending") {
        console.log("[Checkout] Preapproval PENDING - Waiting for MP processing");
        
        return NextResponse.json({
          success: true,
          data: {
            orderId: order.id,
            paymentId: payment.id,
            mpSubscriptionId: subscriptionResult.mpSubscriptionId,
            status: "pending",
            message: "Assinatura sendo processada. Você receberá confirmação em breve.",
          },
        });
      }

      // Outros status = erro
      await paymentRepository.markPaymentAsFailed(payment.id, {
        status: subscriptionResult.status,
        mpSubscriptionId: subscriptionResult.mpSubscriptionId,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Não foi possível ativar a assinatura. Verifique os dados do cartão e tente novamente.",
          errorCode: "SUBSCRIPTION_NOT_AUTHORIZED",
        },
        { status: 400 }
      );
    }

    // Método não suportado
    return NextResponse.json(
      {
        success: false,
        error: "Método de pagamento não suportado",
        errorCode: "UNSUPPORTED_PAYMENT_METHOD",
      },
      { status: 400 }
    );

  } catch (error) {
    console.error("[Checkout Subscription] ✗ UNEXPECTED ERROR ✗");
    console.error("[Checkout Subscription] Error:", error);
    
    if (error instanceof Error) {
      console.error("[Checkout Subscription] Error name:", error.name);
      console.error("[Checkout Subscription] Error message:", error.message);
      console.error("[Checkout Subscription] Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Erro interno ao processar assinatura. Tente novamente.",
        errorCode: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
