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
 *   2. Gera PIX via Mercado Pago (Payment API)
 *   3. Retorna QR Code para frontend
 *   4. Webhook confirma pagamento → Cria Subscription
 * 
 * CARTÃO (Modelo Netflix/Spotify):
 *   1. Frontend tokeniza cartão (Checkout Bricks)
 *   2. Cria Order + Payment pendente
 *   3. COBRA PRIMEIRA MENSALIDADE via Payment API (síncrono)
 *   4. Se APROVADO:
 *      - Marca Order/Payment como PAID
 *      - Cria Preapproval com start_date = +30 dias
 *      - Cria Subscription no banco
 *   5. Cobranças futuras: MP processa via Preapproval automaticamente
 * 
 * VANTAGENS DO FLUXO CARTÃO:
 *   - Feedback IMEDIATO para o usuário (aprovado/recusado na hora)
 *   - Não depende de webhook para primeira ativação
 *   - Igual Netflix: "paga → libera acesso"
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
    // PAGAMENTO COM CARTÃO - FLUXO NETFLIX/SPOTIFY
    // Passo 1: Cobra AGORA via Payment API
    // Passo 2: Se aprovado, cria Preapproval com start_date FUTURO (+30 dias)
    // ───────────────────────────────────────────────────────────────────────
    if (isCardPayment(paymentData)) {
      console.log("\n" + "═".repeat(80));
      console.log("💳 FLUXO DE ASSINATURA COM CARTÃO (MODELO NETFLIX)");
      console.log("═".repeat(80));
      console.log("[Checkout] Order ID:", order.id);
      console.log("[Checkout] Card token received:", paymentData.token ? `${paymentData.token.substring(0, 20)}...` : "❌ MISSING!");
      console.log("[Checkout] Payment Method:", paymentData.paymentMethodId);
      
      // Validação: token é obrigatório
      if (!paymentData.token) {
        return NextResponse.json(
          { success: false, error: "Token do cartão é obrigatório", errorCode: "MISSING_CARD_TOKEN" },
          { status: 400 }
        );
      }
      
      // Import das funções do serviço
      const { 
        processInitialSubscriptionPayment, 
        createRecurringSubscription,
        calculateNextBillingDate,
      } = await import("@/services/subscription-mp.service");
      
      // ─────────────────────────────────────────────────────────────────────
      // PASSO 1: COBRA PRIMEIRA MENSALIDADE VIA PAYMENT API
      // ─────────────────────────────────────────────────────────────────────
      console.log("\n[Checkout] PASSO 1: Cobrando primeira mensalidade via Payment API...");
      
      const initialPaymentResult = await processInitialSubscriptionPayment({
        cardToken: paymentData.token,
        payerEmail: user.email,
        payerFirstName: firstName,
        payerLastName: lastName,
        planName: plan.name,
        amount: totalAmount,
        orderId: order.id,
        planId: plan.id,
        userId: user.id,
        paymentId: payment.id,
        paymentMethodId: paymentData.paymentMethodId,
        issuerId: paymentData.issuerId,
        identification: paymentData.identificationType && paymentData.identificationNumber
          ? {
              type: paymentData.identificationType,
              number: paymentData.identificationNumber,
            }
          : undefined,
      });

      // Se pagamento falhou ou foi rejeitado
      if (!initialPaymentResult.success || initialPaymentResult.status === "rejected") {
        console.log("[Checkout] ❌ Pagamento inicial RECUSADO:", initialPaymentResult.error);
        
        await paymentRepository.markPaymentAsFailed(payment.id, {
          error: initialPaymentResult.error,
          errorCode: initialPaymentResult.errorCode,
          statusDetail: initialPaymentResult.statusDetail,
          mpPaymentId: initialPaymentResult.paymentId,
        });
        
        return NextResponse.json(
          {
            success: false,
            error: initialPaymentResult.error || "Pagamento recusado. Verifique os dados do cartão.",
            errorCode: initialPaymentResult.errorCode || "PAYMENT_REJECTED",
          },
          { status: 400 }
        );
      }

      // Se pagamento está pendente (raro para cartão)
      if (initialPaymentResult.status === "pending" || initialPaymentResult.status === "in_process") {
        console.log("[Checkout] ⏳ Pagamento inicial em processamento...");
        
        await prisma.payment.update({
          where: { id: payment.id },
          data: { 
            transactionId: initialPaymentResult.paymentId,
            payload: {
              type: "subscription_initial",
              status: initialPaymentResult.status,
              statusDetail: initialPaymentResult.statusDetail,
            },
          },
        });

        return NextResponse.json({
          success: true,
          data: {
            orderId: order.id,
            paymentId: payment.id,
            mpPaymentId: initialPaymentResult.paymentId,
            status: "pending",
            message: "Pagamento sendo processado. Você receberá confirmação em breve.",
          },
        });
      }

      // ─────────────────────────────────────────────────────────────────────
      // PAGAMENTO APROVADO! Continua para criar recorrência
      // ─────────────────────────────────────────────────────────────────────
      console.log("[Checkout] ✅ PAGAMENTO INICIAL APROVADO!");
      console.log("[Checkout] MP Payment ID:", initialPaymentResult.paymentId);
      console.log("[Checkout] Card:", initialPaymentResult.cardBrand, "****", initialPaymentResult.cardLastFour);

      // Atualiza payment record com dados do pagamento aprovado
      await paymentRepository.markPaymentAsPaid(
        payment.id,
        initialPaymentResult.paymentId || "",
        { 
          type: "subscription_initial",
          cardLastFour: initialPaymentResult.cardLastFour,
          cardBrand: initialPaymentResult.cardBrand,
        }
      );

      // Marca order como paga
      await orderRepository.markOrderAsPaid(order.id);

      // ─────────────────────────────────────────────────────────────────────
      // PASSO 2: CRIA PREAPPROVAL COM START_DATE FUTURO (+30 DIAS)
      // ─────────────────────────────────────────────────────────────────────
      console.log("\n[Checkout] PASSO 2: Criando Preapproval com início em +30 dias...");
      
      const nextBillingDate = calculateNextBillingDate(30);
      
      const subscriptionResult = await createRecurringSubscription({
        cardToken: paymentData.token,
        payerEmail: user.email,
        planName: plan.name,
        amount: totalAmount,
        externalReference: order.id,
        frequencyMonths: 1, // Mensal
        startDate: nextBillingDate, // Primeira cobrança do Preapproval será em 30 dias
      });

      // Se Preapproval falhou, ainda temos o pagamento aprovado
      // A assinatura ficará ativa mas sem recorrência automática
      // (pode ser tratado manualmente ou via webhook posterior)
      if (!subscriptionResult.success) {
        console.error("[Checkout] ⚠️ AVISO: Pagamento aprovado, mas Preapproval FALHOU!");
        console.error("[Checkout] Erro:", subscriptionResult.error);
        
        // Mesmo assim, criamos subscription local (sem providerSubId)
        // Isso permite que o usuário tenha acesso, mas a cobrança futura precisará ser corrigida
        const subscription = await subscriptionRepository.createSubscription({
          userId,
          planId: plan.id,
          provider: "MERCADO_PAGO",
          providerSubId: undefined, // Será atualizado depois quando Preapproval for criado
          nextBillingDate: nextBillingDate,
        });

        await subscriptionRepository.createFirstCycle({
          subscriptionId: subscription.id,
          amount: totalAmount,
          paymentId: payment.id,
        });

        console.log("\n" + "=".repeat(80));
        console.log("🟡 ASSINATURA CRIADA (SEM RECORRÊNCIA AUTOMÁTICA)");
        console.log("   O pagamento foi aprovado, mas a recorrência NÃO foi configurada.");
        console.log("   Subscription ID:", subscription.id);
        console.log("   Erro do Preapproval:", subscriptionResult.error);
        console.log("   ⚠️ AÇÃO NECESSÁRIA: Corrigir manualmente ou tentar novamente");
        console.log("=".repeat(80) + "\n");

        return NextResponse.json({
          success: true,
          data: {
            subscriptionId: subscription.id,
            orderId: order.id,
            paymentId: payment.id,
            mpPaymentId: initialPaymentResult.paymentId,
            status: "approved",
            warning: "Pagamento aprovado, mas houve problema ao configurar recorrência. Entre em contato conosco.",
            message: "Primeira mensalidade paga com sucesso!",
          },
        });
      }

      // ─────────────────────────────────────────────────────────────────────
      // SUCESSO TOTAL: Pagamento + Preapproval criados!
      // ─────────────────────────────────────────────────────────────────────
      console.log("[Checkout] ✅ Preapproval criado com sucesso!");
      console.log("[Checkout] MP Subscription ID:", subscriptionResult.mpSubscriptionId);
      console.log("[Checkout] Status:", subscriptionResult.status);
      console.log("[Checkout] Next payment (Preapproval):", subscriptionResult.nextPaymentDate);

      // Cria subscription no banco
      const subscription = await subscriptionRepository.createSubscription({
        userId,
        planId: plan.id,
        provider: "MERCADO_PAGO",
        providerSubId: subscriptionResult.mpSubscriptionId!, // ID do Preapproval
        nextBillingDate: subscriptionResult.nextPaymentDate || nextBillingDate,
      });

      // Cria primeiro ciclo
      await subscriptionRepository.createFirstCycle({
        subscriptionId: subscription.id,
        amount: totalAmount,
        paymentId: payment.id,
      });

      console.log("\n" + "=".repeat(80));
      console.log("🟢 ASSINATURA CRIADA COM SUCESSO (MODELO NETFLIX)");
      console.log("═".repeat(80));
      console.log("   📋 Resumo:");
      console.log("   - Subscription ID:", subscription.id);
      console.log("   - MP Payment ID (inicial):", initialPaymentResult.paymentId);
      console.log("   - MP Subscription ID:", subscriptionResult.mpSubscriptionId);
      console.log("   - Plan:", plan.name);
      console.log("   - Amount: R$", totalAmount);
      console.log("   - Cartão:", initialPaymentResult.cardBrand, "****", initialPaymentResult.cardLastFour);
      console.log("");
      console.log("   📅 Cobranças:");
      console.log("   - Primeira mensalidade: PAGA AGORA via Payment API");
      console.log("   - Próxima cobrança (Preapproval):", subscriptionResult.nextPaymentDate);
      console.log("");
      console.log("   ⚡ Comportamento:");
      console.log("   - Cliente já tem acesso IMEDIATO");
      console.log("   - MP cobrará automaticamente em", subscriptionResult.nextPaymentDate);
      console.log("   - Webhook 'subscription_authorized_payment' para cada cobrança futura");
      console.log("═".repeat(80) + "\n");

      return NextResponse.json({
        success: true,
        data: {
          subscriptionId: subscription.id,
          mpSubscriptionId: subscriptionResult.mpSubscriptionId,
          mpPaymentId: initialPaymentResult.paymentId,
          orderId: order.id,
          paymentId: payment.id,
          status: "approved",
          nextPaymentDate: subscriptionResult.nextPaymentDate,
          cardLastFour: initialPaymentResult.cardLastFour,
          cardBrand: initialPaymentResult.cardBrand,
          message: "Assinatura ativada com sucesso! Primeira mensalidade paga.",
        },
      });
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
