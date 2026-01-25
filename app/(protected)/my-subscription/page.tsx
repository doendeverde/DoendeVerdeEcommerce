/**
 * My Subscription Page — Server Component (SSR)
 *
 * Dashboard do assinante com informações do plano atual,
 * benefícios ativos e histórico de pedidos.
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubscriptionDashboard } from "@/components/subscriptions";
import type { PlanBenefitWithBenefit } from "@/types/benefit";

export const metadata: Metadata = {
  title: "Minha Assinatura | Doende HeadShop",
  description: "Gerencie sua assinatura, veja seus benefícios e acompanhe seus pedidos.",
};

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default async function MySubscriptionPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/my-subscription");
  }

  const userId = session.user.id;

  // Fetch user's active subscription with plan details
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "PAUSED", "PENDING_CANCELLATION"] },
    },
    include: {
      plan: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch plan benefits if subscription exists
  let benefits: PlanBenefitWithBenefit[] = [];
  if (subscription) {
    const planBenefits = await prisma.planBenefit.findMany({
      where: {
        planId: subscription.planId,
        enabled: true,
      },
      include: {
        benefit: true,
      },
      orderBy: {
        benefit: { displayOrder: "asc" },
      },
    });
    benefits = planBenefits as PlanBenefitWithBenefit[];
  }

  // Fetch recent orders (last 5)
  const recentOrders = await prisma.order.findMany({
    where: { userId },
    select: {
      id: true,
      createdAt: true,
      totalAmount: true,
      status: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Convert Decimal to number for the component
  const ordersFormatted = recentOrders.map((order) => ({
    ...order,
    totalAmount: Number(order.totalAmount),
  }));

  return (
    <div className="page-content">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-default">Minha Assinatura</h1>
        <p className="text-muted mt-2">
          Gerencie sua assinatura, veja seus benefícios e acompanhe seu histórico.
        </p>
      </header>

      {/* Dashboard */}
      <SubscriptionDashboard
        subscription={subscription}
        benefits={benefits}
        recentOrders={ordersFormatted}
      />
    </div>
  );
}
