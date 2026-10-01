import Link from "next/link";
import type { ProductRow } from "@/lib/database.types";
import { formatPrice } from "@/lib/format";
import { AddToCartButton } from "@/components/products/AddToCartButton";

export function ProductCard({ product }: { product: ProductRow }) {
  const href = `/${product.category === "parfum" ? "parfum" : "3d-print"}/${product.slug}`;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border hairline bg-charcoal">
      <Link href={href} className="relative block aspect-[3/4] overflow-hidden bg-ink-soft">
        {product.images[0] && (
          // Plain <img>, not next/image: Next's server-side image
          // optimizer is a common source of photos that load fine when you
          // open the URL directly but never render on the site itself
          // (especially on a bare VPS without the full sharp toolchain) —
          // not worth the risk for a catalog this size.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <Link href={href}>
            <h3 className="font-display text-lg text-paper hover:text-red-bright transition-colors">
              {product.name}
            </h3>
          </Link>
          <p className="mt-1 text-sm text-ash line-clamp-2">{product.short_description}</p>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-paper font-medium">{formatPrice(product.price, product.currency)}</span>
          <Link
            href={href}
            className="text-xs uppercase tracking-[0.1em] text-ash hover:text-paper transition-colors"
          >
            Подробнее
          </Link>
        </div>
        <AddToCartButton product={product} />
      </div>
    </div>
  );
}
