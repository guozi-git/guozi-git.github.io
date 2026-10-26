'use client';
import { markSiteReady } from '@/lib/site-ready';
import { useEffect, useId, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { SectionLoading } from './section-loading';
import { SectionErrorBoundary } from './section-error-boundary';
import { FactoryParticles } from './factory-particles';
import { assetPath } from '@/lib/asset-path';
import s from './factory-gateway.module.css';
const loadAtelier = () => import('./atelier-archive');
const loadWorkshop = () => import('./factory-preview');
const AtelierArchive = dynamic(() => loadAtelier().then((m) => m.AtelierArchive), {
  loading: () => <SectionLoading name="匠心造" />,
});
const FactoryPreview = dynamic(() => loadWorkshop().then((m) => m.FactoryPreview), {
  loading: () => <SectionLoading name="小作坊" />,
});
function prepareRoom(room: 'atelier' | 'workshop') {
  void (room === 'atelier' ? loadAtelier() : loadWorkshop()).catch(() => undefined);
}
type View = 'gate' | 'atelier' | 'workshop';
function readView(): View {
  const part = window.location.hash.split('/')[1];
  return !part ? 'gate' : part === 'atelier' ? 'atelier' : 'workshop';
}
export function FactoryGateway({ embedded = false }: { embedded?: boolean }) {
  useEffect(markSiteReady, []);
  const clipId = useId().replace(/:/g, '');
  const [view, setView] = useState<View>('gate');
  const root = useRef<HTMLDivElement>(null);
  const previous = useRef<View>('gate');
  useEffect(() => {
    if (view === 'gate') document.title = '论文工厂 · 果子';
  }, [view]);
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
    // The workshop restores its own list position after its lazy module mounts.
    if (panel && view !== 'workshop') panel.scrollTop = 0;
    const focusTarget = () => {
      const target = root.current?.querySelector<HTMLElement>(
        view === 'gate' ? `[data-door="${last}"]` : '[data-gateway-back]',
      );
      target?.focus({ preventScroll: true });
      return !!target;
    };
    if (focusTarget() || !root.current) return;
    root.current.focus({ preventScroll: true });
    // The atelier's return control arrives with its lazy module.
    const observer = new MutationObserver(() => {
      if (document.activeElement !== root.current) observer.disconnect();
      else if (focusTarget()) observer.disconnect();
    });
    observer.observe(root.current, { childList: true, subtree: true });
    return () => observer.disconnect();
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
      tabIndex={-1}
      data-factory-view={view}
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
        <a className={s.homeBack} href={assetPath('/')} aria-label="Home">
          Home
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
            onPointerEnter={() => prepareRoom('atelier')}
            onFocus={() => prepareRoom('atelier')}
            onPointerDown={() => prepareRoom('atelier')}
            className={`${s.door} ${s.atelierDoor}`}
            style={{ clipPath: `url(#${clipId}-left)` }}
            onClick={() => enter('atelier')}
          >
            <h3 aria-label="匠心造">
              {Array.from('匠心造').map((character) => (
                <span key={character} aria-hidden="true">
                  {character}
                </span>
              ))}
            </h3>
          </button>
          <button
            data-door="workshop"
            onPointerEnter={() => prepareRoom('workshop')}
            onFocus={() => prepareRoom('workshop')}
            onPointerDown={() => prepareRoom('workshop')}
            className={`${s.door} ${s.workshopDoor}`}
            style={{ clipPath: `url(#${clipId}-right)` }}
            onClick={() => enter('workshop')}
          >
            <h3 aria-label="小作坊">
              {Array.from('小作坊').map((character) => (
                <span key={character} aria-hidden="true">
                  {character}
                </span>
              ))}
            </h3>
          </button>
          <div className={s.particleVeil}>
            <FactoryParticles mode="divider" />
          </div>
        </div>
      ) : view === 'atelier' ? (
        <SectionErrorBoundary name="匠心造" onBack={back}>
          <AtelierArchive onBack={back} />
        </SectionErrorBoundary>
      ) : (
        <div className={s.workshop}>
          <div className={s.workshopNav}>
            <button
              data-gateway-back
              className={s.innerBack}
              aria-label="返回上一级"
              onClick={back}
            >
              ‹ 返回上一级
            </button>
          </div>
          <SectionErrorBoundary name="小作坊" onBack={back}>
            <FactoryPreview embedded />
          </SectionErrorBoundary>
        </div>
      )}
    </div>
  );
}
