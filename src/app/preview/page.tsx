import Link from 'next/link';
import { PreviewOrbit } from '@/components/preview-orbit';
export const metadata = {
  title: '首页入口预览',
  description: '个人网站首页入口的设计预览。',
  alternates: { canonical: './' },
  openGraph: { title: '首页入口预览 · 果子', description: '个人网站设计预览。', url: './' },
  twitter: { title: '首页入口预览 · 果子', description: '个人网站设计预览。' },
  robots: { index: false, follow: true },
};
export default function Preview() {
  return (
    <>
      <aside
        style={{
          background: '#a9e9e5',
          color: '#143239',
          padding: '9px 20px',
          fontSize: 12,
          textAlign: 'center',
        }}
      >
        本地设计预览 · 右下角为论文工厂入口 · <Link href="/">查看原首页</Link>
      </aside>
      <PreviewOrbit />
    </>
  );
}
