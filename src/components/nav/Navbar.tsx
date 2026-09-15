"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ShoppingBag, User, Menu, X } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useCartStore } from "@/store/cart";

const NAV_LINKS = [
  { href: "/parfum", label: "RK — Parfum" },
  { href: "/pod-shade", label: "Studio Pod Shade" },
  { href: "https://memoryphone.online/ru", label: "MemoryPhone", external: true },
  { href: "/3d-print", label: "RK — 3D Print" },
];

export function Navbar() {
  const pathname = usePathname();
  const { authUser, profile } = useAuth();
  const count = useCartStore((s) => s.count());
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b hairline bg-ink/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0" onClick={() => setOpen(false)}>
          <span className="font-display text-xl tracking-[0.2em] text-paper">RK</span>
          <span className="hidden sm:inline text-[11px] uppercase tracking-[0.3em] text-ash">
            Private Edition
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm uppercase tracking-[0.12em] text-ash hover:text-paper transition-colors"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm uppercase tracking-[0.12em] transition-colors hover:text-paper ${
                  pathname?.startsWith(link.href) ? "text-paper" : "text-ash"
                }`}
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-full border hairline text-paper hover:border-line-strong transition-colors"
            aria-label="Корзина"
          >
            <ShoppingBag size={16} />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[10px] font-medium text-paper">
                {count}
              </span>
            )}
          </Link>

          <Link
            href={authUser ? "/account" : "/login"}
            className="hidden sm:flex h-9 items-center gap-2 rounded-full border hairline px-3 text-xs uppercase tracking-[0.1em] text-paper hover:border-line-strong transition-colors"
          >
            <User size={14} />
            {profile?.username ?? "Войти"}
          </Link>

          <button
            className="lg:hidden flex h-9 w-9 items-center justify-center text-paper"
            onClick={() => setOpen((v) => !v)}
            aria-label="Меню"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t hairline bg-ink">
          <nav className="container-page flex flex-col py-4 gap-1">
            {NAV_LINKS.map((link) =>
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 text-sm uppercase tracking-[0.12em] text-ash"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="py-3 text-sm uppercase tracking-[0.12em] text-ash"
                >
                  {link.label}
                </Link>
              )
            )}
            <Link
              href={authUser ? "/account" : "/login"}
              onClick={() => setOpen(false)}
              className="py-3 text-sm uppercase tracking-[0.12em] text-ash"
            >
              {profile?.username ?? "Войти / Регистрация"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
