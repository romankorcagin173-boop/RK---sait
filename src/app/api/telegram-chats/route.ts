import { NextResponse } from "next/server";

// Self-service helper for finding a chat_id you don't know yet — most
// commonly a group's, after switching order notifications from a personal
// chat to a group. Open http://localhost:3000/api/telegram-chats and it
// lists every chat Telegram has recently handed the bot via getUpdates,
// with its chat_id, so you can copy the right one into TELEGRAM_CHAT_ID
// without guessing.
//
// For a group to show up here, Telegram must actually deliver its messages
// to the bot. By default a bot in a group only sees commands and replies
// to itself ("privacy mode"); making the bot a group *admin* bypasses that
// and lets it see everything. So: add the bot to the group, promote it to
// admin (any permissions are fine), send one message in the group, then
// load this page.
interface TelegramChat {
  id: number;
  type: string;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "TELEGRAM_BOT_TOKEN не задан в .env.local — сначала заполните его (см. README, раздел 4).",
      },
      { status: 200 }
    );
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=100`);
    const data = await res.json();

    if (!res.ok || !data.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: "Telegram отклонил запрос — проверьте, что TELEGRAM_BOT_TOKEN верный.",
          telegramResponse: data,
        },
        { status: 200 }
      );
    }

    const chatsById = new Map<number, TelegramChat>();
    for (const update of (data.result ?? []) as Array<Record<string, unknown>>) {
      const chat =
        (update.message as { chat?: TelegramChat } | undefined)?.chat ??
        (update.channel_post as { chat?: TelegramChat } | undefined)?.chat ??
        (update.my_chat_member as { chat?: TelegramChat } | undefined)?.chat;
      if (chat) chatsById.set(chat.id, chat);
    }

    const chats = Array.from(chatsById.values()).map((chat) => ({
      chat_id: chat.id,
      type: chat.type,
      name:
        chat.title ||
        [chat.first_name, chat.last_name].filter(Boolean).join(" ") ||
        chat.username ||
        "—",
    }));

    return NextResponse.json({
      ok: true,
      message: chats.length
        ? "Скопируйте chat_id нужного чата (группы или личного) в TELEGRAM_CHAT_ID и перезапустите сервер."
        : "Бот пока не видит ни одного чата. Добавьте бота в группу, сделайте его администратором " +
          "группы (важно — иначе Telegram не покажет боту обычные сообщения), отправьте в группе " +
          "любое сообщение, затем обновите эту страницу.",
      chats,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        message: "Не удалось достучаться до api.telegram.org с этого сервера.",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 200 }
    );
  }
}
