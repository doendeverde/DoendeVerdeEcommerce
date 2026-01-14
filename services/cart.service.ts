/**
 * Cart Service Layer
 *
 * Handles cart business logic including stock validation,
 * price snapshots, and total calculations.
 * Uses helpers from types/cart.ts for transformations.
 */

import { cartRepository, productRepository } from '@/repositories';
import {
  type CartState,
  type CartItemDisplay,
  type CartWithItems,
  toCartState,
} from '@/types/cart';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AddToCartResult {
  success: boolean;
  error?: string;
  cart?: CartState;
}

interface UpdateQuantityResult {
  success: boolean;
  error?: string;
  cart?: CartState;
}

interface RemoveItemResult {
  success: boolean;
  error?: string;
  cart?: CartState;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get or create cart for user with computed fields
 */
async function getCart(userId: string): Promise<CartState> {
  const cart = await cartRepository.findOrCreateByUserId(userId);
  return toCartState(cart);
}

/**
 * Add product to cart with stock validation and price snapshot
 */
async function addToCart(
  userId: string,
  productId: string,
  quantity: number,
  variantId?: string
): Promise<AddToCartResult> {
  // Validate product exists and has stock
  const product = await productRepository.findById(productId);

  if (!product) {
    return {
      success: false,
      error: 'Produto não encontrado',
    };
  }

  // Check product availability using status enum (isPublished type inference issue workaround)
  const isAvailable = (product as { status: string }).status === 'ACTIVE';
  if (!isAvailable) {
    return {
      success: false,
      error: 'Este produto não está disponível',
    };
  }

  // Get stock based on variant or product
  let stockToCheck = product.stock;
  let priceToSnapshot = Number(product.basePrice);

  if (variantId) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) {
      return {
        success: false,
        error: 'Variante não encontrada',
      };
    }
    stockToCheck = variant.stock;
    priceToSnapshot = variant.price ? Number(variant.price) : priceToSnapshot;
  }

  // Get or create cart
  const cart = await cartRepository.findOrCreateByUserId(userId);

  // Check if item already in cart
  const existingItem = cart.items.find(
    (item) => item.productId === productId && item.variantId === variantId
  );
  const currentQuantityInCart = existingItem?.quantity || 0;
  const totalRequestedQuantity = currentQuantityInCart + quantity;

  // Validate stock
  if (stockToCheck < totalRequestedQuantity) {
    const availableToAdd = stockToCheck - currentQuantityInCart;
    return {
      success: false,
      error:
        availableToAdd > 0
          ? `Estoque insuficiente. Disponível para adicionar: ${availableToAdd}`
          : 'Quantidade máxima já está no carrinho',
    };
  }

  // Add or update item with current price snapshot
  const updatedCart = await cartRepository.addItem(
    cart.id,
    productId,
    quantity,
    priceToSnapshot,
    variantId
  );

  if (!updatedCart) {
    return {
      success: false,
      error: 'Erro ao adicionar ao carrinho',
    };
  }

  return {
    success: true,
    cart: toCartState(updatedCart),
  };
}

/**
 * Update cart item quantity with stock validation
 */
