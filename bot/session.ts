import type { SessionFlavor } from "grammy";

export interface CartItem {
  productId: string;
  quantity: number;
}

export type CheckoutStep = "name" | "phone" | "comment" | "confirm";

export interface CheckoutDraft {
  step: CheckoutStep;
  name?: string;
  phone?: string;
  comment?: string;
}

export interface SessionData {
  cart: CartItem[];
  checkout?: CheckoutDraft;
}

export type BotContext = SessionFlavor<SessionData>;

export function initialSession(): SessionData {
  return { cart: [] };
}
