'use client';
import { useEffect } from 'react';
import { assetPath } from '@/lib/asset-path';

/** Hash views have client metadata only; this does not claim independent indexing. */
export function PaperMetadata({ title, pdf }: { title: string; pdf: string }) {
  useEffect(() => {
    const entries = [
      ['citation_title', title],
      ['citation_pdf_url', new URL(assetPath(pdf), window.location.origin).href],
      ['DC.type', 'Text'],
    ];
    const nodes = entries.map(([name, content]) => {
      const meta = document.createElement('meta');
      meta.name = name;
      meta.content = content;
      document.head.append(meta);
      return meta;
    });
    return () => nodes.forEach((node) => node.remove());
  }, [title, pdf]);
  return null;
}
