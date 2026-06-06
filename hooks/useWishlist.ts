"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/types";
import toast from "react-hot-toast";

interface WishlistStore {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  toggle: (product: Product) => void;
  isWishlisted: (productId: string) => boolean;
  count: () => number;
}

export const useWishlist = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        set((state) => {
          if (state.items.find((p) => p.id === product.id)) return state;
          toast.success("Added to wishlist");
          return { items: [...state.items, product] };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((p) => p.id !== productId),
        }));
        toast.success("Removed from wishlist");
      },

      toggle: (product) => {
        const { isWishlisted, addItem, removeItem } = get();
        if (isWishlisted(product.id)) {
          removeItem(product.id);
        } else {
          addItem(product);
        }
      },

      isWishlisted: (productId) =>
        get().items.some((p) => p.id === productId),

      count: () => get().items.length,
    }),
    {
      name: "kasho-wishlist",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
