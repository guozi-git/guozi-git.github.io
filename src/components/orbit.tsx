'use client';
import { markSiteReady } from '@/lib/site-ready';
import { reducedMotion } from '@/lib/motion';

import { assetPath } from '@/lib/asset-path';

import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import Image from 'next/image';
import { profile } from '@/lib/profile';
import dynamic from 'next/dynamic';
import earth from '../../public/scenes/photos/nasa-earth.webp';
import { ReadingNavigation } from './reading-navigation';
import { SectionLoading } from './section-loading';
import { SectionErrorBoundary } from './section-error-boundary';
import { scheduleIdlePreload } from '@/lib/idle-preload';
import factoryStyles from './factory-shell.module.css';
const loadPublications = () => import('@/components/publications');
const loadInterests = () => import('@/components/interests');
const loadProjects = () => import('@/components/projects');
const loadFactory = () => import('@/components/factory-gateway');
// Keep each loading boundary inside the dialog so its opening geometry is committed immediately.

const Publications = dynamic(() => loadPublications().then((m) => m.Publications), {
  loading: () => <SectionLoading name="论文发表" />,
});
const Interests = dynamic(() => loadInterests().then((m) => m.Interests), {
  loading: () => <SectionLoading name="兴趣爱好" />,
});
const Projects = dynamic(() => loadProjects().then((m) => m.Projects), {
  loading: () => <SectionLoading name="兴趣造物" />,
});
const FactoryPreview = dynamic(() => loadFactory().then((m) => m.FactoryGateway), {
  loading: () => <SectionLoading name="论文工厂" factory />,
});
function prepareSection(id: string) {
  const load = {
    publications: loadPublications,
    interests: loadInterests,
    projects: loadProjects,
    factory: loadFactory,
  }[id];
  if (load) void load().catch(() => undefined);
}

const sections = [
  {
    id: 'interests',
    title: '兴趣爱好',
    english: 'INTERESTS',
    number: '01',
    subtitle: '好奇心的去处',
    note: '这里将收集你喜欢的事物，以及与它们有关的故事。',
    items: ['喜欢的事物', '片段与记录', '值得分享的发现'],
  },
  {
    id: 'publications',
    title: '论文发表',
    english: 'PUBLICATIONS',
    number: '02',
    subtitle: '思考留下的痕迹',
    note: '这里将介绍真实发表的论文、研究问题和相关链接。',
    items: ['论文信息', '研究问题与贡献', '原文与相关资源'],
  },
  {
    id: 'projects',
    title: '兴趣造物',
    english: 'PROJECTS',
    number: '03',
    subtitle: '把想法变成实物',
    note: '这里将展示出于兴趣制作的工具、装置和其他小作品。',
    items: ['作品与演示', '制作的起点', '过程与进展'],
  },
  {
    id: 'factory',
    title: '论文工厂',
    english: 'PAPER FACTORY',
    number: '04',
    subtitle: 'AI4math',
    note: '这里将容纳不定期的文章、想法和短记录。',
    items: ['长一点的文章', '短一点的想法', '最近的记录'],
  },
  {
    id: 'about',
    title: profile.nickname,
    english: 'HELLO, THERE',
    number: '00',
    subtitle: '关于我',
    note: profile.introduction,
    items: [],
  },
];

function getSection() {
  return (
    sections.find((section) => `#${section.id}` === window.location.hash.split('/')[0]) ?? null
  );
}

