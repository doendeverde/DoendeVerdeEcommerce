import type { Prisma } from "@prisma/client";

/**
 * Cart Types for Frontend
 *
 * Tipos derivados do Prisma para gerenciamento do carrinho.
 */

// Cart item with product and variant info
export type CartItemWithProduct = Prisma.CartItemGetPayload<{
  include: {
    product: {
      include: {
        images: true;
        category: true;
      };
    };
    variant: true;
  };
}>;

// Cart with all items and relations
export type CartWithItems = Prisma.CartGetPayload<{
  include: {
    items: {
      include: {
        product: {
          include: {
            images: true;
            category: true;
          };
        };
        variant: true;
      };
    };
  };
}>;

// Simplified cart item for frontend display
export interface CartItemDisplay {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currentPrice: number;
  priceChanged: boolean;
  isOutOfStock: boolean;
  maxQuantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    stock: number;
    // loyaltyPoints: number; // FEATURE DISABLED: Will be implemented in the future
    image: {
      url: string;
      altText: string | null;
    } | null;
  };
  variant: {
    id: string;
    name: string;
    sku: string;
  } | null;
}

// Full cart state for frontend
export interface CartState {
  id: string;
  items: CartItemDisplay[];
  itemCount: number;
  subtotal: number;
  // loyaltyPointsTotal: number; // FEATURE DISABLED: Will be implemented in the future
  isEmpty: boolean;
  hasOutOfStockItems: boolean;
  hasPriceChangedItems: boolean;
  // Subscription discount info
  subscriptionDiscount?: {
    hasActiveSubscription: boolean;
    discountPercent: number;
    discountLabel: string | null;
    discountAmount: number;
    planName: string | null;
  };
}

// Request types
export interface AddToCartRequest {
  productId: string;
  quantity: number;
  variantId?: string;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

/**
 * Helper function to transform Prisma cart item to display format
 */
export function toCartItemDisplay(item: CartItemWithProduct): CartItemDisplay {
  const primaryImage =
    item.product.images.find((img) => img.isPrimary) || item.product.images[0];

  const unitPrice = Number(item.unitPrice);
  const currentPrice = item.variant?.price
    ? Number(item.variant.price)
    : Number(item.product.basePrice);
  const stock = item.variant?.stock ?? item.product.stock;

  return {
    id: item.id,
    productId: item.productId,
    variantId: item.variantId,
    quantity: item.quantity,
    unitPrice,
    totalPrice: Math.round(unitPrice * item.quantity * 100) / 100,
    currentPrice,
    priceChanged: unitPrice !== currentPrice,
    isOutOfStock: stock === 0,
    maxQuantity: stock,
    product: {
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      stock: item.product.stock,
      // loyaltyPoints: item.product.loyaltyPoints, // FEATURE DISABLED: Will be implemented in the future
      image: primaryImage
        ? { url: primaryImage.url, altText: primaryImage.altText }
        : null,
    },
    variant: item.variant
      ? {
          id: item.variant.id,
          name: item.variant.name,
          sku: item.variant.sku,
        }
      : null,
  };
}

/**
 * Helper function to transform Prisma cart to CartState
 */
export function toCartState(cart: CartWithItems): CartState {
  const items = cart.items.map(toCartItemDisplay);

  return {
    id: cart.id,
    items,
    itemCount: items.reduce((acc, item) => acc + item.quantity, 0),
    subtotal: Math.round(items.reduce((acc, item) => acc + item.totalPrice, 0) * 100) / 100,
    // loyaltyPointsTotal: items.reduce(
    //   (acc, item) => acc + item.product.loyaltyPoints * item.quantity,
    //   0
    // ), // FEATURE DISABLED: Will be implemented in the future
    isEmpty: items.length === 0,
    hasOutOfStockItems: items.some((item) => item.isOutOfStock),
    hasPriceChangedItems: items.some((item) => item.priceChanged),
  };
}
