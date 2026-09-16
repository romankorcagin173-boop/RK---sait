"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Short phrases that build toward the brand lockup — each one fills the
// screen, holds, then dissolves into the next as the section stays pinned.
const BEATS: string[][] = [
  ["Не парфюм —", "подпись."],
  ["Один флакон.", "Один номер.", "Только ваш."],
  ["Аромат,", "который выбирают", "немногие."],
];

const DUST_COUNT = 18;
// Deterministic pseudo-random placement (sine-based, not Math.random) so
// server and client render identical markup — this component is not
// client-only, so a mismatch here would be a real hydration bug.
const DUST = Array.from({ length: DUST_COUNT }).map((_, i) => {
  const seed = i * 37.13;
  return {
    left: (Math.sin(seed) * 0.5 + 0.5) * 100,
    top: (Math.cos(seed * 1.7) * 0.5 + 0.5) * 100,
    size: 2 + (i % 5) * 1.6,
    duration: 14 + (i % 6) * 3,
    delay: -((i * 1.7) % 12),
    opacity: 0.12 + (i % 4) * 0.07,
  };
});

export function AtomizerScene() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const beatRefs = useRef<(HTMLDivElement | null)[]>([]);
  const brandRef = useRef<HTMLDivElement | null>(null);
  const hintRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const beats = beatRefs.current.filter((b): b is HTMLDivElement => Boolean(b));

    gsap.set(beats, { opacity: 0, filter: "blur(14px)", scale: 1.05 });
    gsap.set(brandRef.current, { opacity: 0, y: 24 });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => "+=" + window.innerHeight * 2.6,
          scrub: 1,
          pin: true,
          // GSAP disables pin-spacing by default when the pinned element's
          // parent is `display: flex` (our <main> is) — without this the
          // scroll track never reserves room for the animation.
          pinSpacing: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            gsap.to(hintRef.current, { opacity: self.progress > 0.02 ? 0 : 1, duration: 0.2 });
          },
        },
      });

      // Each beat gets an equal scroll slice; the final slice is reserved
      // for the brand lockup to fade in and hold.
      const slice = 1 / (beats.length + 1);
      beats.forEach((beat, i) => {
        const start = i * slice;
        tl.to(
          beat,
          { opacity: 1, filter: "blur(0px)", scale: 1, duration: slice * 0.4, ease: "power2.out" },
          start
        ).to(
          beat,
          { opacity: 0, filter: "blur(10px)", scale: 0.97, duration: slice * 0.32, ease: "power1.in" },
          start + slice * 0.6
        );
      });

      tl.to(
        brandRef.current,
        { opacity: 1, y: 0, duration: slice * 0.5, ease: "power2.out" },
        beats.length * slice
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-ink"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(163,39,42,0.12),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(243,241,236,0.04),transparent_45%)]" />

      {/* Drifting dust — pure ambience, runs on its own CSS loop
          independent of scroll position. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {DUST.map((d, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-paper"
            style={{
              left: `${d.left}%`,
              top: `${d.top}%`,
              width: d.size,
              height: d.size,
              opacity: d.opacity,
              filter: "blur(1px)",
              animation: `dust-drift ${d.duration}s ease-in-out ${d.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex w-full max-w-3xl justify-center px-6" style={{ height: "16rem" }}>
        {BEATS.map((lines, i) => (
          <div
            key={i}
            ref={(el) => {
              beatRefs.current[i] = el;
            }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1"
          >
            {lines.map((line, j) => (
              <p
                key={j}
                className="font-display italic text-3xl sm:text-5xl text-paper leading-tight text-center"
              >
                {line}
              </p>
            ))}
          </div>
        ))}

        <div ref={brandRef} className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <p className="text-ash text-sm sm:text-base tracking-[0.2em] uppercase">RK — Parfum</p>
          <p className="font-display italic text-2xl sm:text-3xl text-paper text-center">
            Приватная парфюмерия ограниченным тиражом
          </p>
        </div>
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
