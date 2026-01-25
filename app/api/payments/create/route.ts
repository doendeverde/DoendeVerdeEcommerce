/**
 * Payment Creation API
 * 
 * POST /api/payments/create
 * 
 * Cria um pagamento no Mercado Pago usando token do Card Payment Brick.
 * 
 * ⚠️ SEGURANÇA:
 * - Recebe APENAS token de pagamento (nunca dados do cartão)
 * - Calcula valor no backend (nunca confiar no client)
 * - access_token nunca é exposto ao cliente
 * - Valida ownership do pedido
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentApi } from "@/lib/mercadopago";
import { getMercadoPagoWebhookUrl } from "@/lib/environment";

// ─────────────────────────────────────────────────────────────────────────────
// Validation Schema
// ─────────────────────────────────────────────────────────────────────────────

const createPaymentSchema = z.object({
  // Token gerado pelo Brick (obrigatório)
  token: z.string().min(1, "Token de pagamento é obrigatório"),
  
  // Email do pagador
  email: z.string().email("E-mail inválido"),
  
  // Parcelas selecionadas
  installments: z.number().int().min(1).max(12).default(1),
  
  // ID do pedido interno (obrigatório)
  orderId: z.string().uuid("ID do pedido inválido"),
  
  // Dados de identificação (CPF) - opcional
  identificationType: z.string().optional(),
  identificationNumber: z.string().optional(),
  
  // Payment method ID do Mercado Pago
  paymentMethodId: z.string().optional(),
  
  // Issuer ID (banco emissor)
  issuerId: z.string().optional(),
});

export type CreatePaymentRequest = z.infer<typeof createPaymentSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Response Types
// ─────────────────────────────────────────────────────────────────────────────

interface PaymentResponse {
  success: boolean;
  data?: {
    paymentId: string;
    status: string;
    statusDetail: string;
    orderId: string;
  };
  error?: string;
  errorCode?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST Handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse<PaymentResponse>> {
  try {
    // 1. Autenticação
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Não autorizado", errorCode: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // 2. Validação do payload
    const body = await request.json();
    const validationResult = createPaymentSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: validationResult.error.issues[0]?.message || "Dados inválidos",
          errorCode: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const paymentData = validationResult.data;

    // 3. Buscar e validar pedido
    const order = await prisma.order.findUnique({
      where: { id: paymentData.orderId },
      include: {
        items: true,
        payments: {
          where: { status: "PAID" },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Pedido não encontrado", errorCode: "ORDER_NOT_FOUND" },
        { status: 404 }
      );
    }

    // 4. Validar ownership
    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Acesso negado", errorCode: "ACCESS_DENIED" },
        { status: 403 }
      );
    }

    // 5. Verificar se já foi pago
    if (order.payments.length > 0) {
      return NextResponse.json(
        { success: false, error: "Pedido já foi pago", errorCode: "ALREADY_PAID" },
        { status: 400 }
      );
    }

    // 6. ⚠️ IMPORTANTE: Calcular valor no backend
    // Nunca confiar no valor vindo do cliente
    const totalAmount = Number(order.totalAmount);

    if (totalAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Valor do pedido inválido", errorCode: "INVALID_AMOUNT" },
        { status: 400 }
      );
    }

    // 7. Criar pagamento no Mercado Pago
    console.log("[Payment] Creating payment for order:", order.id, "amount:", totalAmount);

    const mpPayment = await paymentApi.create({
      body: {
        transaction_amount: totalAmount,
        token: paymentData.token,
        description: `Pedido #${order.id.substring(0, 8)}`,
        installments: paymentData.installments,
        payment_method_id: paymentData.paymentMethodId,
        issuer_id: paymentData.issuerId ? Number(paymentData.issuerId) : undefined,
        payer: {
          email: paymentData.email,
          identification: paymentData.identificationType && paymentData.identificationNumber
            ? {
                type: paymentData.identificationType,
                number: paymentData.identificationNumber,
              }
            : undefined,
        },
        external_reference: order.id,
        statement_descriptor: "DOENDEVERDE",
        notification_url: getMercadoPagoWebhookUrl(),
        metadata: {
          order_id: order.id,
          user_id: session.user.id,
          integration: "checkout_bricks",
        },
      },
    });

    console.log("[Payment] MP Response:", {
      id: mpPayment.id,
      status: mpPayment.status,
      status_detail: mpPayment.status_detail,
    });

    // 8. Salvar registro de pagamento
    // ⚠️ Não salvamos token, número do cartão, CVV, data de validade
    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "MERCADO_PAGO",
        status: mapMPStatusToInternal(mpPayment.status || "pending"),
        amount: totalAmount,
        transactionId: mpPayment.id?.toString(),
        payload: {
          mp_id: mpPayment.id,
          status: mpPayment.status,
          status_detail: mpPayment.status_detail,
          payment_method_id: mpPayment.payment_method_id,
          payment_type_id: mpPayment.payment_type_id,
          installments: mpPayment.installments,
          // ❌ NUNCA salvar: token, card_number, cvv, expiration
        },
      },
    });

    // 9. Atualizar status do pedido se aprovado
    if (mpPayment.status === "approved") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "PAID" },
      });
    }

    // 10. Retornar status
    return NextResponse.json({
      success: true,
      data: {
        paymentId: mpPayment.id?.toString() || "",
        status: mpPayment.status || "pending",
        statusDetail: mpPayment.status_detail || "",
        orderId: order.id,
      },
    });
  } catch (error) {
    console.error("[Payment] Error creating payment:", error);
    
    // Handle Mercado Pago specific errors
    if (error instanceof Error && error.message.includes("card_token")) {
      return NextResponse.json(
        { success: false, error: "Token de cartão inválido ou expirado", errorCode: "INVALID_TOKEN" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Erro ao processar pagamento", errorCode: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function mapMPStatusToInternal(mpStatus: string): "PENDING" | "PAID" | "FAILED" | "REFUNDED" {
  const statusMap: Record<string, "PENDING" | "PAID" | "FAILED" | "REFUNDED"> = {
    pending: "PENDING",
    approved: "PAID",
    authorized: "PENDING",
    in_process: "PENDING",
    in_mediation: "PENDING",
    rejected: "FAILED",
    cancelled: "FAILED",
    refunded: "REFUNDED",
    charged_back: "REFUNDED",
  };
  
  return statusMap[mpStatus] || "PENDING";
}
