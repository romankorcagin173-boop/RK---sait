import Link from "next/link";
import { ArrowUpRight, Droplet, Waves, Smartphone, Box } from "lucide-react";

const TABS = [
  {
    href: "/parfum",
    icon: Droplet,
    title: "RK — Parfum",
    desc: "Приватная парфюмерия ограниченным тиражом. Распив из нумерованных флаконов.",
    external: false,
  },
  {
    href: "/pod-shade",
    icon: Waves,
    title: "Studio Pod Shade",
    desc: "Новое направление бренда. Уже в разработке.",
    external: false,
  },
  {
    href: "https://memoryphone.online/ru",
    icon: Smartphone,
    title: "MemoryPhone",
    desc: "Отдельный проект бренда — переход на memoryphone.online",
    external: true,
  },
  {
    href: "/3d-print",
    icon: Box,
    title: "RK — 3D Print",
    desc: "Авторские объекты и функциональные предметы на 3D-печати.",
    external: false,
  },
];

export function TabsShowcase() {
  return (
    <section className="border-t hairline bg-ink-soft py-24 sm:py-32">
      <div className="container-page">
        <span className="text-xs uppercase tracking-[0.3em] text-red-bright">Направления</span>
        <h2 className="font-display text-3xl sm:text-4xl text-paper mt-4 mb-14">
          Четыре продукта, один стандарт
        </h2>

        <div className="grid gap-px overflow-hidden rounded-2xl border hairline sm:grid-cols-2 bg-line">
          {TABS.map(({ href, icon: Icon, title, desc, external }) => {
            const content = (
              <div className="group relative flex h-full flex-col justify-between gap-8 bg-ink p-8 sm:p-10 transition-colors hover:bg-charcoal">
                <div className="flex items-center justify-between">
                  <Icon size={28} className="text-red-bright" strokeWidth={1.5} />
                  <ArrowUpRight
                    size={18}
                    className="text-ash opacity-0 -translate-x-1 translate-y-1 transition-all group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0"
                  />
                </div>
                <div>
                  <h3 className="font-display text-2xl text-paper mb-2">{title}</h3>
                  <p className="text-sm text-ash leading-relaxed max-w-sm">{desc}</p>
                </div>
              </div>
            );

            return external ? (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer">
                {content}
              </a>
            ) : (
              <Link key={href} href={href}>
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
