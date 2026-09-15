"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/format";
import { Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

interface OrderResult {
  orderNumber: string;
  items: { name: string; price: number; quantity: number }[];
  total: number;
}

interface FormState {
  name?: string;
  phone?: string;
  telegram?: string;
  email?: string;
  comment?: string;
}

export default function CheckoutPage() {
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
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
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

  if (result) {
    return (
      <div className="container-page flex flex-1 items-center justify-center py-24">
        <div className="w-full max-w-lg rounded-2xl border hairline bg-charcoal p-8 sm:p-10 text-center">
          <h1 className="font-display text-3xl text-paper mb-3">Заказ принят</h1>
          <p className="text-ash mb-6">
            Номер заказа <span className="text-paper">№{result.orderNumber}</span>. Мы свяжемся с
            вами в ближайшее время для подтверждения и оплаты.
          </p>
          <div className="rounded-xl border hairline bg-ink-soft p-5 text-left mb-6">
            {result.items.map((i, idx) => (
              <div key={idx} className="flex justify-between text-sm text-ash py-1">
                <span>
                  {i.name} × {i.quantity}
                </span>
                <span>{formatPrice(i.price * i.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between text-paper font-medium mt-3 pt-3 border-t hairline">
              <span>Итого</span>
              <span>{formatPrice(result.total)}</span>
            </div>
          </div>
          <Button onClick={() => router.push("/account")} className="w-full">
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
              <div key={item.productId} className="flex justify-between text-sm text-ash">
                <span>
                  {item.name} × {item.quantity}
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
