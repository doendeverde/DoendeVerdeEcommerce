import { z } from "zod";

/**
 * Cart Schemas — Zod validation
 *
 * Schemas para validação de operações do carrinho.
 */

// Add item to cart
export const addToCartSchema = z.object({
  productId: z.string().uuid("ID do produto inválido"),
  quantity: z.number().int().min(1, "Quantidade mínima é 1").max(99, "Quantidade máxima é 99"),
  variantId: z.string().uuid("ID da variante inválido").optional(),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;

// Update cart item quantity
export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, "Quantidade mínima é 1").max(99, "Quantidade máxima é 99"),
});

export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

// Cart item ID param
export const cartItemIdSchema = z.object({
  itemId: z.string().uuid("ID do item inválido"),
});

export type CartItemIdInput = z.infer<typeof cartItemIdSchema>;
