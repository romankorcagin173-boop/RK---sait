import { Waves } from "lucide-react";

export const metadata = { title: "Studio Pod Shade" };

export default function PodShadePage() {
  return (
    <section className="flex flex-1 items-center justify-center py-24">
      <div className="container-page flex flex-col items-center text-center max-w-lg">
        <Waves size={40} className="text-red-bright mb-6" strokeWidth={1.5} />
        <span className="text-xs uppercase tracking-[0.3em] text-red-bright mb-4">
          Studio Pod Shade
        </span>
        <h1 className="font-display text-3xl sm:text-4xl text-paper mb-4">
          Уже в пути. Почти готово.
        </h1>
        <p className="text-ash leading-relaxed">
          Новое направление RK — Private Edition сейчас в разработке. Мы бережно доводим
          детали до совершенства — совсем скоро здесь появится отдельный сайт. Загляните
          позже.
        </p>
      </div>
    </section>
  );
}
