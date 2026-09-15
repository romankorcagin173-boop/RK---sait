"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function AtomizerScene() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const capRef = useRef<HTMLDivElement | null>(null);
  const nozzleRef = useRef<HTMLDivElement | null>(null);
  const mistWrapRef = useRef<HTMLDivElement | null>(null);
  const taglineRef = useRef<HTMLDivElement | null>(null);
  const hintRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const mistDots = mistWrapRef.current
        ? Array.from(mistWrapRef.current.querySelectorAll<HTMLDivElement>(".mist-dot"))
        : [];

      gsap.set(capRef.current, { y: 0, rotate: 0 });
      gsap.set(mistDots, { opacity: 0, scale: 0.3, y: 0 });
      gsap.set(taglineRef.current, { opacity: 0, y: 16 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=220%",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            gsap.to(hintRef.current, { opacity: self.progress > 0.03 ? 0 : 1, duration: 0.2 });
          },
        },
      });

      tl.to(capRef.current, { y: -46, rotate: -8, duration: 0.34, ease: "power2.inOut" }, 0)
        .to(
          mistDots,
          {
            opacity: 1,
            scale: 1,
            y: -90,
            duration: 0.5,
            ease: "power1.out",
            stagger: 0.06,
          },
          0.28
        )
        .to(
          mistDots,
          { opacity: 0, y: -150, duration: 0.35, ease: "power1.in", stagger: 0.04 },
          0.66
        )
        .to(taglineRef.current, { opacity: 1, y: 0, duration: 0.2 }, 0.75);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-ink"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(163,39,42,0.08),transparent_60%)]" />

      <div
        className="relative flex items-end justify-center"
        style={{ perspective: "1200px", height: "min(56vh, 380px)" }}
      >
        {/* mist */}
        <div
          ref={mistWrapRef}
          className="absolute left-1/2 top-0 -translate-x-1/2 flex items-center justify-center"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="mist-dot absolute rounded-full bg-paper/25 blur-md"
              style={{
                width: 18 + (i % 3) * 10,
                height: 18 + (i % 3) * 10,
                left: (i - 2.5) * 16,
              }}
            />
          ))}
        </div>

        {/* nozzle */}
        <div
          ref={nozzleRef}
          className="absolute z-10 h-3 w-10 rounded-sm bg-red"
          style={{ bottom: "38%" }}
        />

        {/* cap */}
        <div
          ref={capRef}
          className="absolute z-20 rounded-t-xl rounded-b-sm border hairline bg-charcoal-soft"
          style={{ width: 46, height: 70, bottom: "34%" }}
        />

        {/* neck */}
        <div
          className="absolute z-0 rounded-sm border hairline bg-charcoal-soft"
          style={{ width: 20, height: 24, bottom: "30%" }}
        />

        {/* bottle body */}
        <div
          className="relative z-[5] flex items-end justify-center rounded-t-3xl rounded-b-md border hairline bg-charcoal-soft"
          style={{ width: 150, height: "34%" }}
        >
          <span className="mb-4 font-display text-sm tracking-[0.15em] text-paper/70">RK</span>
        </div>
      </div>

      <div ref={taglineRef} className="relative mt-12 text-center px-6">
        <p className="text-ash text-sm sm:text-base tracking-[0.15em] uppercase">RK — Parfum</p>
        <p className="font-display italic text-xl sm:text-2xl text-paper mt-2">
          Приватная парфюмерия ограниченным тиражом
        </p>
      </div>

      <div
        ref={hintRef}
        className="absolute bottom-10 flex flex-col items-center gap-2 text-ash text-xs uppercase tracking-[0.2em]"
      >
        <span>Листайте вниз</span>
        <span className="h-8 w-px bg-line-strong animate-pulse" />
      </div>
    </section>
  );
}
