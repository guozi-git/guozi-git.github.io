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
    const resize = new ResizeObserver(() => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const dpr = Math.min(devicePixelRatio || 1, 2);
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
      if (mode === 'star') drawStarField();
      const count = mode === 'divider' ? 120 : 50;
      for (let i = 0; i < count; i++) {
        const seed = (i * 0.61803398875) % 1;
        const t = (seed + time * (mode === 'divider' ? 0.035 : 0.024)) % 1;
        const lane =
          mode === 'divider' ? Math.sin(i * 72.7 + time * 0.5) * (8 + (i % 7) * 3) : i % 2;
        const p = point(t, lane);
        const alpha = (0.2 + (i % 5) * 0.12) * Math.sin(Math.PI * t);
        context!.fillStyle = i % 3 ? `rgba(199,182,255,${alpha})` : `rgba(255,229,190,${alpha})`;
        context!.shadowColor = i % 3 ? '#b29aff' : '#fbe0af';
        context!.shadowBlur = i % 7 === 0 ? 12 : 3;
        context!.beginPath();
        context!.arc(p.x, p.y, i % 9 === 0 ? 1.9 : 0.65, 0, Math.PI * 2);
        context!.fill();
      }
      for (let i = 0; i < (mode === 'star' ? 0 : 4); i++) {
        const head = (i * 0.25 + time * 0.045) % 1;
        for (let j = 0; j < 36; j++) {
          const t = (head - j * 0.0018 + 1) % 1;
          const p = point(t, mode === 'star' ? i % 2 : Math.sin(i) * 3);
          context!.fillStyle = `rgba(${i % 2 ? '246,221,188' : '208,193,255'},${(1 - j / 36) * 0.7})`;
          context!.shadowBlur = j === 0 ? 18 : 5;
          context!.beginPath();
          context!.arc(p.x, p.y, j === 0 ? 2.1 : 1, 0, Math.PI * 2);
          context!.fill();
        }
      }
      context!.shadowBlur = 0;
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
      if (last && !document.hidden) time += Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!document.hidden) draw();
      frame = requestAnimationFrame(tick);
    }
    function start() {
      cancelAnimationFrame(frame);
      last = 0;
      draw();
      if (!reducedMotion()) frame = requestAnimationFrame(tick);
    }
    resize.observe(canvas);
    window.addEventListener('site-motion-change', start);
    start();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener('site-motion-change', start);
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
