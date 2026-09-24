import "./load-env";

import { Bot, Context, InlineKeyboard, session, type SessionFlavor } from "grammy";
import { supabaseRead, supabaseWrite } from "./supabase";
import { initialSession, type SessionData } from "./session";
import { formatPrice } from "../src/lib/format";
import { generateOrderNumber } from "../src/lib/order-number";
import type { OrderItem, ProductCategory, ProductRow } from "../src/lib/database.types";

const token = process.env.TELEGRAM_BOT_TOKEN;
const adminChatId = process.env.TELEGRAM_CHAT_ID;
if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN не задан в .env.local — см. README, раздел про Telegram-бота.");
}

type MyContext = Context & SessionFlavor<SessionData>;
const bot = new Bot<MyContext>(token);
bot.use(session({ initial: initialSession }));

const MAX_QTY = 20;
const CATEGORY_LABEL: Record<ProductCategory, string> = {
  parfum: "🌸 Парфюмерия",
  "3d_print": "🖨 3D-печать",
};

// ---------------------------------------------------------------------------
// screens
// ---------------------------------------------------------------------------

function mainMenuKeyboard() {
  return new InlineKeyboard()
    .text(CATEGORY_LABEL.parfum, "cat:parfum")
    .row()
    .text(CATEGORY_LABEL["3d_print"], "cat:3d_print")
    .row()
    .text("🛒 Корзина", "cart:view");
}

async function sendMainMenu(ctx: MyContext) {
  await ctx.reply("RK — Private Edition\nВыберите раздел:", { reply_markup: mainMenuKeyboard() });
}

async function sendCategory(ctx: MyContext, category: ProductCategory) {
  const { data, error } = await supabaseRead
    .from("products")
    .select("*")
    .eq("category", category)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .returns<ProductRow[]>();

  if (error) {
    console.error("catalog fetch failed", error);
    await ctx.reply("Не удалось загрузить каталог. Попробуйте ещё раз чуть позже.");
    return;
  }

  const products = data ?? [];
  const kb = new InlineKeyboard();
  if (products.length === 0) {
    await ctx.reply(`${CATEGORY_LABEL[category]}\n\nСкоро здесь появятся товары.`, {
      reply_markup: kb.text("⬅ Меню", "back:menu"),
    });
    return;
  }

  for (const p of products) {
    kb.text(`${p.name} — ${formatPrice(p.price, p.currency)}`, `prod:${p.id}`).row();
  }
  kb.text("⬅ Меню", "back:menu");

  await ctx.reply(`${CATEGORY_LABEL[category]}\n\nВыберите товар:`, { reply_markup: kb });
}

function formatProductDetails(p: ProductRow): string {
  const lines = [p.name, formatPrice(p.price, p.currency)];
  if (p.short_description) lines.push(p.short_description);
  if (p.category === "parfum") {
    if (p.aroma_notes) lines.push(`Ноты: ${p.aroma_notes}`);
    if (p.volume_ml) {
      const remain = p.remaining_ml != null ? ` (осталось ${p.remaining_ml} мл)` : "";
      lines.push(`Объём: ${p.volume_ml} мл${remain}`);
    }
  } else {
    if (p.material) lines.push(`Материал: ${p.material}`);
    if (p.dimensions) lines.push(`Размеры: ${p.dimensions}`);
  }
  if (p.description && p.description !== p.short_description) {
    lines.push("", p.description);
  }
  return lines.join("\n");
}

async function sendProduct(ctx: MyContext, productId: string) {
  const { data: product, error } = await supabaseRead
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("is_active", true)
    .maybeSingle<ProductRow>();

  if (error || !product) {
    await ctx.reply("Товар недоступен — возможно, его сняли с продажи.");
    return;
  }

  const kb = new InlineKeyboard()
    .text("➕ В корзину", `add:${product.id}`)
    .row()
    .text("🛒 Корзина", "cart:view")
    .text("⬅ К списку", `cat:${product.category}`);

  const caption = formatProductDetails(product);
  const photo = product.images[0];
  if (photo) {
    await ctx.replyWithPhoto(photo, { caption, reply_markup: kb });
  } else {
    await ctx.reply(caption, { reply_markup: kb });
  }
}

async function cartLines(cart: SessionData["cart"]): Promise<{ text: string; total: number; items: OrderItem[] }> {
  if (cart.length === 0) return { text: "Корзина пуста.", total: 0, items: [] };

  const { data, error } = await supabaseRead
    .from("products")
    .select("*")
    .in(
      "id",
      cart.map((c) => c.productId)
    )
    .returns<ProductRow[]>();

  if (error || !data) return { text: "Не удалось загрузить корзину.", total: 0, items: [] };

  const rows: string[] = [];
  const items: OrderItem[] = [];
  let total = 0;
  for (const c of cart) {
    const p = data.find((row) => row.id === c.productId);
    if (!p) continue; // product removed/deactivated since it was added
    const subtotal = p.price * c.quantity;
    total += subtotal;
    rows.push(`${p.name} × ${c.quantity} — ${formatPrice(subtotal, p.currency)}`);
    // The bot doesn't offer volume-option selection (that's a website-only
    // flow for now) — bot orders always buy at the product's flat price.
    items.push({
      product_id: p.id,
      name: p.name,
      price: p.price,
      quantity: c.quantity,
      category: p.category,
      volume_label: null,
    });
  }

  const text = rows.length
    ? `🛒 Ваша корзина:\n\n${rows.join("\n")}\n\nИтого: ${formatPrice(total)}`
    : "Корзина пуста.";
  return { text, total, items };
}

