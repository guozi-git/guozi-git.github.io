'use client';
import { useEffect, useRef, useState } from 'react';
import papers from '@/lib/atelier-papers.json';
import { orderAtelierPapers } from '@/lib/atelier-order';
import { researchReviews } from '@/lib/research-reviews';
import { ResearchGradeGuide } from './research-grade-guide';
import { ResearchReviewPreview } from './research-review-preview';
import { assetPath } from '@/lib/asset-path';
import { PaperMetadata } from './paper-metadata';
import { AbstractContent } from './abstract-content';
import s from './atelier-archive.module.css';

const collection = orderAtelierPapers(papers);
const accession = (number: number) => String(number).padStart(2, '0');

export function AtelierArchive({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const root = useRef<HTMLElement>(null);
  const paper = collection.find((entry) => entry.id === selected);
  useEffect(() => {
    document.title = `${paper?.originalTitle ?? (selected === 'scoring' ? '匠心造等级说明' : selected === 'missing' ? '未找到论文' : '匠心造')} · 果子`;
  }, [paper, selected]);
  useEffect(() => {
    const sync = () => {
      const match = collection.find(
        (entry) => window.location.hash === `#factory/atelier/${entry.id}`,
      );
      setSelected(
        window.location.hash === '#factory/atelier/scoring'
          ? 'scoring'
          : (match?.id ?? (window.location.hash.split('/')[2] ? 'missing' : null)),
      );
    };
    const timer = setTimeout(sync, 0);
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);
  useEffect(() => {
    const panel = root.current?.closest('.detail');
    if (panel) panel.scrollTop = 0;
  }, [selected]);
  function open(id: string) {
    window.history.pushState(
      { ...window.history.state, factoryDepth: 2, atelierDetail: true },
      '',
      `#factory/atelier/${id}`,
    );
    setSelected(id);
  }
  function close() {
    if (window.history.state?.atelierDetail) window.history.back();
    else {
      window.history.replaceState({ factoryDepth: 1 }, '', '#factory/atelier');
      setSelected(null);
    }
  }
  return (
    <section
      ref={root}
      className={s.archive}
      aria-label="匠心造收藏档案"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && selected) {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
      }}
    >
      <nav className={s.nav}>
        <button
          data-gateway-back
          onClick={selected ? close : onBack}
          aria-label={selected ? '返回收藏目录' : '返回上一级'}
        >
          ‹ {selected ? '返回收藏目录' : '返回上一级'}
        </button>
      </nav>
      {selected === 'missing' ? (
        <section>
          <h2>未找到这篇论文</h2>
          <p>此档案链接不存在，请返回匠心造目录查找。</p>
          <button onClick={close}>返回匠心造</button>
        </section>
      ) : selected === 'scoring' ? (
        <section className={s.guidePage} aria-label="匠心造等级说明">
          <header className={s.guideHeading}>
            <span>THE COLLECTION · READING GUIDE</span>
            <h2>等级与评分说明</h2>
            <p>研究价值、证明状态与核心贡献的阅读参照</p>
          </header>
          <ResearchGradeGuide theme="gold" />
        </section>
      ) : !paper ? (
        <>
          <div className={s.guideEntryRow}>
            <button
              className={s.guideEntry}
              onClick={() => open('scoring')}
              aria-label="打开匠心造等级说明"
            >
              等级说明
            </button>
          </div>
          <header className={s.masthead}>
            <span>SELECTED MATHEMATICAL WORKS</span>
            <h2>匠心造</h2>
            <p>研究珍藏 · 第一卷</p>
          </header>
          <div className={s.shelves}>
            {collection.map((entry) => (
              <div className={s.cabinet} key={entry.id}>
                <div className={s.spine} aria-hidden="true">
                  {accession(entry.collectionNumber)} · MATHEMATICAL ARCHIVE
                </div>
                <button
                  className={s.folio}
                  data-atelier-paper={entry.id}
                  onClick={() => open(entry.id)}
                  aria-label={`打开档案 ${accession(entry.collectionNumber)}：${entry.question}`}
                >
                  <span className={s.accession}>
                    COLLECTION {accession(entry.collectionNumber)}{' '}
                    <span>{entry.coverTopic || entry.topic}</span>
                  </span>
                  <span className={s.seal} aria-hidden="true">
                    {accession(entry.collectionNumber)}
                  </span>
                  <h3>
                    {(entry.coverLines || [entry.question]).map((line, index) => (
                      <span key={index} className={s.coverLine}>
                        {line}
                      </span>
                    ))}
                  </h3>
                  <p className={s.scope}>{entry.scope}</p>
                  <div className={s.rule} aria-hidden="true">
                    <span>✦</span>
                  </div>
                  <p className={s.english} lang="en">
                    {entry.originalTitle}
                  </p>
                  <span className={s.open}>开启档案</span>
                </button>
                <div className={s.foreEdge} aria-hidden="true" />
              </div>
            ))}
          </div>
        </>
      ) : (
        <article className={s.dossier}>
          <PaperMetadata title={paper.originalTitle} pdf={paper.pdf} />
          <header className={s.title}>
            <span>
              COLLECTION {accession(paper.collectionNumber)} · {paper.topic}
            </span>
            <h2 lang="en">{paper.originalTitle}</h2>
            <p>{paper.correctnessPassed ? '正确性检验通过' : '正确性检验不通过'}</p>
          </header>
          <section className={s.abstract}>
            <h3>Abstract</h3>
            <AbstractContent text={paper.abstract} />
            <p className={s.msc}>MSC {paper.msc.join(' · ')}</p>
          </section>
          <ResearchReviewPreview review={researchReviews.get(paper.id)!} />
          <footer className={s.footer}>
            <span>THE COLLECTION · {accession(paper.collectionNumber)}</span>
            <a
              href={`${assetPath(paper.pdf)}?v=${paper.sha256.slice(0, 16)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              阅读原文
            </a>
          </footer>
        </article>
      )}
    </section>
  );
}
