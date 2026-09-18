import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY не заданы в .env.local — бот не может читать каталог."
  );
}
if (!serviceRoleKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY не задан в .env.local — бот не сможет создавать заказы. " +
      "Найдите его в Supabase: Project Settings → API → service_role secret. " +
      "Это секретный ключ — никогда не публикуйте его и не используйте на сайте."
  );
}

// Reads (catalog browsing) go through the anon key, so RLS still applies
// (only is_active products are visible) — the bot has no special read
// privileges beyond what any visitor already has.
export const supabaseRead = createClient(url, anonKey);

// Order creation needs the service role key: a Telegram customer has no
// Supabase Auth session, so the normal "auth.uid() = user_id" RLS policy on
// orders can never pass for them. The service role bypasses RLS entirely,
// which is why this client is only ever used for the one insert in
// orders.ts — never for reads, never exposed outside this process.
export const supabaseWrite = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});
