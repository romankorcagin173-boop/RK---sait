import type { OrderItem } from "@/lib/database.types";
import { formatPrice } from "@/lib/format";

interface NotifyOrderParams {
  orderNumber: string;
  items: OrderItem[];
  total: number;
  contactName: string;
  contactPhone?: string | null;
  contactTelegram?: string | null;
  contactEmail: string;
  comment?: string | null;
}

export async function notifyNewOrder(params: NotifyOrderParams) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID не заданы — уведомление не отправлено.");
    return;
  }

  const itemsText = params.items
    .map((i) => `• ${i.name} × ${i.quantity} — ${formatPrice(i.price * i.quantity)}`)
    .join("\n");

  const contactLines = [
    `Имя: ${params.contactName}`,
    params.contactPhone ? `Телефон: ${params.contactPhone}` : null,
    params.contactTelegram ? `Telegram: @${params.contactTelegram.replace(/^@/, "")}` : null,
    `Почта: ${params.contactEmail}`,
  ]
    .filter(Boolean)
    .join("\n");

  const text = [
    `🛍 Новый заказ №${params.orderNumber}`,
    "",
    itemsText,
    "",
    `Итого: ${formatPrice(params.total)}`,
    "",
    contactLines,
    params.comment ? `\nКомментарий: ${params.comment}` : "",
  ].join("\n");

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });

  if (!res.ok) {
    console.error("Telegram notify failed", await res.text());
  }
}
