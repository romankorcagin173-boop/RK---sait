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
      gsap.set(bottleRef.current, { y: 10, scale: 0.97 });
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

      // Phase 1 — the whole bottle settles in, cap lifts and tilts off.
      tl.to(bottleRef.current, { y: 0, scale: 1, duration: 0.2, ease: "power2.out" }, 0)
        .to(capRef.current, { y: -58, rotate: -10, duration: 0.3, ease: "power3.inOut" }, 0.12)
        // Phase 2 — a fine mist bursts from the nozzle in a soft cone.
        .to(
          mistDots,
          {
            opacity: 1,
            scale: 1,
            duration: 0.36,
            ease: "power1.out",
            stagger: { each: 0.045, from: "center" },
          },
          0.34
        )
        .to(
          mistDots,
          {
            opacity: 0,
            y: "-=70",
            x: (i) => (i % 2 === 0 ? "+=26" : "-=26"),
            duration: 0.4,
            ease: "power1.in",
            stagger: { each: 0.045, from: "center" },
          },
          0.5
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
        style={{ perspective: "1300px", height: "min(58vh, 420px)" }}
      >
        {/* contact shadow */}
        <div
          ref={shadowRef}
          className="absolute bottom-[6%] h-5 w-28 rounded-full bg-black/50 blur-lg"
        />

        {/* mist cone */}
        <div
          ref={mistWrapRef}
          className="pointer-events-none absolute left-1/2 flex -translate-x-1/2"
          style={{ top: "6%" }}
        >
          {Array.from({ length: 9 }).map((_, i) => {
            const spread = (i - 4) * 11;
            const size = 10 + Math.abs(i - 4) * 3;
            return (
              <div
                key={i}
                className="mist-dot absolute rounded-full bg-paper/20 blur-[2px]"
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
          className="absolute z-10 h-2 w-7 rounded-full bg-red"
          style={{ bottom: "56%", left: "50%", transform: "translateX(-50%)" }}
        />

        {/* pump actuator + cap */}
        <div
          ref={capRef}
          className="absolute z-20 rounded-t-2xl rounded-b-md border hairline bg-charcoal-soft shadow-lg"
          style={{ width: 40, height: 64, bottom: "44%", left: "50%", transform: "translateX(-50%)" }}
        >
          <div className="absolute inset-x-0 top-2 mx-auto h-px w-6 bg-line-strong" />
        </div>

        {/* neck */}
        <div
          className="absolute z-[5] rounded-sm border hairline bg-charcoal-soft"
          style={{ width: 18, height: 20, bottom: "42%", left: "50%", transform: "translateX(-50%)" }}
        />

        {/* bottle shoulders + body */}
        <div
          className="relative z-0 overflow-hidden rounded-t-[2.5rem] rounded-b-xl border hairline bg-charcoal-soft"
          style={{ width: 168, height: "44%" }}
        >
          {/* liquid fill */}
          <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-red/35 to-red/10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(243,241,236,0.08),transparent_55%)]" />

          {/* wordmark */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span className="font-display text-base tracking-[0.2em] text-paper/85">RK</span>
            <span className="text-[10px] uppercase tracking-[0.35em] text-paper/50">Parfum</span>
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
