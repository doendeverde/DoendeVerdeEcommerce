import { prisma } from "@/lib/prisma";
import { CartStatus } from "@prisma/client";

/**
 * Cart Repository
 *
 * Gerencia operações de carrinho no banco de dados.
 * Carrinho é único por usuário (1:1).
 */

// Include for cart with all relations
const cartWithItems = {
  items: {
    include: {
      product: {
        include: {
          images: true,
          category: true,
        },
      },
      variant: true,
    },
    orderBy: { createdAt: "asc" as const },
  },
};

export const cartRepository = {
  /**
   * Find or create cart for user
   * Uses upsert to prevent race conditions
   */
  async findOrCreateByUserId(userId: string) {
    const cart = await prisma.cart.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        status: CartStatus.ACTIVE,
      },
      include: cartWithItems,
    });

    return cart;
  },

  /**
   * Get cart by ID
   */
  async findById(cartId: string) {
    return prisma.cart.findUnique({
      where: { id: cartId },
      include: cartWithItems,
    });
  },

  /**
   * Add item to cart
   * Returns full cart with all items
   */
  async addItem(
    cartId: string,
    productId: string,
    quantity: number,
    unitPrice: number,
    variantId?: string
  ) {
    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId,
        productId,
        variantId: variantId ?? null,
      },
    });

    if (existingItem) {
      // Update quantity
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      // Create new item
      await prisma.cartItem.create({
        data: {
          cartId,
          productId,
          variantId,
          quantity,
          unitPrice,
        },
      });
    }

    // Return updated cart with all items
    return prisma.cart.findUnique({
      where: { id: cartId },
      include: cartWithItems,
    }) as ReturnType<typeof this.findById>;
  },

  /**
   * Update item quantity
   */
  async updateItemQuantity(cartId: string, itemId: string, quantity: number) {
    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
    return this.findById(cartId);
  },

  /**
   * Update item price (for price refresh)
   */
  async updateItemPrice(itemId: string, newPrice: number) {
    return prisma.cartItem.update({
      where: { id: itemId },
      data: { unitPrice: newPrice },
    });
  },

  /**
   * Remove item from cart
   */
  async removeItem(cartId: string, itemId: string) {
    await prisma.cartItem.delete({
      where: { id: itemId },
    });
    return this.findById(cartId);
  },

  /**
   * Clear all items from cart
   */
  async clearCart(cartId: string) {
    await prisma.cartItem.deleteMany({
      where: { cartId },
    });
    return this.findById(cartId);
  },

  /**
   * Get cart item by ID (for ownership validation)
   */
  async findItemById(itemId: string) {
    return prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
        product: true,
        variant: true,
      },
    });
  },
};
