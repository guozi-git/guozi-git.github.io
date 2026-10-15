import papers from './factory-papers.json';
import stagePaper from './research-stage-paper.json';
import { researchReviews } from './research-reviews';

export interface FactoryPaper {
  id: string;
  originalTitle: string;
  topic: string;
  symbol: string;
  msc: string[];
  abstract: string;
  limitation: string;
  scores: number[] | null;
  reasons: string[];
  level: number | null;
  maturity: number | null;
  correctness: number;
  confidence: number | null;
  status: string;
  pdf: string;
  pages: number;
  bytes: number;
  sha256: string;
  reviewNote: string;
  scoreScale: number;
  reviewDate: string;
  overall: string;
  levelReason: string;
  maturityReason: string;
  verificationReason: string;
  supplement?: { pdf: string; pages: number; bytes: number; sha256: string };
}

export { scoreDimensions } from './score-dimensions';
// Bibliographic records remain stable; current evaluations come from the 2026-10-14 report.
export const allFactoryPapers: FactoryPaper[] = [
  ...papers,
  {
    ...stagePaper,
    limitation: '',
    scores: null,
    reasons: [],
    level: null,
    maturity: null,
    correctness: 0,
    confidence: null,
    status: '重要证明缺口',
    reviewNote: '',
    scoreScale: 100,
    reviewDate: '2026-10-14',
    overall: '',
    levelReason: '',
    maturityReason: '',
    verificationReason: '',
  },
];
export const factoryPapers: FactoryPaper[] = allFactoryPapers
  .filter((p) => researchReviews.has(p.id))
  .map((p) => {
    const review = researchReviews.get(p.id)!;
    return {
      ...p,
      scores: review.dimensions,
      level: review.research_score,
      maturity: null,
      status: review.correctness === 'C3' ? '通过' : review.correctness_status,
      reviewNote: '',
      reviewDate: '2026-10-14',
    };
  })
  .sort(
    (a, b) =>
      (b.level ?? -1) - (a.level ?? -1) ||
      (b.scores?.[0] ?? -1) - (a.scores?.[0] ?? -1) ||
      (b.scores?.[1] ?? -1) - (a.scores?.[1] ?? -1) ||
      a.id.localeCompare(b.id),
  );
export const reviewBatch = {
  total: factoryPapers.length,
  scored: factoryPapers.filter((p) => p.level !== null).length,
  pending: factoryPapers.filter((p) => p.level === null).length,
};
const topicOrder = [
  '数值分析与优化',
  '动力系统与差分方程',
  '算子与不动点理论',
  '博弈论',
  '概率与随机过程',
];

export const factoryTopics = topicOrder.filter((topic) =>
  papers.some((paper) => paper.topic === topic),
);
