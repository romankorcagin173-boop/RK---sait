import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const LINKS = [
  { href: "/admin", label: "Обзор" },
  { href: "/admin/products", label: "Товары" },
  { href: "/admin/orders", label: "Заказы" },
  { href: "/admin/users", label: "Пользователи" },
  { href: "/admin/settings", label: "Настройки сайта" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) redirect("/");

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mb-10">
        <span className="text-xs uppercase tracking-[0.3em] text-red-bright">Админ-панель</span>
        <h1 className="font-display text-3xl text-paper mt-2">RK — Private Edition</h1>
      </div>

      <div className="flex flex-col gap-10 lg:flex-row">
        <nav className="flex shrink-0 flex-row gap-2 overflow-x-auto lg:w-56 lg:flex-col lg:overflow-visible">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded-lg px-4 py-2.5 text-sm text-ash hover:bg-charcoal hover:text-paper transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
