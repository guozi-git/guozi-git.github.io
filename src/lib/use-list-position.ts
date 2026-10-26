'use client';
import { useLayoutEffect, type RefObject } from 'react';

// Page-lifetime memory only: a refresh starts a new reading session.
const positions = new Map<string, number>();
export function useListPosition(
  ref: RefObject<HTMLDivElement | null>,
  key: string,
  active: boolean,
) {
  useLayoutEffect(() => {
    if (!active) return;
    const route = window.location.hash;
    const listRoute = key === 'workshop' ? '#factory/workshop' : `#${key}`;
    // A popstate can briefly render the old list while its panel is closing.
    if (route !== listRoute) return;
    const panel = ref.current?.closest<HTMLElement>('.detail');
    if (!panel) return;
    const top = positions.get(key) ?? 0;
    let restoring = true;
    panel.scrollTop = top;
    const frame = requestAnimationFrame(() => {
      panel.scrollTop = top;
      restoring = false;
    });
    const save = () => {
      // Closing transforms/browser anchoring can scroll the old DOM after navigation.
      if (!restoring && window.location.hash === route) positions.set(key, panel.scrollTop);
    };
    panel.addEventListener('scroll', save, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      panel.removeEventListener('scroll', save);
      // DOM removal may already have clamped scrollTop; retain the last scroll event.
    };
  }, [ref, key, active]);
}
