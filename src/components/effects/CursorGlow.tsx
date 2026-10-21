"use client";

import { useEffect, useRef } from "react";

interface Dot {
  x: number;
  y: number;
  glow: number;
}

const SPACING = 36;
const RADIUS = 140;
const BASE_ALPHA = 0.045;
const LIT_ALPHA = 0.85;
const BASE_SIZE = 1;
const LIT_SIZE = 2.2;
// Gold, interpolated by alpha/size only — hue stays constant between the
// barely-visible resting dots and the ones lit up near the cursor.
const GOLD = "201, 162, 74";

// A faint field of micro-dots sitting behind page content — mostly
// invisible at rest, lighting up gold near the cursor and fading back out
// as it moves away. Desktop/fine-pointer only, skipped for
// prefers-reduced-motion, pointer-events none throughout.
export function CursorGlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(pointer: fine)").matches
    ) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dots: Dot[] = [];

    function buildGrid() {
      dots = [];
      for (let y = SPACING / 2; y < height; y += SPACING) {
        for (let x = SPACING / 2; x < width; x += SPACING) {
          dots.push({ x, y, glow: 0 });
        }
      }
    }

    function handleResize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width;
      canvas!.height = height;
      buildGrid();
    }

    canvas.width = width;
    canvas.height = height;
    buildGrid();
    window.addEventListener("resize", handleResize);

    const pointer = { x: -9999, y: -9999, active: false };
    function handleMove(e: PointerEvent) {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    }
    function handleLeave() {
      pointer.active = false;
    }
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerleave", handleLeave);

    let raf = 0;
    function frame() {
      ctx!.clearRect(0, 0, width, height);

      for (const dot of dots) {
        let target = 0;
        if (pointer.active) {
          const dx = dot.x - pointer.x;
          const dy = dot.y - pointer.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < RADIUS) {
            target = Math.pow(1 - dist / RADIUS, 1.6);
          }
        }
        dot.glow += (target - dot.glow) * 0.15;

        const alpha = BASE_ALPHA + dot.glow * (LIT_ALPHA - BASE_ALPHA);
        const size = BASE_SIZE + dot.glow * (LIT_SIZE - BASE_SIZE);
        ctx!.fillStyle = `rgba(${GOLD}, ${alpha})`;
        ctx!.fillRect(dot.x - size / 2, dot.y - size / 2, size, size);
      }

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerleave", handleLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[70] hidden mix-blend-screen sm:block"
      aria-hidden
    />
  );
}
