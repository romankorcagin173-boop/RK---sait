"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";
import type { ProfileRow } from "@/lib/database.types";
import { Button } from "@/components/ui/Button";

export function UsersTable({ initialUsers }: { initialUsers: ProfileRow[] }) {
  const [users, setUsers] = useState(initialUsers);
  const supabase = createClient();

  async function toggleBlock(id: string, next: boolean) {
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, is_blocked: next } : u)));
    await supabase.from("profiles").update({ is_blocked: next }).eq("id", id);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-[0.1em] text-ash-soft border-b hairline">
            <th className="py-3 pr-4">Логин</th>
            <th className="py-3 pr-4">Почта</th>
            <th className="py-3 pr-4">Контакт</th>
            <th className="py-3 pr-4">Регистрация</th>
            <th className="py-3 pr-4">Статус</th>
            <th className="py-3" />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b hairline">
              <td className="py-3 pr-4 text-paper">
                {u.username} {u.is_admin && <span className="text-red-bright text-xs">· admin</span>}
              </td>
              <td className="py-3 pr-4 text-ash">{u.email}</td>
              <td className="py-3 pr-4 text-ash">
                {u.phone && <div>{u.phone}</div>}
                {u.telegram_username && <div>@{u.telegram_username}</div>}
              </td>
              <td className="py-3 pr-4 text-ash-soft">{formatDate(u.created_at)}</td>
              <td className="py-3 pr-4">
                {u.is_blocked ? (
                  <span className="text-red-bright text-xs uppercase tracking-[0.08em]">Заблокирован</span>
                ) : (
                  <span className="text-ash text-xs uppercase tracking-[0.08em]">Активен</span>
                )}
              </td>
              <td className="py-3">
                {!u.is_admin && (
                  <Button
                    variant="outline"
                    className="px-4 py-1.5"
                    onClick={() => toggleBlock(u.id, !u.is_blocked)}
                  >
                    {u.is_blocked ? "Разблокировать" : "Заблокировать"}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
