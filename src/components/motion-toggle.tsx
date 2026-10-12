'use client';
import { useEffect, useState } from 'react';
export function MotionToggle() {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    document.documentElement.dataset.motion = enabled ? 'full' : 'reduced';
    window.dispatchEvent(new Event('site-motion-change'));
  }, [enabled]);
  function toggle() {
    setEnabled((value) => !value);
  }
  return (
    <button
      className="motion-toggle"
      type="button"
      aria-pressed={enabled}
      onClick={toggle}
      aria-label="动态效果"
    >
      <span>动态</span>
      <span className="motion-toggle-track" aria-hidden="true">
        <span />
      </span>
    </button>
  );
}
