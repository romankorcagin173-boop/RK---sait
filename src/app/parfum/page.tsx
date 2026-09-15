import { AtomizerScene } from "@/components/parfum/AtomizerScene";
import { ProductCard } from "@/components/products/ProductCard";
import { getProducts } from "@/lib/products";

export const metadata = { title: "RK — Parfum" };

export default async function ParfumPage() {
  const products = await getProducts("parfum");

  return (
    <>
      <AtomizerScene />

      <section className="border-t hairline bg-ink py-20 sm:py-28">
        <div className="container-page">
          <span className="text-xs uppercase tracking-[0.3em] text-red-bright">В наличии</span>
          <h2 className="font-display text-3xl sm:text-4xl text-paper mt-4 mb-12">
            Каталог RK — Parfum
          </h2>

          {products.length === 0 ? (
            <p className="text-ash">Скоро здесь появятся ароматы.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
