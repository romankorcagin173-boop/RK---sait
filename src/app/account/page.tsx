import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatPrice } from "@/lib/format";
import type { OrderRow, ProfileRow } from "@/lib/database.types";
import { SignOutButton } from "@/components/account/SignOutButton";

const STATUS_LABEL: Record<string, string> = {
  new: "Новый",
  processing: "В обработке",
  done: "Выполнен",
  cancelled: "Отменён",
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/account");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .returns<ProfileRow[]>()
    .maybeSingle();

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<OrderRow[]>();

  return (
    <div className="container-page py-16 sm:py-24">
      <div className="flex flex-wrap items-start justify-between gap-6 mb-14">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-red-bright">Аккаунт</span>
          <h1 className="font-display text-4xl text-paper mt-3">{profile?.username}</h1>
          <div className="mt-4 flex flex-col gap-1 text-sm text-ash">
            <span>{profile?.email}</span>
            {profile?.phone && <span>{profile.phone}</span>}
            {profile?.telegram_username && <span>@{profile.telegram_username}</span>}
          </div>
        </div>
        <SignOutButton />
      </div>

      <h2 className="font-display text-2xl text-paper mb-6">История заказов</h2>

      {!orders || orders.length === 0 ? (
        <p className="text-ash">Пока нет заказов.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border hairline bg-charcoal p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <div className="text-paper font-medium">Заказ №{order.order_number}</div>
                  <div className="text-xs text-ash-soft">{formatDate(order.created_at)}</div>
                </div>
                <span className="rounded-full border hairline px-3 py-1 text-xs uppercase tracking-[0.1em] text-ash">
                  {STATUS_LABEL[order.status] ?? order.status}
                </span>
              </div>
              <ul className="flex flex-col gap-1 text-sm text-ash">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-end text-paper font-medium">
                Итого: {formatPrice(order.total)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
