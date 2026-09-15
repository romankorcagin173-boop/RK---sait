import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/database.types";
import { UsersTable } from "@/components/admin/UsersTable";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<ProfileRow[]>();

  return (
    <div>
      <h2 className="font-display text-2xl text-paper mb-8">Пользователи</h2>
      <UsersTable initialUsers={users ?? []} />
    </div>
  );
}
