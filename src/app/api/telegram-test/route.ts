import { NextResponse } from "next/server";

// Diagnostic-only endpoint: open http://localhost:3000/api/telegram-test
// in the browser after setting TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID and
// restarting `npm run dev`. It calls the Telegram API directly and shows
// you exactly what Telegram says back, instead of you having to dig
// through server logs. Safe to delete once notifications work.
export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return NextResponse.json(
      {
        ok: false,
        step: "env",
        message:
          "TELEGRAM_BOT_TOKEN и/или TELEGRAM_CHAT_ID не видны серверу. Проверьте .env.local " +
          "(без кавычек вокруг значений) и обязательно перезапустите `npm run dev` после правки.",
        tokenPresent: Boolean(token),
        chatIdPresent: Boolean(chatId),
      },
      { status: 200 }
    );
  }

  if (chatId === token.split(":")[0]) {
    return NextResponse.json(
      {
        ok: false,
        step: "chat_id",
        message:
          "TELEGRAM_CHAT_ID совпадает с ID самого бота — это неверный chat_id. " +
          "Нужен ваш личный chat_id (см. README).",
      },
      { status: 200 }
    );
  }

  // Step 1: is the token itself valid?
  let meResult: unknown;
  try {
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    meResult = await meRes.json();
    if (!meRes.ok) {
      return NextResponse.json(
        { ok: false, step: "getMe", message: "Токен бота недействителен.", telegramResponse: meResult },
        { status: 200 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        step: "getMe",
        message:
          "Не удалось достучаться до api.telegram.org с этого сервера — проверьте интернет/файрвол на этой машине.",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 200 }
    );
  }

  // Step 2: can we actually send to this chat_id?
  try {
    const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "✅ Тестовое сообщение с сайта RK — Private Edition. Если оно пришло, уведомления о заказах настроены верно.",
      }),
    });
    const sendResult = await sendRes.json();

    return NextResponse.json({
      ok: sendRes.ok,
      step: "sendMessage",
      message: sendRes.ok
        ? "Отправлено. Проверьте Telegram — тестовое сообщение должно было прийти."
        : "Telegram отклонил отправку сообщения. Смотрите telegramResponse.description ниже.",
      bot: meResult,
      telegramResponse: sendResult,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        step: "sendMessage",
        message: "Запрос на отправку не прошёл на сетевом уровне.",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 200 }
    );
  }
}
