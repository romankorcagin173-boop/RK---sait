import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import type { ProductRow } from "@/lib/database.types";
import { Button } from "@/components/ui/Button";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true })
    .returns<ProductRow[]>();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-display text-2xl text-paper">Товары</h2>
        <Link href="/admin/products/new">
          <Button>Добавить товар</Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {(products ?? []).map((p) => (
          <Link
            key={p.id}
            href={`/admin/products/${p.id}`}
            className="flex items-center gap-4 rounded-xl border hairline bg-charcoal p-4 hover:border-line-strong transition-colors"
          >
            <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-ink-soft">
              {p.images[0] && <Image src={p.images[0]} alt="" fill className="object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-paper font-medium truncate">{p.name}</div>
              <div className="text-xs text-ash-soft">
                {p.category === "parfum" ? "RK — Parfum" : "RK — 3D Print"} ·{" "}
                {formatPrice(p.price, p.currency)}
              </div>
            </div>
            {!p.is_active && (
              <span className="text-xs uppercase tracking-[0.08em] text-ash-soft">Скрыт</span>
            )}
          </Link>
        ))}
        {(!products || products.length === 0) && <p className="text-ash">Товаров пока нет.</p>}
      </div>
    </div>
  );
}
