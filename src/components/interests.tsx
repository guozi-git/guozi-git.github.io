'use client';
import { reducedMotion } from '@/lib/motion';

import { assetPath } from '@/lib/asset-path';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Swimming } from '@/components/swimming';
import { Gaming } from '@/components/gaming';
import { kit } from '@/lib/equipment';
import { Player, equipment } from '@/components/badminton-player';

const hobbies = [
  { id: 'badminton', name: '羽毛球', english: 'BADMINTON', note: '中羽等级 L3.5–4', number: '01' },
  {
    id: 'swimming',
    name: '游泳',
    english: 'SWIMMING',
    note: '每周二、周四 · 水里的记录',
    number: '02',
  },
  { id: 'gaming', name: '游戏', english: 'GAMING', note: '设备 · CS · 炉石传说', number: '03' },
] as const;
type Hobby = (typeof hobbies)[number];
type Equipment = (typeof equipment)[number];
function fromHash() {
  return hobbies.find((hobby) => window.location.hash === `#interests/${hobby.id}`) ?? null;
}

export function Interests() {
  const [selected, setSelected] = useState<Hobby | null>(fromHash);
  const [gear, setGear] = useState<Equipment | null>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const previousHobby = useRef<string | null>(null);
  const previousGear = useRef<string | null>(null);

  useEffect(() => {
    const sync = () => {
      setSelected(fromHash());
      setGear(null);
    };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  useEffect(() => {
    const region = regionRef.current;
    if (!region) return;
    if (selected) {
      previousHobby.current = selected.id;
      region.querySelector<HTMLButtonElement>('.hobby-back')?.focus({ preventScroll: true });
    } else if (previousHobby.current)
      region
        .querySelector<HTMLButtonElement>(`[data-hobby="${previousHobby.current}"]`)
        ?.focus({ preventScroll: true });
    if (!reducedMotion()) {
      const animation = region.animate(
        [
          { opacity: 0, transform: 'translateY(12px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 350, easing: 'ease-out' },
      );
      return () => animation.cancel();
    }
  }, [selected]);

  useEffect(() => {
    const region = regionRef.current;
    if (gear) {
      previousGear.current = gear.id;
      const description = region?.querySelector<HTMLElement>('.equipment-description');
      description?.focus({ preventScroll: true });
      description?.scrollIntoView({
        behavior: reducedMotion() ? 'instant' : 'smooth',
        block: 'nearest',
      });
    } else if (previousGear.current)
      region
        ?.querySelector<HTMLButtonElement>(`[data-equipment="${previousGear.current}"]`)
        ?.focus({ preventScroll: true });
  }, [gear]);

  function open(hobby: Hobby) {
    window.history.pushState(
      { ...window.history.state, interestDetail: true },
      '',
      `#interests/${hobby.id}`,
    );
    setSelected(hobby);
    setGear(null);
  }
  function back() {
    setGear(null);
    if (window.history.state?.interestDetail) window.history.back();
    else {
      window.history.replaceState(window.history.state, '', '#interests');
      setSelected(null);
    }
  }

  return (
    <div
      ref={regionRef}
      className="interests-content"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && (gear || selected)) {
          event.preventDefault();
          event.stopPropagation();
          if (gear) setGear(null);
          else back();
        }
      }}
    >
      {!selected ? (
        <>
          <div className="hobbies-heading">
            <span className="eyebrow">OFF THE PAGE</span>
            <h3>生活的另外几个切面。</h3>
            <p className="hobbies-intro">
              我的兴趣爱好其实远不止这些。本科期间，我还经常和朋友一起打乒乓球，出去玩时偶尔也会打会儿台球。我是一个很乐意接触新鲜事物的人，还有很多有趣的事情想去试试。
            </p>
          </div>
          <div className="hobby-stack">
            {hobbies.map((hobby) => (
              <button
                className={`hobby-row hobby-${hobby.id}`}
                data-hobby={hobby.id}
                key={hobby.id}
                onClick={() => open(hobby)}
              >
                <span className="hobby-symbol">
                  <Image
                    src={assetPath(`/interests/${hobby.id}.webp`)}
                    alt=""
                    fill
                    sizes="(max-width: 600px) 110px, 200px"
                  />
                </span>
                <span className="hobby-row-copy">
                  <span>
                    {hobby.number} / {hobby.english}
                  </span>
                  <strong>{hobby.name}</strong>
                  <span>{hobby.note}</span>
                </span>
                <span className="hobby-row-arrow" aria-hidden="true">
                  ↗
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <button className="paper-back hobby-back" onClick={back}>
            返回兴趣列表
          </button>
          {selected.id === 'badminton' ? (
            <>
              <div className="equipment-heading">
                <div>
                  <p className="eyebrow">BADMINTON / THE KIT</p>
                  <h3>羽毛球 · 装备一览</h3>
                </div>
                <span>点击装备卡片，查看介绍</span>
              </div>
              <div className="equipment-board">
                <Player selected={gear?.id} />
                {equipment.map((item) => (
                  <button
                    key={item.id}
                    data-equipment={item.id}
                    className={`equipment-card equipment-${item.id}${gear?.id === item.id ? ' selected' : ''}`}
                    onClick={() => setGear(item)}
                    aria-expanded={gear?.id === item.id}
                    aria-controls={gear?.id === item.id ? 'equipment-description' : undefined}
                  >
                    <span className="equipment-card-number">{item.number}</span>
                    <strong>{item.name}</strong>
                    <span className="equipment-card-label">{item.label}</span>
                    <span className="equipment-card-status">
                      {kit[item.id].length} 件装备 <span aria-hidden="true">↗</span>
                    </span>
                  </button>
                ))}
              </div>
              {gear && (
                <section
                  id="equipment-description"
                  className="equipment-description"
                  tabIndex={-1}
                  aria-labelledby="equipment-name"
                >
                  <button
                    className="equipment-close"
                    onClick={() => setGear(null)}
                    aria-label="收起装备介绍"
                  >
                    ×
                  </button>
                  <span className="eyebrow">
                    {gear.number} / {gear.label}
                  </span>
                  <h4 id="equipment-name">{gear.name}</h4>
                  <div className="kit-list">
                    {[...kit[gear.id]]
                      .sort(
                        (a, b) => Number(a.status === 'retired') - Number(b.status === 'retired'),
                      )
                      .map((item) => (
                        <article className="kit-item" key={item.id} data-kit={item.id}>
                          <div className={`kit-status kit-status-${item.status}`}>
                            <span>状态</span>
                            <strong>{item.status === 'active' ? '服役中' : '已退役'}</strong>
                          </div>
                          <div className="kit-photo">
                            {item.image ? (
                              <Image
                                src={assetPath(item.image)}
                                alt={`${item.name} ${item.note}`}
                                width={300}
                                height={300}
                                sizes="(max-width: 600px) 75vw, 300px"
                              />
                            ) : (
                              <span>图片待确认</span>
                            )}
                          </div>
                          <div className="kit-copy">
                            <h5>{item.name}</h5>
                            <p>{item.note}</p>
                          </div>
                        </article>
                      ))}
                  </div>
                </section>
              )}
            </>
          ) : selected.id === 'swimming' ? (
            <Swimming />
          ) : (
            <Gaming />
          )}
        </>
      )}
    </div>
  );
}
