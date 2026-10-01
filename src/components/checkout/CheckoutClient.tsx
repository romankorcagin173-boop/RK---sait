"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Send } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/format";
import { Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

interface OrderResult {
  orderNumber: string;
  items: { name: string; price: number; quantity: number; volume_label: string | null }[];
  total: number;
}

interface FormState {
  name?: string;
  phone?: string;
  telegram?: string;
  email?: string;
  comment?: string;
}

function buildOrderText(
  result: OrderResult,
  contact: { name: string; phone: string; telegram: string; email: string; comment: string }
) {
  const itemLines = result.items.map(
    (i) =>
      `• ${i.name}${i.volume_label ? ` (${i.volume_label})` : ""} × ${i.quantity} — ${formatPrice(i.price * i.quantity)}`
  );
  const contactLines = [
    `Имя: ${contact.name}`,
    contact.phone ? `Телефон: ${contact.phone}` : null,
    contact.telegram ? `Telegram: @${contact.telegram.replace(/^@/, "")}` : null,
    `Почта: ${contact.email}`,
    contact.comment ? `Комментарий: ${contact.comment}` : null,
  ].filter((l): l is string => Boolean(l));

  return [`Заказ №${result.orderNumber}`, "", ...itemLines, "", `Итого: ${formatPrice(result.total)}`, "", ...contactLines].join(
    "\n"
  );
}

export function CheckoutClient({ telegramContact }: { telegramContact: string | null }) {
  const router = useRouter();
  const { authUser, profile, loading: authLoading } = useAuth();
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total());
  const clear = useCartStore((s) => s.clear);

  // Fields the user hasn't touched yet fall back to their profile info,
  // computed at render time instead of copied into state via an effect.
  const [edited, setEdited] = useState<FormState>({});
  const form = {
    name: edited.name ?? profile?.username ?? "",
    phone: edited.phone ?? profile?.phone ?? "",
    telegram: edited.telegram ?? profile?.telegram_username ?? "",
    email: edited.email ?? profile?.email ?? "",
    comment: edited.comment ?? "",
  };
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrderResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.replace("/login?next=/checkout");
    }
  }, [authLoading, authUser, router]);

  function update<K extends keyof FormState>(key: K, value: string) {
    setEdited((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.phone && !form.telegram) {
      setError("Укажите телефон или Telegram для связи.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            variantMl: i.variantMl,
          })),
          contactName: form.name,
          contactPhone: form.phone || undefined,
          contactTelegram: form.telegram || undefined,
          contactEmail: form.email,
          comment: form.comment || undefined,
        }),
      });
      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : null;
      if (!res.ok || !data) {
        throw new Error(data?.error || "Сервер не ответил. Попробуйте ещё раз.");
      }

      setResult(data);
      clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось оформить заказ.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Не удалось скопировать — скопируйте текст вручную.");
    }
  }

  if (result) {
    const orderText = buildOrderText(result, form);
    const telegramUrl = telegramContact
      ? `https://t.me/${telegramContact.replace(/^@/, "")}?text=${encodeURIComponent(orderText)}`
      : null;

    return (
      <div className="container-page flex flex-1 items-center justify-center py-24">
        <div className="w-full max-w-lg rounded-2xl border border-red/30 bg-charcoal p-8 sm:p-10 text-center shadow-[0_0_60px_rgba(163,39,42,0.12)]">
          <h1 className="font-display text-3xl text-paper mb-3">✨ Заказ оформлен!</h1>
          <p className="text-ash mb-6">
            Номер заказа <span className="text-paper">№{result.orderNumber}</span>. Чтобы мы увидели
            заказ быстрее — скопируйте его и отправьте нам в Telegram.
          </p>

          <div className="rounded-xl border hairline bg-ink-soft p-5 text-left mb-6 whitespace-pre-line text-sm text-ash">
            {orderText}
          </div>

          <div className="flex flex-col gap-3 mb-6 sm:flex-row">
            <Button onClick={() => handleCopy(orderText)} variant="outline" className="flex-1">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Скопировано" : "Скопировать заказ"}
            </Button>
            {telegramUrl && (
              <Button
                onClick={() => window.open(telegramUrl, "_blank", "noopener,noreferrer")}
                className="flex-1"
              >
                <Send size={16} />
                Отправить заказ
              </Button>
            )}
          </div>

          {telegramUrl && (
            <p className="text-xs text-ash-soft mb-6">
              1. Скопируйте заказ → 2. Нажмите «Отправить заказ» → 3. Вставьте и отправьте
              сообщение, если текст не подставился сам.
            </p>
          )}

          <p className="text-sm text-paper mb-6">Благодарим за понимание 🤍</p>

          <Button onClick={() => router.push("/account")} variant="ghost" className="w-full">
            К истории заказов
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page flex flex-1 items-center justify-center py-24 text-center">
        <p className="text-ash">Корзина пуста.</p>
      </div>
    );
  }

  return (
    <div className="container-page py-16 sm:py-24">
      <h1 className="font-display text-4xl text-paper mb-12">Оформление заказа</h1>

      <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-xl">
          <Input label="Имя" required value={form.name} onChange={(e) => update("name", e.target.value)} />
          <Input
            label="Телефон"
            type="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
          <Input
            label="Telegram"
            placeholder="@username"
            value={form.telegram}
            onChange={(e) => update("telegram", e.target.value)}
            hint="Телефон или Telegram — заполните хотя бы одно поле"
          />
          <Input
            label="Почта"
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
          <Textarea
            label="Комментарий к заказу"
            value={form.comment}
            onChange={(e) => update("comment", e.target.value)}
          />

          {error && <p className="text-sm text-red-bright">{error}</p>}

          <Button type="submit" loading={loading} className="mt-2 w-full sm:w-auto">
            Приобрести
          </Button>
        </form>

        <div className="h-fit rounded-xl border hairline bg-charcoal p-6">
          <div className="flex flex-col gap-2 mb-4">
            {items.map((item) => (
              <div
                key={`${item.productId}::${item.variantMl ?? ""}`}
                className="flex justify-between text-sm text-ash"
              >
                <span>
                  {item.name}
                  {item.volumeLabel ? ` (${item.volumeLabel})` : ""} × {item.quantity}
                </span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-paper text-lg font-medium pt-4 border-t hairline">
            <span>Итого</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
