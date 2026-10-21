"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const COLORS = ["var(--color-red-bright)", "var(--color-gold)", "var(--color-gold-bright)", "var(--color-paper)"];
const COUNT = 26;

// A one-shot celebratory burst for the order-success card — brand colors
// only (no generic rainbow confetti), skipped for prefers-reduced-motion.
export function ConfettiBurst() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dots: HTMLSpanElement[] = [];
    for (let i = 0; i < COUNT; i++) {
      const dot = document.createElement("span");
      const size = 4 + Math.random() * 7;
      dot.style.position = "absolute";
      dot.style.left = "50%";
      dot.style.top = "0";
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
      dot.style.background = COLORS[i % COLORS.length];
      dot.style.willChange = "transform, opacity";
      el.appendChild(dot);
      dots.push(dot);
    }

    const tweens = dots.map((dot) => {
      const angle = Math.random() * Math.PI + Math.PI; // spray downward/outward
      const distance = 60 + Math.random() * 120;
      const x = Math.cos(angle) * distance;
      const y = Math.abs(Math.sin(angle) * distance) * -1 + 40 + Math.random() * 60;
      return gsap.fromTo(
        dot,
        { x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 },
        {
          x,
          y,
          rotate: (Math.random() - 0.5) * 360,
          opacity: 0,
          scale: 0.6,
          duration: 0.9 + Math.random() * 0.5,
          ease: "power2.out",
          delay: Math.random() * 0.15,
        }
      );
    });

    return () => {
      tweens.forEach((t) => t.kill());
      dots.forEach((d) => d.remove());
    };
  }, []);

  return <div ref={ref} className="pointer-events-none absolute inset-x-0 top-0 h-0" aria-hidden />;
}
