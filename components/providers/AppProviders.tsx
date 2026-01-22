/**
 * App Providers
 * 
 * Centralizes all client-side providers for the application.
 * This allows the root layout to remain a Server Component.
 */

"use client";

import { ReactNode } from "react";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { SubscriptionProvider } from "@/components/providers/SubscriptionProvider";
import { AuthModal } from "@/components/auth/AuthModal";
import { CartDrawer } from "@/components/cart";
import { Toaster } from "sonner";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SessionProvider>
      <SubscriptionProvider>
        {children}
        <AuthModal />
        <CartDrawer />
        <Toaster position="top-right" richColors />
      </SubscriptionProvider>
    </SessionProvider>
  );
}
