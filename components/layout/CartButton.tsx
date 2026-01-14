"use client";

import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface CartButtonProps {
  itemCount?: number;
  onClick?: () => void;
  className?: string;
}

/**
 * Cart icon button with item count badge
 * Opens cart drawer on click
 */
export function CartButton({ itemCount = 0, onClick, className }: CartButtonProps) {
  return (
    <button
      onClick={onClick}
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
