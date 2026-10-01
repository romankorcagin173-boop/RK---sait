import { getContacts } from "@/lib/settings";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export default async function CheckoutPage() {
  const contacts = await getContacts();
  return <CheckoutClient telegramContact={contacts.telegram ?? null} />;
}
