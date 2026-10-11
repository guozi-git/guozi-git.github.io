'use client';
import { useEffect, useState } from 'react';
export function MotionToggle() {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    let value = true;
    try {
      value = localStorage.getItem('guozi-motion') !== 'reduced';
    } catch {
      /* Storage may be unavailable in private browsing. */
    }
    document.documentElement.dataset.motion = value ? 'full' : 'reduced';
    window.dispatchEvent(new Event('site-motion-change'));
    const timer = setTimeout(() => setEnabled(value), 0);
    return () => clearTimeout(timer);
  }, []);
  function toggle() {
    const next = !enabled;
    setEnabled(next);
    document.documentElement.dataset.motion = next ? 'full' : 'reduced';
    try {
      localStorage.setItem('guozi-motion', next ? 'full' : 'reduced');
    } catch {
      /* Storage may be unavailable in private browsing. */
    }
    window.dispatchEvent(new Event('site-motion-change'));
  }
  return (
    <button
      className="motion-toggle"
      type="button"
      aria-pressed={enabled}
      onClick={toggle}
      aria-label="动态效果"
    >
      动态效果 · {enabled ? '开' : '关'}
    </button>
  );
}
