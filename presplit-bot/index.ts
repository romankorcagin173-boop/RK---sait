import "./load-env";
import { Bot, InlineKeyboard, session, type Context, type SessionFlavor } from "grammy";
import {
  addFlacon,
  addRequest,
  closeFlacon,
  confirmRequest,
  getConfirmedRequests,
  getFlacon,
  getOpenFlacons,
  getPendingRequests,
  getRequest,
  rejectRequest,
  type Flacon,
} from "./store";

const token = process.env.PRESPLIT_BOT_TOKEN;
if (!token) {
  throw new Error("PRESPLIT_BOT_TOKEN не задан (см. .env.local).");
}

const adminId = Number(process.env.PRESPLIT_ADMIN_CHAT_ID ?? "");
const adminUsername = (process.env.PRESPLIT_ADMIN_USERNAME ?? "").replace(/^@/, "");

interface SessionData {
  stage?: "add_flacon_name" | "add_flacon_total" | "add_flacon_price" | "order_ml";
  draftFlaconName?: string;
  draftFlaconTotalMl?: number;
  orderFlaconId?: number;
}

type MyContext = Context & SessionFlavor<SessionData>;

const bot = new Bot<MyContext>(token);
bot.use(session({ initial: (): SessionData => ({}) }));

function isAdmin(ctx: MyContext) {
  return Number.isFinite(adminId) && ctx.from?.id === adminId;
}

function formatFlacon(f: Flacon) {
  const price = f.pricePerMl != null ? `, ${f.pricePerMl}₽/мл` : "";
  return `#${f.id} «${f.name}» — осталось ${f.remainingMl} из ${f.totalMl} мл${price}`;
}

function who(r: { username: string | null; firstName: string }) {
  return r.username ? `@${r.username}` : r.firstName;
}

bot.command("start", async (ctx) => {
  if (isAdmin(ctx)) {
    await ctx.reply(
      [
        "Бот предраспива RK — Parfum. Команды администратора:",
        "/add_flacon — добавить новый флакон",
        "/flacons — список открытых флаконов",
        "/close_flacon — закрыть флакон досрочно",
        "/pending — заявки, ждущие подтверждения оплаты",
        "/history — кто что уже забрал",
        "/whoami — ваш Telegram ID",
      ].join("\n")
    );
  } else {
    await ctx.reply(
      [
        "Привет! Здесь можно заказать предраспив из флаконов RK — Parfum.",
        "",
        "/flacons — что есть в наличии",
        "/order — заказать миллилитры",
        "",
        "После заявки мы попросим вас написать нам для оплаты, и подтвердим заявку, как только оплата дойдёт.",
      ].join("\n")
    );
  }
});

bot.command("whoami", async (ctx) => {
  await ctx.reply(`Ваш ID: ${ctx.from?.id}\nUsername: ${ctx.from?.username ? "@" + ctx.from.username : "—"}`);
});

bot.command("flacons", async (ctx) => {
  const open = getOpenFlacons();
  if (open.length === 0) {
    await ctx.reply("Сейчас нет флаконов в наличии для предраспива.");
    return;
  }
  await ctx.reply(["Доступные флаконы:", ...open.map(formatFlacon)].join("\n"));
});

bot.command("order", async (ctx) => {
  const open = getOpenFlacons();
  if (open.length === 0) {
    await ctx.reply("Сейчас нет флаконов в наличии для предраспива.");
    return;
  }
  const kb = new InlineKeyboard();
  for (const f of open) kb.text(`${f.name} (${f.remainingMl} мл)`, `order:${f.id}`).row();
  await ctx.reply("Какой флакон?", { reply_markup: kb });
});

bot.callbackQuery(/^order:(\d+)$/, async (ctx) => {
  const flaconId = Number(ctx.match[1]);
  const flacon = getFlacon(flaconId);
  if (!flacon || flacon.status !== "open") {
    await ctx.answerCallbackQuery({ text: "Этот флакон уже недоступен.", show_alert: true });
    return;
  }
  ctx.session.stage = "order_ml";
  ctx.session.orderFlaconId = flaconId;
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `«${flacon.name}», осталось ${flacon.remainingMl} мл.\nСколько миллилитров хотите заказать?`
  );
});

bot.command("add_flacon", async (ctx) => {
  if (!isAdmin(ctx)) {
    await ctx.reply("Эта команда доступна только администратору.");
    return;
  }
  ctx.session.stage = "add_flacon_name";
  ctx.session.draftFlaconName = undefined;
  ctx.session.draftFlaconTotalMl = undefined;
  await ctx.reply("Название флакона (например: Dior Sauvage 50 мл)?");
});

