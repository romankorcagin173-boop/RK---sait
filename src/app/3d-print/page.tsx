import { ProductCard } from "@/components/products/ProductCard";
import { getProducts } from "@/lib/products";

export const metadata = { title: "RK — 3D Print" };

export default async function PrintPage() {
  const products = await getProducts("3d_print");

  return (
    <section className="py-20 sm:py-28">
      <div className="container-page">
        <span className="text-xs uppercase tracking-[0.3em] text-red-bright">RK — 3D Print</span>
        <h1 className="font-display text-4xl sm:text-5xl text-paper mt-4 mb-4 max-w-2xl">
          Авторские объекты на 3D-печати
        </h1>
        <p className="text-ash max-w-xl mb-14 leading-relaxed">
          Функциональные предметы и скульптурные формы, напечатанные и обработанные вручную.
          Каждая модель — с указанием материала, размеров и параметров печати.
        </p>

        {products.length === 0 ? (
          <p className="text-ash">Скоро здесь появятся модели.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
