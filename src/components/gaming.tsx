'use client';

import { assetPath } from '@/lib/asset-path';
import Image from 'next/image';
import { hearthstoneNotes } from '@/lib/hearthstone';
import { csMemories } from '@/lib/cs-memories';

import { CsCollection } from '@/components/cs-collection';
import { Devices } from '@/components/devices';

const games = [
  { id: 'devices', name: '设备', label: 'MY SETUP', mark: 'SETUP', number: '01' },
  { id: 'cs', name: 'CS', label: 'COUNTER-STRIKE', mark: 'CS', number: '02' },
  { id: 'hearthstone', name: '炉石传说', label: 'HEARTHSTONE', mark: '炉石', number: '03' },
];

export function Gaming() {
  return (
    <section
      className="gaming-page"
      aria-labelledby="gaming-title"
      onKeyDown={(event) => {
        const opened = event.currentTarget.querySelector<HTMLDetailsElement>('details[open]');
        if (event.key === 'Escape' && opened) {
          event.preventDefault();
          event.stopPropagation();
          opened.open = false;
          opened.querySelector('summary')?.focus();
        }
      }}
    >
      <div className="gaming-heading">
        <p className="eyebrow">STILL PLAYING</p>
        <h3 id="gaming-title">我的游戏角落。</h3>
        <p>我的设备，还有陪我最久的两个游戏。</p>
      </div>
      <div className="game-grid">
        {games.map((game) => (
          <details className={`game-card game-${game.id}`} key={game.id}>
            <summary>
              <div className="game-art" aria-hidden="true">
                <span>{game.mark}</span>
                <i />
              </div>
              <div className="game-card-heading">
                <span className="eyebrow">
                  {game.number} / {game.label}
                </span>
                <h4>{game.name}</h4>
                <span className="game-card-hint">
                  {game.id === 'devices'
                    ? '桌面 · 主机 · 外设'
                    : game.id === 'cs'
                      ? '留下的瞬间 · 收藏与偏好'
                      : '天梯 · 酒馆'}
                </span>
                <span className="game-return">收起并返回游戏列表</span>
                <span className="game-open" aria-hidden="true">
                  ＋
                </span>
              </div>
            </summary>
            <div className="game-sections">
              {game.id === 'devices' ? (
                <Devices />
              ) : game.id === 'hearthstone' ? (
                <div className="hearthstone-notes">
                  <p className="hearthstone-preface">
                    国服“离家出走”之后，大多数据都找不回来了，只剩回忆。先把还记得的留在这里。
                  </p>
                  {hearthstoneNotes.map((section) => (
                    <section key={section.id}>
                      <span className="eyebrow">{section.english}</span>
                      <h5>{section.title}</h5>
                      <p>{section.introduction}</p>
                      <a
                        className="hearthstone-screenshot"
                        href={assetPath(section.image)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`查看${section.title}截图大图（新标签页）`}
                      >
                        <Image
                          src={assetPath(section.image)}
                          alt={section.imageAlt}
                          width={2560}
                          height={1440}
                          sizes="(max-width: 600px) 85vw, 850px"
                        />
                      </a>
                      {section.entries.map((entry) => (
                        <article key={entry.id}>
                          <h6>{entry.title}</h6>
                          <p>{entry.text}</p>
                        </article>
                      ))}
                    </section>
                  ))}
                  <p className="hearthstone-later">还有很多回忆，之后慢慢补。</p>
                </div>
              ) : (
                <>
                  <section>
                    <span className="eyebrow">{game.id === 'cs' ? 'MOMENTS' : 'RANKED'}</span>
                    <h5>{game.id === 'cs' ? '留下的瞬间' : '天梯'}</h5>
                    <div className="cs-memories">
                      {csMemories.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  </section>
                  <section>
                    <span className="eyebrow">
                      {game.id === 'cs' ? 'FAVORITES' : 'BATTLEGROUNDS'}
                    </span>
                    <h5>{game.id === 'cs' ? '收藏与偏好' : '酒馆'}</h5>
                    {game.id === 'cs' ? <CsCollection /> : <p>暂时留白。</p>}
                  </section>
                </>
              )}
            </div>
            <button
              className="paper-back game-bottom-back"
              onClick={(event) => {
                const card = event.currentTarget.closest('details')!;
                card.open = false;
                card.querySelector('summary')?.focus();
              }}
            >
              返回游戏列表
            </button>
          </details>
        ))}
      </div>
    </section>
  );
}
