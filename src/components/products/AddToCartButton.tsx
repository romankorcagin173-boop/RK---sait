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

type Selection = number | "remainder";

export function AddToCartButton({ product }: { product: ProductRow }) {
  const { authUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const add = useCartStore((s) => s.add);
  const [added, setAdded] = useState(false);

  const options = product.volume_options;
  const hasRemainder =
    product.category === "parfum" &&
    product.remaining_ml != null &&
    product.remaining_ml > 0 &&
    product.price_per_ml != null;
  const hasChoice = options.length > 0 || hasRemainder;

  const [selected, setSelected] = useState<Selection>(options.length > 0 ? 0 : hasRemainder ? "remainder" : 0);

  const chosenOption = typeof selected === "number" ? options[selected] : null;
  const remainderPrice = hasRemainder ? product.remaining_ml! * product.price_per_ml! : 0;

  const price = selected === "remainder" ? remainderPrice : chosenOption ? chosenOption.price : product.price;

  function handleClick() {
    if (loading) return;
    if (!authUser) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    const variantMl = selected === "remainder" ? "remainder" : chosenOption ? chosenOption.ml : undefined;
    const volumeLabel =
      selected === "remainder"
        ? `Остаток флакона (${product.remaining_ml} мл)`
        : chosenOption
          ? optionLabel(chosenOption.ml)
          : undefined;

    add({
      productId: product.id,
      variantMl,
      volumeLabel,
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
      {hasChoice && (
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
          {hasRemainder && (
            <button
              type="button"
              onClick={() => setSelected("remainder")}
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.1em] transition-colors ${
                selected === "remainder" ? "border-red bg-red text-paper" : "hairline text-ash"
              }`}
            >
              Остаток ({product.remaining_ml} мл) — {formatPrice(remainderPrice, product.currency)}
            </button>
          )}
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
