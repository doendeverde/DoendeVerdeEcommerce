"use client";

import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart";
import { useSession } from "next-auth/react";
import { useEffect, useMemo } from "react";

interface CartButtonProps {
  className?: string;
}

/**
 * Cart icon button with item count badge
 * Opens cart drawer on click
 */
export function CartButton({ className }: CartButtonProps) {
  const { data: session } = useSession();
  const { openDrawer, fetchCart, isInitialized, cart } = useCartStore();
  const itemCount = useMemo(() => cart?.itemCount ?? 0, [cart?.itemCount]);

  // Fetch cart on mount if authenticated
  useEffect(() => {
    if (session?.user && !isInitialized) {
      fetchCart();
    }
  }, [session, isInitialized, fetchCart]);

  return (
    <button
      onClick={openDrawer}
      className={cn(
        "relative p-2 text-text-secondary hover:text-text-primary hover:bg-gray-bg rounded-lg transition-colors",
        className
      )}
      aria-label={`Carrinho com ${itemCount} itens`}
    >
      <ShoppingCart className="w-5 h-5" />

      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-medium text-white bg-primary-green rounded-full">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </button>
  );
}
