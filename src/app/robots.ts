import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';
export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  // Do not block crawling: local/preview noindex remains readable in page metadata.
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap:
      site && process.env.INDEX_SITE === 'true'
        ? new URL('sitemap.xml', `${site.replace(/\/$/, '')}/`).href
        : undefined,
  };
}
