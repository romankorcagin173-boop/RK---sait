"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function EnvelopeScene() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const flapRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const pocketRef = useRef<HTMLDivElement | null>(null);
  const taglineRef = useRef<HTMLDivElement | null>(null);
  const hintRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.set(flapRef.current, { rotateX: 0, transformOrigin: "top center" });
      gsap.set(cardRef.current, {
        y: 70,
        scale: 0.86,
        rotateY: 0,
        opacity: 0.001,
        transformOrigin: "center center",
      });
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

      tl.to(cardRef.current, { opacity: 1, duration: 0.05 }, 0)
        .to(flapRef.current, { rotateX: -150, duration: 0.32, ease: "power2.inOut" }, 0)
        .to(
          cardRef.current,
          { y: -70, scale: 0.98, duration: 0.32, ease: "power2.out" },
          0.16
        )
        .to(
          cardRef.current,
          { rotateY: 180, y: -140, scale: 1, duration: 0.4, ease: "power2.inOut" },
          0.5
        )
        .to(taglineRef.current, { opacity: 1, y: 0, duration: 0.18 }, 0.82);
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
        className="relative flex items-center justify-center"
        style={{ perspective: "1600px", width: "min(90vw, 420px)", height: "min(70vh, 300px)" }}
      >
        {/* Envelope back panel */}
        <div
          ref={pocketRef}
          className="absolute inset-0 rounded-xl border border-line-strong bg-charcoal"
          style={{
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 62%, 0 100%)",
          }}
        />

        {/* Card */}
        <div
          ref={cardRef}
          className="absolute rounded-2xl shadow-2xl"
          style={{
            width: "68%",
            aspectRatio: "1.586",
            transformStyle: "preserve-3d",
            zIndex: 15,
          }}
        >
          <div
            className="absolute inset-0 rounded-2xl bg-charcoal-soft border border-line-strong flex items-center justify-center overflow-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className="font-display text-[13vw] sm:text-6xl text-paper/10 tracking-tight select-none">
              RK
            </span>
          </div>
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden border border-line-strong"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
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
          className="absolute inset-0 rounded-xl border border-line-strong bg-charcoal-soft"
          style={{
            zIndex: 20,
            clipPath: "polygon(0 100%, 50% 55%, 100% 100%, 100% 100%, 0 100%)",
          }}
        />

        {/* Envelope top flap */}
        <div
          ref={flapRef}
          className="absolute left-0 right-0 top-0 rounded-t-xl border border-line-strong bg-charcoal-soft"
          style={{
            height: "55%",
            zIndex: 30,
            clipPath: "polygon(0 0, 100% 0, 50% 100%)",
            transformStyle: "preserve-3d",
          }}
        />
      </div>

      <div
        ref={taglineRef}
        className="relative mt-10 text-center px-6"
      >
        <p className="text-ash text-sm sm:text-base tracking-[0.15em] uppercase">
          RK — Private Edition
        </p>
        <p className="font-display italic text-xl sm:text-2xl text-paper mt-2">
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
