'use client';
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { FactoryPreview } from './factory-preview';
import { FactoryParticles } from './factory-particles';
import { assetPath } from '@/lib/asset-path';
import s from './factory-gateway.module.css';
type View = 'gate' | 'atelier' | 'workshop';
function readView(): View {
  const part = window.location.hash.split('/')[1];
  return !part ? 'gate' : part === 'atelier' ? 'atelier' : 'workshop';
}
export function FactoryGateway({ embedded = false }: { embedded?: boolean }) {
  const clipId = useId().replace(/:/g, '');
  const [view, setView] = useState<View>('gate');
  const root = useRef<HTMLDivElement>(null);
  const previous = useRef<View>('gate');
  useEffect(() => {
    const sync = () => setView(readView());
    const initial = window.setTimeout(sync, 0);
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      clearTimeout(initial);
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);
  useEffect(() => {
    if (previous.current === view) return;
    const last = previous.current;
    previous.current = view;
    const panel = root.current?.closest('.detail');
    if (panel) panel.scrollTop = 0;
    root.current
      ?.querySelector<HTMLElement>(
        view === 'gate' ? `[data-door="${last}"]` : '[data-gateway-back]',
      )
      ?.focus({ preventScroll: true });
  }, [view]);
  function enter(next: View) {
    window.history.pushState(
      { ...window.history.state, factoryDepth: 1, factoryGateway: true },
      '',
      `#factory/${next}`,
    );
    setView(next);
  }
  function back() {
    if (window.history.state?.factoryGateway && !window.history.state?.factoryDetail)
      window.history.back();
    else {
      window.history.replaceState(null, '', '#factory');
      setView('gate');
    }
  }
  return (
    <div
      ref={root}
      className={`${s.root} ${view === 'atelier' ? s.goldRoom : ''}`}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && view !== 'gate') {
          e.preventDefault();
          e.stopPropagation();
          back();
        }
      }}
    >
      {!embedded && (
        <a className={s.homeBack} href={assetPath('/')} aria-label="返回个人空间">
          ‹
        </a>
      )}
      {view === 'gate' ? (
        <div className={s.gateway}>
          <svg width="0" height="0" aria-hidden="true">
            <defs>
              <clipPath id={`${clipId}-left`} clipPathUnits="objectBoundingBox">
                <path d="M0 0H.59C.15 .333 .87 .667 .43 1H0Z" />
              </clipPath>
              <clipPath id={`${clipId}-right`} clipPathUnits="objectBoundingBox">
                <path d="M.59 0H1V1H.43C.87 .667 .15 .333 .59 0Z" />
              </clipPath>
            </defs>
          </svg>
          <button
            data-door="atelier"
            className={`${s.door} ${s.atelierDoor}`}
            style={{ clipPath: `url(#${clipId}-left)` }}
            onClick={() => enter('atelier')}
          >
            <h3>匠心造</h3>
          </button>
          <button
            data-door="workshop"
            className={`${s.door} ${s.workshopDoor}`}
            style={{ clipPath: `url(#${clipId}-right)` }}
            onClick={() => enter('workshop')}
          >
            <h3>小作坊</h3>
          </button>
          <div className={s.particleVeil}>
            <FactoryParticles mode="divider" />
          </div>
        </div>
      ) : view === 'atelier' ? (
        <section className={s.atelier} aria-label="六篇精选论文展厅">
          <button data-gateway-back className={s.innerBack} aria-label="返回入口" onClick={back}>
            ‹
          </button>
          <div className={s.constellation}>
            <div className={s.nebula} aria-hidden="true" />
            <svg
              className={s.starMap}
              viewBox="0 0 800 680"
              preserveAspectRatio="none"
              fill="none"
              aria-hidden="true"
            >
              <path d="M400 68 648 476H152ZM648 204 400 612 152 204Z" />
            </svg>
            <FactoryParticles mode="star" />
            {['01', '02', '03', '04', '05', '06'].map((number, index) => (
              <article
                key={number}
                className={s.paperSlot}
                style={{ '--slot': index } as CSSProperties}
                aria-label={`精选论文展位 ${index + 1}，待呈现`}
              >
                <div className={s.cover} aria-hidden="true">
                  <span className={s.coverOrbit} />
                  <span className={s.coverLight} />
                  <span className={s.coverNumber}>{number}</span>
                </div>
                <div className={s.paperCopy}>
                  <span>{number}</span>
                  <h3>待呈现</h3>
                  <span className={s.dot} />
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <div className={s.workshop}>
          <div className={s.workshopNav}>
            <button data-gateway-back className={s.innerBack} aria-label="返回入口" onClick={back}>
              ‹
            </button>
            <span>小作坊 / AI4math</span>
          </div>
          <FactoryPreview embedded />
        </div>
      )}
    </div>
  );
}
