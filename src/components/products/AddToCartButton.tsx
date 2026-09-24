"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingBag, Check } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import type { ProductRow } from "@/lib/database.types";

function optionLabel(ml: number | null) {
  return ml == null ? "Весь флакон" : `${ml} мл`;
}

export function AddToCartButton({ product }: { product: ProductRow }) {
  const { authUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const add = useCartStore((s) => s.add);
  const [added, setAdded] = useState(false);

  const options = product.volume_options;
  const hasOptions = options.length > 0;
  const [selected, setSelected] = useState(0);
  const chosen = hasOptions ? options[selected] : null;
  const price = chosen ? chosen.price : product.price;

  function handleClick() {
    if (loading) return;
    if (!authUser) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    add({
      productId: product.id,
      variantMl: chosen ? chosen.ml : undefined,
      volumeLabel: chosen ? optionLabel(chosen.ml) : undefined,
      slug: product.slug,
      name: product.name,
      price,
      image: product.images[0] ?? null,
      category: product.category,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="flex flex-col gap-4">
      {hasOptions && (
        <div className="flex flex-wrap gap-2">
          {options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.1em] transition-colors ${
                selected === i ? "border-red bg-red text-paper" : "hairline text-ash"
              }`}
            >
              {optionLabel(opt.ml)} — {formatPrice(opt.price, product.currency)}
            </button>
          ))}
        </div>
      )}

      <div className="text-2xl text-paper font-medium">{formatPrice(price, product.currency)}</div>

      <Button onClick={handleClick} className="w-full sm:w-auto">
        {added ? <Check size={16} /> : <ShoppingBag size={16} />}
        {added ? "Добавлено" : "Приобрести"}
      </Button>
    </div>
  );
}
