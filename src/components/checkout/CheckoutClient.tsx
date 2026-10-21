"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Send, Tag, X } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/format";
import { MIN_DECANT_ML } from "@/lib/checkout-rules";
import { Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { OrderThresholds } from "@/components/cart/OrderThresholds";
import { ConfettiBurst } from "@/components/checkout/ConfettiBurst";

interface OrderResult {
  orderNumber: string;
  items: { name: string; price: number; quantity: number; volume_label: string | null }[];
  total: number;
  subtotal: number;
  discountAmount: number;
  promoCode: string | null;
}

interface FormState {
  name?: string;
  phone?: string;
  telegram?: string;
  email?: string;
  comment?: string;
}

interface AppliedPromo {
  code: string;
  discountPercent: number;
}

function buildOrderText(
  result: OrderResult,
  contact: { name: string; phone: string; telegram: string; email: string; comment: string }
) {
  const itemLines = result.items.map(
    (i) =>
      `• ${i.name}${i.volume_label ? ` (${i.volume_label})` : ""} × ${i.quantity} — ${formatPrice(i.price * i.quantity)}`
  );
  const totalLines =
    result.discountAmount > 0
      ? [
          `Сумма: ${formatPrice(result.subtotal)}`,
          `Промокод ${result.promoCode}: −${formatPrice(result.discountAmount)}`,
          `Итого: ${formatPrice(result.total)}`,
        ]
      : [`Итого: ${formatPrice(result.total)}`];
  const contactLines = [
    `Имя: ${contact.name}`,
    contact.phone ? `Телефон: ${contact.phone}` : null,
    contact.telegram ? `Telegram: @${contact.telegram.replace(/^@/, "")}` : null,
    `Почта: ${contact.email}`,
    contact.comment ? `Комментарий: ${contact.comment}` : null,
  ].filter((l): l is string => Boolean(l));

  return [`Заказ №${result.orderNumber}`, "", ...itemLines, "", ...totalLines, "", ...contactLines].join("\n");
}

export function CheckoutClient({ telegramContact }: { telegramContact: string | null }) {
  const router = useRouter();
  const { authUser, profile, loading: authLoading } = useAuth();
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total());
  const totalMl = useCartStore((s) => s.totalMl());
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
  const [contactError, setContactError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrderResult | null>(null);
  const [copied, setCopied] = useState(false);

  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const discountAmount = appliedPromo
    ? Math.round(total * (appliedPromo.discountPercent / 100) * 100) / 100
    : 0;
  const payableTotal = Math.max(0, total - discountAmount);
  const minMlBlocked = totalMl > 0 && totalMl < MIN_DECANT_ML;

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.replace("/login?next=/checkout");
    }
  }, [authLoading, authUser, router]);

  function update<K extends keyof FormState>(key: K, value: string) {
    setEdited((f) => ({ ...f, [key]: value }));
  }

  async function handleApplyPromo() {
    if (!promoInput.trim()) return;
    setPromoError(null);
    setPromoLoading(true);
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Промокод недействителен.");
      setAppliedPromo({ code: data.code, discountPercent: data.discountPercent });
    } catch (err) {
      setAppliedPromo(null);
      setPromoError(err instanceof Error ? err.message : "Промокод недействителен.");
    } finally {
      setPromoLoading(false);
    }
  }

  function handleRemovePromo() {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setContactError(null);

    if (!form.phone && !form.telegram) {
      setContactError("Укажите телефон или Telegram для связи.");
      return;
    }
    if (minMlBlocked) {
      setError(`Минимальный заказ на распив — ${MIN_DECANT_ML} мл суммарно. Сейчас в заказе ${totalMl} мл.`);
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
          promoCode: appliedPromo?.code,
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
        <div className="relative w-full max-w-lg animate-pop-in rounded-2xl glass-panel p-8 sm:p-10 text-center shadow-[0_0_60px_rgba(201,162,74,0.15)]">
          <ConfettiBurst />
          <h1 className="font-display text-3xl text-paper mb-3">✨ Заказ оформлен!</h1>
          <p className="text-ash mb-6">
            Номер заказа <span className="text-paper">№{result.orderNumber}</span>. Чтобы мы увидели
            заказ быстрее — скопируйте его и отправьте нам в Telegram.
          </p>

          <div className="rounded-xl border hairline bg-ink-soft/80 p-5 text-left mb-6 whitespace-pre-line text-sm text-ash">
            {orderText}
          </div>

          {result.discountAmount > 0 && (
            <p className="mb-6 text-sm text-gold-bright">
              Промокод «{result.promoCode}» сэкономил вам {formatPrice(result.discountAmount)} 🎉
            </p>
          )}

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
            error={contactError ?? undefined}
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

          <Button type="submit" loading={loading} disabled={minMlBlocked} className="mt-2 w-full sm:w-auto">
            Приобрести
          </Button>
        </form>

        <div className="h-fit flex flex-col gap-4 rounded-xl border hairline bg-charcoal p-6">
          <div className="flex flex-col gap-2">
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

          <div className="border-t hairline pt-4">
            {appliedPromo ? (
              <div className="flex items-center justify-between rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-gold-bright">
                <span className="flex items-center gap-1.5">
                  <Tag size={13} /> {appliedPromo.code} (−{appliedPromo.discountPercent}%)
                </span>
                <button
                  type="button"
                  onClick={handleRemovePromo}
                  aria-label="Убрать промокод"
                  className="text-ash hover:text-paper transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Промокод"
                    aria-label="Промокод"
                    className="w-full rounded-lg border hairline bg-ink-soft px-3 py-2 text-sm text-paper placeholder:text-ash-soft outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red-bright transition-colors"
                  />
                  <Button type="button" variant="outline" loading={promoLoading} onClick={handleApplyPromo}>
                    Применить
                  </Button>
                </div>
                {promoError && <p className="text-xs text-red-bright">{promoError}</p>}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1 border-t hairline pt-4">
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-ash">
                <span>Сумма</span>
                <span>{formatPrice(total)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-gold-bright">
                <span>Скидка</span>
                <span>−{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-paper text-lg font-medium">
              <span>Итого</span>
              <span>{formatPrice(payableTotal)}</span>
            </div>
          </div>

          <OrderThresholds total={payableTotal} totalMl={totalMl} />
        </div>
      </div>
    </div>
  );
}
