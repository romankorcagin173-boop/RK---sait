"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/Button";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const total = useCartStore((s) => s.total());

  if (items.length === 0) {
    return (
      <div className="container-page flex flex-1 flex-col items-center justify-center py-28 text-center">
        <h1 className="font-display text-3xl text-paper mb-4">Корзина пуста</h1>
        <p className="text-ash mb-8">Загляните в каталог, чтобы выбрать что-то особенное.</p>
        <div className="flex gap-4">
          <Link href="/parfum">
            <Button variant="outline">RK — Parfum</Button>
          </Link>
          <Link href="/3d-print">
            <Button variant="outline">RK — 3D Print</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-16 sm:py-24">
      <h1 className="font-display text-4xl text-paper mb-12">Корзина</h1>

      <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center gap-4 rounded-xl border hairline bg-charcoal p-4"
            >
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-soft">
                {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-paper font-medium truncate">{item.name}</div>
                <div className="text-sm text-ash">{formatPrice(item.price)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(item.productId, item.quantity - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border hairline text-paper"
                >
                  <Minus size={12} />
                </button>
                <span className="w-6 text-center text-paper">{item.quantity}</span>
                <button
                  onClick={() => setQuantity(item.productId, item.quantity + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border hairline text-paper"
                >
                  <Plus size={12} />
                </button>
              </div>
              <button
                onClick={() => remove(item.productId)}
                className="text-ash hover:text-red-bright transition-colors"
                aria-label="Удалить"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-xl border hairline bg-charcoal p-6">
          <div className="flex justify-between text-paper text-lg font-medium mb-6">
            <span>Итого</span>
            <span>{formatPrice(total)}</span>
          </div>
          <Link href="/checkout">
            <Button className="w-full">Оформить заказ</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
