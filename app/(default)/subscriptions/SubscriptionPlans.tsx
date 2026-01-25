/**
 * SubscriptionPlans Component
 *
 * Grid de cards de planos de assinatura.
 * Client component para interatividade (clicks, scroll).
 * 
 * Mobile: Carrossel horizontal com snap scroll, iniciando no plano popular.
 * Desktop: Grid 4 colunas.
 * 
 * Benefits Display:
 * - Shows ALL benefits (enabled and disabled) 
 * - Enabled benefits: checkmark icon, full opacity
 * - Disabled benefits: X icon, reduced opacity, strikethrough
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Gift, Zap, Star, Crown, Check, X, ArrowRight } from "lucide-react";
import type { SubscriptionPlanItem, BenefitItem, PlanColorScheme } from "@/types/subscription";

interface SubscriptionPlansProps {
  plans: SubscriptionPlanItem[];
  currentPlanSlug: string | null;
  isLoggedIn: boolean;
}

// Icon mapping by plan slug
const planIcons: Record<string, React.ReactNode> = {
  gratuito: <Gift className="h-5 w-5 sm:h-6 sm:w-6" />,
  "doende-x": <Zap className="h-5 w-5 sm:h-6 sm:w-6" />,
  "doende-bronze": <Star className="h-5 w-5 sm:h-6 sm:w-6" />,
  "doende-prata": <Crown className="h-5 w-5 sm:h-6 sm:w-6" />,
};

// Fallback color schemes by plan slug (used when plan.colorScheme is not set)
const fallbackColors: Record<
  string,
  { icon: string; badge: string; button: string; border: string }
> = {
  gratuito: {
    icon: "bg-gray-bg text-text-secondary",
    badge: "",
    button: "bg-gray-bg text-text-primary hover:bg-hover-bg",
    border: "border-gray-border hover:border-gray-muted",
  },
  "doende-x": {
    icon: "bg-green-bg text-green-text",
    badge: "",
    button: "bg-primary-green text-white hover:bg-green-600",
    border: "border-gray-border hover:border-primary-green",
  },
  "doende-bronze": {
    icon: "bg-green-bg text-green-text",
    badge: "bg-primary-green",
    button: "bg-primary-green text-white hover:bg-green-600",
    border: "border-primary-green",
  },
  "doende-prata": {
    icon: "bg-purple-bg text-purple-text",
    badge: "bg-primary-purple",
    button: "bg-primary-purple text-white hover:bg-purple-700",
    border: "border-primary-purple",
  },
};

/**
 * Get plan display colors
 * Uses colorScheme from DB if available, otherwise falls back to slug-based colors
 */
