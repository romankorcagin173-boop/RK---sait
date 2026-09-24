import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProductBySlug, getReviews } from "@/lib/products";
import { ProductGallery } from "@/components/products/ProductGallery";
import { RemainingGauge } from "@/components/products/RemainingGauge";
import { AddToCartButton } from "@/components/products/AddToCartButton";
import { ReviewsSection } from "@/components/products/ReviewsSection";

export default async function ParfumDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || product.category !== "parfum") notFound();

  const reviews = await getReviews(product.id);

  return (
    <div className="container-page py-16 sm:py-24">
      <Link href="/parfum" className="inline-flex items-center gap-2 text-sm text-ash hover:text-paper mb-10">
        <ArrowLeft size={14} /> К каталогу RK — Parfum
      </Link>

      <div className="grid gap-12 lg:grid-cols-2">
        <ProductGallery images={product.images} alt={product.name} />

        <div className="flex flex-col gap-6">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-paper">{product.name}</h1>
            <p className="mt-3 text-ash leading-relaxed">{product.short_description}</p>
          </div>

          {product.volume_ml != null && product.remaining_ml != null && (
            <RemainingGauge volume={product.volume_ml} remaining={product.remaining_ml} />
          )}

          <AddToCartButton product={product} />

          <div className="border-t hairline pt-6">
            <h2 className="text-xs uppercase tracking-[0.2em] text-ash-soft mb-3">Об аромате</h2>
            <p className="text-paper leading-relaxed whitespace-pre-line">{product.description}</p>
            {product.aroma_notes && (
              <p className="mt-4 text-sm text-ash leading-relaxed">{product.aroma_notes}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-20 max-w-2xl">
        <h2 className="font-display text-2xl text-paper mb-8">Отзывы</h2>
        <ReviewsSection productId={product.id} initialReviews={reviews} />
      </div>
    </div>
  );
}
