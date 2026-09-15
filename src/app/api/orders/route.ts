import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateOrderNumber } from "@/lib/order-number";
import { notifyNewOrder } from "@/lib/telegram";
import type { OrderItem } from "@/lib/database.types";

interface RequestBody {
  items: { productId: string; quantity: number }[];
  contactName: string;
  contactPhone?: string;
  contactTelegram?: string;
  contactEmail: string;
  comment?: string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_blocked")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.is_blocked) {
      return NextResponse.json({ error: "Аккаунт заблокирован." }, { status: 403 });
    }

    let body: RequestBody;
    try {
      body = (await request.json()) as RequestBody;
    } catch {
      return NextResponse.json({ error: "Некорректный запрос." }, { status: 400 });
    }

    if (!body.items?.length) {
      return NextResponse.json({ error: "Корзина пуста." }, { status: 400 });
    }
    if (!body.contactName || !body.contactEmail) {
      return NextResponse.json({ error: "Укажите имя и почту." }, { status: 400 });
    }
    if (!body.contactPhone && !body.contactTelegram) {
      return NextResponse.json(
        { error: "Укажите телефон или Telegram для связи." },
        { status: 400 }
      );
    }

    const productIds = body.items.map((i) => i.productId);
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, category")
      .in("id", productIds);

    if (productsError || !products || products.length !== productIds.length) {
      return NextResponse.json({ error: "Часть товаров недоступна." }, { status: 400 });
    }

    const items: OrderItem[] = body.items.map((requested) => {
      const product = products.find((p) => p.id === requested.productId)!;
      return {
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: Math.max(1, Math.min(20, requested.quantity)),
        category: product.category,
      };
    });

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const orderNumber = generateOrderNumber();

    const { data: order, error: insertError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: user.id,
        items,
        total,
        contact_name: body.contactName,
        contact_phone: body.contactPhone || null,
        contact_telegram: body.contactTelegram ? body.contactTelegram.replace(/^@/, "") : null,
        contact_email: body.contactEmail,
        comment: body.comment || null,
        status: "new",
      })
      .select("*")
      .single();

    if (insertError || !order) {
      console.error("order insert failed", insertError);
      return NextResponse.json({ error: "Не удалось создать заказ." }, { status: 500 });
    }

    // A broken Telegram token/chat id or a flaky network call must never
    // fail an already-placed order — the order in the database is what counts.
    try {
      await notifyNewOrder({
        orderNumber,
        items,
        total,
        contactName: body.contactName,
        contactPhone: body.contactPhone,
        contactTelegram: body.contactTelegram,
        contactEmail: body.contactEmail,
        comment: body.comment,
      });
    } catch (err) {
      console.error("Telegram notify threw", err);
    }

    return NextResponse.json({ orderNumber, items, total });
  } catch (err) {
    console.error("order creation failed", err);
    return NextResponse.json({ error: "Не удалось оформить заказ. Попробуйте ещё раз." }, { status: 500 });
  }
}
