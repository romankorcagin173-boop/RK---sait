import { getBrandDescription, getContacts } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function AdminSettingsPage() {
  const [brandDescription, contacts] = await Promise.all([getBrandDescription(), getContacts()]);

  return (
    <div>
      <h2 className="font-display text-2xl text-paper mb-8">Настройки сайта</h2>
      <SettingsForm initialDescription={brandDescription} initialContacts={contacts} />
    </div>
  );
}
