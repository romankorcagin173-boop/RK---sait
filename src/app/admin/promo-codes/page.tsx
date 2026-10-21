import { createClient } from "@/lib/supabase/server";
import type { PromoCodeRow } from "@/lib/database.types";
import { PromoCodesTable } from "@/components/admin/PromoCodesTable";

export default async function AdminPromoCodesPage() {
  const supabase = await createClient();
  const { data: codes } = await supabase
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<PromoCodeRow[]>();

  return (
    <div>
      <h2 className="font-display text-2xl text-paper mb-8">Промокоды</h2>
      <PromoCodesTable initialCodes={codes ?? []} />
    </div>
  );
}
