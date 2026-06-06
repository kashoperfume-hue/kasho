"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LocalCartItem, Product } from "@/types";
import toast from "react-hot-toast";

interface CartStore {
  items: LocalCartItem[];
  isOpen: boolean;
  // Actions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  closeCart: () => void;
  openCart: () => void;
  // Computed
  totalItems: () => number;
  subtotal: () => number;
  shipping: () => number;
  total: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(
            (item) => item.product.id === product.id
          );
          if (existing) {
            const newQty = Math.min(
              existing.quantity + quantity,
              product.stock_quantity
            );
            toast.success("Cart updated");
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: newQty }
                  : item
              ),
              isOpen: true,
            };
          }
          toast.success("Added to cart");
          return {
            items: [...state.items, { product, quantity }],
            isOpen: true,
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }));
        toast.success("Removed from cart");
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      closeCart: () => set({ isOpen: false }),
      openCart: () => set({ isOpen: true }),

      totalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      subtotal: () =>
        get().items.reduce(
          (sum, item) => sum + item.product.sale_price * item.quantity,
          0
        ),

      shipping: () => {
        const sub = get().subtotal();
        return sub >= 999 ? 0 : 99;
      },

      total: () => get().subtotal() + get().shipping(),
    }),
    {
      name: "kasho-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
