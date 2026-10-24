'use client';
import { useEffect, useRef, useState, type RefObject } from 'react';

/** Reuse the original return action so nested history and focus behavior remain intact. */
export function ReadingNavigation({
  panelRef,
  onHome,
}: {
  panelRef: RefObject<HTMLElement | null>;
  onHome: () => void;
}) {
  const [label, setLabel] = useState<string | null>(null);
  const targetRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const update = () => {
      const target = [
        '[data-inner-back]',
        '.paper-back:not(.game-bottom-back)',
        '[data-gateway-back]',
      ]
        .flatMap((selector) => Array.from(panel.querySelectorAll<HTMLButtonElement>(selector)))
        .find((button) => button.getClientRects().length > 0);
      targetRef.current = target ?? null;
      const hidden =
        panel.scrollTop > 180 &&
        (!target || target.getBoundingClientRect().bottom < panel.getBoundingClientRect().top);
      setLabel(hidden ? target?.textContent?.trim() || '' : null);
    };
    panel.addEventListener('scroll', update, { passive: true });
    const observer = new MutationObserver(update);
    observer.observe(panel, { childList: true, subtree: true });
    update();
    return () => {
      panel.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [panelRef]);
  return (
    <div className="reading-navigation-anchor">
      {label !== null && (
        <nav className="reading-navigation" aria-label="阅读导航">
          {label && <button onClick={() => targetRef.current?.click()}>{label}</button>}
          <button onClick={onHome}>回首页</button>
        </nav>
      )}
    </div>
  );
}
