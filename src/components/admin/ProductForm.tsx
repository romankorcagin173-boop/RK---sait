"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { ProductCategory, ProductRow } from "@/lib/database.types";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function ProductForm({ product }: { product?: ProductRow }) {
  const supabase = createClient();
  const router = useRouter();
  const isEdit = Boolean(product);

  const [category, setCategory] = useState<ProductCategory>(product?.category ?? "parfum");
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [shortDescription, setShortDescription] = useState(product?.short_description ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [isActive, setIsActive] = useState(product?.is_active ?? true);

  const [volumeMl, setVolumeMl] = useState(product?.volume_ml?.toString() ?? "");
  const [remainingMl, setRemainingMl] = useState(product?.remaining_ml?.toString() ?? "");
  const [aromaNotes, setAromaNotes] = useState(product?.aroma_notes ?? "");

  const [material, setMaterial] = useState(product?.material ?? "");
  const [dimensions, setDimensions] = useState(product?.dimensions ?? "");
  const [printInfo, setPrintInfo] = useState(product?.print_info ?? "");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const path = `${category}/${slug || "draft"}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      setImages((prev) => [...prev, ...urls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить фото.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      category,
      slug: slug || slugify(name),
      name,
      short_description: shortDescription,
      description,
      price: Number(price) || 0,
      currency: "RUB",
      images,
      is_active: isActive,
      sort_order: product?.sort_order ?? 0,
      volume_ml: category === "parfum" && volumeMl ? Number(volumeMl) : null,
      remaining_ml: category === "parfum" && remainingMl ? Number(remainingMl) : null,
      aroma_notes: category === "parfum" ? aromaNotes || null : null,
      material: category === "3d_print" ? material || null : null,
      dimensions: category === "3d_print" ? dimensions || null : null,
      print_info: category === "3d_print" ? printInfo || null : null,
    };

    try {
      if (isEdit && product) {
        const { error: updateError } = await supabase
          .from("products")
          .update(payload)
          .eq("id", product.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("products").insert(payload);
        if (insertError) throw insertError;
      }
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить товар.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!product || !confirm("Удалить товар безвозвратно?")) return;
    await supabase.from("products").delete().eq("id", product.id);
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      <div className="flex gap-3">
        {(["parfum", "3d_print"] as ProductCategory[]).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.1em] transition-colors ${
              category === c ? "border-red bg-red text-paper" : "hairline text-ash"
            }`}
          >
            {c === "parfum" ? "RK — Parfum" : "RK — 3D Print"}
          </button>
        ))}
      </div>

      <Input label="Название" required value={name} onChange={(e) => setName(e.target.value)} />
      <Input
        label="Slug (URL)"
        value={slug}
        onChange={(e) => setSlug(slugify(e.target.value))}
        hint="Оставьте пустым — сгенерируется из названия"
      />
      <Textarea
        label="Краткое описание"
        required
        rows={2}
        value={shortDescription}
        onChange={(e) => setShortDescription(e.target.value)}
      />
      <Textarea
        label="Полное описание"
        required
        rows={5}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Input
        label="Цена, ₽"
        type="number"
        required
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      {category === "parfum" ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Объём флакона, мл"
            type="number"
            value={volumeMl}
            onChange={(e) => setVolumeMl(e.target.value)}
          />
          <Input
            label="Остаток на распив, мл"
            type="number"
            value={remainingMl}
            onChange={(e) => setRemainingMl(e.target.value)}
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Пирамида аромата"
              rows={3}
              value={aromaNotes}
              onChange={(e) => setAromaNotes(e.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Материал" value={material} onChange={(e) => setMaterial(e.target.value)} />
          <Input label="Размеры" value={dimensions} onChange={(e) => setDimensions(e.target.value)} />
          <div className="sm:col-span-2">
            <Textarea
              label="Параметры печати"
              rows={3}
              value={printInfo}
              onChange={(e) => setPrintInfo(e.target.value)}
            />
          </div>
        </div>
      )}

      <div>
        <span className="text-xs uppercase tracking-[0.12em] text-ash mb-2 block">Фото</span>
        {images.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {images.map((url) => (
              <div key={url} className="relative h-20 w-20 overflow-hidden rounded-lg border hairline">
                <Image src={url} alt="" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/80 text-paper"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={(e) => handleUpload(e.target.files)}
          className="text-sm text-ash file:mr-4 file:rounded-full file:border-0 file:bg-ink-soft file:px-4 file:py-2 file:text-paper file:text-xs file:uppercase"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-paper">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4"
        />
        Товар в наличии (виден на сайте)
      </label>

      {error && <p className="text-sm text-red-bright">{error}</p>}

      <div className="flex items-center gap-4">
        <Button type="submit" loading={saving}>
          {isEdit ? "Сохранить изменения" : "Добавить товар"}
        </Button>
        {isEdit && (
          <Button type="button" variant="ghost" onClick={handleDelete}>
            Удалить товар
          </Button>
        )}
      </div>
    </form>
  );
}
