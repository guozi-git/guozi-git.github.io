import { Orbit } from '@/components/orbit';
import { preload } from 'react-dom';
import earth from '../../public/scenes/photos/nasa-earth.webp';

export default function Home() {
  preload(earth.src, { as: 'image', fetchPriority: 'high' });
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  return (
    <>
      {site && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: '果子 · 个人网站',
              url: `${site.replace(/\/$/, '')}/`,
              inLanguage: 'zh-CN',
            }).replace(/</g, '\\u003c'),
          }}
        />
      )}
      <Orbit />
    </>
  );
}
