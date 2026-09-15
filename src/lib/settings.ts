import { createClient } from "@/lib/supabase/server";

export interface Contacts {
  email?: string;
  telegram?: string;
  phone?: string;
  instagram?: string;
}

export async function getContacts(): Promise<Contacts> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "contacts")
      .maybeSingle()
      .returns<{ value: Contacts }>();
    return data?.value ?? {};
  } catch {
    return {};
  }
}

export async function getBrandDescription(): Promise<string> {
  const fallback =
    "RK — private edition. Приватная марка на стыке парфюмерии, технологий и 3D-печати. Каждый продукт выпускается ограниченным тиражом для тех, кто выбирает вещи не для всех.";
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "brand_description")
      .maybeSingle()
      .returns<{ value: string }>();
    return data?.value || fallback;
  } catch {
    return fallback;
  }
}
