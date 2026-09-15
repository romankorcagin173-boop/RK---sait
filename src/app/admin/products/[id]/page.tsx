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

  return (
    <div>
      <h2 className="font-display text-2xl text-paper mb-8">Редактировать товар</h2>
      <ProductForm product={product} />
    </div>
  );
}