bot.command("close_flacon", async (ctx) => {
  if (!isAdmin(ctx)) {
    await ctx.reply("Эта команда доступна только администратору.");
    return;
  }
  const arg = ctx.match?.toString().trim();
  if (arg) {
    const id = Number(arg);
    await ctx.reply(closeFlacon(id) ? `Флакон #${id} закрыт.` : `Флакон #${id} не найден.`);
    return;
  }
  const open = getOpenFlacons();
  if (open.length === 0) {
    await ctx.reply("Нет открытых флаконов.");
    return;
  }
  const kb = new InlineKeyboard();
  for (const f of open) kb.text(`${f.name} (#${f.id})`, `close:${f.id}`).row();
  await ctx.reply("Какой флакон закрыть?", { reply_markup: kb });
});

bot.callbackQuery(/^close:(\d+)$/, async (ctx) => {
  if (!isAdmin(ctx)) {
    await ctx.answerCallbackQuery({ text: "Только для администратора.", show_alert: true });
    return;
  }
  const id = Number(ctx.match[1]);
  closeFlacon(id);
  await ctx.answerCallbackQuery({ text: "Закрыто" });
  await ctx.editMessageText(`Флакон #${id} закрыт.`);
});

bot.command("pending", async (ctx) => {
  if (!isAdmin(ctx)) {
    await ctx.reply("Эта команда доступна только администратору.");
    return;
  }
  const pending = getPendingRequests();
  if (pending.length === 0) {
    await ctx.reply("Нет заявок, ожидающих подтверждения.");
    return;
  }
  const lines = pending.map((r) => `#${r.id} ${who(r)} — ${r.ml} мл «${getFlacon(r.flaconId)?.name ?? "?"}»`);
  await ctx.reply(["Ожидают подтверждения:", ...lines].join("\n"));
});

bot.command("history", async (ctx) => {
  if (!isAdmin(ctx)) {
    await ctx.reply("Эта команда доступна только администратору.");
    return;
  }
  const confirmed = getConfirmedRequests();
  if (confirmed.length === 0) {
    await ctx.reply("Пока нет подтверждённых заказов.");
    return;
  }
  const lines = confirmed.map((r) => `#${r.id} ${who(r)} — ${r.ml} мл «${getFlacon(r.flaconId)?.name ?? "?"}»`);
  await ctx.reply(["Подтверждённые заказы:", ...lines].join("\n"));
});

bot.callbackQuery(/^confirm:(\d+)$/, async (ctx) => {
  if (!isAdmin(ctx)) {
    await ctx.answerCallbackQuery({ text: "Только для администратора.", show_alert: true });
    return;
  }
  const id = Number(ctx.match[1]);
  const result = confirmRequest(id);
  if (!result.ok) {
    await ctx.answerCallbackQuery({ text: result.reason, show_alert: true });
    return;
  }
  const request = getRequest(id)!;
  const flacon = getFlacon(request.flaconId)!;
  await ctx.answerCallbackQuery({ text: "Подтверждено" });
  await ctx.editMessageText(`${ctx.callbackQuery.message?.text ?? ""}\n\n✅ Подтверждено`);
  await ctx.api
    .sendMessage(
      request.userId,
      `Оплата по заявке #${request.id} подтверждена ✅\n${request.ml} мл «${flacon.name}» забронировано за вами. Скоро свяжемся по поводу отправки/самовывоза.`
    )
    .catch(() => {});
});

bot.callbackQuery(/^reject:(\d+)$/, async (ctx) => {
  if (!isAdmin(ctx)) {
    await ctx.answerCallbackQuery({ text: "Только для администратора.", show_alert: true });
    return;
  }
  const id = Number(ctx.match[1]);
  const request = getRequest(id);
  if (!request || !rejectRequest(id)) {
    await ctx.answerCallbackQuery({ text: "Заявка не найдена или уже обработана.", show_alert: true });
    return;
  }
  const flacon = getFlacon(request.flaconId);
  await ctx.answerCallbackQuery({ text: "Отклонено" });
  await ctx.editMessageText(`${ctx.callbackQuery.message?.text ?? ""}\n\n❌ Отклонено`);
  await ctx.api
    .sendMessage(
      request.userId,
      `Ваша заявка #${request.id} на ${request.ml} мл «${flacon?.name ?? ""}» отклонена.` +
        (adminUsername ? ` Если это ошибка — напишите @${adminUsername}.` : "")
    )
    .catch(() => {});
});

