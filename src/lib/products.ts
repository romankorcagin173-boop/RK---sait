import { createClient } from "@/lib/supabase/server";
import type { ProductCategory, ProductRow, ReviewRow } from "@/lib/database.types";

export async function getProducts(category: ProductCategory) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category", category)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .returns<ProductRow[]>();
  // A silently swallowed query error here used to look identical to "no
  // products yet" — surfacing it turns a confusing blank catalog into a
  // visible, debuggable failure instead.
  if (error) {
    console.error("getProducts failed", { category, error });
    throw new Error(`Не удалось загрузить товары: ${error.message}`);
  }
  return data ?? [];
}

export async function getProductBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .returns<ProductRow[]>()
    .maybeSingle();
  // Without this check, any real query error (bad RLS policy, a broken
  // trigger, etc.) came back as `data: null` and was indistinguishable
  // from "this product genuinely doesn't exist" — the page just called
  // notFound() either way, hiding the actual cause.
  if (error) {
    console.error("getProductBySlug failed", { slug, error });
    throw new Error(`Не удалось загрузить товар: ${error.message}`);
  }
  return data;
}

export async function getReviews(productId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .returns<ReviewRow[]>();
  if (error) {
    console.error("getReviews failed", { productId, error });
    throw new Error(`Не удалось загрузить отзывы: ${error.message}`);
  }
  return data ?? [];
}
