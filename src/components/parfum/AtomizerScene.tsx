"use client";

import { useLayoutEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const BottleScene3D = dynamic(
  () => import("@/components/parfum/BottleScene3D").then((m) => m.BottleScene3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center text-ash text-xs uppercase tracking-[0.2em]">
        Загрузка сцены…
      </div>
    ),
  }
);

export function AtomizerScene() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const taglineRef = useRef<HTMLDivElement | null>(null);
  const hintRef = useRef<HTMLDivElement | null>(null);
  const [triggerEl, setTriggerEl] = useState<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    setTriggerEl(sectionRef.current);
  }, []);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    gsap.set(taglineRef.current, { opacity: 0, y: 18 });

    const ctx = gsap.context(() => {
      // This pin owns the scroll track; BottleScene3D reads progress off a
      // second, non-pinning ScrollTrigger on the same element so the 3D
      // animation and the DOM pin stay perfectly in sync without the 3D
      // module needing to know anything about pinning.
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: () => "+=" + window.innerHeight * 2.4,
        scrub: 1,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          gsap.to(hintRef.current, { opacity: self.progress > 0.02 ? 0 : 1, duration: 0.2 });
          gsap.to(taglineRef.current, {
            opacity: self.progress > 0.82 ? 1 : 0,
            y: self.progress > 0.82 ? 0 : 18,
            duration: 0.2,
          });
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-ink"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(163,39,42,0.1),transparent_60%)]" />

      <div className="relative z-[60]" style={{ width: "min(88vw, 440px)", height: "min(64vh, 480px)" }}>
        <div className="pointer-events-none absolute bottom-[6%] left-1/2 h-6 w-40 -translate-x-1/2 rounded-full bg-black/50 blur-xl" />
        <BottleScene3D triggerEl={triggerEl} />
      </div>

      <div ref={taglineRef} className="relative mt-6 text-center px-6">
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
