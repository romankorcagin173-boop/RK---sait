"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductCategory } from "@/lib/database.types";

export interface CartItem {
  productId: string;
  // undefined = product has no volume options (unchanged pre-variant
  // behaviour); null = the "whole bottle" option; a number = decant size
  // in ml. Together with productId this forms the line's identity, so the
  // same product bought in two different volumes is two separate lines.
  variantMl?: number | null;
  volumeLabel?: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  category: ProductCategory;
  quantity: number;
}

function lineKey(item: Pick<CartItem, "productId" | "variantMl">) {
  return `${item.productId}::${item.variantMl === undefined ? "" : String(item.variantMl)}`;
}

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  remove: (productId: string, variantMl?: number | null) => void;
  setQuantity: (productId: string, quantity: number, variantMl?: number | null) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, quantity = 1) => {
        set((state) => {
          const key = lineKey(item);
          const existing = state.items.find((i) => lineKey(i) === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                lineKey(i) === key ? { ...i, quantity: i.quantity + quantity } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
        });
      },
      remove: (productId, variantMl) =>
        set((state) => ({
          items: state.items.filter((i) => lineKey(i) !== lineKey({ productId, variantMl })),
        })),
      setQuantity: (productId, quantity, variantMl) =>
        set((state) => {
          const key = lineKey({ productId, variantMl });
          return {
            items:
              quantity <= 0
                ? state.items.filter((i) => lineKey(i) !== key)
                : state.items.map((i) => (lineKey(i) === key ? { ...i, quantity } : i)),
          };
        }),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "rk-cart",
      // Rehydrated manually after mount (see CartHydration) so the very
      // first client render matches the server's empty-cart render instead
      // of jumping straight to whatever was in localStorage.
      skipHydration: true,
    }
  )
);
