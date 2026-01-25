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
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthModal } from "@/components/auth/AuthModal";
import { CartDrawer } from "@/components/cart";
import { Toaster } from "sonner";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <SubscriptionProvider>
          {children}
          <AuthModal />
          <CartDrawer />
          <Toaster
            position="top-right"
            richColors
            toastOptions={{
              style: {
                padding: '16px',
                gap: '12px',
              },
              duration: 4000,
            }}
          />
        </SubscriptionProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
