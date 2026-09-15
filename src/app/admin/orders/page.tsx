import { createClient } from "@/lib/supabase/server";
import type { OrderRow } from "@/lib/database.types";
import { OrdersTable } from "@/components/admin/OrdersTable";

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<OrderRow[]>();

  return (
    <div>
      <h2 className="font-display text-2xl text-paper mb-8">Заказы</h2>
      <OrdersTable initialOrders={orders ?? []} />
    </div>
  );
}
