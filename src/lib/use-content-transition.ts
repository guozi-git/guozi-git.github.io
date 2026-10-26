'use client';
import { useLayoutEffect, useRef, type RefObject } from 'react';
import { reducedMotion } from './motion';

// The panel owns first entry; only late content and subsequent inner navigation fade.
export function useContentTransition(
  ref: RefObject<HTMLDivElement | null>,
  view: string | boolean,
  duration = 175,
  easing = 'ease-out',
) {
  const previous = useRef<string | boolean | undefined>(undefined);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || previous.current === view) return;
    const first = previous.current === undefined;
    previous.current = view;
    if (reducedMotion()) return;
    let animation: Animation | undefined;
    let frame: number | undefined;
    const opacity = element.style.opacity;
    const start = (late: boolean) => {
      animation = element.animate(
        late
          ? [{ opacity: 0 }, { opacity: 1 }]
          : [
              { opacity: 0, transform: 'translateY(12px)' },
              { opacity: 1, transform: 'none' },
            ],
        { duration, easing },
      );
    };
    if (first) {
      // flushSync can mount us before the enclosing panel starts its animation.
      element.style.opacity = '0';
      frame = requestAnimationFrame(() => {
        element.style.opacity = opacity;
        const opening = element
          .closest('.detail')
          ?.getAnimations()
          .some((a) => a.playState === 'running');
        if (!opening && !reducedMotion()) start(true);
      });
    } else start(false);
    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      element.style.opacity = opacity;
      animation?.cancel();
    };
  }, [ref, view, duration, easing]);
}