function getPlanDisplayColors(plan: SubscriptionPlanItem) {
  const fallback = fallbackColors[plan.slug] || fallbackColors.gratuito;
  const colorScheme = plan.colorScheme as PlanColorScheme | undefined;

  if (!colorScheme) {
    return fallback;
  }

  // Generate Tailwind-compatible classes from colorScheme
  return {
    icon: fallback.icon, // Keep icon style from fallback for now
    badge: colorScheme.badge ? `bg-[${colorScheme.badge}]` : fallback.badge,
    button: `bg-[${colorScheme.primary}] text-[${colorScheme.text}] hover:opacity-90`,
    border: `border-[${colorScheme.primary}]/50 hover:border-[${colorScheme.primary}]`,
    // Raw colors for inline styles
    raw: {
      primary: colorScheme.primary,
      text: colorScheme.text,
      primaryDark: colorScheme.primaryDark,
      textDark: colorScheme.textDark,
      badge: colorScheme.badge,
    },
  };
}

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
    if (planSlug === "gratuito") {
      // Free plan - no checkout needed
      return;
    }

    if (!isLoggedIn) {
      // Redirect to login with callback to checkout
      window.location.href = `/login?callbackUrl=${encodeURIComponent(
        `/checkout/subscription/${planSlug}`
      )}`;
      return;
    }

    // Redirect to subscription checkout
    window.location.href = `/checkout/subscription/${planSlug}`;
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
          const colors = getPlanDisplayColors(plan);
          const isPremium = plan.badge === "premium";
          const isPopular = plan.badge === "popular";
          const hasRawColors = 'raw' in colors && colors.raw;

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
                        relative flex flex-col rounded-2xl border-2 bg-surface 
                        transition-all duration-200 hover:shadow-lg
                        ${!hasRawColors ? colors.border : ''}
                        flex-shrink-0 w-[72vw] max-w-[280px]
                        snap-center
                        p-4 sm:p-6
                        md:w-auto md:max-w-none md:flex-shrink
                        `}
              style={hasRawColors ? {
                borderColor: `${colors.raw.primary}50`,
              } : undefined}
            >
              {/* Badge - Positioned above card */}
              {plan.badge && (
                <div
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold text-white ${!hasRawColors ? colors.badge : ''}`}
                  style={hasRawColors && colors.raw.badge ? {
                    backgroundColor: colors.raw.badge,
                  } : undefined}
                >
                  {plan.badge === "popular" ? "Mais popular" : "Premium"}
                </div>
              )}

              {/* Plan Icon */}
              <div
                className={`inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl ${colors.icon}`}
                aria-hidden="true"
              >
                {planIcons[plan.slug] || <Gift className="h-5 w-5 sm:h-6 sm:w-6" />}
              </div>

              {/* Plan Name & Price */}
              <div className="mt-3 sm:mt-4">
                <h3 className="text-base sm:text-lg font-semibold text-default">
                  {plan.name}
                </h3>
                <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1">
                  {plan.price === 0 ? (
                    <span className="text-2xl sm:text-3xl font-bold text-default">
                      Grátis
                    </span>
                  ) : (
                    <>
                      <span className="text-xs sm:text-sm text-muted">R$</span>
                      <span className="text-2xl sm:text-3xl font-bold text-default">
                        {plan.price.toFixed(2).replace(".", ",")}
                      </span>
                      <span className="text-xs sm:text-sm text-muted">/mês</span>
                    </>
                  )}
                </div>

                {/* Discount Badge */}
                {plan.discountPercent > 0 && (
                  <div className="mt-1.5 sm:mt-2 inline-flex rounded-full bg-green-bg px-2 py-0.5 sm:px-2.5 text-[10px] sm:text-xs font-medium text-green-text">
                    {plan.discountPercent}% de desconto permanente
                  </div>
                )}
              </div>

              {/* Benefits List - Shows ALL benefits (enabled and disabled) */}
              <ul
                className={`mt-4 sm:mt-6 flex-1 space-y-2 sm:space-y-3 ${isMediumHeight ? 'max-h-[180px] sm:max-h-[200px] overflow-y-auto pr-1 sm:pr-2' : ''}`}
                role="list"
              >
                {plan.benefits.map((benefit, benefitIndex) => {
                  // Get benefit details (handles both string and BenefitItem)
                  const benefitName = typeof benefit === "string" ? benefit : benefit.name;
                  const isEnabled = typeof benefit === "string" ? true : benefit.enabled !== false;

                  // Highlight key benefits (points and discount) - only if enabled
                  const isHighlight = isEnabled && (
                    benefitName.includes("pontos") ||
                    benefitName.includes("desconto")
                  );

                  return (
                    <li
                      key={benefitIndex}
                      className={`flex items-start gap-1.5 sm:gap-2 ${!isEnabled ? 'opacity-50' : ''}`}
                    >
                      {isEnabled ? (
                        <Check
                          className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${isHighlight ? "text-primary-green" : "text-muted"}`}
                          aria-hidden="true"
                        />
                      ) : (
                        <X
                          className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-gray-400"
                          aria-hidden="true"
                        />
                      )}
                      <span
                        className={`text-xs sm:text-sm ${!isEnabled
                            ? "text-gray-400 line-through"
                            : isHighlight
                              ? "font-medium text-default"
                              : "text-muted"
                          }`}
                      >
                        {benefitName}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {/* CTA Button */}
              <div className="mt-4 sm:mt-6">
                {isCurrentPlan ? (
                  <button
                    disabled
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-bg px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-muted cursor-not-allowed"
                    aria-label={`${plan.name} é seu plano atual`}
                  >
                    Plano atual
                  </button>
                ) : plan.slug === "gratuito" ? (
                  <button
                    onClick={() => handleSubscribe(plan.slug)}
                    className={`flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold transition-colors ${!hasRawColors ? colors.button : ''}`}
                    style={hasRawColors ? {
                      backgroundColor: colors.raw.primary,
                      color: colors.raw.text,
                    } : undefined}
                    aria-label="Usar plano gratuito"
                  >
                    Usar plano gratuito
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.slug)}
                    className={`flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold transition-colors hover:opacity-90 ${!hasRawColors ? colors.button : ''}`}
                    style={hasRawColors ? {
                      backgroundColor: colors.raw.primary,
                      color: colors.raw.text,
                    } : undefined}
                    aria-label={`Assinar plano ${plan.name}`}
                  >
                    Assinar agora
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
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
          const planColorScheme = plan.colorScheme as PlanColorScheme | undefined;
          const indicatorColor = planColorScheme?.primary;

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
                  ? `w-6 h-2 ${!indicatorColor ? (plan.badge === "premium" ? "bg-primary-purple" : "bg-primary-green") : ''}`
                  : "w-2 h-2 bg-gray-border hover:bg-gray-muted"
                }
              `}
              style={isActive && indicatorColor ? { backgroundColor: indicatorColor } : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
