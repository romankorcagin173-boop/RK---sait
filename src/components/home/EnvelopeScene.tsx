"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const DUST_COUNT = 14;
// Same deterministic sine-based placement as AtomizerScene's dust, for the
// same reason: this is a client component but still server-rendered for
// the initial HTML, so Math.random() here would mismatch on hydration.
const DUST = Array.from({ length: DUST_COUNT }).map((_, i) => {
  const seed = i * 51.7;
  return {
    left: (Math.sin(seed) * 0.5 + 0.5) * 100,
    top: (Math.cos(seed * 1.3) * 0.5 + 0.5) * 100,
    size: 2 + (i % 5) * 1.4,
    duration: 16 + (i % 6) * 3,
    delay: -((i * 2.1) % 14),
    opacity: 0.1 + (i % 4) * 0.06,
  };
});

export function EnvelopeScene() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const bgGlowRef = useRef<HTMLDivElement | null>(null);
  const bgHazeRef = useRef<HTMLDivElement | null>(null);
  const seamRef = useRef<SVGPathElement | null>(null);
  const flapRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const glintRef = useRef<HTMLDivElement | null>(null);
  const shadowRef = useRef<HTMLDivElement | null>(null);
  const taglineRef = useRef<HTMLDivElement | null>(null);
  const hintRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Scroll-jacking a pinned 2.6-viewport-tall section is exactly the kind
    // of motion prefers-reduced-motion exists for — skip the scrubbed
    // timeline entirely and just show the end state.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(flapRef.current, { rotateX: -165, transformOrigin: "top center" });
      gsap.set(seamRef.current, { opacity: 0 });
      gsap.set(cardRef.current, {
        y: -128,
        scale: 1,
        rotateY: 180,
        rotateX: 0,
        opacity: 1,
        zIndex: 45,
        transformOrigin: "center center",
      });
      gsap.set(shadowRef.current, { opacity: 0.35, scaleX: 0.82 });
      gsap.set(taglineRef.current, { opacity: 1, y: 0 });
      gsap.set(hintRef.current, { opacity: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set([bgGlowRef.current, bgHazeRef.current], { scale: 1, y: 0 });
      gsap.set(flapRef.current, { rotateX: 0, transformOrigin: "top center" });
      gsap.set(seamRef.current, { opacity: 1 });
      gsap.set(cardRef.current, {
        y: 125,
        scale: 0.42,
        rotateY: 0,
        rotateX: 0,
        opacity: 0,
        zIndex: 5,
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

      // Slow continuous drift on the two background glows, in opposite
      // directions, for a bit of parallax depth behind the envelope —
      // spans the whole timeline rather than any one phase.
      tl.to(bgGlowRef.current, { scale: 1.15, y: -30, duration: 1, ease: "none" }, 0).to(
        bgHazeRef.current,
        { scale: 1.1, y: 20, duration: 1, ease: "none" },
        0
      );

      // A light glint sweeping across the card right as it turns face-on —
      // timed to land mid-flip, like the surface catching the light.
      tl.fromTo(
        glintRef.current,
        { left: "-60%" },
        { left: "160%", duration: 0.5, ease: "power1.inOut" },
        0.56
      );

      // The flat seam line only reads correctly while the envelope looks
      // closed — it dissolves the instant the flap actually starts lifting.
      tl.to(seamRef.current, { opacity: 0, duration: 0.05 }, 0);

      // Phase 1 — the flap unfolds, tipping back and away from the viewer.
      // The card is behind both the body and the flap here (z-index 5, below
      // the body's 10 and the flap's 30), so it fades in but stays hidden
      // until it's promoted above them once risen clear.
      tl.to(cardRef.current, { opacity: 1, duration: 0.06 }, 0)
        .to(flapRef.current, { rotateX: -165, duration: 0.34, ease: "power3.inOut" }, 0)
        // Phase 2 — the card climbs up and grows as it emerges.
        .to(
          cardRef.current,
          { y: 6, scale: 0.88, rotateX: -4, duration: 0.28, ease: "power2.out" },
          0.2
        )
        .to(shadowRef.current, { opacity: 1, scaleX: 1, duration: 0.24 }, 0.32)
        // Phase 3 — clear of the envelope: promoted above both its pieces so
        // nothing can occlude it again, then it turns face-on with a brief
        // motion blur through the fastest part of the turn.
        .set(cardRef.current, { zIndex: 45 }, 0.46)
        .to(
          cardRef.current,
          { y: -128, scale: 1.08, rotateX: 0, duration: 0.42, ease: "power2.inOut" },
          0.52
        )
        .to(
          cardRef.current,
          { rotateY: 90, filter: "blur(7px)", duration: 0.18, ease: "power1.in" },
          0.58
        )
        .to(
          cardRef.current,
          { rotateY: 180, filter: "blur(0px)", duration: 0.2, ease: "power1.out" },
          0.76
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
      <div
        ref={bgGlowRef}
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(163,39,42,0.1),transparent_60%)]"
      />
      <div
        ref={bgHazeRef}
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(243,241,236,0.05),transparent_45%)]"
      />

      {/* Drifting dust — pure ambience, runs on its own CSS loop
          independent of scroll position (same device as AtomizerScene). */}
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

      <div
        className="relative z-[60] flex items-center justify-center"
        style={{ perspective: "1800px", width: "min(92vw, 480px)", height: "min(74vh, 340px)" }}
      >
        {/* Envelope body — only the lower part of the scene, so the upper
            part is genuinely open space for the card to rise into once the
            flap lifts away, rather than a shape it has to climb clear of. */}
        <div
          className="absolute bottom-0 left-0 right-0 rounded-2xl border border-line-strong bg-charcoal-soft"
          style={{ height: "41%", zIndex: 10 }}
        />

        {/* Seam line — reads as the closed envelope's fold while the flap
            hasn't moved yet; dissolves the instant it starts lifting (see
            the timeline), since a flat line stops making sense once the
            flap is a real 3D shape in motion. */}
        <svg
          className="pointer-events-none absolute inset-0"
          viewBox="0 0 320 200"
          preserveAspectRatio="none"
          style={{ zIndex: 35 }}
        >
          <path
            ref={seamRef}
            d="M 4 14 L 160 118 L 316 14"
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Soft contact shadow under the emerging card */}
        <div
          ref={shadowRef}
          className="absolute bottom-[8%] h-6 w-[60%] rounded-full bg-black/50 blur-xl"
          style={{ zIndex: 15 }}
        />

        {/* Card */}
        <div
          ref={cardRef}
          className="absolute rounded-2xl"
          style={{
            width: "66%",
            aspectRatio: "1.586",
            transformStyle: "preserve-3d",
            // Starts below both the body (10) and the flap (30) so it's
            // genuinely hidden at rest; the timeline promotes it to 45 the
            // moment it clears the envelope — see gsap.set below.
            zIndex: 5,
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
            <div
              ref={glintRef}
              className="pointer-events-none absolute inset-y-0 w-1/2"
              style={{
                left: "-60%",
                background:
                  "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)",
                mixBlendMode: "screen",
              }}
            />
          </div>
        </div>

        {/* Envelope flap — hinged at the top edge, swings up and back to
            reveal the open body beneath. Height/apex match the approved
            shape study: base at the top edge, point at 59% down. */}
        <div
          ref={flapRef}
          className="absolute left-0 right-0 top-0 rounded-t-2xl border border-line-strong bg-charcoal-soft"
          style={{
            height: "59%",
            zIndex: 30,
            clipPath: "polygon(0% 0%, 100% 0%, 50% 100%)",
            transformStyle: "preserve-3d",
          }}
        >
          <span className="absolute left-1/2 top-6 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-red/70 [animation:glow-pulse_2.4s_ease-in-out_infinite]" />
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