bot.on("message:text", async (ctx) => {
  const stage = ctx.session.stage;
  if (!stage) {
    await ctx.reply("Не понял. Используйте /flacons чтобы посмотреть наличие или /order чтобы заказать.");
    return;
  }
  const text = ctx.message.text.trim();

  if (stage === "add_flacon_name") {
    if (!isAdmin(ctx)) {
      ctx.session.stage = undefined;
      return;
    }
    ctx.session.draftFlaconName = text;
    ctx.session.stage = "add_flacon_total";
    await ctx.reply("Сколько всего миллилитров во флаконе?");
    return;
  }

  if (stage === "add_flacon_total") {
    const total = Number(text.replace(",", "."));
    if (!Number.isFinite(total) || total <= 0) {
      await ctx.reply("Введите число миллилитров, например 50.");
      return;
    }
    ctx.session.draftFlaconTotalMl = total;
    ctx.session.stage = "add_flacon_price";
    await ctx.reply("Цена за 1 мл, ₽? Если не хотите указывать — отправьте «-».");
    return;
  }

  if (stage === "add_flacon_price") {
    let price: number | null = null;
    if (text !== "-") {
      const parsed = Number(text.replace(",", "."));
      if (!Number.isFinite(parsed) || parsed <= 0) {
        await ctx.reply("Введите число, или «-» чтобы пропустить.");
        return;
      }
      price = parsed;
    }
    const name = ctx.session.draftFlaconName;
    const totalMl = ctx.session.draftFlaconTotalMl;
    ctx.session.stage = undefined;
    ctx.session.draftFlaconName = undefined;
    ctx.session.draftFlaconTotalMl = undefined;
    if (!name || !totalMl) {
      await ctx.reply("Что-то пошло не так, начните заново: /add_flacon");
      return;
    }
    const flacon = addFlacon(name, totalMl, price);
    await ctx.reply(`Флакон добавлен: ${formatFlacon(flacon)}`);
    return;
  }

  if (stage === "order_ml") {
    const flaconId = ctx.session.orderFlaconId;
    const flacon = flaconId ? getFlacon(flaconId) : undefined;
    if (!flacon || flacon.status !== "open") {
      ctx.session.stage = undefined;
      ctx.session.orderFlaconId = undefined;
      await ctx.reply("Этот флакон уже недоступен. Используйте /order заново.");
      return;
    }
    const ml = Number(text.replace(",", "."));
    if (!Number.isFinite(ml) || ml <= 0) {
      await ctx.reply("Введите количество миллилитров числом, например 10.");
      return;
    }
    if (ml > flacon.remainingMl) {
      await ctx.reply(`Столько уже нет — осталось ${flacon.remainingMl} мл. Введите другое количество.`);
      return;
    }

    const request = addRequest({
      flaconId: flacon.id,
      userId: ctx.from!.id,
      username: ctx.from!.username ?? null,
      firstName: ctx.from!.first_name,
      ml,
    });
    ctx.session.stage = undefined;
    ctx.session.orderFlaconId = undefined;

    const price = flacon.pricePerMl != null ? ` (≈${Math.round(flacon.pricePerMl * ml)}₽)` : "";
    await ctx.reply(
      `Заявка #${request.id} принята: ${ml} мл «${flacon.name}»${price}.\n\n` +
        (adminUsername
          ? `Для оплаты напишите @${adminUsername}. После получения оплаты мы подтвердим заявку, и об этом придёт сообщение сюда.`
          : `Мы свяжемся с вами по поводу оплаты.`)
    );

    if (Number.isFinite(adminId)) {
      const kb = new InlineKeyboard()
        .text("✅ Подтвердить", `confirm:${request.id}`)
        .text("❌ Отклонить", `reject:${request.id}`);
      await ctx.api
        .sendMessage(
          adminId,
          `Новая заявка #${request.id}\n${who(request)} (id ${request.userId})\n«${flacon.name}»: ${ml} мл${price}\nОсталось во флаконе сейчас: ${flacon.remainingMl} мл`,
          { reply_markup: kb }
        )
        .catch(() => {});
    }
  }
});

bot.catch((err) => {
  console.error("Presplit bot error:", err);
});

bot.start();
console.log("Presplit bot запущен.");
