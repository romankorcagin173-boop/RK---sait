"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

// A soft golden glow + light dust trail that follows the cursor — desktop
// only (fine pointer), skipped for prefers-reduced-motion, pointer-events
// none throughout so it never interferes with clicks or hover states.
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
    canvas.width = width;
    canvas.height = height;

    function handleResize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width;
      canvas!.height = height;
    }
    window.addEventListener("resize", handleResize);

    const pointer = { x: width / 2, y: height / 2, active: false };
    const glow = { x: pointer.x, y: pointer.y };
    let particles: Particle[] = [];
    let lastSpawn = 0;

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
    function frame(time: number) {
      glow.x += (pointer.x - glow.x) * 0.18;
      glow.y += (pointer.y - glow.y) * 0.18;

      ctx!.clearRect(0, 0, width, height);

      if (pointer.active) {
        if (time - lastSpawn > 30) {
          lastSpawn = time;
          for (let i = 0; i < 2; i++) {
            particles.push({
              x: glow.x + (Math.random() - 0.5) * 10,
              y: glow.y + (Math.random() - 0.5) * 10,
              vx: (Math.random() - 0.5) * 0.6,
              vy: (Math.random() - 0.5) * 0.6 - 0.2,
              life: 0,
              maxLife: 50 + Math.random() * 30,
              size: 1.5 + Math.random() * 2.5,
            });
          }
        }

        const radius = 110;
        const gradient = ctx!.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, radius);
        gradient.addColorStop(0, "rgba(232, 197, 119, 0.18)");
        gradient.addColorStop(1, "rgba(232, 197, 119, 0)");
        ctx!.fillStyle = gradient;
        ctx!.beginPath();
        ctx!.arc(glow.x, glow.y, radius, 0, Math.PI * 2);
        ctx!.fill();
      }

      particles = particles.filter((p) => p.life < p.maxLife);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;
        const t = p.life / p.maxLife;
        const alpha = (1 - t) * 0.8;
        const grad = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
        grad.addColorStop(0, `rgba(232, 197, 119, ${alpha})`);
        grad.addColorStop(1, "rgba(232, 197, 119, 0)");
        ctx!.fillStyle = grad;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx!.fill();
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
