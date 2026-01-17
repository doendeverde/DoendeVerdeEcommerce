/**
 * Subscriptions Page — Server Component (SSR)
 *
 * Página de planos de assinatura com dados sempre frescos do banco.
 * 100% Server-Side Rendered para SEO e velocidade.
 *
 * Decisões de arquitetura:
 * - SSR completo: dados dos planos sempre atualizados
 * - Sem cache: planos podem mudar (preços, promoções)
 * - Session check no servidor: sem flash de conteúdo
 */

import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { subscriptionService } from "@/services";
import { SubscriptionPlans } from "./SubscriptionPlans";
import { WhySubscribe } from "./WhySubscribe";
import { SubscriptionFAQ } from "./SubscriptionFAQ";
import type { SubscriptionPlanItem } from "@/types/subscription";

export const metadata: Metadata = {
  title: "Assinaturas | Doende HeadShop",
  description:
    "Escolha seu plano e aproveite descontos exclusivos de até 20%, pontos automáticos todo mês e frete grátis. Planos a partir de R$ 29,90/mês.",
  openGraph: {
    title: "Planos de Assinatura | Doende HeadShop",
    description:
      "Descontos de até 20% em todas as compras, pontos mensais automáticos e benefícios exclusivos.",
    type: "website",
  },
};

// Force dynamic rendering - always fresh data
export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  // Parallel fetch: plans + session (optimized)
  const [plans, session] = await Promise.all([
    subscriptionService.getPlans(),
    auth(),
  ]);

  const userId = session?.user?.id;

  // Get user's current plan (if logged in)
  let currentPlanSlug: string | null = null;
  if (userId) {
    currentPlanSlug = await subscriptionService.getUserPlanSlug(userId);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header - SEO optimized */}
        <header className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Escolha seu plano
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Faça parte da comunidade Doende Verde e aproveite descontos
            exclusivos, acúmulo de pontos e muito mais!
          </p>
        </header>

        {/* Current Plan Badge - Server rendered */}
        {currentPlanSlug && (
          <div className="mt-8 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-primary-green">
              <svg
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                Plano atual:{" "}
                <strong>
                  {plans.find((p: SubscriptionPlanItem) => p.slug === currentPlanSlug)?.name ||
                    "Gratuito"}
                </strong>
              </span>
            </div>
          </div>
        )}

        {/* Plans Grid - Main content */}
        <section className="mt-12" aria-labelledby="plans-heading">
          <h2 id="plans-heading" className="sr-only">
            Planos disponíveis
          </h2>
          <SubscriptionPlans
            plans={plans}
            currentPlanSlug={currentPlanSlug}
            isLoggedIn={!!userId}
          />
        </section>

        {/* Why Subscribe Section */}
        <section className="mt-20" aria-labelledby="benefits-heading">
          <WhySubscribe />
        </section>

        {/* FAQ Section - SEO rich content */}
        <section className="mt-20" aria-labelledby="faq-heading">
          <SubscriptionFAQ />
        </section>
      </div>
    </div>
  );
}
