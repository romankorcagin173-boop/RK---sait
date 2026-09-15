import { createClient } from "@/lib/supabase/server";

async function getStats() {
  const supabase = await createClient();

  const [{ count: usersCount }, { count: ordersCount }, { count: doneCount }, { data: orders }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "done"),
      supabase.from("orders").select("total"),
    ]);

  const revenue = (orders ?? []).reduce((sum, o) => sum + Number(o.total), 0);

  return {
    usersCount: usersCount ?? 0,
    ordersCount: ordersCount ?? 0,
    doneCount: doneCount ?? 0,
    revenue,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    { label: "Зарегистрировано пользователей", value: stats.usersCount },
    { label: "Всего заказов", value: stats.ordersCount },
    { label: "Выполнено заказов", value: stats.doneCount },
    {
      label: "Оборот (все заказы)",
      value: new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(
        stats.revenue
      ),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border hairline bg-charcoal p-6">
          <div className="text-xs uppercase tracking-[0.15em] text-ash-soft mb-2">{card.label}</div>
          <div className="font-display text-3xl text-paper">{card.value}</div>
        </div>
      ))}
    </div>
  );
}
