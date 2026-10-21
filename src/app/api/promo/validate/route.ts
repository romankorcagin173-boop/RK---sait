import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { PromoValidation } from "@/lib/database.types";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
    }

    let body: { code?: string };
    try {
      body = (await request.json()) as { code?: string };
    } catch {
      return NextResponse.json({ error: "Некорректный запрос." }, { status: 400 });
    }

    const code = body.code?.trim();
    if (!code) {
      return NextResponse.json({ error: "Введите промокод." }, { status: 400 });
    }

    const { data: validation, error } = await supabase
      .rpc("validate_promo_code", { p_code: code })
      .returns<PromoValidation[]>()
      .maybeSingle();

    if (error || !validation?.valid) {
      return NextResponse.json(
        { error: validation?.reason || "Промокод недействителен." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      code: code.toUpperCase(),
      discountPercent: validation.discount_percent ?? 0,
    });
  } catch (err) {
    console.error("promo validate failed", err);
    return NextResponse.json({ error: "Не удалось проверить промокод." }, { status: 500 });
  }
}
