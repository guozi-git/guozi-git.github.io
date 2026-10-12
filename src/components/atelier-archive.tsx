'use client';
import { useEffect, useRef, useState } from 'react';
import papers from '@/lib/atelier-papers.json';
import { orderAtelierPapers } from '@/lib/atelier-order';
import { scoreDimensions } from '@/lib/factory-papers';
import { assetPath } from '@/lib/asset-path';
import { AbstractContent, ScoreRadar } from './factory-preview';
import s from './atelier-archive.module.css';

const collection = orderAtelierPapers(papers);
const accession = (number: number) => String(number).padStart(2, '0');

export function AtelierArchive({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const root = useRef<HTMLElement>(null);
  const paper = collection.find((entry) => entry.id === selected);
  useEffect(() => {
    const sync = () => {
      const match = collection.find(
        (entry) => window.location.hash === `#factory/atelier/${entry.id}`,
      );
      setSelected(match?.id ?? null);
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
      {!paper ? (
        <>
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
                  <span className={s.open}>
                    开启档案 <span aria-hidden="true">↗</span>
                  </span>
                </button>
                <div className={s.foreEdge} aria-hidden="true" />
              </div>
            ))}
          </div>
        </>
      ) : (
        <article className={s.dossier}>
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
          <section className={s.evaluation} aria-label="综合评价">
            <div className={s.verdict}>
              <span>研究水平</span>
              <strong>
                {paper.level}
                <small> / {paper.scoreScale}</small>
              </strong>
              <p>
                稿件成熟度 <b>{paper.maturity}</b> / {paper.scoreScale}
              </p>
            </div>
            <div className={s.radar}>
              <ScoreRadar
                id={`atelier-${paper.id}`}
                scores={paper.scores}
                maxScore={paper.scoreScale}
              />
            </div>
          </section>
          <section className={s.reasons}>
            <h3>
              评价依据 <span>ASSESSMENT</span>
            </h3>
            <dl>
              {scoreDimensions.map((d, i) => (
                <div key={d.name}>
                  <dt>
                    {d.name}
                    <b>{paper.scores[i]}</b>
                  </dt>
                  <dd>{paper.reasons[i]}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className={s.limits}>
            <h3>适用范围与局限</h3>
            <p>{paper.limitation}</p>
          </section>
          <section className={s.limits}>
            <h3>整体评价</h3>
            <p>{paper.overallAssessment}</p>
          </section>
          <footer className={s.footer}>
            <span>THE COLLECTION · {accession(paper.collectionNumber)}</span>
            <a
              href={`${assetPath(paper.pdf)}?v=${paper.sha256.slice(0, 16)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              阅读原文 ↗
            </a>
          </footer>
        </article>
      )}
    </section>
  );
}