async function sendCart(ctx: MyContext) {
  const { text, items } = await cartLines(ctx.session.cart);
  const kb = new InlineKeyboard();
  for (const item of items) {
    kb.text(`✕ Убрать: ${item.name}`, `cart:remove:${item.product_id}`).row();
  }
  if (items.length > 0) {
    kb.text("Оформить заказ", "cart:checkout").row();
    kb.text("🗑 Очистить", "cart:clear").row();
  }
  kb.text("⬅ Меню", "back:menu");
  await ctx.reply(text, { reply_markup: kb });
}

// ---------------------------------------------------------------------------
// checkout
// ---------------------------------------------------------------------------

function cancelKeyboard() {
  return new InlineKeyboard().text("❌ Отмена", "checkout:cancel");
}

async function askName(ctx: MyContext) {
  ctx.session.checkout = { step: "name" };
  await ctx.reply("Как к вам обращаться? Напишите имя.", { reply_markup: cancelKeyboard() });
}

async function askPhone(ctx: MyContext) {
  ctx.session.checkout!.step = "phone";
  await ctx.reply(
    "Оставьте номер телефона для связи — или нажмите «Пропустить», и мы свяжемся с вами через Telegram.",
    { reply_markup: cancelKeyboard().text("Пропустить", "checkout:skip_phone") }
  );
}

async function askComment(ctx: MyContext) {
  ctx.session.checkout!.step = "comment";
  await ctx.reply("Комментарий к заказу (необязательно).", {
    reply_markup: cancelKeyboard().text("Пропустить", "checkout:skip_comment"),
  });
}

