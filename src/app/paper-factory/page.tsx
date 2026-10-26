import { StartupRecovery } from '@/components/startup-recovery';
import type { Metadata } from 'next';
import { FactoryGateway as FactoryPreview } from '@/components/factory-gateway';
export const metadata: Metadata = {
  title: '论文工厂 · 果子的 AI 数学研究展厅',
  description: '从问题出发，让推导接受检验。AI 辅助数学研究展厅。',
  alternates: { canonical: './' },
  openGraph: {
    title: '论文工厂 · 果子的 AI 数学研究展厅',
    description: 'AI 辅助数学研究稿件、独立评价与原文阅读；展示不代表正式发表。',
    url: './',
    images: [{ url: './share-cover.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '论文工厂 · 果子',
    description: 'AI 辅助数学研究稿件、独立评价与原文阅读。',
    images: ['./share-cover.png'],
  },
};
export default function PaperFactory() {
  return (
    <>
      <StartupRecovery />
      <FactoryPreview />
    </>
  );
}
