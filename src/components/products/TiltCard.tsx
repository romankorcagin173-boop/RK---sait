"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";

// A light pseudo-3D hover tilt — the card leans toward the cursor instead of
// just scaling flat. Mouse-only (touch devices get a tap, not a hover) and
// skipped entirely for prefers-reduced-motion.
export function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const quickRef = useRef<{
    rotateX: ReturnType<typeof gsap.quickTo>;
    rotateY: ReturnType<typeof gsap.quickTo>;
    y: ReturnType<typeof gsap.quickTo>;
  } | null>(null);
  const reducedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedRef.current) return;

    gsap.set(el, { transformPerspective: 700 });
    quickRef.current = {
      rotateX: gsap.quickTo(el, "rotateX", { duration: 0.4, ease: "power2.out" }),
      rotateY: gsap.quickTo(el, "rotateY", { duration: 0.4, ease: "power2.out" }),
      y: gsap.quickTo(el, "y", { duration: 0.4, ease: "power2.out" }),
    };
  }, []);

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reducedRef.current || !quickRef.current || e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    quickRef.current.rotateY(px * 8);
    quickRef.current.rotateX(-py * 8);
    quickRef.current.y(-4);
  }

  function handlePointerLeave() {
    if (!quickRef.current) return;
    quickRef.current.rotateY(0);
    quickRef.current.rotateX(0);
    quickRef.current.y(0);
  }

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={className}
    >
      {children}
    </div>
  );
}
