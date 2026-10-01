import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProductRow } from "@/lib/database.types";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .returns<ProductRow[]>()
    .maybeSingle();

  if (!product) notFound();

  const publicHref = `/${product.category === "parfum" ? "parfum" : "3d-print"}/${product.slug}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <h2 className="font-display text-2xl text-paper">Редактировать товар</h2>
        <Link
          href={publicHref}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.1em] text-ash hover:text-paper transition-colors"
        >
          Посмотреть на сайте <ExternalLink size={13} />
        </Link>
      </div>
      {!product.is_active && (
        <p className="mb-6 rounded-lg border border-red/30 bg-red/10 px-4 py-2.5 text-sm text-red-bright">
          Товар скрыт («Товар в наличии» не отмечено ниже) — по ссылке выше будет 404, пока не
          включите видимость и не сохраните.
        </p>
      )}
      <ProductForm product={product} />
    </div>
  );
}
