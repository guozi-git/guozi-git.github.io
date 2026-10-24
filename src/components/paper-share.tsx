'use client';
import { useState } from 'react';

export function PaperShare() {
  const [message, setMessage] = useState('');
  const [fallback, setFallback] = useState('');
  async function copy() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setMessage('论文链接已复制');
      setFallback('');
    } catch {
      setMessage('请选中下方链接复制');
      setFallback(url);
    }
  }
  return (
    <div className="paper-share">
      <button onClick={copy}>复制论文链接</button>
      <span role="status">{message}</span>
      {fallback && (
        <input
          aria-label="论文链接"
          value={fallback}
          readOnly
          onFocus={(event) => event.currentTarget.select()}
        />
      )}
    </div>
  );
}
