import { Check, Truck, Droplet } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD, MIN_DECANT_ML } from "@/lib/checkout-rules";

export function OrderThresholds({ total, totalMl }: { total: number; totalMl: number }) {
  const freeShipping = total >= FREE_SHIPPING_THRESHOLD;
  const showDecant = totalMl > 0;
  const decantOk = totalMl >= MIN_DECANT_ML;

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
          freeShipping ? "border-red-bright/40 bg-red/10 text-paper" : "hairline text-ash"
        }`}
      >
        {freeShipping ? <Check size={14} className="text-red-bright shrink-0" /> : <Truck size={14} className="shrink-0" />}
        {freeShipping ? (
          <span>Бесплатная доставка</span>
        ) : (
          <span>
            Бесплатная доставка от {formatPrice(FREE_SHIPPING_THRESHOLD)} — осталось{" "}
            {formatPrice(FREE_SHIPPING_THRESHOLD - total)}. Ниже порога доставка обсуждается с
            продавцом.
          </span>
        )}
      </div>

      {showDecant && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
            decantOk ? "border-red-bright/40 bg-red/10 text-paper" : "hairline text-ash"
          }`}
        >
          {decantOk ? <Check size={14} className="text-red-bright shrink-0" /> : <Droplet size={14} className="shrink-0" />}
          <span>
            Объём на распив: {totalMl} / {MIN_DECANT_ML} мл
            {!decantOk && " — минимум для оформления"}
          </span>
        </div>
      )}
    </div>
  );
}
