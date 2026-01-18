"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Sparkles, Gift, Truck, Star } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { SubscriptionPlanItem } from "@/types/subscription";

interface SubscriptionCTABannerProps {
  className?: string;
}

/**
 * Carousel banner showing subscription plans for non-subscribers
 * Features:
 * - Auto-scroll carousel
 * - Manual navigation with arrows
 * - Plan cards with gradient colors
 * - CTA to subscription page
 */
export function SubscriptionCTABanner({ className }: SubscriptionCTABannerProps) {
  const [plans, setPlans] = useState<SubscriptionPlanItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Fetch plans from API
  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch("/api/subscriptions/plans");
        if (response.ok) {
          const data = await response.json();
          setPlans(data.plans || []);
        }
      } catch (error) {
        console.error("Error fetching plans:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlans();
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    if (plans.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % plans.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [plans.length, isPaused]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + plans.length) % plans.length);
  }, [plans.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % plans.length);
  }, [plans.length]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn("w-full rounded-xl overflow-hidden", className)}>
        <div className="bg-gradient-to-r from-primary-purple-dark to-primary-purple p-4 sm:p-6 animate-pulse">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="h-5 bg-white/20 rounded w-48 mb-2" />
              <div className="h-4 bg-white/20 rounded w-64" />
            </div>
            <div className="h-10 bg-white/20 rounded-lg w-32" />
          </div>
        </div>
      </div>
    );
  }

  // No plans available
  if (plans.length === 0) {
    return null;
  }

  const currentPlan = plans[currentIndex];

  return (
    <div
      className={cn("w-full rounded-xl overflow-hidden relative group", className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      ref={carouselRef}
    >
      {/* Background gradient using plan colors */}
      <div
        className="absolute inset-0 transition-all duration-500 ease-in-out"
        style={{
          background: `linear-gradient(135deg, ${currentPlan.colorDark} 0%, ${currentPlan.color} 50%, ${currentPlan.colorDark} 100%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Left: Plan info */}
          <div className="flex-1">
            {/* Badge */}
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-xs font-medium text-white/90 uppercase tracking-wide">
                Economize até {Math.max(...plans.map(p => p.discountPercent))}% com assinatura
              </span>
            </div>

            {/* Plan name with slide animation */}
            <div className="overflow-hidden">
              <h3 
                key={currentPlan.id}
                className="text-lg sm:text-xl font-bold text-white animate-slideIn"
              >
                {currentPlan.name}
              </h3>
            </div>

            {/* Plan short description */}
            <p className="text-sm text-white/80 mt-1">
              {currentPlan.shortDescription}
            </p>

            {/* Plan highlights */}
            <div className="flex items-center gap-4 mt-3 text-xs text-white/70">
              {currentPlan.discountPercent > 0 && (
                <span className="flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5" />
                  {currentPlan.discountPercent}% desconto
                </span>
              )}
              {currentPlan.monthlyPoints > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {currentPlan.monthlyPoints} pontos/mês
                </span>
              )}
              {currentPlan.order >= 2 && (
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" />
                  Frete grátis
                </span>
              )}
            </div>
          </div>

          {/* Right: Price and CTA */}
          <div className="flex items-center gap-4">
            {/* Price */}
            <div className="text-right">
              <p className="text-xs text-white/60">a partir de</p>
              <p className="text-2xl font-bold text-white">
                R$ {currentPlan.price.toFixed(2).replace(".", ",")}
                <span className="text-sm font-normal">/mês</span>
              </p>
            </div>

            {/* CTA Button */}
            <Link
              href={`/checkout/subscription/${currentPlan.slug}`}
              className="px-4 py-2.5 bg-white rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg"
              style={{ color: currentPlan.colorDark }}
            >
              Assinar agora
            </Link>
          </div>
        </div>

        {/* Navigation */}
        {plans.length > 1 && (
          <>
            {/* Arrow buttons */}
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white/30"
              aria-label="Plano anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white/30"
              aria-label="Próximo plano"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Dots indicator */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {plans.map((plan, index) => (
                <button
                  key={plan.id}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-200",
                    index === currentIndex
                      ? "bg-white w-6"
                      : "bg-white/40 hover:bg-white/60"
                  )}
                  aria-label={`Ver plano ${plan.name}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
