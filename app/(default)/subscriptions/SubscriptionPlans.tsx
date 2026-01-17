/**
 * SubscriptionPlans Component
 *
 * Grid de cards de planos de assinatura.
 * Client component para interatividade (clicks, scroll).
 * 
 * Mobile: Carrossel horizontal com snap scroll, iniciando no plano popular.
 * Desktop: Grid 4 colunas.
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Gift, Zap, Star, Crown, Check, ArrowRight } from "lucide-react";
import type { SubscriptionPlanItem } from "@/types/subscription";

interface SubscriptionPlansProps {
  plans: SubscriptionPlanItem[];
  currentPlanSlug: string | null;
  isLoggedIn: boolean;
}

// Icon mapping by plan slug
const planIcons: Record<string, React.ReactNode> = {
  gratuito: <Gift className="h-6 w-6" />,
  "doende-x": <Zap className="h-6 w-6" />,
  "doende-bronze": <Star className="h-6 w-6" />,
  "doende-prata": <Crown className="h-6 w-6" />,
};

// Color schemes by plan slug (following UX guide)
const planColors: Record<
  string,
  { icon: string; badge: string; button: string; border: string }
> = {
  gratuito: {
    icon: "bg-gray-100 text-gray-600",
    badge: "",
    button: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    border: "border-gray-200 hover:border-gray-300",
  },
  "doende-x": {
    icon: "bg-green-100 text-primary-green",
    badge: "",
    button: "bg-primary-green text-white hover:bg-green-600",
    border: "border-gray-200 hover:border-primary-green",
  },
  "doende-bronze": {
    icon: "bg-green-100 text-primary-green",
    badge: "bg-primary-green",
    button: "bg-primary-green text-white hover:bg-green-600",
    border: "border-primary-green",
  },
  "doende-prata": {
    icon: "bg-purple-100 text-primary-purple",
    badge: "bg-primary-purple",
    button: "bg-primary-purple text-white hover:bg-purple-700",
    border: "border-primary-purple",
  },
};

export function SubscriptionPlans({
  plans,
  currentPlanSlug,
  isLoggedIn,
}: SubscriptionPlansProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const popularPlanRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  // Track active card index for scroll indicators
  const [activeIndex, setActiveIndex] = useState(() => {
    // Start with popular plan index
    const popularIndex = plans.findIndex((p) => p.badge === "popular");
    return popularIndex >= 0 ? popularIndex : 0;
  });

  // Detect small screen height (< 400px) for compact layout
  const [isSmallHeight, setIsSmallHeight] = useState(false);
  // Detect medium screen height (< 700px) for limiting benefits height
  const [isMediumHeight, setIsMediumHeight] = useState(false);

  useEffect(() => {
    const checkHeight = () => {
      const height = window.innerHeight;
      setIsSmallHeight(height < 400);
      setIsMediumHeight(height < 700);
    };

    checkHeight();
    window.addEventListener("resize", checkHeight);
    return () => window.removeEventListener("resize", checkHeight);
  }, []);

  // Scroll to popular plan on mount (mobile only)
  useEffect(() => {
    if (popularPlanRef.current && scrollContainerRef.current) {
      // Small delay to ensure layout is complete
      const timer = setTimeout(() => {
        popularPlanRef.current?.scrollIntoView({
          behavior: "instant",
          inline: "center",
          block: "nearest",
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [plans]);

  // IntersectionObserver to track which card is most visible
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const index = cardRefs.current.findIndex(
              (ref) => ref === entry.target
            );
            if (index !== -1) {
              setActiveIndex(index);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.5,
        rootMargin: "0px",
      }
    );

    cardRefs.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => observer.disconnect();
  }, [plans]);

  // Scroll to specific card
  const scrollToCard = useCallback((index: number) => {
    const card = cardRefs.current[index];
    if (card) {
      card.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, []);

  const handleSubscribe = (planSlug: string) => {
    if (!isLoggedIn) {
      // Redirect to login with return URL
      window.location.href = `/login?callbackUrl=${encodeURIComponent(
        `/subscriptions?subscribe=${planSlug}`
      )}`;
      return;
    }

    // TODO: Implement subscription checkout flow
    console.log("Subscribe to:", planSlug);
    // Future: redirect to /checkout/subscription?plan=${planSlug}
  };

  return (
    <div className="relative">
      {/* Gradient indicators for scroll (mobile only) */}
      {/* <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-50 to-transparent z-10 md:hidden" /> */}
      {/* <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 to-transparent z-10 md:hidden" /> */}

      {/* Scrollable container (mobile) / Grid (desktop) */}
      <div
        ref={scrollContainerRef}
        className="
          flex gap-2 overflow-x-auto snap-x snap-mandatory scroll-smooth
          -mx-4 px-4 pb-4
          md:mx-0 md:px-0 md:pb-0
          md:grid md:grid-cols-4 md:gap-6 md:overflow-visible
          pt-3          
          scrollbar-hide
        "
        style={{
          marginTop: "-12px",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {plans.map((plan, index) => {
          const isCurrentPlan = currentPlanSlug === plan.slug;
          const colors = planColors[plan.slug] || planColors.gratuito;
          const isPremium = plan.badge === "premium";
          const isPopular = plan.badge === "popular";

          return (
            <article
              key={plan.id}
              ref={(el) => {
                cardRefs.current[index] = el;
                if (isPopular) {
                  popularPlanRef.current = el;
                }
              }}
              className={`
                        relative flex flex-col rounded-2xl border-2 bg-white p-6 
                        transition-all duration-200 hover:shadow-lg
                        ${colors.border}
                        flex-shrink-0 w-[85vw] max-w-[320px]
                        snap-center
                        md:w-auto md:max-w-none md:flex-shrink
                        `}
              style={{
                // transform: isSmallHeight ? 'scale(0.7)' : 'scale(0.8)'
              }}
            >
              {/* Badge - Positioned above card */}
              {plan.badge && (
                <div
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold text-white ${colors.badge}`}
                >
                  {plan.badge === "popular" ? "Mais popular" : "Premium"}
                </div>
              )}

              {/* Plan Icon */}
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${colors.icon}`}
                aria-hidden="true"
              >
                {planIcons[plan.slug] || <Gift className="h-6 w-6" />}
              </div>

              {/* Plan Name & Price */}
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {plan.name}
                </h3>
                <div className="mt-2 flex items-baseline gap-1">
                  {plan.price === 0 ? (
                    <span className="text-3xl font-bold text-gray-900">
                      Grátis
                    </span>
                  ) : (
                    <>
                      <span className="text-sm text-gray-500">R$</span>
                      <span className="text-3xl font-bold text-gray-900">
                        {plan.price.toFixed(2).replace(".", ",")}
                      </span>
                      <span className="text-sm text-gray-500">/mês</span>
                    </>
                  )}
                </div>

                {/* Discount Badge */}
                {plan.discountPercent > 0 && (
                  <div className="mt-2 inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-primary-green">
                    {plan.discountPercent}% de desconto permanente
                  </div>
                )}
              </div>

              {/* Benefits List */}
              <ul
                className={`mt-6 flex-1 space-y-3 ${isMediumHeight ? 'max-h-[200px] overflow-y-auto pr-2' : ''}`}
                role="list"
              >
                {plan.benefits.map((benefit, index) => {
                  // Highlight key benefits (points and discount)
                  const isHighlight =
                    benefit.includes("pontos mensais") ||
                    benefit.includes("desconto em todas");

                  return (
                    <li key={index} className="flex items-start gap-2">
                      <Check
                        className={`h-5 w-5 flex-shrink-0 ${isHighlight ? "text-primary-green" : "text-gray-400"
                          }`}
                        aria-hidden="true"
                      />
                      <span
                        className={`${isSmallHeight ? 'text-base' : 'text-sm'} ${isHighlight
                          ? "font-medium text-gray-900"
                          : "text-gray-600"
                          }`}
                      >
                        {benefit}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {/* CTA Button */}
              <div className="mt-6">
                {isCurrentPlan ? (
                  <button
                    disabled
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-500 cursor-not-allowed"
                    aria-label={`${plan.name} é seu plano atual`}
                  >
                    Plano atual
                  </button>
                ) : plan.slug === "gratuito" ? (
                  <button
                    onClick={() => handleSubscribe(plan.slug)}
                    className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${colors.button}`}
                    aria-label="Usar plano gratuito"
                  >
                    Usar plano gratuito
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.slug)}
                    className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${colors.button}`}
                    aria-label={`Assinar plano ${plan.name}`}
                  >
                    Assinar agora
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Scroll indicators (dots) - mobile only */}
      <div className="flex justify-center gap-2 mt-4 md:hidden" role="tablist" aria-label="Navegação de planos">
        {plans.map((plan, index) => {
          const isActive = index === activeIndex;
          const colors = planColors[plan.slug] || planColors.gratuito;

          return (
            <button
              key={plan.id}
              onClick={() => scrollToCard(index)}
              role="tab"
              aria-selected={isActive}
              aria-label={`Ver plano ${plan.name}${isActive ? " (selecionado)" : ""}`}
              className={`
                rounded-full transition-all duration-300 ease-out
                ${isActive
                  ? `w-6 h-2 ${plan.badge === "premium" ? "bg-primary-purple" : "bg-primary-green"}`
                  : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
                }
              `}
            />
          );
        })}
      </div>
    </div>
  );
}
