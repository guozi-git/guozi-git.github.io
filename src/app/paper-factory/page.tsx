import type { Metadata } from 'next';
import { FactoryPreview } from '@/components/factory-preview';
export const metadata: Metadata = {
  title: '论文工厂 · 果子的 AI 数学研究展厅',
  description: '从问题出发，让推导接受检验。AI 辅助数学研究展厅。',
  robots: { index: false, follow: false },
};
export default function PaperFactory() {
  return <FactoryPreview />;
}
