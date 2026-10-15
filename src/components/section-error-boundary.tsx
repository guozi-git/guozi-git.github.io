'use client';

import { Component, useEffect, useRef, type ReactNode } from 'react';
import s from './section-loading.module.css';

type Props = { name: string; onBack: () => void; children: ReactNode };

function Recovery({ name, onBack }: Omit<Props, 'children'>) {
  const retry = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    retry.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div className={s.recovery}>
      <div role="alert" aria-label="内容加载失败">
        <h3>{name}暂时无法载入</h3>
        <p>请检查网络后重新加载，或先返回上一级。重新加载会保留当前页面位置。</p>
      </div>
      <div className={s.actions}>
        <button ref={retry} onClick={() => window.location.reload()}>
          重新加载此页
        </button>
        <button onClick={onBack}>返回上一级</button>
      </div>
    </div>
  );
}

/** Keep failed lazy modules inside their section. A deliberate reload also recovers stale chunks. */
export class SectionErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? (
      <Recovery name={this.props.name} onBack={this.props.onBack} />
    ) : (
      this.props.children
    );
  }
}
