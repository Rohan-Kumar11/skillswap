// app/components/Galaxy.js
"use client";

import { useEffect, useRef } from "react";

/**
 * Lightweight animated starfield + soft nebulas canvas.
 * - No external libs
 * - High-DPI aware
 * - Mouse parallax
 */
export default function Galaxy({ className = "" }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const stateRef = useRef({
    width: 0,
    height: 0,
    dpr: 1,
    mouseX: 0,
    mouseY: 0,
    stars: [],
    blobs: [],
    time: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    let running = true;

    function resize() {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stateRef.current.width = rect.width;
      stateRef.current.height = rect.height;
      stateRef.current.dpr = dpr;
      initScene();
    }

    function initScene() {
      const { width, height } = stateRef.current;
      // stars
      const stars = [];
      const count = Math.max(60, Math.floor((width * height) / 12000)); // scale with screen
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.3 + 0.2,
          // twinkle offset
          t: Math.random() * Math.PI * 2,
          speed: 0.02 + Math.random() * 0.08,
          hue: 200 + Math.random() * 60,
          alpha: 0.2 + Math.random() * 0.9,
        });
      }

      // blobs (soft nebula shapes)
      const blobs = [];
      const blobCount = Math.max(2, Math.floor(width / 800));
      for (let i = 0; i < blobCount; i++) {
        blobs.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.max(width, height) * (0.18 + Math.random() * 0.25),
          hue: 200 + Math.random() * 80,
          alpha: 0.06 + Math.random() * 0.12,
          vx: (Math.random() - 0.5) * 0.05,
          vy: (Math.random() - 0.5) * 0.05,
        });
      }

      stateRef.current.stars = stars;
      stateRef.current.blobs = blobs;
    }

    function onMouse(e) {
      const rect = canvas.getBoundingClientRect();
      stateRef.current.mouseX = (e.clientX - rect.left) / rect.width - 0.5;
      stateRef.current.mouseY = (e.clientY - rect.top) / rect.height - 0.5;
    }

    function draw(t) {
      if (!running) return;
      rafRef.current = requestAnimationFrame(draw);

      const s = stateRef.current;
      s.time = t * 0.001;

      const w = s.width;
      const h = s.height;

      // Background fill (dark with slight vignette)
      ctx.clearRect(0, 0, w, h);
      const gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, "#05060a");
      gradient.addColorStop(1, "#0b0c10");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      // Nebula / blobs
      for (let i = 0; i < s.blobs.length; i++) {
        const b = s.blobs[i];
        // move slowly
        b.x += b.vx;
        b.y += b.vy;
        // wrap
        if (b.x < -b.r) b.x = w + b.r;
        if (b.x > w + b.r) b.x = -b.r;
        if (b.y < -b.r) b.y = h + b.r;
        if (b.y > h + b.r) b.y = -b.r;

        const px = b.x + s.mouseX * 120 * (i + 1) * 0.08;
        const py = b.y + s.mouseY * 120 * (i + 1) * 0.08;
        const g = ctx.createRadialGradient(px, py, 0, px, py, b.r);
        // subtle blue/purple nebula
        g.addColorStop(0, `hsla(${b.hue}, 70%, 60%, ${b.alpha})`);
        g.addColorStop(0.35, `hsla(${b.hue}, 70%, 50%, ${b.alpha * 0.6})`);
        g.addColorStop(1, `hsla(${b.hue}, 70%, 30%, 0)`);
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, b.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "lighter";

      // Stars
      for (let i = 0; i < s.stars.length; i++) {
        const star = s.stars[i];
        // twinkle
        const tw = Math.sin(t * 0.002 * (1 + star.speed * 16) + star.t);
        const alpha = Math.max(0.1, star.alpha * (0.6 + tw * 0.4));
        // parallax offset based on mouse
        const ox = s.mouseX * 120 * (star.r / 2);
        const oy = s.mouseY * 80 * (star.r / 2);

        ctx.beginPath();
        if (star.r < 0.8) {
          // sharp small star
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.fillRect(star.x + ox, star.y + oy, 1.2 * star.r, 1.2 * star.r);
        } else {
          // soft larger star with glow
          const rg = ctx.createRadialGradient(star.x + ox, star.y + oy, 0, star.x + ox, star.y + oy, star.r * 6);
          rg.addColorStop(0, `rgba(255,255,255,${alpha})`);
          rg.addColorStop(0.2, `rgba(180,200,255,${alpha * 0.6})`);
          rg.addColorStop(0.6, `rgba(100,140,255,${alpha * 0.15})`);
          rg.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = rg;
          ctx.arc(star.x + ox, star.y + oy, star.r * 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Faint vignette + overlay lines for depth
      ctx.globalCompositeOperation = "source-over";
      const vignette = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 1.1);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.35)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);
    }

    // event listeners
    function handleMove(e) {
      onMouse(e);
    }
    function handleTouch(e) {
      if (e.touches && e.touches[0]) {
        onMouse(e.touches[0]);
      }
    }
    function onMouse(ev) {
      const rect = canvas.getBoundingClientRect();
      stateRef.current.mouseX = (ev.clientX - rect.left) / rect.width - 0.5;
      stateRef.current.mouseY = (ev.clientY - rect.top) / rect.height - 0.5;
    }

    // setup listeners
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleTouch, { passive: true });

    // initial sizing and start
    resize();
    rafRef.current = requestAnimationFrame(draw);

    // cleanup
    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleTouch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // render canvas as absolutely positioned background
  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none inset-0 absolute w-full h-full ${className || ""}`}
      aria-hidden="true"
    />
  );
}
