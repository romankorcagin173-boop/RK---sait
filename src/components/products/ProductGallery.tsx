"use client";

import { useState } from "react";
import clsx from "clsx";

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const list = images.length > 0 ? images : [];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border hairline bg-ink-soft">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {list[active] && <img src={list[active]} alt={alt} className="absolute inset-0 h-full w-full object-cover" />}
      </div>
      {list.length > 1 && (
        <div className="flex gap-2">
          {list.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              className={clsx(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border transition-colors",
                i === active ? "border-red" : "border-line hover:border-line-strong"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
