'use client';
import { reducedMotion } from '@/lib/motion';

import { assetPath } from '@/lib/asset-path';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

const detailHash = '#projects/personal-website';

export function Projects() {
  const [expanded, setExpanded] = useState(() => window.location.hash === detailHash);
  const regionRef = useRef<HTMLDivElement>(null);
  const openedRef = useRef(false);

  useEffect(() => {
    const sync = () => setExpanded(window.location.hash === detailHash);
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  useEffect(() => {
    const region = regionRef.current;
    if (!region) return;
    if (expanded) {
      openedRef.current = true;
      region.querySelector<HTMLButtonElement>('.project-back')?.focus({ preventScroll: true });
    } else if (openedRef.current)
      region.querySelector<HTMLButtonElement>('.project-card')?.focus({ preventScroll: true });
    if (!reducedMotion()) {
      const animation = region.animate(
        [
          { opacity: 0, transform: 'translateY(12px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 175, easing: 'ease-out' },
      );
      return () => animation.cancel();
    }
  }, [expanded]);

  function open() {
    window.history.pushState({ ...window.history.state, projectDetail: true }, '', detailHash);
    setExpanded(true);
  }
  function back() {
    if (window.history.state?.projectDetail) window.history.back();
    else {
      window.history.replaceState(window.history.state, '', '#projects');
      setExpanded(false);
    }
  }

  return (
    <div
      ref={regionRef}
      className="projects-content"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && expanded) {
          event.preventDefault();
          event.stopPropagation();
          back();
        }
      }}
    >
      {expanded ? (
        <article className="project-detail" aria-labelledby="project-title">
          <button className="paper-back project-back" onClick={back}>
            返回作品列表
          </button>
          <div className="project-detail-top">
            <span className="project-status">
              <span /> 制作中
            </span>
            <span className="eyebrow">PROJECT 01 / PERSONAL WEBSITE</span>
          </div>
          <h3 id="project-title">果子的个人网站</h3>
          <p className="project-introduction">你正在浏览的，就是我的第一件作品。</p>
          <Image
            className="project-detail-image"
            src={assetPath('/personal-website-preview.webp')}
            alt="个人网站的圆环首页：中心照片与兴趣、论文、造物、随笔四个入口"
            width={1440}
            height={1000}
            sizes="(max-width: 600px) 85vw, 790px"
          />
          <div className="project-story">
            <section>
              <p className="eyebrow">WHY I MADE IT</p>
              <h4>从一个想法开始</h4>
              <p>
                做一个属于自己的小空间，向别人介绍自己，也把兴趣、论文和以后做出的小东西放在一起。
              </p>
            </section>
            <section>
              <p className="eyebrow">A LITTLE DIFFERENT</p>
              <h4>像翻开一个角落</h4>
              <p>
                用中心照片和四段圆环组织内容。点击一个区域，它就平滑展开；返回时，再收回原来的位置。
              </p>
            </section>
          </div>
          <section className="project-progress">
            <h4>目前已经做好的部分</h4>
            <ul>
              <li>照片、昵称与简单的自我介绍</li>
              <li>三篇论文的卡片、简介与原文入口</li>
              <li>兴趣列表与羽毛球装备示意交互</li>
              <li>游泳数据图表、游戏收藏与桌面设备</li>
              <li>炉石与 CS 回忆，以及第一篇随笔</li>
              <li>展开、返回动画与手机布局</li>
            </ul>
          </section>
          <p className="project-next">还在慢慢完善：记录新的经历，补充小作品，再打磨细节。</p>
        </article>
      ) : (
        <>
          <div className="hobbies-heading">
            <span className="eyebrow">MADE OUT OF CURIOSITY</span>
            <h3>从第一件小作品开始。</h3>
            <p className="projects-intro">
              这里放着我突发奇想攒的小玩意儿。我的兴趣挺广：可能做个视频、搓个
              App，也可能搭个网页。想到什么，就试着做点什么。
            </p>
          </div>
          <button className="project-card" onClick={open} aria-label="查看作品：果子的个人网站">
            <div className="project-cover">
              <Image
                src={assetPath('/personal-website-preview.webp')}
                alt="果子的个人网站首页预览"
                width={1440}
                height={1000}
                sizes="(max-width: 600px) 85vw, 440px"
              />
              <span className="project-cover-label">01 / FIRST PROJECT</span>
            </div>
            <div className="project-card-copy">
              <span className="project-status">
                <span /> 制作中
              </span>
              <h3>果子的个人网站</h3>
              <p>一个用圆环展开的个人空间，放下自我介绍、兴趣、论文和慢慢积累的小作品。</p>
              <span className="project-card-link">
                看看这件作品 <span aria-hidden="true">↗</span>
              </span>
            </div>
          </button>
          <p className="projects-footnote">第一件作品，也是更多想法的起点。</p>
        </>
      )}
    </div>
  );
}
