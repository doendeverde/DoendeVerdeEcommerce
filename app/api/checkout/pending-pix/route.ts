/**
 * Pending PIX Payment API
 * 
 * GET /api/checkout/pending-pix - Recupera pagamento PIX pendente do usuário
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * PROPÓSITO:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Permite que o usuário recupere um pagamento PIX pendente mesmo após:
 * - Fechar o navegador
 * - Atualizar a página
 * - Perder conexão
 * 
 * O sistema consulta o banco de dados para encontrar qualquer PIX pendente
 * que ainda não expirou, e retorna os dados necessários para exibir o QR Code.
 * 
 * Isso garante que o usuário NUNCA perca um PIX gerado antes de pagar.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Busca pagamento PIX pendente do usuário que ainda não expirou
    const pendingPixPayment = await prisma.payment.findFirst({
      where: {
        order: {
          userId: userId,
        },
        status: "PENDING",
        provider: "MERCADO_PAGO",
        pixQrCode: { not: null },
        pixExpiresAt: { gt: new Date() }, // Ainda não expirou
      },
      include: {
        order: {
          select: {
            id: true,
            totalAmount: true,
            notes: true, // Contém info do plano para subscription orders
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Mais recente primeiro
      },
    });

    if (!pendingPixPayment) {
      return NextResponse.json({
        success: true,
        hasPendingPix: false,
        data: null,
      });
    }

    // Calcula tempo restante
    const expiresAt = pendingPixPayment.pixExpiresAt!;
    const now = new Date();
    const remainingMs = expiresAt.getTime() - now.getTime();

    // Se expirou (edge case), não retorna
    if (remainingMs <= 0) {
      return NextResponse.json({
        success: true,
        hasPendingPix: false,
        data: null,
      });
    }

    // Extrai informações do plano se for pedido de assinatura
    let planInfo = null;
    if (pendingPixPayment.order.notes) {
      try {
        const notes = JSON.parse(pendingPixPayment.order.notes as string);
        if (notes.subscriptionPlanId) {
          planInfo = {
            planId: notes.subscriptionPlanId,
            planName: notes.subscriptionPlanName,
          };
        }
      } catch {
        // Notes não é JSON válido, ignora
      }
    }

    return NextResponse.json({
      success: true,
      hasPendingPix: true,
      data: {
        paymentId: pendingPixPayment.transactionId || pendingPixPayment.id,
        orderId: pendingPixPayment.order.id,
        amount: Number(pendingPixPayment.amount),
        qrCode: pendingPixPayment.pixQrCode,
        qrCodeBase64: pendingPixPayment.pixQrCodeBase64,
        ticketUrl: pendingPixPayment.pixTicketUrl,
        expiresAt: expiresAt.toISOString(),
        remainingSeconds: Math.floor(remainingMs / 1000),
        planInfo,
      },
    });
  } catch (error) {
    console.error("[PendingPix] Error:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao buscar pagamento pendente" },
      { status: 500 }
    );
  }
}
