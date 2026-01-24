import type { ReactNode } from "react";
import { Header, ConditionalSubscriptionBanner } from "@/components/layout";

interface DefaultLayoutProps {
  children: ReactNode;
}

/**
 * Default Layout — E-commerce Shell
 * 
 * Used for all public-facing pages:
 * - Product catalog
 * - Product details
 * - Subscriptions
 * - Points/Rewards
 * 
 * Contains:
 * - Fixed Header with navigation
 * - Subscription Banner (dynamic based on user status)
 * - Main content area
 */
export default function DefaultLayout({ children }: DefaultLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--gray-bg)] flex flex-col">
      {/* Fixed Header */}
      <Header />

      {/* Main Content - flex-1 para ocupar espaço restante, mas não forçar altura extra */}
      <main className="flex-1 flex flex-col">
        {/* Subscription Banner - Full width, internal padding */}
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-7xl mx-auto">
            <ConditionalSubscriptionBanner />
          </div>
        </div>

        {/* Page Content */}
        <div className="container-main pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
