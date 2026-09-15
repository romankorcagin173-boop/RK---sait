import { createClient } from "@/lib/supabase/server";
import type { ProductCategory, ProductRow, ReviewRow } from "@/lib/database.types";

export async function getProducts(category: ProductCategory) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("category", category)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .returns<ProductRow[]>();
  return data ?? [];
}

export async function getProductBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .returns<ProductRow[]>()
    .maybeSingle();
  return data;
}

export async function getReviews(productId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .returns<ReviewRow[]>();
  return data ?? [];
}
