'use client';
import { reducedMotion } from '@/lib/motion';

import { useEffect, useRef, useState } from 'react';
import { publications, type Publication } from '@/lib/publications';

function selectedFromHash() {
  return publications.find((paper) => window.location.hash === `#publications/${paper.id}`) ?? null;
}

// Decorative diagrams evoke each topic; they do not reproduce experimental data.
function PaperArt({ index }: { index: number }) {
  return (
    <svg viewBox="0 0 320 170" aria-hidden="true" className={`paper-art paper-art-${index}`}>
      {index === 0 ? (
        <g transform="translate(70 22)">
          {Array.from({ length: 5 }, (_, y) => (
            <path key={`h${y}`} d={`M0 ${y * 30}H180`} />
          ))}
          {Array.from({ length: 7 }, (_, x) => (
            <path key={`v${x}`} d={`M${x * 30} 0V120`} />
          ))}
          {Array.from({ length: 35 }, (_, i) => (
            <circle
              key={i}
              cx={(i % 7) * 30}
              cy={Math.floor(i / 7) * 30}
              r={[1, 3, 8, 17, 24, 28, 34].includes(i) ? 6 : 2.5}
              className={[1, 3, 8, 17, 24, 28, 34].includes(i) ? 'art-highlight' : ''}
            />
          ))}
        </g>
      ) : index === 1 ? (
        <g transform="translate(160 85)">
          <path d="M-122 0H122M0-67V67" />
          <circle r="55" fill="none" />
          <circle r="32" fill="none" strokeDasharray="3 5" />
          {Array.from({ length: 9 }, (_, i) => (
            <circle
              key={i}
              cx={Math.cos((i * Math.PI * 2) / 9) * 55}
              cy={Math.sin((i * Math.PI * 2) / 9) * 55}
              r="4"
              className="art-highlight"
            />
          ))}
          <path d="M0 0 42-35" />
          <text x="49" y="-31">
            |z|
          </text>
        </g>
      ) : (
        <g>
          {[38, 85, 132].flatMap((y, i) =>
            [25, 65, 105, 145].map((z, j) => <path key={`${i}-${j}`} d={`M100 ${y} 225 ${z}`} />),
          )}
          {[38, 85, 132].map((y) => (
            <circle key={y} cx="100" cy={y} r="7" className="art-highlight" />
          ))}
          {[25, 65, 105, 145].map((y) => (
            <circle key={y} cx="225" cy={y} r="7" className="art-highlight" />
          ))}
        </g>
      )}
    </svg>
  );
}

export function Publications() {
  const [selected, setSelected] = useState<Publication | null>(selectedFromHash);
  const regionRef = useRef<HTMLDivElement>(null);
  const previousIdRef = useRef<string | null>(null);
  const scrollRef = useRef(0);

  useEffect(() => {
    const sync = () => setSelected(selectedFromHash());
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  useEffect(() => {
    const region = regionRef.current;
    if (!region) return;
    const panel = region.closest<HTMLElement>('.detail');
    if (selected) {
      previousIdRef.current = selected.id;
      region.querySelector<HTMLButtonElement>('.paper-back')?.focus({ preventScroll: true });
      if (panel) panel.scrollTop = 0;
    } else if (previousIdRef.current) {
      region
        .querySelector<HTMLButtonElement>(`[data-paper="${previousIdRef.current}"]`)
        ?.focus({ preventScroll: true });
      if (panel) panel.scrollTop = scrollRef.current;
    }
    if (!reducedMotion()) {
      const animation = region.animate(
        [
          { opacity: 0, transform: 'translateY(12px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 180, easing: 'cubic-bezier(.2,.7,.2,1)' },
      );
      return () => animation.cancel();
    }
  }, [selected]);

  function open(paper: Publication) {
    scrollRef.current = regionRef.current?.closest('.detail')?.scrollTop ?? 0;
    window.history.pushState(
      { ...window.history.state, publicationDetail: true },
      '',
      `#publications/${paper.id}`,
    );
    setSelected(paper);
  }

  function back() {
    if (window.history.state?.publicationDetail) window.history.back();
    else {
      window.history.replaceState(window.history.state, '', '#publications');
      setSelected(null);
    }
  }

  return (
    <div
      ref={regionRef}
      className="publications-content"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && selected) {
          event.preventDefault();
          event.stopPropagation();
          back();
        }
      }}
    >
      {selected ? (
        <article className="paper-detail" aria-labelledby="paper-title">
          <button className="paper-back" onClick={back}>
            返回论文列表
          </button>
          <div className="paper-detail-top">
            <span
              className={`paper-status${selected.fullText && selected.id === 'bipartite-stability' ? ' is-preprint' : ''}`}
            >
              {selected.status}
            </span>
            <span>{selected.year}</span>
          </div>
          <h3 id="paper-title" lang="en">
            {selected.title}
          </h3>
          <p className="paper-authors">{selected.authors.join(' · ')}</p>
          <p className="paper-citation">{selected.citation}</p>
          <div className="paper-explanation">
            <section>
              <h4>{selected.shortTitle}</h4>
              <p>{selected.summary}</p>
            </section>
          </div>
          <div className="paper-links">
            {selected.fullText && (
              <a
                className="paper-primary-link"
                href={selected.fullText}
                target="_blank"
                rel="noopener noreferrer"
              >
                阅读原文 PDF
              </a>
            )}
            <a
              className={selected.fullText ? 'paper-source-link' : 'paper-primary-link'}
              href={selected.source}
              target="_blank"
              rel="noopener noreferrer"
            >
              {selected.id === 'bipartite-stability' ? 'arXiv 页面' : '出版社页面'}
            </a>
          </div>
          <p className="paper-access">{selected.access}</p>
          <p className="paper-identifier">{selected.identifier}</p>
        </article>
      ) : (
        <>
          <div className="papers-intro">
            <div>
              <p className="eyebrow">SELECTED RESEARCH / 01—03</p>
              <h3>我研究过的三个小问题。</h3>
            </div>
            <span>2 篇已发表 · 1 篇预印本</span>
          </div>
          <div className="paper-grid">
            {publications.map((paper, index) => (
              <button
                key={paper.id}
                className="publication-card"
                data-paper={paper.id}
                onClick={() => open(paper)}
                aria-label={`查看论文：${paper.title}`}
              >
                <div className="paper-cover">
                  <PaperArt index={index} />
                  <span className="paper-index">0{index + 1}</span>
                  <span className="paper-year">{paper.year}</span>
                </div>
                <div className="paper-card-body">
                  <span className={`paper-status${index === 2 ? ' is-preprint' : ''}`}>
                    {paper.status}
                  </span>
                  <h3>{paper.shortTitle}</h3>
                  <p className="paper-summary">{paper.summary}</p>
                  <div className="paper-card-bottom">
                    <span>{paper.venue}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <p className="papers-footnote">点击卡片了解研究内容 · 原文链接在新标签页打开</p>
        </>
      )}
    </div>
  );
}
