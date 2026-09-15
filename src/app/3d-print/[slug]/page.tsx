import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProductBySlug, getReviews } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { ProductGallery } from "@/components/products/ProductGallery";
import { AddToCartButton } from "@/components/products/AddToCartButton";
import { ReviewsSection } from "@/components/products/ReviewsSection";

export default async function PrintDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || product.category !== "3d_print") notFound();

  const reviews = await getReviews(product.id);

  const specs = [
    { label: "Материал", value: product.material },
    { label: "Размеры", value: product.dimensions },
    { label: "Печать", value: product.print_info },
  ].filter((s) => s.value);

  return (
    <div className="container-page py-16 sm:py-24">
      <Link href="/3d-print" className="inline-flex items-center gap-2 text-sm text-ash hover:text-paper mb-10">
        <ArrowLeft size={14} /> К каталогу RK — 3D Print
      </Link>

      <div className="grid gap-12 lg:grid-cols-2">
        <ProductGallery images={product.images} alt={product.name} />

        <div className="flex flex-col gap-6">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-paper">{product.name}</h1>
            <p className="mt-3 text-ash leading-relaxed">{product.short_description}</p>
          </div>

          <div className="text-2xl text-paper font-medium">
            {formatPrice(product.price, product.currency)}
          </div>

          <AddToCartButton product={product} />

          {specs.length > 0 && (
            <div className="grid grid-cols-1 gap-3 border-y hairline py-6 sm:grid-cols-3">
              {specs.map((s) => (
                <div key={s.label}>
                  <div className="text-xs uppercase tracking-[0.15em] text-ash-soft mb-1">
                    {s.label}
                  </div>
                  <div className="text-sm text-paper">{s.value}</div>
                </div>
              ))}
            </div>
          )}

          <div>
            <h2 className="text-xs uppercase tracking-[0.2em] text-ash-soft mb-3">Описание</h2>
            <p className="text-paper leading-relaxed whitespace-pre-line">{product.description}</p>
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
