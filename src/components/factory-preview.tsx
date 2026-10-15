'use client';
import { reducedMotion } from '@/lib/motion';

import { assetPath } from '@/lib/asset-path';
import { useEffect, useRef, useState } from 'react';
import { factoryPapers, allFactoryPapers, factoryTopics, reviewBatch } from '@/lib/factory-papers';
import s from './factory-preview.module.css';
import { ResearchReviewPreview } from './research-review-preview';
import { ResearchGradeGuide } from './research-grade-guide';
import { researchReviews, mergedReviews } from '@/lib/research-reviews';
import { rankLabel } from '@/lib/paper-label';
import { PaperMetadata } from './paper-metadata';

const availableGrades = ['S6', 'S5', 'S4', 'S3', 'S2', 'S1', 'S0'].filter((grade) =>
  factoryPapers.some((p) => researchReviews.get(p.id)?.academic_level === grade),
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
function fromHash() {
  if (typeof window === 'undefined') return 'overview';
  const id = window.location.hash.split('/')[1];
  if (!id || id === 'workshop') return 'overview';
  return id === 'scoring' || allFactoryPapers.some((paper) => paper.id === id) ? id : 'missing';
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
  const paper =
    factoryPapers.find((item) => item.id === view) ??
    allFactoryPapers.find((item) => item.id === view);
  const review = paper ? researchReviews.get(paper.id) : undefined;
  const mergedInto = paper ? mergedReviews.get(paper.id) : undefined;
  useEffect(() => {
    document.title = `${paper?.originalTitle ?? (view === 'scoring' ? '等级与评分说明' : view === 'missing' ? '未找到论文' : '小作坊')} · 果子`;
  }, [paper, view]);
  const matching = factoryPapers.filter(
    (item) =>
      (reviewFilter === 'scored' ? item.level !== null : item.level === null) &&
      (filter === '全部方向' || item.topic === filter) &&
      (scoreFilter === 'all' || researchReviews.get(item.id)?.academic_level === scoreFilter) &&
      `${item.originalTitle} ${rankLabel(item.id, paperRanks)} ${item.id} ${item.msc.join(' ')}`
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
            <PaperMetadata title={paper.originalTitle} pdf={paper.pdf} />
            <button data-inner-back className={s.back} onClick={back}>
              <span aria-hidden="true">‹</span> 返回论文汇总
            </button>
            <p className={s.eyebrow}>
              {rankLabel(paper.id, paperRanks)} · {paper.topic}
            </p>
            <h3 lang={paper.id === 'P091' ? 'zh-CN' : 'en'}>{paper.originalTitle}</h3>
            {mergedInto && (
              <div className={s.reviewNotice}>
                此稿已归入后续成果，不再单独评分。
                {mergedInto.map((id) => (
                  <button className={s.scoringLink} key={id} onClick={() => open(id)}>
                    查看 {paperRanks.has(id) ? rankLabel(id, paperRanks) : id}
                  </button>
                ))}
              </div>
            )}
            <p className={s.mscLine}>MSC {paper.msc.join(' · ')}</p>
            <section className={s.abstract}>
              <div className={s.subheading}>
                <h4>{paper.abstract ? 'Abstract' : '原稿说明'}</h4>
              </div>
              {paper.abstract ? (
                <AbstractContent text={paper.abstract} />
              ) : (
                <p>此稿为阶段研究报告，未设独立摘要；已核结果与待完成部分见下方评价。</p>
              )}
            </section>
            {review && <ResearchReviewPreview review={review} workshop />}
            <div className={s.pdfLinks}>
              <a
                href={`${assetPath(paper.pdf)}?v=${paper.sha256.slice(0, 16)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                阅读原文
              </a>
              {paper.supplement && (
                <a
                  href={`${assetPath(paper.supplement.pdf)}?v=${paper.supplement.sha256.slice(0, 16)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  阅读证明补充
                </a>
              )}
            </div>
          </article>
        ) : view === 'missing' ? (
          <section className={s.scoring}>
            <h2>未找到这篇论文</h2>
            <p>链接中的稿件标识不存在，请返回论文汇总查找。原有论文链接保持有效。</p>
            <button data-inner-back className={s.back} onClick={back}>
              返回论文汇总
            </button>
          </section>
        ) : view === 'scoring' ? (
          <section className={s.scoring}>
            <button data-inner-back className={s.back} onClick={back}>
              <span aria-hidden="true">‹</span> 返回论文汇总
            </button>
            <p className={s.eyebrow}>HOW TO READ THE SCORES</p>
            <h3>等级与评分说明</h3>
            <p className={s.description}>
              综合分按五维固定权重计算；同分依次比较创新性、学术意义和论文编号。核心贡献与研究潜力分别评价。
            </p>
            <ResearchGradeGuide />
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
                <strong>{reviewBatch.pending}</strong> 项未评分
              </span>
            </div>
            <div className={s.sectionHeading}>
              <h3>研究论文</h3>
              <button className={s.scoringLink} data-score-open onClick={() => open('scoring')}>
                等级说明
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
                未评分 <span>{reviewBatch.pending}</span>
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
                  aria-label="学术等级"
                  disabled={reviewFilter === 'pending'}
                  value={scoreFilter}
                  onChange={(event) => {
                    setScoreFilter(event.target.value);
                    setVisibleCount(20);
                  }}
                >
                  <option value="all">全部等级</option>
                  {availableGrades.map((score) => (
                    <option key={score} value={score}>
                      {score}
                    </option>
                  ))}
                </select>
              </div>
              {reviewFilter === 'pending' && (
                <div className={s.sortCaption}>
                  4 项关键证书待核验 · 1 项阶段稿存在重要证明缺口 · 不参与综合排名
                </div>
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
                      {rankLabel(item.id, paperRanks)} · {item.topic}
                    </span>
                    <span className={s.paperTitle} lang={item.id === 'P091' ? 'zh-CN' : 'en'}>
                      {item.originalTitle}
                    </span>
                    <span className={s.paperMeta}>
                      {item.status === '通过' ? '正确性检验通过' : item.status}
                      {item.level !== null && (
                        <span>
                          {' '}
                          · {researchReviews.get(item.id)?.originality} · 核心贡献{' '}
                          {researchReviews.get(item.id)?.core_score}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className={s.paperLevel}>
                    <strong>{item.level?.toFixed(2) ?? '—'}</strong>
                    <small>
                      {item.level === null
                        ? '暂不评分'
                        : `${researchReviews.get(item.id)?.academic_level}`}
                    </small>
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
