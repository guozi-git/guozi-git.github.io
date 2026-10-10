'use client';

import { assetPath } from '@/lib/asset-path';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { factoryPapers, factoryTopics, reviewBatch, scoreDimensions } from '@/lib/factory-papers';
import s from './factory-preview.module.css';

const availableScores = [
  ...new Set(factoryPapers.flatMap((paper) => (paper.level === null ? [] : [paper.level]))),
]
  .sort((a, b) => b - a)
  .map((score) => score.toFixed(1));
const hasUnscored = factoryPapers.some((paper) => paper.level === null);

const icons = [
  { symbol: 'π', x: '6%', y: '19%', size: 70, hue: 188 },
  { symbol: '∑', x: '94%', y: '14%', size: 84, hue: 220 },
  { symbol: '∫', x: '94%', y: '49%', size: 53, hue: 188 },
  { symbol: '∞', x: '6%', y: '61%', size: 56, hue: 228 },
  { symbol: '∇', x: '6%', y: '88%', size: 49, hue: 186 },
  { symbol: '√', x: '94%', y: '83%', size: 66, hue: 212 },
];
export function MathBackdrop() {
  return (
    <div className={s.mathBackdrop} aria-hidden="true">
      <div className={s.dots} />
      {icons.map((icon) => (
        <span
          key={icon.symbol}
          className={s.mathIcon}
          style={
            {
              '--x': icon.x,
              '--y': icon.y,
              '--size': `${icon.size}px`,
              '--hue': icon.hue,
            } as CSSProperties
          }
        >
          {icon.symbol}
        </span>
      ))}
    </div>
  );
}
function AbstractContent({ text }: { text: string }) {
  const blocks: { list: boolean; paragraphs: string[] }[] = [];
  for (const paragraph of text.split('\n\n')) {
    const list = paragraph.startsWith('• ');
    const content = list ? paragraph.slice(2) : paragraph;
    const previous = blocks.at(-1);
    if (list && previous?.list) previous.paragraphs.push(content);
    else blocks.push({ list, paragraphs: [content] });
  }
  const inline = (text: string) =>
    text
      .split(/([\^_]\{[^}]+\})/g)
      .map((part, index) =>
        part.startsWith('^{') ? (
          <sup key={index}>{part.slice(2, -1)}</sup>
        ) : part.startsWith('_{') ? (
          <sub key={index}>{part.slice(2, -1)}</sub>
        ) : (
          part
        ),
      );
  return (
    <div lang="en" className={s.abstractText}>
      {blocks.map((block, index) =>
        block.list ? (
          <ul key={index}>
            {block.paragraphs.map((paragraph, item) => (
              <li key={item}>{inline(paragraph)}</li>
            ))}
          </ul>
        ) : (
          <p key={index}>{inline(block.paragraphs[0])}</p>
        ),
      )}
    </div>
  );
}
function ScoreRadar({ scores, id }: { scores: readonly number[]; id: string }) {
  const center = { x: 200, y: 163 };
  const point = (index: number, radius: number) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / 5;
    return { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius };
  };
  const polygon = (values: readonly number[]) =>
    values
      .map((value, index) => {
        const p = point(index, (value / 5) * 98);
        return `${p.x},${p.y}`;
      })
      .join(' ');
  return (
    <figure className={s.radar}>
      <svg viewBox="0 0 400 335" role="img" aria-labelledby={`radar-title-${id} radar-desc-${id}`}>
        <title id={`radar-title-${id}`}>五维评分雷达图</title>
        <desc id={`radar-desc-${id}`}>
          {scoreDimensions
            .map((dimension, index) => `${dimension.name} ${scores[index].toFixed(1)} / 5`)
            .join('；')}
        </desc>
        {[1, 2, 3, 4, 5].map((level) => (
          <polygon
            key={level}
            points={polygon([level, level, level, level, level])}
            className={s.radarGrid}
          />
        ))}
        {scoreDimensions.map((dimension, index) => {
          const p = point(index, 98);
          return (
            <line
              key={dimension.name}
              x1={center.x}
              y1={center.y}
              x2={p.x}
              y2={p.y}
              className={s.radarAxis}
            />
          );
        })}
        {[1, 3, 5].map((level) => (
          <text
            key={level}
            x={center.x + 6}
            y={center.y - (level / 5) * 98 - 4}
            className={s.radarScale}
          >
            {level}
          </text>
        ))}
        <polygon points={polygon(scores)} className={s.radarValue} />
        {scoreDimensions.map((dimension, index) => {
          const p = point(index, (scores[index] / 5) * 98);
          const label = point(index, 137);
          return (
            <g key={dimension.name}>
              <circle cx={p.x} cy={p.y} r="3" className={s.radarPoint} />
              <text x={label.x} y={label.y - 3} textAnchor="middle" className={s.radarLabel}>
                {dimension.name}
                <tspan x={label.x} dy="19" className={s.radarNumber}>
                  {scores[index].toFixed(1)}
                </tspan>
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
function fromHash() {
  if (typeof window === 'undefined') return 'overview';
  const id = window.location.hash.split('/')[1];
  return id === 'scoring' || factoryPapers.some((paper) => paper.id === id) ? id : 'overview';
}
export function FactoryPreview({ embedded = false }: { embedded?: boolean }) {
  const [view, setView] = useState('overview');
  const [visibleCount, setVisibleCount] = useState(20);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('全部方向');
  const [scoreFilter, setScoreFilter] = useState('all');
  const region = useRef<HTMLDivElement>(null);
  const lastTrigger = useRef<string | null>(null);
  const scroll = useRef(0);
  const first = useRef(true);
  const paper = factoryPapers.find((item) => item.id === view);
  const matching = factoryPapers.filter(
    (item) =>
      (filter === '全部方向' || item.topic === filter) &&
      (scoreFilter === 'all' ||
        (scoreFilter === 'unscored' ? item.level === null : item.level === Number(scoreFilter))) &&
      `${item.originalTitle} ${item.id} ${item.msc.join(' ')}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  useEffect(() => {
    const sync = () => setView(fromHash());
    const initial = window.setTimeout(sync, 0);
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      window.clearTimeout(initial);
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);
  useEffect(() => {
    const current = region.current;
    if (!current) return;
    const panel = current.closest<HTMLElement>('.detail');
    if (first.current) {
      first.current = false;
      return;
    }
    if (view === 'overview') {
      current
        .querySelector<HTMLElement>(
          lastTrigger.current === 'scoring'
            ? '[data-score-open]'
            : `[data-paper="${lastTrigger.current}"]`,
        )
        ?.focus({ preventScroll: true });
      if (panel) panel.scrollTop = scroll.current;
    } else {
      current.querySelector<HTMLElement>('[data-inner-back]')?.focus({ preventScroll: true });
      if (panel) panel.scrollTop = 0;
    }
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const animation = current.animate(
        [
          { opacity: 0.25, transform: 'translateY(10px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 360, easing: 'cubic-bezier(.2,.7,.2,1)' },
      );
      return () => animation.cancel();
    }
  }, [view]);
  function open(next: string) {
    lastTrigger.current = next;
    scroll.current = region.current?.closest('.detail')?.scrollTop ?? 0;
    window.history.pushState(
      { ...window.history.state, factoryDetail: true },
      '',
      `#factory/${next}`,
    );
    setView(next);
  }
  function back() {
    if (window.history.state?.factoryDetail) window.history.back();
    else {
      window.history.replaceState(null, '', '#factory');
      setView('overview');
    }
  }
  return (
    <div className={`${s.factory} ${embedded ? s.embedded : ''}`}>
      <MathBackdrop />
      {!embedded && (
        <header className={s.header}>
          <a className={s.back} href={assetPath('/')}>
            <span aria-hidden="true">‹</span> 个人空间
          </a>
        </header>
      )}
      <div
        ref={region}
        className={`${s.content} detail-body`}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && view !== 'overview') {
            event.preventDefault();
            event.stopPropagation();
            back();
          }
        }}
      >
        {paper ? (
          <article className={s.paperDetail}>
            <button data-inner-back className={s.back} onClick={back}>
              <span aria-hidden="true">‹</span> 返回论文汇总
            </button>
            <p className={s.eyebrow}>
              {paper.id} · {paper.topic}
            </p>
            <h3 lang="en">{paper.originalTitle}</h3>
            <div className={s.statusLine}>
              <span className={paper.status === '通过' ? s.passed : s.reviewStatus}>
                {paper.status === '通过' ? '审查通过' : paper.status}
              </span>
              <span>正确性 {paper.correctness.toFixed(1)} / 5</span>
              {paper.confidence && <span>评价置信度：{paper.confidence}</span>}
            </div>
            <p className={s.mscLine}>MSC {paper.msc.join(' · ')}</p>
            {paper.reviewNote && <p className={s.reviewNotice}>{paper.reviewNote}</p>}
            <section className={s.abstract}>
              <div className={s.subheading}>
                <h4>Abstract</h4>
              </div>
              <AbstractContent text={paper.abstract} />
            </section>
            {paper.scores ? (
              <section className={s.ratingPanel}>
                <div className={s.ratingSummary}>
                  <div>
                    <span>研究水平</span>
                    <strong>
                      {paper.level?.toFixed(1)}
                      <small> / 5</small>
                    </strong>
                  </div>
                  <div>
                    <span>稿件成熟度</span>
                    <strong>
                      {paper.maturity?.toFixed(1)}
                      <small> / 5</small>
                    </strong>
                  </div>
                  <p>
                    分别判断
                    <br />
                    不取五维平均
                  </p>
                </div>
                <ScoreRadar scores={paper.scores} id={paper.id} />
                <details className={s.scoreReasons}>
                  <summary>查看评分理由</summary>
                  <dl>
                    {scoreDimensions.map((dimension, index) => (
                      <div key={dimension.name}>
                        <dt>
                          {dimension.name}
                          <span>{paper.scores?.[index].toFixed(1)} / 5</span>
                        </dt>
                        <dd>{paper.reasons[index]}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              </section>
            ) : (
              <p className={s.reviewNotice}>正确性待确认，暂不展示研究水平与五维评分。</p>
            )}
            <section className={s.limitations}>
              <h4>适用范围与局限</h4>
              <p>{paper.limitation}</p>
            </section>
            <div className={s.pdfLinks}>
              <a
                href={`${assetPath(paper.pdf)}?v=${paper.sha256.slice(0, 16)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                阅读原文 <span aria-hidden="true">↗</span>
              </a>
            </div>
          </article>
        ) : view === 'scoring' ? (
          <section className={s.scoring}>
            <button data-inner-back className={s.back} onClick={back}>
              <span aria-hidden="true">‹</span> 返回论文汇总
            </button>
            <p className={s.eyebrow}>HOW TO READ THE SCORES</p>
            <h3>评分说明</h3>
            <p className={s.description}>
              五个维度分别按 0–5 星评价，支持半星；研究水平与成熟度单独判断。
            </p>
            <div className={s.rulePanel}>
              {scoreDimensions.map((dimension, index) => (
                <div key={dimension.name}>
                  <span className={s.ruleIndex}>0{index + 1}</span>
                  <div>
                    <h4>{dimension.name}</h4>
                    <p>{dimension.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className={s.overview}>
            <div className={s.intro} data-factory-heading>
              <p className={s.eyebrow}>THE PAPER FACTORY</p>
              <h2 id="factory-heading">
                论文工厂<span>。</span>
              </h2>
              <p className={s.subtitle}>ai4math</p>
            </div>
            <div className={s.summaryLine}>
              <span>
                <strong>{reviewBatch.total}</strong> 篇研究稿
              </span>
              <span>
                <strong>{reviewBatch.scored}</strong> 篇已评价
              </span>
              <span>
                <strong>{reviewBatch.pending}</strong> 篇待确认
              </span>
            </div>
            <div className={s.sectionHeading}>
              <h3>论文汇总</h3>
              <button className={s.scoringLink} data-score-open onClick={() => open('scoring')}>
                评分说明 <span aria-hidden="true">↗</span>
              </button>
            </div>
            <div className={s.panel}>
              <div className={s.toolbar}>
                <label className={s.search}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="10.5" cy="10.5" r="6.5" />
                    <path d="m16 16 4 4" />
                  </svg>
                  <input
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setVisibleCount(20);
                    }}
                    placeholder="搜索论文"
                    aria-label="搜索论文"
                  />
                </label>
                <select
                  aria-label="研究方向"
                  value={filter}
                  onChange={(event) => {
                    setFilter(event.target.value);
                    setVisibleCount(20);
                  }}
                >
                  <option>全部方向</option>
                  {factoryTopics.map((topic) => (
                    <option key={topic}>{topic}</option>
                  ))}
                </select>
                <select
                  aria-label="研究水平分数"
                  value={scoreFilter}
                  onChange={(event) => {
                    setScoreFilter(event.target.value);
                    setVisibleCount(20);
                  }}
                >
                  <option value="all">全部分数</option>
                  {availableScores.map((score) => (
                    <option key={score} value={score}>
                      {score} 分
                    </option>
                  ))}
                  {hasUnscored && <option value="unscored">未评分</option>}
                </select>
              </div>
              <div className={s.sortCaption}>
                <span>研究水平从高到低</span>
                <span aria-live="polite">{matching.length} 篇</span>
              </div>
              {matching.slice(0, visibleCount).map((item) => (
                <button
                  key={item.id}
                  className={s.paper}
                  data-paper={item.id}
                  onClick={() => open(item.id)}
                >
                  <span className={s.paperSymbol} aria-hidden="true">
                    {item.symbol}
                  </span>
                  <span className={s.paperCopy}>
                    <span className={s.paperId}>
                      {item.id} · {item.topic}
                    </span>
                    <span className={s.paperTitle} lang="en">
                      {item.originalTitle}
                    </span>
                    <span className={s.paperMeta}>
                      {item.status === '通过' ? '审查通过' : item.status}
                    </span>
                  </span>
                  <span className={s.paperLevel}>
                    <strong>{item.level?.toFixed(1) ?? '—'}</strong>
                    <small>{item.level === null ? '未评分' : '研究水平 / 5'}</small>
                  </span>
                  <span className={s.arrow} aria-hidden="true">
                    ↗
                  </span>
                </button>
              ))}
              {matching.length > visibleCount && (
                <button
                  className={s.loadMore}
                  onClick={() => setVisibleCount((count) => count + 20)}
                >
                  显示更多 · 已显示 {Math.min(visibleCount, matching.length)} / {matching.length} 篇
                </button>
              )}
              {!matching.length && (
                <div className={s.empty}>
                  <p>尚无此类论文</p>
                  <button
                    onClick={() => {
                      setQuery('');
                      setFilter('全部方向');
                      setScoreFilter('all');
                      setVisibleCount(20);
                    }}
                  >
                    重置筛选
                  </button>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
