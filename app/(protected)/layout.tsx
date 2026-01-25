import type { ReactNode } from "react";
import { Header, ConditionalSubscriptionBanner } from "@/components/layout";

interface ProtectedLayoutProps {
  children: ReactNode;
}

/**
 * Protected Layout — User Area Shell
 * 
 * Used for authenticated user pages:
 * - Profile
 * - Orders
 * - Subscriptions management
 * 
 * Layout Structure:
 * - Fixed Header with navigation
 * - Subscription Banner (dynamic based on user status)
 * - Main content area with consistent padding
 * 
 * Spacing System:
 * - Container: max-w-7xl (1280px) with responsive padding
 * - Page padding: 24px (mobile) → 32px (tablet+)
 * - Section gap: 32px (mobile) → 48px (desktop)
 */
export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <div className="min-h-screen bg-page flex flex-col">
      {/* Fixed Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Subscription Banner */}
        <div className="container-main py-4">
          <ConditionalSubscriptionBanner />
        </div>

        {/* Page Content */}
        <div className="container-main page-wrapper flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
