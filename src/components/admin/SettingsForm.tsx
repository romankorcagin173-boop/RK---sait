"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { Contacts } from "@/lib/settings";

export function SettingsForm({
  initialDescription,
  initialContacts,
}: {
  initialDescription: string;
  initialContacts: Contacts;
}) {
  const supabase = createClient();
  const [description, setDescription] = useState(initialDescription);
  const [contacts, setContacts] = useState<Contacts>(initialContacts);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    await Promise.all([
      supabase.from("site_settings").update({ value: description }).eq("key", "brand_description"),
      supabase.from("site_settings").update({ value: contacts }).eq("key", "contacts"),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col gap-8 max-w-xl">
      <Textarea
        label="Описание бренда (главная страница)"
        rows={6}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Почта"
          value={contacts.email ?? ""}
          onChange={(e) => setContacts((c) => ({ ...c, email: e.target.value }))}
        />
        <Input
          label="Telegram"
          placeholder="@username"
          value={contacts.telegram ?? ""}
          onChange={(e) => setContacts((c) => ({ ...c, telegram: e.target.value }))}
        />
        <Input
          label="Телефон"
          value={contacts.phone ?? ""}
          onChange={(e) => setContacts((c) => ({ ...c, phone: e.target.value }))}
        />
        <Input
          label="Instagram"
          placeholder="@username"
          value={contacts.instagram ?? ""}
          onChange={(e) => setContacts((c) => ({ ...c, instagram: e.target.value }))}
        />
      </div>

      <div className="flex items-center gap-4">
        <Button onClick={save} loading={saving} className="self-start">
          Сохранить
        </Button>
        {saved && <span className="text-sm text-ash">Сохранено</span>}
      </div>
    </div>
  );
}
