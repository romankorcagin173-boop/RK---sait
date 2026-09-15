import { getBrandDescription } from "@/lib/settings";

export async function BrandIntro() {
  const description = await getBrandDescription();

  return (
    <section className="border-t hairline bg-ink py-24 sm:py-32">
      <div className="container-page grid gap-10 md:grid-cols-[1fr_1.4fr] md:gap-20">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-red-bright">О бренде</span>
          <h2 className="font-display text-3xl sm:text-4xl text-paper mt-4 leading-tight">
            Не для всех.
            <br />
            Только для своих.
          </h2>
        </div>
        <p className="text-ash text-base sm:text-lg leading-relaxed">{description}</p>
      </div>
    </section>
  );
}
