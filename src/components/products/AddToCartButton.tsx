"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingBag, Check } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/Button";
import type { ProductRow } from "@/lib/database.types";

export function AddToCartButton({ product }: { product: ProductRow }) {
  const { authUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const add = useCartStore((s) => s.add);
  const [added, setAdded] = useState(false);

  function handleClick() {
    if (loading) return;
    if (!authUser) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images[0] ?? null,
      category: product.category,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <Button onClick={handleClick} className="w-full sm:w-auto">
      {added ? <Check size={16} /> : <ShoppingBag size={16} />}
      {added ? "Добавлено" : "Приобрести"}
    </Button>
  );
}
