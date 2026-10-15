import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';
export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (!site || process.env.INDEX_SITE !== 'true') return [];
  return ['', 'paper-factory/'].map((path) => ({
    url: new URL(path, `${site.replace(/\/$/, '')}/`).href,
  }));
}
