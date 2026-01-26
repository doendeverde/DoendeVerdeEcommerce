"use client";

import { useEffect, useRef } from "react";
import { useCartStore } from "@/stores/cart";

/**
 * ClearCartOnMount
 * 
 * Componente invisível que limpa o carrinho quando montado.
 * Usado na página de sucesso de pagamento para garantir que o carrinho
 * seja esvaziado após uma compra bem-sucedida.
 */
export function ClearCartOnMount() {
  const clearCart = useCartStore((state) => state.clearCart);
  const hasClearedRef = useRef(false);

  useEffect(() => {
    // Executar apenas uma vez para evitar múltiplas chamadas
    if (hasClearedRef.current) return;
    hasClearedRef.current = true;

    const performClearCart = async () => {
      try {
        await clearCart();
        console.log("[ClearCartOnMount] Carrinho limpo com sucesso após pagamento");
      } catch (error) {
        console.error("[ClearCartOnMount] Erro ao limpar carrinho:", error);
      }
    };

    performClearCart();
  }, [clearCart]);

  // Componente invisível - não renderiza nada
  return null;
}
