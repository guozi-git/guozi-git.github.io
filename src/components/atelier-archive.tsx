'use client';
import { useEffect, useRef, useState } from 'react';
import papers from '@/lib/atelier-papers.json';
import { scoreDimensions } from '@/lib/factory-papers';
import { assetPath } from '@/lib/asset-path';
import { AbstractContent, ScoreRadar } from './factory-preview';
import s from './atelier-archive.module.css';

export function AtelierArchive({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState(false);
  const root = useRef<HTMLElement>(null);
  const paper = papers[0];
  useEffect(() => {
    const sync = () => setSelected(window.location.hash === `#factory/atelier/${paper.id}`);
    const timer = setTimeout(sync, 0);
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, [paper.id]);
  useEffect(() => {
    const panel = root.current?.closest('.detail');
    if (panel) panel.scrollTop = 0;
  }, [selected]);
  function open() {
    window.history.pushState(
      { ...window.history.state, factoryDepth: 2, atelierDetail: true },
      '',
      `#factory/atelier/${paper.id}`,
    );
    setSelected(true);
  }
  function close() {
    if (window.history.state?.atelierDetail) window.history.back();
    else {
      window.history.replaceState({ factoryDepth: 1 }, '', '#factory/atelier');
      setSelected(false);
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
      {!selected ? (
        <>
          <header className={s.masthead}>
            <span>SELECTED MATHEMATICAL WORKS</span>
            <h2>匠心造</h2>
            <p>研究珍藏 · 第一卷</p>
          </header>
          <div className={s.cabinet}>
            <div className={s.spine} aria-hidden="true">
              I · MATHEMATICAL ARCHIVE
            </div>
            <button className={s.folio} onClick={open} aria-label={`打开第一篇：${paper.question}`}>
              <span className={s.accession}>
                COLLECTION 01 <span>动力系统</span>
              </span>
              <span className={s.seal} aria-hidden="true">
                Ⅰ
              </span>
              <h3>
                Nesterov 流<br />
                何时收敛到一点？
              </h3>
              <p className={s.scope}>{paper.scope}</p>
              <div className={s.rule} aria-hidden="true">
                <span>✦</span>
              </div>
              <p className={s.english} lang="en">
                {paper.originalTitle}
              </p>
              <span className={s.open}>
                开启档案 <span aria-hidden="true">↗</span>
              </span>
            </button>
            <div className={s.foreEdge} aria-hidden="true" />
          </div>
        </>
      ) : (
        <article className={s.dossier}>
          <header className={s.title}>
            <span>COLLECTION 01 · 动力系统与差分方程</span>
            <h2 lang="en">{paper.originalTitle}</h2>
            <p>审查通过 · 正确性 5.0 / 5 · 评价置信度：{paper.confidence}</p>
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
                {paper.level.toFixed(1)}
                <small> / 5</small>
              </strong>
              <p>
                稿件成熟度 <b>{paper.maturity.toFixed(1)}</b> / 5
              </p>
            </div>
            <div className={s.radar}>
              <ScoreRadar id="atelier-P089" scores={paper.scores} />
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
                    <b>{paper.scores[i].toFixed(1)}</b>
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
          <footer className={s.footer}>
            <span>THE COLLECTION · 01</span>
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
