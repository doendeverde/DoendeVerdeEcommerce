/**
 * Cart Store (Zustand)
 *
 * Global state management for the shopping cart.
 * Handles cart state, drawer visibility, and API sync.
 */

import { create } from 'zustand';
import { CartState, CartItemDisplay } from '@/types/cart';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CartStore {
  // Cart State
  cart: CartState | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Drawer State
  isDrawerOpen: boolean;

  // Optimistic Update State
  pendingOperations: Set<string>;

  // Actions
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;

  // Cart Actions
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  clearCart: () => Promise<void>;

  // Internal
  setCart: (cart: CartState) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────────────────────────

const initialState = {
  cart: null,
  isLoading: false,
  isInitialized: false,
  error: null,
  isDrawerOpen: false,
  pendingOperations: new Set<string>(),
};

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useCartStore = create<CartStore>((set, get) => ({
  ...initialState,

  // Drawer Actions
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

  // Fetch Cart from API
  fetchCart: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/cart');
      const data = await response.json();

      if (!data.success) {
        // User not authenticated or other error
        set({
          cart: null,
          isLoading: false,
          isInitialized: true,
          error: data.error || null,
        });
        return;
      }

      set({
        cart: data.cart,
        isLoading: false,
        isInitialized: true,
        error: null,
      });
    } catch (error) {
      console.error('[CartStore] Error fetching cart:', error);
      set({
        isLoading: false,
        isInitialized: true,
        error: 'Erro ao carregar carrinho',
      });
    }
  },

  // Add Item to Cart
  addItem: async (productId: string, quantity = 1) => {
    const { pendingOperations } = get();
    const operationId = `add-${productId}`;

    // Prevent duplicate operations
    if (pendingOperations.has(operationId)) {
      return false;
    }

    set({
      pendingOperations: new Set([...pendingOperations, operationId]),
      error: null,
    });

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      });

      const data = await response.json();

      // Remove from pending
      const updated = new Set(get().pendingOperations);
      updated.delete(operationId);
      set({ pendingOperations: updated });

      if (!data.success) {
        set({ error: data.error });
        return false;
      }

      set({ cart: data.cart, isDrawerOpen: true });
      return true;
    } catch (error) {
      console.error('[CartStore] Error adding item:', error);
      const updated = new Set(get().pendingOperations);
      updated.delete(operationId);
      set({
        pendingOperations: updated,
        error: 'Erro ao adicionar ao carrinho',
      });
      return false;
    }
  },

  // Update Item Quantity
  updateQuantity: async (itemId: string, quantity: number) => {
    const { cart, pendingOperations } = get();
    const operationId = `update-${itemId}`;

    if (pendingOperations.has(operationId) || !cart) {
      return false;
    }

    // Optimistic update
    const previousCart = cart;
    const optimisticItems = cart.items.map((item) =>
      item.id === itemId
        ? { ...item, quantity, totalPrice: Math.round(item.unitPrice * quantity * 100) / 100 }
        : item
    );

    set({
      cart: {
        ...cart,
        items: optimisticItems,
        subtotal: Math.round(optimisticItems.reduce((sum, item) => sum + item.totalPrice, 0) * 100) / 100,
        itemCount: optimisticItems.reduce((sum, item) => sum + item.quantity, 0),
      },
      pendingOperations: new Set([...pendingOperations, operationId]),
      error: null,
    });

    try {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });

      const data = await response.json();

      const updated = new Set(get().pendingOperations);
      updated.delete(operationId);
      set({ pendingOperations: updated });

      if (!data.success) {
        // Rollback optimistic update
        set({ cart: previousCart, error: data.error });
        return false;
      }

      set({ cart: data.cart });
      return true;
    } catch (error) {
      console.error('[CartStore] Error updating quantity:', error);
      const updated = new Set(get().pendingOperations);
      updated.delete(operationId);
      set({
        cart: previousCart,
        pendingOperations: updated,
        error: 'Erro ao atualizar quantidade',
      });
      return false;
    }
  },

  // Remove Item from Cart
  removeItem: async (itemId: string) => {
    const { cart, pendingOperations } = get();
    const operationId = `remove-${itemId}`;

    if (pendingOperations.has(operationId) || !cart) {
      return false;
    }

    // Optimistic update
    const previousCart = cart;
    const optimisticItems = cart.items.filter((item) => item.id !== itemId);

    set({
      cart: {
        ...cart,
        items: optimisticItems,
        subtotal: Math.round(optimisticItems.reduce((sum, item) => sum + item.totalPrice, 0) * 100) / 100,
        itemCount: optimisticItems.reduce((sum, item) => sum + item.quantity, 0),
        isEmpty: optimisticItems.length === 0,
        hasOutOfStockItems: optimisticItems.some((item) => item.isOutOfStock),
        hasPriceChangedItems: optimisticItems.some((item) => item.priceChanged),
        // loyaltyPointsTotal: optimisticItems.reduce((sum, item) => sum + item.product.loyaltyPoints * item.quantity, 0), // FEATURE DISABLED
      },
      pendingOperations: new Set([...pendingOperations, operationId]),
      error: null,
    });

    try {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      const updated = new Set(get().pendingOperations);
      updated.delete(operationId);
      set({ pendingOperations: updated });

      if (!data.success) {
        set({ cart: previousCart, error: data.error });
        return false;
      }

      set({ cart: data.cart });
      return true;
    } catch (error) {
      console.error('[CartStore] Error removing item:', error);
      const updated = new Set(get().pendingOperations);
      updated.delete(operationId);
      set({
        cart: previousCart,
        pendingOperations: updated,
        error: 'Erro ao remover item',
      });
      return false;
    }
  },

  // Clear Cart
  clearCart: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        set({ isLoading: false, error: data.error });
        return;
      }

      set({ cart: data.cart, isLoading: false });
    } catch (error) {
      console.error('[CartStore] Error clearing cart:', error);
      set({ isLoading: false, error: 'Erro ao limpar carrinho' });
    }
  },

  // Internal Actions
  setCart: (cart) => set({ cart }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Selectors (for optimized re-renders)
// ─────────────────────────────────────────────────────────────────────────────

export const selectCartItemCount = (state: CartStore) =>
  state.cart?.itemCount ?? 0;

export const selectCartSubtotal = (state: CartStore) =>
  state.cart?.subtotal ?? 0;

export const selectIsCartEmpty = (state: CartStore) =>
  state.cart?.isEmpty ?? true;

export const selectCartItems = (state: CartStore) =>
  state.cart?.items ?? [];

export const selectIsItemPending = (itemId: string) => (state: CartStore) =>
  state.pendingOperations.has(`update-${itemId}`) ||
  state.pendingOperations.has(`remove-${itemId}`);
