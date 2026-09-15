"use client";

import { Star } from "lucide-react";
import clsx from "clsx";

export function StarRatingDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= Math.round(rating) ? "text-red-bright fill-red-bright" : "text-ash-soft"}
        />
      ))}
    </div>
  );
}

export function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="p-1"
          aria-label={`${n} звёзд`}
        >
          <Star
            size={24}
            className={clsx(
              "transition-colors",
              n <= value ? "text-red-bright fill-red-bright" : "text-ash-soft"
            )}
          />
        </button>
      ))}
    </div>
  );
}
