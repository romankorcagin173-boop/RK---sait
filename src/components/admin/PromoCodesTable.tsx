"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";
import type { PromoCodeRow } from "@/lib/database.types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

export function PromoCodesTable({ initialCodes }: { initialCodes: PromoCodeRow[] }) {
  const [codes, setCodes] = useState(initialCodes);
  const supabase = createClient();

  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const percent = Number(discountPercent);
    if (!code.trim() || !Number.isFinite(percent) || percent <= 0 || percent > 100) {
      setError("Введите код и скидку от 1 до 100%.");
      return;
    }
    setSaving(true);
    const { data, error: insertError } = await supabase
      .from("promo_codes")
      .insert({
        code: code.trim().toUpperCase(),
        discount_percent: percent,
        max_uses: maxUses.trim() ? Number(maxUses) : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      })
      .select("*")
      .single();
    setSaving(false);

    if (insertError || !data) {
      setError(insertError?.message.includes("duplicate") ? "Такой код уже существует." : "Не удалось создать промокод.");
      return;
    }

    setCodes((list) => [data as PromoCodeRow, ...list]);
    setCode("");
    setDiscountPercent("");
    setMaxUses("");
    setExpiresAt("");
  }

  async function toggleActive(id: string, next: boolean) {
    setCodes((list) => list.map((c) => (c.id === id ? { ...c, is_active: next } : c)));
    await supabase.from("promo_codes").update({ is_active: next }).eq("id", id);
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить промокод безвозвратно?")) return;
    setCodes((list) => list.filter((c) => c.id !== id));
    await supabase.from("promo_codes").delete().eq("id", id);
  }

  return (
    <div className="flex flex-col gap-8">
      <form
        onSubmit={handleAdd}
        className="grid gap-4 rounded-xl border hairline bg-charcoal p-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Input label="Код" value={code} onChange={(e) => setCode(e.target.value)} placeholder="SAVE10" />
        <Input
          label="Скидка, %"
          type="number"
          value={discountPercent}
          onChange={(e) => setDiscountPercent(e.target.value)}
          placeholder="10"
        />
        <Input
          label="Лимит использований"
          type="number"
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value)}
          hint="Пусто — без лимита"
        />
        <Input
          label="Истекает"
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          hint="Пусто — без срока"
        />
        {error && <p className="sm:col-span-2 lg:col-span-4 text-sm text-red-bright">{error}</p>}
        <Button type="submit" loading={saving} className="sm:col-span-2 lg:col-span-4 self-start">
          Создать промокод
        </Button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.1em] text-ash-soft border-b hairline">
              <th className="py-3 pr-4">Код</th>
              <th className="py-3 pr-4">Скидка</th>
              <th className="py-3 pr-4">Использован</th>
              <th className="py-3 pr-4">Истекает</th>
              <th className="py-3 pr-4">Статус</th>
              <th className="py-3" />
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.id} className="border-b hairline">
                <td className="py-3 pr-4 text-paper font-medium">{c.code}</td>
                <td className="py-3 pr-4 text-ash">−{c.discount_percent}%</td>
                <td className="py-3 pr-4 text-ash">
                  {c.used_count}
                  {c.max_uses != null ? ` / ${c.max_uses}` : ""}
                </td>
                <td className="py-3 pr-4 text-ash-soft">{c.expires_at ? formatDate(c.expires_at) : "—"}</td>
                <td className="py-3 pr-4">
                  {c.is_active ? (
                    <span className="text-ash text-xs uppercase tracking-[0.08em]">Активен</span>
                  ) : (
                    <span className="text-red-bright text-xs uppercase tracking-[0.08em]">Отключён</span>
                  )}
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="px-4 py-1.5"
                      onClick={() => toggleActive(c.id, !c.is_active)}
                    >
                      {c.is_active ? "Отключить" : "Включить"}
                    </Button>
                    <Button variant="ghost" className="px-4 py-1.5" onClick={() => handleDelete(c.id)}>
                      Удалить
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {codes.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-ash">
                  Промокодов пока нет.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
