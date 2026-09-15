"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function EnvelopeScene() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const flapRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const shadowRef = useRef<HTMLDivElement | null>(null);
  const taglineRef = useRef<HTMLDivElement | null>(null);
  const hintRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.set(flapRef.current, { rotateX: 0, transformOrigin: "top center" });
      gsap.set(cardRef.current, {
        y: 66,
        scale: 0.82,
        rotateY: 0,
        rotateX: 0,
        opacity: 0,
        transformOrigin: "center center",
      });
      gsap.set(shadowRef.current, { opacity: 0, scaleX: 0.7 });
      gsap.set(taglineRef.current, { opacity: 0, y: 18 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => "+=" + window.innerHeight * 2.6,
          scrub: 1,
          pin: true,
          // GSAP disables pin-spacing by default when the pinned element's
          // parent is `display: flex` (our <main> is) — without this the
          // scroll track never actually reserved room for the animation,
          // so the pinned scene and the next section fought over the same
          // scroll range and visually collided.
          pinSpacing: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            gsap.to(hintRef.current, { opacity: self.progress > 0.02 ? 0 : 1, duration: 0.2 });
          },
        },
      });

      // Phase 1 — the flap unfolds, tipping back and away from the viewer.
      tl.to(cardRef.current, { opacity: 1, duration: 0.06 }, 0)
        .to(flapRef.current, { rotateX: -165, duration: 0.34, ease: "power3.inOut" }, 0)
        // Phase 2 — the card slides up out of the pocket.
        .to(
          cardRef.current,
          { y: -30, scale: 0.94, rotateX: -4, duration: 0.26, ease: "power2.out" },
          0.22
        )
        .to(shadowRef.current, { opacity: 1, scaleX: 1, duration: 0.26 }, 0.22)
        // Phase 3 — it rises further and turns face-on to the viewer.
        .to(
          cardRef.current,
          { rotateY: 180, y: -128, scale: 1.08, rotateX: 0, duration: 0.42, ease: "power2.inOut" },
          0.52
        )
        .to(shadowRef.current, { opacity: 0.35, scaleX: 0.82, duration: 0.42 }, 0.52)
        // Phase 4 — settle and reveal the tagline.
        .to(cardRef.current, { scale: 1, duration: 0.14, ease: "power1.out" }, 0.94)
        .to(taglineRef.current, { opacity: 1, y: 0, duration: 0.2 }, 0.84);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-ink"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(163,39,42,0.1),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(243,241,236,0.05),transparent_45%)]" />

      <div
        className="relative z-[60] flex items-center justify-center"
        style={{ perspective: "1800px", width: "min(92vw, 480px)", height: "min(74vh, 340px)" }}
      >
        {/* Envelope back panel */}
        <div
          className="absolute inset-0 rounded-2xl border border-line-strong bg-charcoal"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 60%, 0 100%)" }}
        />

        {/* Soft contact shadow under the emerging card */}
        <div
          ref={shadowRef}
          className="absolute bottom-[8%] h-6 w-[60%] rounded-full bg-black/50 blur-xl"
        />

        {/* Card */}
        <div
          ref={cardRef}
          className="absolute rounded-2xl"
          style={{
            width: "66%",
            aspectRatio: "1.586",
            transformStyle: "preserve-3d",
            zIndex: 15,
          }}
        >
          <div
            className="absolute inset-0 rounded-2xl bg-charcoal-soft border border-line-strong flex items-center justify-center overflow-hidden"
            style={{ backfaceVisibility: "hidden", boxShadow: "0 30px 40px rgba(0,0,0,0.55)" }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(243,241,236,0.06),transparent_65%)]" />
            <span className="font-display text-[15vw] sm:text-7xl text-paper/[0.08] tracking-tight select-none">
              RK
            </span>
            <span className="absolute h-2.5 w-2.5 rounded-full bg-red top-4 right-4" />
          </div>
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden border border-line-strong"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              boxShadow: "0 30px 40px rgba(0,0,0,0.55)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/rk-card-front.svg"
              alt="RK Private Edition"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Envelope front pocket (lower flap) */}
        <div
          className="absolute inset-0 rounded-2xl border border-line-strong bg-charcoal-soft"
          style={{ zIndex: 20, clipPath: "polygon(0 100%, 50% 53%, 100% 100%)" }}
        />

        {/* Envelope top flap */}
        <div
          ref={flapRef}
          className="absolute left-0 right-0 top-0 rounded-t-2xl border border-line-strong bg-charcoal-soft"
          style={{
            height: "53%",
            zIndex: 30,
            clipPath: "polygon(0 0, 100% 0, 50% 100%)",
            transformStyle: "preserve-3d",
          }}
        >
          <span className="absolute left-1/2 top-6 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-red/70" />
        </div>
      </div>

      <div ref={taglineRef} className="relative mt-12 text-center px-6">
        <p className="text-ash text-sm sm:text-base tracking-[0.2em] uppercase">
          RK — Private Edition
        </p>
        <p className="font-display italic text-2xl sm:text-3xl text-paper mt-3">
          Стань частью уникального
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
