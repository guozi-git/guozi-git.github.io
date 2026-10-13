'use client';
import { reducedMotion } from '@/lib/motion';

import { assetPath } from '@/lib/asset-path';
import { useEffect, useRef, useState } from 'react';
import { factoryPapers, factoryTopics, reviewBatch, scoreDimensions } from '@/lib/factory-papers';
import s from './factory-preview.module.css';

const availableScores = [91, 81, 71, 61, 51].filter((lower) =>
  factoryPapers.some(
    (paper) => paper.level !== null && paper.level >= lower && paper.level <= lower + 9,
  ),
);
const rankedPapers = factoryPapers.filter((paper) => paper.level !== null);
const paperRanks = new Map(rankedPapers.map((paper, index) => [paper.id, index + 1]));

// Level sets of a positive definite quadratic form: a quiet mathematical backdrop.
function ContourField() {
  return (
    <svg className={s.contours} viewBox="0 0 600 300" fill="none" aria-hidden="true">
      <path d="M0 150H600M300 0V300" stroke="currentColor" opacity=".25" />
      <g transform="translate(340 145) rotate(-24)">
        {[24, 44, 66, 90, 116, 144, 174, 206, 240].map((radius) => (
          <ellipse key={radius} rx={radius} ry={radius * 0.46} stroke="currentColor" />
        ))}
        <path
          d="M-195 -40L-132 -25L-89 -13L-55 -5L-30 -1L0 0"
          stroke="currentColor"
          strokeWidth="2"
        />
        {[-195, -132, -89, -55, -30, 0].map((x, i) => (
          <circle key={x} cx={x} cy={[-40, -25, -13, -5, -1, 0][i]} r="3" fill="currentColor" />
        ))}
      </g>
    </svg>
  );
}
export function MathBackdrop() {
  return (
    <div className={s.mathBackdrop} aria-hidden="true">
      <div className={s.dots} />
    </div>
  );
}
export function AbstractContent({ text }: { text: string }) {
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
export function ScoreRadar({
  scores,
  id,
  maxScore = 100,
}: {
  scores: readonly number[];
  id: string;
  maxScore?: number;
}) {
  const formatScore = (value: number) => (maxScore === 5 ? value.toFixed(1) : String(value));
  const center = { x: 200, y: 163 };
  const point = (index: number, radius: number) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / 5;
    return { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius };
  };
  const polygon = (values: readonly number[]) =>
    values
      .map((value, index) => {
        const p = point(index, (value / maxScore) * 98);
        return `${p.x},${p.y}`;
      })
      .join(' ');
  return (
    <figure className={s.radar}>
      <svg viewBox="0 0 400 335" role="img" aria-labelledby={`radar-title-${id} radar-desc-${id}`}>
        <title id={`radar-title-${id}`}>五维评分雷达图</title>
        <desc id={`radar-desc-${id}`}>
          {scoreDimensions
            .map(
              (dimension, index) => `${dimension.name} ${formatScore(scores[index])} / ${maxScore}`,
            )
            .join('；')}
        </desc>
        {[1, 2, 3, 4, 5].map((level) => (
          <polygon
            key={level}
            points={polygon(Array(5).fill((level * maxScore) / 5))}
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
            {(level * maxScore) / 5}
          </text>
        ))}
        <polygon points={polygon(scores)} className={s.radarValue} />
        {scoreDimensions.map((dimension, index) => {
          const p = point(index, (scores[index] / maxScore) * 98);
          const label = point(index, 137);
          return (
            <g key={dimension.name}>
              <circle cx={p.x} cy={p.y} r="3" className={s.radarPoint} />
              <text x={label.x} y={label.y - 3} textAnchor="middle" className={s.radarLabel}>
                {dimension.name}
                <tspan x={label.x} dy="19" className={s.radarNumber}>
                  {formatScore(scores[index])}
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
  const [reviewFilter, setReviewFilter] = useState<'scored' | 'pending'>('scored');
  const region = useRef<HTMLDivElement>(null);
  const lastTrigger = useRef<string | null>(null);
  const scroll = useRef(0);
  const first = useRef(true);
  const paper = factoryPapers.find((item) => item.id === view);
  const matching = factoryPapers.filter(
    (item) =>
      (reviewFilter === 'scored' ? item.level !== null : item.level === null) &&
      (filter === '全部方向' || item.topic === filter) &&
      (scoreFilter === 'all' ||
        (item.level !== null &&
          item.level >= Number(scoreFilter) &&
          item.level <= Number(scoreFilter) + 9)) &&
      `${item.originalTitle} ${item.id} ${item.msc.join(' ')}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  useEffect(() => {
    const sync = () => {
      const next = fromHash();
      setView(next);
      if (factoryPapers.some((item) => item.id === next && item.level === null))
        setReviewFilter('pending');
    };
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
    if (!reducedMotion()) {
      const animation = current.animate(
        [
          { opacity: 0.25, transform: 'translateY(10px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 180, easing: 'cubic-bezier(.2,.7,.2,1)' },
      );
      return () => animation.cancel();
    }
  }, [view]);
  function open(next: string) {
    lastTrigger.current = next;
    scroll.current = region.current?.closest('.detail')?.scrollTop ?? 0;
    window.history.pushState(
      {
        ...window.history.state,
        factoryDetail: true,
        factoryDepth: (window.history.state?.factoryDepth ?? 0) + 1,
      },
      '',
      `#factory/${next}`,
    );
    setView(next);
  }
  function back() {
    if (window.history.state?.factoryDetail) window.history.back();
    else {
      window.history.replaceState(null, '', '#factory/workshop');
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
                {paper.status === '通过' ? '正确性检验通过' : `正确性：${paper.status}`}
              </span>
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
                    <span>核心成果水平</span>
                    <strong>
                      {paper.level}
                      <small> / 100</small>
                    </strong>
                    <p className={s.metricReason}>{paper.levelReason}</p>
                  </div>
                </div>
                <h4 className={s.dimensionHeading}>五维评价</h4>
                <ScoreRadar scores={paper.scores} id={paper.id} maxScore={100} />
                <div className={s.scoreReasons}>
                  <dl>
                    {scoreDimensions.map((dimension, index) => (
                      <div key={dimension.name}>
                        <dt>{dimension.name}</dt>
                        <dd>{paper.reasons[index]}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className={`${s.ratingSummary} ${s.maturitySummary}`}>
                  <div>
                    <span>稿件成熟度</span>
                    <strong>
                      {paper.maturity}
                      <small> / 100</small>
                    </strong>
                    <p className={s.metricReason}>{paper.maturityReason}</p>
                  </div>
                </div>
              </section>
            ) : (
              <p className={s.reviewNotice}>正确性待确认，暂不展示研究水平与五维评分。</p>
            )}
            <section className={s.limitations}>
              <h4>适用范围与局限</h4>
              {paper.limitation.split('\n').map((text) => (
                <p key={text}>{text}</p>
              ))}
            </section>
            <section className={s.overallReview}>
              <h4>整体评价</h4>
              <p>{paper.overall}</p>
            </section>
            <div className={s.pdfLinks}>
              <a
                href={`${assetPath(paper.pdf)}?v=${paper.sha256.slice(0, 16)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                阅读原文 <span aria-hidden="true">↗</span>
              </a>
              {paper.supplement && (
                <a
                  href={`${assetPath(paper.supplement.pdf)}?v=${paper.supplement.sha256.slice(0, 16)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  阅读证明补充 <span aria-hidden="true">↗</span>
                </a>
              )}
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
              采用本轮独立重审的整数百分制。核心成果水平、稿件成熟度和五个维度分别评价。 1—2
              分的差异表达审稿判断，不代表客观测量精度。
            </p>
            <div className={s.reviewPrinciples}>
              <section>
                <h4>先核验，再评价</h4>
                <p>
                  正确性分为通过、有条件通过、待确认、不通过。待确认与不通过稿件不参与正式价值评分和排名；有条件通过须具备具体可靠的修复方案。
                </p>
              </section>
              <section>
                <h4>成果与成熟度分开看</h4>
                <p>
                  成果水平综合判断最重要的已核验贡献、问题价值、原创增量和适用边界；成熟度评价当前稿件的证明依赖、证书、引用与叙述是否完整。有条件通过不代表修复已经执行。
                </p>
              </section>
              <section>
                <h4>同分排序</h4>
                <p>
                  先按核心成果水平降序，再依次比较创新性、学术意义、技术深度，最后按论文编号稳定排序。
                </p>
              </section>
            </div>
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
            <p className={s.scoreBands}>
              90–100：本维极强且证据充分 · 80–89：明显较强 · 70–79：扎实并有实质增量 ·
              60–69：有限但明确的贡献 · 50–59：偏窄或主要整合 · 低于 50：有明显不足
            </p>
          </section>
        ) : (
          <section className={s.overview}>
            <div className={s.intro} data-factory-heading>
              <ContourField />
              <p className={s.eyebrow}>MATHEMATICAL RESEARCH / WORKSPACE</p>
              <h2 id="factory-heading">AI4math</h2>
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
              <h3>研究论文</h3>
              <button className={s.scoringLink} data-score-open onClick={() => open('scoring')}>
                评分说明 <span aria-hidden="true">↗</span>
              </button>
            </div>
            <div className={s.reviewTabs} role="group" aria-label="审查分组">
              <button
                aria-pressed={reviewFilter === 'scored'}
                onClick={() => {
                  setReviewFilter('scored');
                  setScoreFilter('all');
                  setVisibleCount(20);
                }}
              >
                已评价 <span>{reviewBatch.scored}</span>
              </button>
              <button
                aria-pressed={reviewFilter === 'pending'}
                onClick={() => {
                  setReviewFilter('pending');
                  setScoreFilter('all');
                  setVisibleCount(20);
                }}
              >
                待确认 <span>{reviewBatch.pending}</span>
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
                  disabled={reviewFilter === 'pending'}
                  value={scoreFilter}
                  onChange={(event) => {
                    setScoreFilter(event.target.value);
                    setVisibleCount(20);
                  }}
                >
                  <option value="all">全部分数</option>
                  {availableScores.map((score) => (
                    <option key={score} value={score}>
                      {score}-{score + 9}
                    </option>
                  ))}
                </select>
              </div>
              {reviewFilter === 'pending' && (
                <div className={s.sortCaption}>证明依赖待补齐 · 不参与正式排名</div>
              )}
              {matching.slice(0, visibleCount).map((item) => (
                <button
                  key={item.id}
                  className={s.paper}
                  data-paper={item.id}
                  onClick={() => open(item.id)}
                >
                  <span className={s.rankIndex} aria-hidden="true">
                    {paperRanks.has(item.id)
                      ? String(paperRanks.get(item.id)).padStart(2, '0')
                      : '—'}
                  </span>
                  <span className={s.paperCopy}>
                    <span className={s.paperId}>
                      {item.id} · {item.topic}
                    </span>
                    <span className={s.paperTitle} lang="en">
                      {item.originalTitle}
                    </span>
                    <span className={s.paperMeta}>
                      {item.status === '通过' ? '正确性检验通过' : item.status}
                      {item.level !== null && <span> · 稿件成熟度 {item.maturity} / 100</span>}
                    </span>
                  </span>
                  <span className={s.paperLevel}>
                    <strong>{item.level ?? '—'}</strong>
                    <small>{item.level === null ? '暂不评分' : '成果水平 / 100'}</small>
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