export function Orbit() {
  useEffect(markSiteReady, []);
  const [active, setActive] = useState<(typeof sections)[number] | null>(null);
  useEffect(() => {
    if (!active) return scheduleIdlePreload(loadFactory, () => !window.location.hash);
  }, [active]);
  useEffect(() => {
    if (
      active?.id !== 'factory' &&
      !(active?.id === 'publications' && window.location.hash.includes('/'))
    )
      document.title = active ? `${active.title} · 果子` : '果子 · 个人网站';
  }, [active]);
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const busyRef = useRef(false);
  const pendingCloseRef = useRef(false);
  const pushedRef = useRef(false);
  const activeRef = useRef<typeof active>(null);
  const animationsRef = useRef<Animation[]>([]);
  const sequenceRef = useRef(0);

  async function transition(next: typeof active) {
    if (next?.id === activeRef.current?.id) return;
    const sequence = ++sequenceRef.current;
    pendingCloseRef.current = false;
    animationsRef.current.forEach((animation) => animation.cancel());
    animationsRef.current = [];
    const section = next ?? activeRef.current;
    const trigger = section
      ? document.querySelector<HTMLButtonElement>(`[data-section="${section.id}"]`)
      : null;
    const source = trigger?.getBoundingClientRect();
    const commit = () => {
      activeRef.current = next;
      flushSync(() => setActive(next));
    };
    if (!source || reducedMotion()) {
      commit();
      busyRef.current = false;
      return;
    }
    busyRef.current = true;
    if (next) {
      triggerRef.current = trigger;
      commit();
    }
    const panel = dialogRef.current;
    if (!panel) {
      commit();
      busyRef.current = false;
      return;
    }
    const target = panel.getBoundingClientRect();
    const collapsed = `translate(${source.left - target.left}px, ${source.top - target.top}px) scale(${source.width / target.width}, ${source.height / target.height})`;
    const duration = next ? 615 : 330;
    const animate = (
      element: Element | null,
      frames: Keyframe[],
      options: KeyframeAnimationOptions,
    ) => {
      if (element)
        animationsRef.current.push(element.animate(frames, { fill: 'both', ...options }));
    };
    panel.style.transformOrigin = 'top left';
    panel.style.willChange = 'transform';
    animate(
      panel,
      next
        ? [
            { transform: collapsed, opacity: 1 },
            { transform: 'none', opacity: 1 },
          ]
        : [
            { transform: 'none', opacity: 1 },
            { opacity: 1, offset: 0.7 },
            { transform: collapsed, opacity: 0 },
          ],
      { duration, easing: 'cubic-bezier(.22,.7,.18,1)' },
    );
    animate(
      panel.querySelector('.detail-body'),
      next
        ? [
            { opacity: 0, transform: 'translateY(24px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ]
        : [{ opacity: 1 }, { opacity: 0 }],
      { duration: next ? 300 : 70, delay: next ? 285 : 0, easing: 'ease-out' },
    );
    animate(
      panel.querySelector('.detail-heading'),
      next
        ? [
            { opacity: 0, transform: 'translateY(14px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ]
        : [{ opacity: 1 }, { opacity: 0 }],
      { duration: next ? 315 : 90, delay: next ? 150 : 0 },
    );
    animate(
      panel.querySelector('.back-button'),
      next ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }],
      { duration: next ? 135 : 90, delay: next ? 375 : 0 },
    );
    window.dispatchEvent(new Event('site-transition-start'));
    await Promise.all(
      animationsRef.current.map((animation) => animation.finished.catch(() => undefined)),
    );
    if (sequence !== sequenceRef.current) return;
    if (!next) commit();
    animationsRef.current.forEach((animation) => animation.cancel());
    animationsRef.current = [];
    panel.style.willChange = '';
    busyRef.current = false;
    if (pendingCloseRef.current) {
      pendingCloseRef.current = false;
      close();
    }
  }

  function open(section: (typeof sections)[number], button: HTMLButtonElement) {
    if (busyRef.current) return;
    triggerRef.current = button;
    window.history.pushState(null, '', `#${section.id}`);
    pushedRef.current = true;
    transition(section);
  }

  function close() {
    if (!activeRef.current) return;
    if (busyRef.current) {
      // Preserve a return request made while the entrance animation is running.
      pendingCloseRef.current = true;
      return;
    }
    if (pushedRef.current) {
      if (activeRef.current.id === 'factory' && window.history.state?.factoryDepth) {
        window.history.go(-(window.history.state.factoryDepth + 1));
        return;
      }
      window.history.go(
        window.history.state?.factoryDetail ||
          window.history.state?.publicationDetail ||
          window.history.state?.interestDetail ||
          window.history.state?.projectDetail
          ? -2
          : -1,
      );
      return;
    }
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    transition(null);
  }

  useEffect(() => {
    const sync = () => {
      busyRef.current = false;
      transition(getSection());
    };
    const initial = window.setTimeout(sync, 0);
    window.addEventListener('popstate', sync);
    return () => {
      window.clearTimeout(initial);
      window.removeEventListener('popstate', sync);
      sequenceRef.current += 1;
      animationsRef.current.forEach((animation) => animation.cancel());
    };
  }, []);

  useEffect(() => {
    if (!active) {
      triggerRef.current?.focus({ preventScroll: true });
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);

  return (
    <>
      <div className="site-shell" inert={!!active}>
        <svg
          className="deep-space-stars"
          viewBox="0 0 1440 1000"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          {Array.from({ length: 145 }, (_, i) => (
            <circle
              key={i}
              cx={(i * 347 + 53) % 1440}
              cy={(i * 211 + 29) % 1000}
              r={i % 13 === 0 ? 1.3 : 0.6}
              opacity={0.2 + (i % 5) * 0.12}
            />
          ))}
        </svg>
        <main className="home" aria-label="个人空间">
          <h1 className="visually-hidden">果子 · 个人网站</h1>
          <div className="orbit-wrap">
            <svg
              className="deep-space-orbit orbit-rear"
              viewBox="-160 -160 1320 1320"
              aria-hidden="true"
            >
              <ellipse cx="500" cy="500" rx="645" ry="208" transform="rotate(-25 500 500)" />
            </svg>
            <div className="orbit" aria-label="个人空间的五个入口">
              <span
                className="orbit-earth"
                style={{ backgroundImage: `url("${earth.src}")` }}
                aria-hidden="true"
              />
              <span className="earth-sunrise" aria-hidden="true" />
              {sections.slice(0, 4).map((section, index) => (
                <button
                  key={section.id}
                  className={`sector sector-${index} theme-${section.id}`}
                  onClick={(event) => open(section, event.currentTarget)}
                  onPointerEnter={() => prepareSection(section.id)}
                  onFocus={() => prepareSection(section.id)}
                  onPointerDown={() => prepareSection(section.id)}
                  data-section={section.id}
                  aria-label={`打开${section.title}`}
                >
                  <span className="scene" aria-hidden="true" />
                  <span className="sector-shade" />
                  <span className="sector-copy">
                    <span className="sector-number">{section.number} /</span>
                    <strong>{section.title}</strong>
                    <span className="sector-english">{section.english}</span>
                  </span>
                </button>
              ))}
              <button
                className="portrait theme-about"
                onClick={(event) => open(sections[4], event.currentTarget)}
                data-section="about"
                aria-label="打开自我介绍"
              >
                {/* Static srcset avoids a server image optimizer on GitHub Pages. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="portrait-photo"
                  src={assetPath(profile.photo)}
                  srcSet={`${assetPath('/portrait-320.webp')} 320w, ${assetPath('/portrait-640.webp')} 640w, ${assetPath(profile.photo)} 1280w`}
                  alt={profile.photoAlt}
                  width={1280}
                  height={1707}
                  sizes="min(372.4px, calc(38vw - 18.24px), calc(38svh - 42.56px))"
                  fetchPriority="high"
                  decoding="async"
                />
                <span className="portrait-copy">
                  <span>ABOUT ME</span>
                  <strong>{profile.nickname}</strong>
                </span>
              </button>
            </div>
            <svg
              className="deep-space-orbit orbit-front"
              viewBox="-160 -160 1320 1320"
              aria-hidden="true"
            >
              <path d="M -145 500 A 645 208 0 0 0 1145 500" transform="rotate(-25 500 500)" />
              <circle className="orbit-satellite-halo" cx="1085" cy="227" r="12" />
              <circle className="orbit-satellite" cx="1085" cy="227" r="3" />
            </svg>
          </div>
        </main>
      </div>
      {active && (
        <div
          data-orbit-section={active.id}
          className={`detail-backdrop ${active.id === 'factory' ? factoryStyles.orbitBackdrop : ''}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={active.id === 'factory' ? '论文工厂' : undefined}
            aria-labelledby={active.id === 'factory' ? undefined : 'detail-title'}
            className={`detail theme-${active.id} ${['interests', 'publications', 'projects'].includes(active.id) ? 'tech-interior' : ''} ${active.id === 'factory' ? factoryStyles.orbitPanel : ''}`}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                close();
              }
              if (event.key === 'Tab') {
                const controls = Array.from(
                  event.currentTarget.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), a[href], input, select, summary, [tabindex="0"]',
                  ),
                ).filter((control) => control.getClientRects().length > 0);
                const first = controls[0];
                const last = controls.at(-1);
                if (!controls.some((control) => control === document.activeElement)) {
                  event.preventDefault();
                  (event.shiftKey ? last : first)?.focus();
                } else if (event.shiftKey && document.activeElement === first) {
                  event.preventDefault();
                  last?.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                  event.preventDefault();
                  first?.focus();
                }
              }
            }}
          >
            <ReadingNavigation panelRef={dialogRef} onHome={close} />
            {active.id === 'factory' ? (
              <>
                <button
                  ref={closeRef}
                  className={`back-button ${factoryStyles.outerBack}`}
                  onClick={close}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
                    <path
                      d="m14 5-7 7 7 7"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Home
                </button>
                <SectionErrorBoundary name="论文工厂" onBack={close}>
                  <FactoryPreview embedded />
                </SectionErrorBoundary>
              </>
            ) : (
              <>
                <div className="detail-hero">
                  {active.id === 'about' ? (
                    <Image
                      className="about-hero-photo"
                      src={assetPath(profile.photo)}
                      alt={profile.photoAlt}
                      fill
                      sizes="(max-width: 600px) 94vw, 880px"
                    />
                  ) : (
                    <span className="scene" aria-hidden="true" />
                  )}
                  <span className="detail-tint" />
                  <button ref={closeRef} className="back-button" onClick={close}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                      <path
                        d="m14 5-7 7 7 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Home
                  </button>
                  <div className="detail-heading">
                    <p>
                      {active.number} / {active.english}
                    </p>
                    <h2 id="detail-title">{active.title}</h2>
                    <span>{active.subtitle}</span>
                  </div>
                  <span
                    className="hero-decoration"
                    aria-hidden="true"
                    hidden={active.id === 'about'}
                  >
                    ✳
                  </span>
                </div>
                <div className={`detail-body${active.id === 'about' ? ' about-body' : ''}`}>
                  <SectionErrorBoundary key={active.id} name={active.title} onBack={close}>
                    {active.id === 'about' ? (
                      <div className="detail-lead">
                        <span className="eyebrow">SELF INTRODUCTION</span>
                        <h3>{profile.introduction}</h3>
                        <div className="about-prose">
                          {profile.paragraphs.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                          ))}
                        </div>
                      </div>
                    ) : active.id === 'publications' ? (
                      <Publications />
                    ) : active.id === 'interests' ? (
                      <Interests />
                    ) : active.id === 'projects' ? (
                      <Projects />
                    ) : (
                      <>
                        <div className="detail-lead">
                          <span className="eyebrow">A SPACE FOR {active.english}</span>
                          <h3>留一个位置，给未来的内容。</h3>
                          <p>{active.note}</p>
                        </div>
                        <div className="content-slots">
                          {active.items.map((item, index) => (
                            <div className="content-slot" key={item}>
                              <span>0{index + 1}</span>
                              <h4>{item}</h4>
                              <span className="slot-status">待加入</span>
                            </div>
                          ))}
                        </div>
                        <p className="prototype-note">
                          当前只体验构图与展开动效；这里没有真实个人资料。
                        </p>
                      </>
                    )}
                  </SectionErrorBoundary>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
