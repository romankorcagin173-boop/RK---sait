import { Mail, Send, Phone } from "lucide-react";
import { getContacts } from "@/lib/settings";
import { InstagramIcon } from "@/components/ui/InstagramIcon";

export async function ContactBlock() {
  const contacts = await getContacts();
  const items = [
    { Icon: Mail, label: contacts.email, href: contacts.email ? `mailto:${contacts.email}` : undefined },
    {
      Icon: Send,
      label: contacts.telegram,
      href: contacts.telegram ? `https://t.me/${contacts.telegram.replace(/^@/, "")}` : undefined,
    },
    { Icon: Phone, label: contacts.phone, href: contacts.phone ? `tel:${contacts.phone}` : undefined },
    {
      Icon: InstagramIcon,
      label: contacts.instagram,
      href: contacts.instagram
        ? `https://instagram.com/${contacts.instagram.replace(/^@/, "")}`
        : undefined,
    },
  ].filter((i): i is typeof i & { label: string; href: string } => Boolean(i.label));

  if (items.length === 0) return null;

  return (
    <section className="border-t hairline bg-ink py-24 sm:py-32">
      <div className="container-page">
        <span className="text-xs uppercase tracking-[0.3em] text-red-bright">Связь</span>
        <h2 className="font-display text-3xl sm:text-4xl text-paper mt-4 mb-12">Контакты</h2>
        <div className="flex flex-wrap gap-4">
          {items.map(({ Icon, label, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-full border hairline px-5 py-3 text-sm text-paper hover:border-red hover:text-red-bright transition-colors"
            >
              <Icon size={16} /> {label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