async function updateQuantity(
  userId: string,
  itemId: string,
  quantity: number
): Promise<UpdateQuantityResult> {
  // Validate item belongs to user's cart
  const item = await cartRepository.findItemById(itemId);

  if (!item) {
    return {
      success: false,
      error: 'Item não encontrado no carrinho',
    };
  }

  const cart = await cartRepository.findOrCreateByUserId(userId);

  if (item.cartId !== cart.id) {
    return {
      success: false,
      error: 'Item não pertence ao seu carrinho',
    };
  }

  // Validate stock for new quantity
  const product = await productRepository.findById(item.productId);

  if (!product) {
    // Product was deleted, remove from cart
    const updatedCart = await cartRepository.removeItem(cart.id, itemId);
    if (!updatedCart) {
      return { success: false, error: 'Erro ao atualizar carrinho' };
    }
    return {
      success: true,
      cart: toCartState(updatedCart),
    };
  }

  // Get stock from variant or product
  let stockToCheck = product.stock;
  if (item.variantId) {
    const variant = product.variants.find((v) => v.id === item.variantId);
    stockToCheck = variant?.stock ?? product.stock;
  }

  if (quantity > stockToCheck) {
    return {
      success: false,
      error: `Estoque insuficiente. Disponível: ${stockToCheck}`,
    };
  }

  // Update quantity
  const updatedCart = await cartRepository.updateItemQuantity(
    cart.id,
    itemId,
    quantity
  );

  if (!updatedCart) {
    return { success: false, error: 'Erro ao atualizar carrinho' };
  }

  return {
    success: true,
    cart: toCartState(updatedCart),
  };
}

/**
 * Remove item from cart
 */
async function removeItem(
  userId: string,
  itemId: string
): Promise<RemoveItemResult> {
  const cart = await cartRepository.findOrCreateByUserId(userId);
  const item = await cartRepository.findItemById(itemId);

  if (!item || item.cartId !== cart.id) {
    return {
      success: false,
      error: 'Item não encontrado no carrinho',
    };
  }

  const updatedCart = await cartRepository.removeItem(cart.id, itemId);

  if (!updatedCart) {
    return { success: false, error: 'Erro ao remover item' };
  }

  return {
    success: true,
    cart: toCartState(updatedCart),
  };
}

/**
 * Clear all items from cart
 */
async function clearCart(
  userId: string
): Promise<{ success: boolean; cart?: CartState }> {
  const cart = await cartRepository.findOrCreateByUserId(userId);
  const updatedCart = await cartRepository.clearCart(cart.id);

  if (!updatedCart) {
    return { success: false };
  }

  return {
    success: true,
    cart: toCartState(updatedCart),
  };
}

/**
 * Validate cart items before checkout
 * Returns list of issues with items (out of stock, price changed, etc.)
 */
async function validateCartForCheckout(
  userId: string
): Promise<{
  valid: boolean;
  issues: Array<{
    itemId: string;
    productName: string;
    issue: 'out_of_stock' | 'insufficient_stock' | 'price_changed' | 'unavailable';
    details?: string;
  }>;
}> {
  const cart = await getCart(userId);
  const issues: Array<{
    itemId: string;
    productName: string;
    issue: 'out_of_stock' | 'insufficient_stock' | 'price_changed' | 'unavailable';
    details?: string;
  }> = [];

  for (const item of cart.items) {
    if (item.isOutOfStock) {
      issues.push({
        itemId: item.id,
        productName: item.product.name,
        issue: 'out_of_stock',
      });
    } else if (item.quantity > item.maxQuantity) {
      issues.push({
        itemId: item.id,
        productName: item.product.name,
        issue: 'insufficient_stock',
        details: `Disponível: ${item.maxQuantity}`,
      });
    }

    if (item.priceChanged) {
      issues.push({
        itemId: item.id,
        productName: item.product.name,
        issue: 'price_changed',
        details: `Preço atual: R$ ${item.currentPrice.toFixed(2)}`,
      });
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Refresh cart prices to current product prices
 */
async function refreshPrices(userId: string): Promise<CartState> {
  const cart = await cartRepository.findOrCreateByUserId(userId);

  // Update each item's price to current product price
  for (const item of cart.items) {
    const product = await productRepository.findById(item.productId);
    if (product) {
      let currentPrice = Number(product.basePrice);
      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        currentPrice = variant?.price ? Number(variant.price) : currentPrice;
      }
      await cartRepository.updateItemPrice(item.id, currentPrice);
    }
  }

  // Return fresh cart state
  return getCart(userId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────

export const cartService = {
  getCart,
  addToCart,
  updateQuantity,
  removeItem,
  clearCart,
  validateCartForCheckout,
  refreshPrices,
};
