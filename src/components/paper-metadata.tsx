'use client';
import { useEffect } from 'react';
import { assetPath } from '@/lib/asset-path';

/** Hash views have client metadata only; this does not claim independent indexing. */
export function PaperMetadata({
  title,
  pdf,
  description,
}: {
  title: string;
  pdf?: string;
  description?: string;
}) {
  useEffect(() => {
    const entries = [
      ['citation_title', title],
      ...(pdf ? [['citation_pdf_url', new URL(assetPath(pdf), window.location.origin).href]] : []),
      ['DC.type', 'Text'],
    ];
    const nodes = entries.map(([name, content]) => {
      const meta = document.createElement('meta');
      meta.name = name;
      meta.content = content;
      document.head.append(meta);
      return meta;
    });
    const summary = (description || title).replace(/\s+/g, ' ').trim();
    const updates = [
      ['name', 'description', summary],
      ['property', 'og:title', title],
      ['property', 'og:description', summary],
      ['property', 'og:url', window.location.href],
      ['name', 'twitter:title', title],
      ['name', 'twitter:description', summary],
    ];
    const restore = updates.map(([attribute, key, content]) => {
      const existing = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
      const meta = existing ?? document.createElement('meta');
      const previous = meta.content;
      meta.setAttribute(attribute, key);
      meta.content = content;
      if (!existing) document.head.append(meta);
      return () => {
        if (existing) meta.content = previous;
        else meta.remove();
      };
    });
    return () => {
      nodes.forEach((node) => node.remove());
      restore.forEach((reset) => reset());
    };
  }, [title, pdf, description]);
  return null;
}
