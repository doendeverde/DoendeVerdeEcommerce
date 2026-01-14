import type { ReactNode } from "react";
import { Header, UserStatusBanner } from "@/components/layout";

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
 * - User Status Banner (when logged in)
 * - Main content area
 */
export default function DefaultLayout({ children }: DefaultLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-bg">
      {/* Fixed Header */}
      <Header />

      {/* Main Content */}
      <main>
        {/* User Status Banner - Shows subscription plan & points */}
        <div className="container-main py-4">
          <UserStatusBanner />
        </div>

        {/* Page Content */}
        <div className="container-main pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
