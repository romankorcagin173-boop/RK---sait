"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatPrice } from "@/lib/format";
import type { OrderRow, OrderStatus } from "@/lib/database.types";

const STATUSES: OrderStatus[] = ["new", "processing", "done", "cancelled"];
const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "Новый",
  processing: "В обработке",
  done: "Выполнен",
  cancelled: "Отменён",
};

export function OrdersTable({ initialOrders }: { initialOrders: OrderRow[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const supabase = createClient();

  async function updateStatus(id: string, status: OrderStatus) {
    setOrders((list) => list.map((o) => (o.id === id ? { ...o, status } : o)));
    await supabase.from("orders").update({ status }).eq("id", id);
  }

  async function deleteOrder(id: string, orderNumber: string) {
    if (!confirm(`Удалить заказ №${orderNumber} безвозвратно?`)) return;
    const previous = orders;
    setOrders((list) => list.filter((o) => o.id !== id));
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) {
      setOrders(previous);
      alert("Не удалось удалить заказ.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.length === 0 && <p className="text-ash">Заказов пока нет.</p>}
      {orders.map((order) => (
        <div key={order.id} className="rounded-xl border hairline bg-charcoal p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-paper font-medium">№{order.order_number}</span>
                {order.source === "telegram" && (
                  <span className="rounded-full bg-red/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-red-bright">
                    Telegram
                  </span>
                )}
              </div>
              <div className="text-xs text-ash-soft">{formatDate(order.created_at)}</div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={order.status}
                onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                className="rounded-lg border hairline bg-ink-soft px-3 py-1.5 text-xs uppercase tracking-[0.08em] text-paper"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => deleteOrder(order.id, order.order_number)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border hairline text-ash hover:text-red-bright transition-colors"
                aria-label="Удалить заказ"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="text-sm text-ash">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>
                    {item.name}
                    {item.volume_label ? ` (${item.volume_label})` : ""} × {item.quantity}
                  </span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="mt-2 flex justify-between text-paper font-medium border-t hairline pt-2">
                <span>Итого</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
            <div className="text-sm text-ash">
              <div>{order.contact_name}</div>
              {order.contact_phone && <div>{order.contact_phone}</div>}
              {order.contact_telegram && <div>@{order.contact_telegram}</div>}
              {order.contact_email && <div>{order.contact_email}</div>}
              {order.comment && <div className="mt-2 text-ash-soft">«{order.comment}»</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