async function askConfirm(ctx: MyContext) {
  const draft = ctx.session.checkout!;
  draft.step = "confirm";
  const { text: cartText, total } = await cartLines(ctx.session.cart);
  const summary = [
    cartText,
    "",
    `Имя: ${draft.name}`,
    draft.phone ? `Телефон: ${draft.phone}` : "Телефон: не указан (свяжемся через Telegram)",
    draft.comment ? `Комментарий: ${draft.comment}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  await ctx.reply(`Проверьте заказ перед отправкой:\n\n${summary}`, {
    reply_markup: new InlineKeyboard()
      .text("✅ Подтвердить", "checkout:confirm")
      .text("❌ Отмена", "checkout:cancel"),
  });
  void total; // total is recomputed authoritatively again at insert time
}

async function submitOrder(ctx: MyContext) {
  const draft = ctx.session.checkout;
  if (!draft || draft.step !== "confirm" || !draft.name) return;

  const { items, total } = await cartLines(ctx.session.cart);
  if (items.length === 0) {
    await ctx.reply("Корзина пуста — заказ не создан.");
    ctx.session.checkout = undefined;
    return;
  }

  const orderNumber = generateOrderNumber();
  const username = ctx.from?.username ?? null;
  const { error } = await supabaseWrite.from("orders").insert({
    order_number: orderNumber,
    user_id: null,
    items,
    total,
    contact_name: draft.name,
    contact_phone: draft.phone ?? null,
    contact_telegram: username,
    contact_email: null,
    comment: draft.comment ?? null,
    status: "new",
    source: "telegram",
    telegram_chat_id: ctx.chat!.id,
    telegram_username: username,
  });

  if (error) {
    console.error("telegram order insert failed", error);
    await ctx.reply("Не удалось оформить заказ. Попробуйте ещё раз или напишите нам напрямую.");
    return;
  }

  ctx.session.cart = [];
  ctx.session.checkout = undefined;
  await ctx.reply(`✅ Заказ №${orderNumber} оформлен! Мы свяжемся с вами в ближайшее время.`, {
    reply_markup: mainMenuKeyboard(),
  });

  if (adminChatId) {
    const itemsText = items.map((i) => `• ${i.name} × ${i.quantity} — ${formatPrice(i.price * i.quantity)}`).join("\n");
    const contactLine = username ? `Telegram: @${username}` : `Telegram id: ${ctx.chat!.id}`;
    const text = [
      `🛍 Новый заказ №${orderNumber} (из Telegram-бота)`,
      "",
      itemsText,
      "",
      `Итого: ${formatPrice(total)}`,
      "",
      `Имя: ${draft.name}`,
      draft.phone ? `Телефон: ${draft.phone}` : contactLine,
      draft.comment ? `\nКомментарий: ${draft.comment}` : "",
    ].join("\n");
    try {
      await bot.api.sendMessage(adminChatId, text);
    } catch (err) {
      console.error("failed to notify admin chat", err);
    }
  }
}

// ---------------------------------------------------------------------------
// commands
// ---------------------------------------------------------------------------

bot.command("start", async (ctx) => {
  await ctx.reply(
    "Добро пожаловать в RK — Private Edition.\nПриватная парфюмерия и авторские 3D-объекты ограниченным тиражом."
  );
  await sendMainMenu(ctx);
});

bot.command("menu", sendMainMenu);
bot.command("cart", sendCart);

// ---------------------------------------------------------------------------
// callback queries
// ---------------------------------------------------------------------------

bot.callbackQuery("back:menu", async (ctx) => {
  await ctx.answerCallbackQuery();
  await sendMainMenu(ctx);
});

bot.callbackQuery(/^cat:(parfum|3d_print)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await sendCategory(ctx, ctx.match[1] as ProductCategory);
});

bot.callbackQuery(/^prod:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await sendProduct(ctx, ctx.match[1]);
});

bot.callbackQuery(/^add:(.+)$/, async (ctx) => {
  const productId = ctx.match[1];
  const { data: product } = await supabaseRead
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("is_active", true)
    .maybeSingle();

  if (!product) {
    await ctx.answerCallbackQuery({ text: "Товар недоступен.", show_alert: true });
    return;
  }

  const existing = ctx.session.cart.find((c) => c.productId === productId);
  if (existing) {
    existing.quantity = Math.min(MAX_QTY, existing.quantity + 1);
  } else {
    ctx.session.cart.push({ productId, quantity: 1 });
  }
  await ctx.answerCallbackQuery({ text: "Добавлено в корзину" });
});

bot.callbackQuery("cart:view", async (ctx) => {
  await ctx.answerCallbackQuery();
  await sendCart(ctx);
});

bot.callbackQuery(/^cart:remove:(.+)$/, async (ctx) => {
  const productId = ctx.match[1];
  ctx.session.cart = ctx.session.cart.filter((c) => c.productId !== productId);
  await ctx.answerCallbackQuery({ text: "Убрано из корзины" });
  await sendCart(ctx);
});

bot.callbackQuery("cart:clear", async (ctx) => {
  ctx.session.cart = [];
  await ctx.answerCallbackQuery({ text: "Корзина очищена" });
  await sendCart(ctx);
});

bot.callbackQuery("cart:checkout", async (ctx) => {
  if (ctx.session.cart.length === 0) {
    await ctx.answerCallbackQuery({ text: "Корзина пуста", show_alert: true });
    return;
  }
  await ctx.answerCallbackQuery();
  await askName(ctx);
});

bot.callbackQuery("checkout:cancel", async (ctx) => {
  ctx.session.checkout = undefined;
  await ctx.answerCallbackQuery({ text: "Оформление отменено" });
  await sendCart(ctx);
});

bot.callbackQuery("checkout:skip_phone", async (ctx) => {
  if (ctx.session.checkout?.step !== "phone") {
    await ctx.answerCallbackQuery();
    return;
  }
  await ctx.answerCallbackQuery();
  await askComment(ctx);
});

bot.callbackQuery("checkout:skip_comment", async (ctx) => {
  if (ctx.session.checkout?.step !== "comment") {
    await ctx.answerCallbackQuery();
    return;
  }
  await ctx.answerCallbackQuery();
  await askConfirm(ctx);
});

bot.callbackQuery("checkout:confirm", async (ctx) => {
  await ctx.answerCallbackQuery();
  await submitOrder(ctx);
});

// ---------------------------------------------------------------------------
// free-text replies (only meaningful mid-checkout)
// ---------------------------------------------------------------------------

bot.on("message:text", async (ctx) => {
  const draft = ctx.session.checkout;
  if (!draft) {
    await ctx.reply("Не понял. Используйте кнопки или команду /menu.");
    return;
  }

  const text = ctx.message.text.trim();
  if (draft.step === "name") {
    if (!text) {
      await ctx.reply("Имя не может быть пустым. Попробуйте ещё раз.");
      return;
    }
    draft.name = text.slice(0, 120);
    await askPhone(ctx);
    return;
  }
  if (draft.step === "phone") {
    draft.phone = text.slice(0, 40);
    await askComment(ctx);
    return;
  }
  if (draft.step === "comment") {
    draft.comment = text.slice(0, 500);
    await askConfirm(ctx);
    return;
  }
  // step === "confirm": nudge toward the buttons instead of free text
  await ctx.reply("Нажмите «✅ Подтвердить» или «❌ Отмена» выше.");
});

bot.catch((err) => {
  console.error("bot error:", err.error);
});

bot
  .start()
  .then(() => console.log("RK Telegram bot запущен (long polling)."))
  .catch((err) => {
    console.error("Не удалось запустить бота:", err);
    process.exit(1);
  });
