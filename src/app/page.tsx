import { Orbit } from '@/components/orbit';

export default function Home() {
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
