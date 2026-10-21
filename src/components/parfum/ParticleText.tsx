"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export interface ParticleTextHandle {
  setProgress: (p: number) => void;
}

interface Particle {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  group: number;
}

// Paper white — matches the text color this replaces.
const DOT = "243, 241, 236";
const SAMPLE_STEP = 2.6;

// Draws `lines` as a cloud of particles that converge into the actual
// letterforms as `setProgress` goes 0 -> 1 (and scatter again on the way
// back down) — driven externally by a GSAP scroll timeline via the ref,
// not by its own scroll logic. The real text stays in the DOM for screen
// readers/SEO via a visually-hidden span.
export const ParticleText = forwardRef<
  ParticleTextHandle,
  { lines: string[]; className?: string }
>(function ParticleText({ lines, className }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const progressRef = useRef(0);
  const dprRef = useRef(1);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!container || !canvas || !ctx) return;

    let cancelled = false;

    function build() {
      if (cancelled) return;
      const rect = container!.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (width === 0 || height === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dprRef.current = dpr;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;

      const sample = document.createElement("canvas");
      sample.width = canvas!.width;
      sample.height = canvas!.height;
      const sctx = sample.getContext("2d")!;
      sctx.scale(dpr, dpr);

      const fontFamily =
        getComputedStyle(document.documentElement).getPropertyValue("--font-playfair").trim() ||
        "serif";
      const fontSize = Math.max(22, Math.min(width * 0.085, 54));
      const lineHeight = fontSize * 1.08;
      const totalHeight = lineHeight * lines.length;
      const startY = height / 2 - totalHeight / 2 + lineHeight / 2;

      sctx.font = `italic 500 ${fontSize}px ${fontFamily}`;
      sctx.fillStyle = "#fff";
      sctx.textAlign = "center";
      sctx.textBaseline = "middle";

      const points: { x: number; y: number; group: number }[] = [];
      lines.forEach((line, i) => {
        const y = startY + i * lineHeight;
        sctx.clearRect(0, 0, width, height);
        sctx.fillText(line, width / 2, y);
        const data = sctx.getImageData(0, 0, canvas!.width, canvas!.height).data;
        for (let py = 0; py < height; py += SAMPLE_STEP) {
          for (let px = 0; px < width; px += SAMPLE_STEP) {
            const sx = Math.round(px * dpr);
            const sy = Math.round(py * dpr);
            const alpha = data[(sy * canvas!.width + sx) * 4 + 3];
            if (alpha > 120) points.push({ x: px, y: py, group: i });
          }
        }
      });

      particlesRef.current = points.map((p) => {
        const angle = Math.random() * Math.PI * 2;
        const radius = 50 + Math.random() * 140;
        return {
          startX: p.x + Math.cos(angle) * radius,
          startY: p.y + Math.sin(angle) * radius,
          targetX: p.x,
          targetY: p.y,
          group: p.group,
        };
      });
    }

    build();
    document.fonts.ready.then(() => !cancelled && build());

    const resizeObserver = new ResizeObserver(() => build());
    resizeObserver.observe(container);

    let raf = 0;
    function draw() {
      const particles = particlesRef.current;
      const dpr = dprRef.current;
      const width = canvas!.width / dpr;
      const height = canvas!.height / dpr;
      ctx!.save();
      ctx!.scale(dpr, dpr);
      ctx!.clearRect(0, 0, width, height);

      const numGroups = lines.length;
      const p = progressRef.current;
      for (const particle of particles) {
        const groupDelay = numGroups > 1 ? (particle.group / numGroups) * 0.35 : 0;
        const span = 1 - groupDelay;
        const local = Math.min(1, Math.max(0, span > 0 ? (p - groupDelay) / span : p));
        const eased = 1 - Math.pow(1 - local, 3);

        const x = particle.startX + (particle.targetX - particle.startX) * eased;
        const y = particle.startY + (particle.targetY - particle.startY) * eased;
        const size = 0.6 + (1 - eased) * 1.6;
        if (eased > 0.01) {
          ctx!.fillStyle = `rgba(${DOT}, ${eased})`;
          ctx!.fillRect(x - size / 2, y - size / 2, size, size);
        }
      }
      ctx!.restore();
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
    };
  }, [lines]);

  useImperativeHandle(ref, () => ({
    setProgress(p: number) {
      progressRef.current = p;
    },
  }));

  return (
    <div ref={containerRef} className={className}>
      <canvas ref={canvasRef} />
      <span className="sr-only">{lines.join(" ")}</span>
    </div>
  );
});
