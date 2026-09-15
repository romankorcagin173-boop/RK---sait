"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart";

// Rehydrates the persisted cart from localStorage after mount, once React
// has already committed a render that matches the server (empty cart).
// Doing this synchronously during store creation — zustand's default
// behavior — makes the very first client render diverge from the
// server-rendered HTML whenever a visitor already has items in their
// cart, which React reports as a hydration mismatch.
export function CartHydration() {
  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  return null;
}
