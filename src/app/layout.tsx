import type { Metadata } from 'next';
import { preload } from 'react-dom';
import { MotionToggle } from '@/components/motion-toggle';
import { assetPath } from '@/lib/asset-path';
import '@/styles/globals.css';

const title = '果子 · 个人网站';
const description =
  '你好，我是果子。这里记录我的数学研究、兴趣爱好、突发奇想的小作品，以及 AI 辅助数学研究的探索。';
const publicUrl = process.env.NEXT_PUBLIC_SITE_URL;
const siteUrl = new URL(
  `${(publicUrl || `http://127.0.0.1:3000${process.env.NEXT_PUBLIC_BASE_PATH || ''}`).replace(/\/$/, '')}/`,
);
const shareImage = new URL('share-cover.png', siteUrl).href;

export const metadata: Metadata = {
  title: { default: title, template: '%s · 果子' },
  description,
  metadataBase: siteUrl,
  alternates: publicUrl ? { canonical: siteUrl.href } : undefined,
  icons: { icon: assetPath('/favicon.svg'), apple: assetPath('/apple-touch-icon.png') },
  openGraph: {
    type: 'website',
    title,
    description,
    locale: 'zh_CN',
    siteName: title,
    url: publicUrl ? siteUrl.href : undefined,
    images: [
      {
        url: shareImage,
        width: 1200,
        height: 630,
        alt: '果子的个人网站：兴趣、论文、造物与论文工厂',
      },
    ],
  },
  twitter: { card: 'summary_large_image', title, description, images: [shareImage] },
  robots: { index: !!publicUrl && process.env.INDEX_SITE === 'true', follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  preload(assetPath('/fonts/factory-script-subset.otf'), {
    as: 'font',
    type: 'font/otf',
    crossOrigin: 'anonymous',
  });
  return (
    <html lang="zh-CN">
      <head>
        <style>{`@font-face{font-family:'Factory Script';src:url('${assetPath('/fonts/factory-script-subset.otf')}') format('opentype');font-display:swap;font-weight:400;font-style:normal;}`}</style>
      </head>
      <body>
        {children}
        <MotionToggle />
      </body>
    </html>
  );
}
