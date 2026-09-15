"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { StarRatingDisplay } from "@/components/products/StarRating";
import { ReviewForm } from "@/components/products/ReviewForm";
import { formatDate } from "@/lib/format";
import type { ReviewRow } from "@/lib/database.types";

export function ReviewsSection({
  productId,
  initialReviews,
}: {
  productId: string;
  initialReviews: ReviewRow[];
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const supabase = createClient();

  async function refresh() {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .returns<ReviewRow[]>();
    if (data) setReviews(data);
  }

  const avg =
    reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <StarRatingDisplay rating={avg} size={18} />
        <span className="text-sm text-ash">
          {avg > 0 ? avg.toFixed(1) : "—"} · {reviews.length} отзыв(ов)
        </span>
      </div>

      <ReviewForm productId={productId} onSubmitted={refresh} />

      <div className="flex flex-col gap-6">
        {reviews.map((review) => (
          <div key={review.id} className="border-t hairline pt-6">
            <div className="flex items-center justify-between mb-3">
              <StarRatingDisplay rating={review.rating} />
              <span className="text-xs text-ash-soft">{formatDate(review.created_at)}</span>
            </div>
            {review.pros && (
              <p className="text-sm text-paper mb-1">
                <span className="text-ash">+ </span>
                {review.pros}
              </p>
            )}
            {review.cons && (
              <p className="text-sm text-paper mb-1">
                <span className="text-ash">− </span>
                {review.cons}
              </p>
            )}
            {review.photos.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none">
                {review.photos.map((url) => (
                  <div key={url} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                    <Image src={url} alt="Фото отзыва" fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
