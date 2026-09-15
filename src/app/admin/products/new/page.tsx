import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <h2 className="font-display text-2xl text-paper mb-8">Новый товар</h2>
      <ProductForm />
    </div>
  );
}
