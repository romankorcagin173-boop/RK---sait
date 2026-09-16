"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function AtomizerScene() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const capRef = useRef<HTMLDivElement | null>(null);
  const mistWrapRef = useRef<HTMLDivElement | null>(null);
  const shadowRef = useRef<HTMLDivElement | null>(null);
  const bottleRef = useRef<HTMLDivElement | null>(null);
  const taglineRef = useRef<HTMLDivElement | null>(null);
  const hintRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const mistDots = mistWrapRef.current
        ? Array.from(mistWrapRef.current.querySelectorAll<HTMLDivElement>(".mist-dot"))
        : [];

      gsap.set(capRef.current, { y: 0, rotate: 0 });
      gsap.set(mistDots, { opacity: 0, scale: 0.2 });
      gsap.set(bottleRef.current, { y: 12, scale: 0.96, opacity: 0 });
      gsap.set(taglineRef.current, { opacity: 0, y: 18 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => "+=" + window.innerHeight * 2.4,
          scrub: 1,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            gsap.to(hintRef.current, { opacity: self.progress > 0.02 ? 0 : 1, duration: 0.2 });
          },
        },
      });

      // Phase 1 — the bottle fades/settles in.
      tl.to(bottleRef.current, { y: 0, scale: 1, opacity: 1, duration: 0.2, ease: "power2.out" }, 0)
        // Phase 2 — the cap lifts straight up and tips slightly, as if unscrewed.
        .to(capRef.current, { y: -64, rotate: -12, duration: 0.3, ease: "power3.inOut" }, 0.16)
        // Phase 3 — a fine mist bursts from the nozzle in a soft believable cone.
        .to(
          mistDots,
          {
            opacity: 1,
            scale: 1,
            duration: 0.32,
            ease: "power1.out",
            stagger: { each: 0.04, from: "center" },
          },
          0.38
        )
        .to(
          mistDots,
          {
            opacity: 0,
            y: "-=64",
            x: (i) => (i % 2 === 0 ? "+=22" : "-=22"),
            duration: 0.38,
            ease: "power1.in",
            stagger: { each: 0.04, from: "center" },
          },
          0.54
        )
        // Phase 4 — a second, lighter puff for a believable double-spritz.
        .to(
          mistDots,
          { opacity: 0.9, scale: 0.85, duration: 0.05 },
          0.66
        )
        .to(
          mistDots,
          { opacity: 0, y: "-=40", duration: 0.3, ease: "power1.in", stagger: { each: 0.03, from: "center" } },
          0.68
        )
        .to(taglineRef.current, { opacity: 1, y: 0, duration: 0.22 }, 0.82);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-ink"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(163,39,42,0.1),transparent_60%)]" />

      <div
        ref={bottleRef}
        className="relative z-[60] flex items-end justify-center"
        style={{ perspective: "1400px", height: "min(64vh, 480px)" }}
      >
        {/* contact shadow */}
        <div
          ref={shadowRef}
          className="absolute bottom-[3%] h-5 w-32 rounded-full bg-black/55 blur-lg"
        />

        {/* mist cone */}
        <div
          ref={mistWrapRef}
          className="pointer-events-none absolute left-1/2 z-30 flex -translate-x-1/2"
          style={{ top: "3%" }}
        >
          {Array.from({ length: 9 }).map((_, i) => {
            const spread = (i - 4) * 11;
            const size = 9 + Math.abs(i - 4) * 3;
            return (
              <div
                key={i}
                className="mist-dot absolute rounded-full bg-paper/25 blur-[2px]"
                style={{
                  width: size,
                  height: size,
                  left: spread - size / 2,
                  top: Math.abs(i - 4) * 4,
                }}
              />
            );
          })}
        </div>

        {/* nozzle spout */}
        <div
          className="absolute z-20 h-2 w-8 rounded-full bg-red"
          style={{ bottom: "68%", left: "50%", transform: "translateX(-50%)" }}
        />

        {/* cap */}
        <div
          ref={capRef}
          className="absolute z-20 overflow-hidden rounded-t-[10px] rounded-b-[4px] border border-black/40"
          style={{
            width: 46,
            height: 78,
            bottom: "54%",
            left: "50%",
            transform: "translateX(-50%)",
            background:
              "repeating-linear-gradient(90deg, rgba(255,255,255,0.14) 0px, rgba(255,255,255,0.14) 2px, rgba(0,0,0,0.28) 2px, rgba(0,0,0,0.28) 6px), linear-gradient(180deg, #3a3936, #232220)",
            boxShadow: "0 18px 26px rgba(0,0,0,0.5)",
          }}
        >
          <div className="absolute inset-x-0 top-0 h-1.5 bg-black/30" />
          <div className="absolute inset-x-0 bottom-2 h-[3px] bg-red/80" />
        </div>

        {/* neck */}
        <div
          className="absolute z-10 rounded-sm border border-black/30 bg-charcoal-soft"
          style={{ width: 18, height: 22, bottom: "51%", left: "50%", transform: "translateX(-50%)" }}
        />

        {/* shoulder (tapered) */}
        <div
          className="absolute z-[6]"
          style={{
            bottom: "44%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "84px solid transparent",
            borderRight: "84px solid transparent",
            borderBottom: "40px solid var(--color-charcoal-soft)",
            opacity: 0.96,
          }}
        />
        <div
          className="absolute z-[5] overflow-hidden rounded-t-[10px]"
          style={{
            width: 168,
            height: 46,
            bottom: "44%",
            left: "50%",
            transform: "translateX(-50%)",
            background:
              "repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 3px, rgba(0,0,0,0.14) 3px, rgba(0,0,0,0.14) 9px), linear-gradient(180deg, #2c2b28, #26221f)",
          }}
        />

        {/* main ribbed body */}
        <div
          className="relative z-0 overflow-hidden rounded-b-lg border border-black/40"
          style={{
            width: 168,
            height: "44%",
            background:
              "repeating-linear-gradient(90deg, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 3px, rgba(0,0,0,0.16) 3px, rgba(0,0,0,0.16) 9px), linear-gradient(180deg, #201f1d 0%, #241a19 55%, #3a1211 100%)",
            boxShadow: "inset 0 0 26px rgba(0,0,0,0.5)",
          }}
        >
          {/* liquid glow */}
          <div className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-red/40 via-red/15 to-transparent" />

          {/* label plaque — the actual RK Private Edition card design */}
          <div className="absolute left-1/2 top-1/2 w-[76%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[3px] border border-line-strong shadow-[0_6px_14px_rgba(0,0,0,0.45)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/rk-card-front.svg"
              alt="RK Private Edition"
              className="block w-full"
              style={{ aspectRatio: "1.6" }}
            />
          </div>
        </div>
      </div>

      <div ref={taglineRef} className="relative mt-12 text-center px-6">
        <p className="text-ash text-sm sm:text-base tracking-[0.2em] uppercase">RK — Parfum</p>
        <p className="font-display italic text-2xl sm:text-3xl text-paper mt-3">
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
