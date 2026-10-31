"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  twinkle: number;
}

interface ParticleEffectProps {
  density?: number;
  colors?: string[];
  className?: string;
  reduced?: boolean;
}

const DARK_COLORS = ["#ffffff", "#c9c9d1", "#9a9aa5"];
const LIGHT_COLORS = ["#8a7a55", "#a8946a", "#6f6349"];
const DEFAULT_COLORS = DARK_COLORS;

export function ParticleEffect({
  density = 36,
  colors = DEFAULT_COLORS,
  className,
  reduced = false,
}: ParticleEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const count = reduced ? Math.floor(density / 3) : density;

    // رنگ ذرات تابع تم است: سفید در حالت تیره، خاکستری-طلایی محو در حالت روشن
    function palette(): string[] {
      if (colors !== DEFAULT_COLORS) return colors;
      return document.documentElement.classList.contains("dark")
        ? DARK_COLORS
        : LIGHT_COLORS;
    }

    function resize() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, rect.width * dpr);
      canvas.height = Math.max(1, rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initParticles() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      particlesRef.current = Array.from({ length: count }).map(() => ({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        r: Math.random() * 3 + 1,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.5 - 0.1,
        color: palette()[Math.floor(Math.random() * palette().length)],
        alpha: Math.random() * 0.6 + 0.2,
        twinkle: Math.random() * Math.PI * 2,
      }));
    }

    function tick() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.twinkle += 0.04;

        // wrap
        if (p.y < -10) p.y = rect.height + 10;
        if (p.x < -10) p.x = rect.width + 10;
        if (p.x > rect.width + 10) p.x = -10;

        const tw = (Math.sin(p.twinkle) + 1) / 2;
        const a = p.alpha * (0.5 + tw * 0.5);
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (1 + tw * 0.4), 0, Math.PI * 2);
        ctx.fill();

        // subtle soft edge (no colored halo)
        ctx.globalAlpha = a * 0.12;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(tick);
    }

    resize();
    initParticles();
    if (!reduced) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      // static draw
      tick();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }

    const onResize = () => {
      resize();
      initParticles();
    };
    window.addEventListener("resize", onResize);

    // تم که عوض شود، رنگ ذرات هم هم‌رنگ همان تم می‌شود
    const themeObserver = new MutationObserver(() => initParticles());
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      window.removeEventListener("resize", onResize);
      themeObserver.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [density, colors, reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className ?? ""}`}
    />
  );
}
