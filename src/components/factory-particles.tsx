'use client';
import { reducedMotion } from '@/lib/motion';
import { useEffect, useRef } from 'react';

export function FactoryParticles({ mode }: { mode: 'divider' | 'star' }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    let frame = 0;
    let width = 0;
    let height = 0;
    let time = 0;
    let last = 0;
    let visible = true;
    let generation = 0;
    const lanes = Array.from({ length: 1500 }, (_, i) => {
      const seed = Math.sin(i * 127.1 + 31.7) * 43758.5453;
      const lane = (seed - Math.floor(seed)) * 2 - 1;
      return Math.sign(lane) * lane * lane;
    });
    // Reuse constants and full-opacity paint strings; keep the original order and blending.
    const divider = lanes.map((lane, i) => {
      const alpha = 0.24 + (i % 7) * 0.085;
      const color = i % 4 ? '212,207,243' : '245,224,188';
      return {
        lane,
        seed: i * 0.61803398875,
        speed: 0.009 + (i % 5) * 0.0008,
        radius: i % 23 === 0 ? 1 : 0.45 + (i % 3) * 0.12,
        alpha,
        color,
        paint: `rgba(${color},${alpha})`,
      };
    });
    const resize = new ResizeObserver(() => {
      // Layout dimensions stay sharp while the parent expands with a CSS transform.
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const dpr = Math.min(devicePixelRatio || 1, 3);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    });
    function point(t: number, lane = 0) {
      if (mode === 'divider') {
        const u = 1 - t;
        return {
          x:
            (u * u * u * 0.59 + 3 * u * u * t * 0.15 + 3 * u * t * t * 0.87 + t * t * t * 0.43) *
              width +
            lane,
          y: t * height,
        };
      }
      const vertices =
        lane === 0
          ? [
              [0.5, 0.1],
              [0.81, 0.7],
              [0.19, 0.7],
            ]
          : [
              [0.81, 0.3],
              [0.5, 0.9],
              [0.19, 0.3],
            ];
      const edge = t * 3;
      const index = Math.floor(edge) % 3;
      const mix = edge % 1;
      const a = vertices[index],
        b = vertices[(index + 1) % 3];
      return { x: (a[0] + (b[0] - a[0]) * mix) * width, y: (a[1] + (b[1] - a[1]) * mix) * height };
    }
    function draw() {
      context!.clearRect(0, 0, width, height);
      context!.globalCompositeOperation = 'lighter';
      if (mode === 'divider') {
        drawDivider();
        return;
      }
      if (mode === 'star') drawStarField();
      const count = 50;
      for (let i = 0; i < count; i++) {
        const t = (((i * 0.61803398875) % 1) + time * 0.024) % 1;
        const p = point(t, i % 2);
        const alpha = (0.2 + (i % 5) * 0.12) * Math.sin(Math.PI * t);
        context!.fillStyle = i % 3 ? `rgba(199,182,255,${alpha})` : `rgba(255,229,190,${alpha})`;
        context!.shadowColor = i % 3 ? '#b29aff' : '#fbe0af';
        context!.shadowBlur = i % 7 === 0 ? 12 : 3;
        context!.beginPath();
        context!.arc(p.x, p.y, i % 9 === 0 ? 1.9 : 0.65, 0, Math.PI * 2);
        context!.fill();
      }
      context!.shadowBlur = 0;
    }
    function drawDivider() {
      const ctx = context!;
      const compact = width < 600;
      const count = compact ? 900 : 1500;
      const spread = compact ? 13 : 22;
      ctx.shadowBlur = 0;
      for (let i = 0; i < count; i++) {
        const particle = divider[i];
        const t = (particle.seed + time * particle.speed) % 1;
        // Concentrate crisp stars around the curve, with a sparse outer fringe.
        const offset = particle.lane * spread + Math.sin(t * 18 + time * 0.2) * 2;
        const u = 1 - t;
        const x =
          (u * u * u * 0.59 + 3 * u * u * t * 0.15 + 3 * u * t * t * 0.87 + t * t * t * 0.43) *
            width +
          offset;
        const fade = Math.min(1, t * 18, (1 - t) * 18);
        ctx.fillStyle =
          fade === 1 ? particle.paint : `rgba(${particle.color},${particle.alpha * fade})`;
        ctx.beginPath();
        ctx.arc(x, t * height, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      // Thin tapered strokes avoid the overexposed blobs of overlapping glowing circles.
      for (let i = 0; i < 3; i++) {
        const head = (i / 3 + time * 0.037) % 1;
        const length = Math.min(0.035, 26 / Math.max(height, 1));
        for (let j = 24; j > 0; j--) {
          const t = head - (j / 24) * length;
          if (t < 0) continue;
          const a = point(t),
            b = point(head - ((j - 1) / 24) * length);
          const intensity = 1 - j / 25;
          ctx.strokeStyle = `rgba(${i % 2 ? '241,222,190' : '209,198,245'},${intensity * 0.62})`;
          ctx.lineWidth = 0.35 + intensity * 0.65;
          ctx.shadowColor = i % 2 ? '#e3cda9' : '#c4b6ed';
          ctx.shadowBlur = 2 * intensity;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
        const p = point(head);
        ctx.shadowBlur = 3;
        ctx.fillStyle = '#f2ebff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, compact ? 0.85 : 1.05, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }
    function drawStarField() {
      const ctx = context!;
      ctx.shadowBlur = 0;
      // A quiet star field underneath the moving triangular light paths.
      for (let i = 0; i < 48; i++) {
        const x = ((i * 0.6180339) % 1) * width;
        const y = ((i * 0.4142135 + 0.13) % 1) * height;
        ctx.fillStyle = `rgba(204,190,237,${0.12 + 0.14 * (1 + Math.sin(time * 0.7 + i))})`;
        ctx.beginPath();
        ctx.arc(x, y, i % 9 === 0 ? 1.2 : 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let lane = 0; lane < 2; lane++) {
        for (let beam = 0; beam < 2; beam++) {
          const direction = lane === 0 ? 1 : -1;
          const head = (((beam * 0.5 + direction * time * 0.085) % 1) + 1) % 1;
          const p = point(head, lane);
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, width * 0.13);
          glow.addColorStop(0, lane ? '#e6c99823' : '#b696ff30');
          glow.addColorStop(1, '#b696ff00');
          ctx.fillStyle = glow;
          ctx.fillRect(0, 0, width, height);
          for (let j = 60; j > 0; j--) {
            const a = point((head - direction * j * 0.0024 + 1) % 1, lane);
            const b = point((head - direction * (j - 1) * 0.0024 + 1) % 1, lane);
            const intensity = 1 - j / 61;
            ctx.strokeStyle = `rgba(${lane ? '246,224,191' : '206,184,255'},${intensity * 0.8})`;
            ctx.lineWidth = 1.6;
            ctx.shadowColor = lane ? '#f1d5a0' : '#b58cff';
            ctx.shadowBlur = 12 * intensity;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
          ctx.fillStyle = '#f8efff';
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // One brief meteor every 7.5 seconds, with a different starting position.
      const cycle = Math.floor(time / 7.5);
      const phase = (time % 7.5) - 2;
      if (!reducedMotion() && phase >= 0 && phase < 1.35) {
        const progress = phase / 1.35;
        const x = (0.1 + (cycle % 3) * 0.14 + progress * 0.67) * width;
        const y = (0.02 + (cycle % 2) * 0.19 + progress * 0.42) * height;
        const tailX = x - width * 0.19,
          tailY = y - height * 0.12;
        const opacity = Math.sin(progress * Math.PI);
        const tail = ctx.createLinearGradient(tailX, tailY, x, y);
        tail.addColorStop(0, '#b7a0ff00');
        tail.addColorStop(0.75, `rgba(199,177,255,${opacity * 0.5})`);
        tail.addColorStop(1, `rgba(255,247,231,${opacity})`);
        ctx.strokeStyle = tail;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#cdb2ff';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.fillStyle = `rgba(255,250,240,${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }
    function tick(now: number) {
      if (document.hidden || !visible || reducedMotion()) return;
      if (last && !document.hidden) time += Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!document.hidden) draw();
      frame = requestAnimationFrame(tick);
    }
    function start() {
      const current = ++generation;
      cancelAnimationFrame(frame);
      last = 0;
      draw();
      if (reducedMotion() || document.hidden || !visible) return;
      // Keep a sharp still frame during the panel transform; animate only once it settles.
      frame = requestAnimationFrame(() => {
        const animations = canvas?.closest('.detail')?.getAnimations() ?? [];
        void Promise.all(
          animations.map((animation) => animation.finished.catch(() => undefined)),
        ).then(() => {
          if (current === generation && !document.hidden && visible && !reducedMotion())
            frame = requestAnimationFrame(tick);
        });
      });
    }
    const visibility = new IntersectionObserver(([entry]) => {
      if (visible === entry.isIntersecting) return;
      visible = entry.isIntersecting;
      start();
    });
    visibility.observe(canvas);
    resize.observe(canvas);
    window.addEventListener('site-motion-change', start);
    window.addEventListener('site-transition-start', start);
    document.addEventListener('visibilitychange', start);
    start();
    return () => {
      generation++;
      cancelAnimationFrame(frame);
      visibility.disconnect();
      resize.disconnect();
      window.removeEventListener('site-motion-change', start);
      window.removeEventListener('site-transition-start', start);
      document.removeEventListener('visibilitychange', start);
    };
  }, [mode]);
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      data-particles={mode}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
}
