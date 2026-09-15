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
  if (chatId === token.split(":")[0]) {
    console.error(
      "TELEGRAM_CHAT_ID совпадает с ID самого бота (первая часть токена до ':'). " +
        "Это неверный chat_id — Telegram не сможет доставить сообщение. " +
        "Нужен ваш личный chat_id: напишите боту любое сообщение, затем откройте " +
        `https://api.telegram.org/bot${token}/getUpdates и возьмите число из "chat":{"id": ...}.`
    );
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
    // Plain text — the message has no markup, so there's nothing for a
    // parse_mode to buy us, and it only adds a way for a stray "<" or "&"
    // in a product/comment field to make Telegram reject the whole request.
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  if (!res.ok) {
    console.error("Telegram notify failed:", res.status, await res.text());
  } else {
    console.log("Telegram notify sent to chat", chatId);
  }
}
