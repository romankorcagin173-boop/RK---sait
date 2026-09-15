import Link from "next/link";
import { Mail, Send, Phone } from "lucide-react";
import { getContacts } from "@/lib/settings";
import { InstagramIcon } from "@/components/ui/InstagramIcon";

export async function Footer() {
  const contacts = await getContacts();

  return (
    <footer className="border-t hairline bg-ink-soft">
      <div className="container-page py-14 grid gap-12 md:grid-cols-3">
        <div>
          <div className="font-display text-2xl tracking-[0.2em] text-paper mb-3">RK</div>
          <p className="text-sm text-ash leading-relaxed max-w-xs">
            Private Edition — приватный бренд на стыке парфюмерии, звука и технологий.
            Ограниченные тиражи, для своих.
          </p>
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ash-soft mb-4">Каталог</div>
          <nav className="flex flex-col gap-2 text-sm text-paper">
            <Link href="/parfum" className="hover:text-red-bright transition-colors">RK — Parfum</Link>
            <Link href="/pod-shade" className="hover:text-red-bright transition-colors">Studio Pod Shade</Link>
            <a
              href="https://memoryphone.online/ru"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-red-bright transition-colors"
            >
              MemoryPhone
            </a>
            <Link href="/3d-print" className="hover:text-red-bright transition-colors">RK — 3D Print</Link>
          </nav>
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ash-soft mb-4">Контакты</div>
          <div className="flex flex-col gap-3 text-sm text-paper">
            {contacts.email && (
              <a href={`mailto:${contacts.email}`} className="flex items-center gap-2 hover:text-red-bright transition-colors">
                <Mail size={14} className="text-ash" /> {contacts.email}
              </a>
            )}
            {contacts.telegram && (
              <a
                href={`https://t.me/${contacts.telegram.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-red-bright transition-colors"
              >
                <Send size={14} className="text-ash" /> {contacts.telegram}
              </a>
            )}
            {contacts.phone && (
              <a href={`tel:${contacts.phone}`} className="flex items-center gap-2 hover:text-red-bright transition-colors">
                <Phone size={14} className="text-ash" /> {contacts.phone}
              </a>
            )}
            {contacts.instagram && (
              <a
                href={`https://instagram.com/${contacts.instagram.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-red-bright transition-colors"
              >
                <InstagramIcon size={14} className="text-ash" /> {contacts.instagram}
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="border-t hairline">
        <div className="container-page py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-ash-soft">
          <span>© {new Date().getFullYear()} RK — Private Edition</span>
          <span>Стань частью уникального</span>
        </div>
      </div>
    </footer>
  );
}
