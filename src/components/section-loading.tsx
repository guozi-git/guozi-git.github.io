'use client';
import { useEffect, useState } from 'react';
import s from './section-loading.module.css';

export function SectionLoading({ name, factory = false }: { name: string; factory?: boolean }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 8000);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div className={`${s.loading} ${factory ? s.factory : ''}`}>
      <div role="status">正在载入{name}…</div>
      {slow && (
        <div className={s.slow}>
          <p>加载比平时慢，可以继续等待；若一直没有响应，请重新加载。也可以用上方按钮返回。</p>
          <div className={s.actions}>
            <button onClick={() => window.location.reload()}>重新加载此页</button>
          </div>
        </div>
      )}
    </div>
  );
}
