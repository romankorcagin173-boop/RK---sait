"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { StarRatingInput } from "@/components/products/StarRating";
import { Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function ReviewForm({ productId, onSubmitted }: { productId: string; onSubmitted?: () => void }) {
  const { authUser } = useAuth();
  const pathname = usePathname();
  const supabase = createClient();

  const [rating, setRating] = useState(5);
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!authUser) {
    return (
      <p className="text-sm text-ash">
        <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="text-paper hover:text-red-bright">
          Войдите
        </Link>
        , чтобы оставить отзыв.
      </p>
    );
  }

  if (done) {
    return <p className="text-sm text-ash">Спасибо! Ваш отзыв опубликован.</p>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const photoUrls: string[] = [];
      for (const file of files.slice(0, 5)) {
        const path = `${authUser!.id}/${productId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("review-photos")
          .upload(path, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("review-photos").getPublicUrl(path);
        photoUrls.push(data.publicUrl);
      }

      const { error: insertError } = await supabase.from("reviews").insert({
        product_id: productId,
        user_id: authUser!.id,
        rating,
        pros: pros || null,
        cons: cons || null,
        photos: photoUrls,
      });
      if (insertError) throw insertError;

      setDone(true);
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить отзыв.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border hairline bg-charcoal p-6">
      <div>
        <span className="text-xs uppercase tracking-[0.12em] text-ash mb-2 block">Оценка</span>
        <StarRatingInput value={rating} onChange={setRating} />
      </div>
      <Textarea label="Плюсы" value={pros} onChange={(e) => setPros(e.target.value)} />
      <Textarea label="Минусы" value={cons} onChange={(e) => setCons(e.target.value)} />
      <div>
        <span className="text-xs uppercase tracking-[0.12em] text-ash mb-2 block">Фото (до 5)</span>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="text-sm text-ash file:mr-4 file:rounded-full file:border-0 file:bg-ink-soft file:px-4 file:py-2 file:text-paper file:text-xs file:uppercase"
        />
      </div>
      {error && <p className="text-sm text-red-bright">{error}</p>}
      <Button type="submit" loading={loading} className="self-start">
        Опубликовать отзыв
      </Button>
    </form>
  );
}
