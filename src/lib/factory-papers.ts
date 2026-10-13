import papers from './factory-papers.json';
import { compareFactoryPapers } from './factory-order';

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

export const reviewBatch = {
  total: papers.length,
  passed: papers.filter((paper) => paper.status === '通过').length,
  conditional: papers.filter((paper) => paper.status === '有条件通过').length,
  pending: papers.filter((paper) => paper.status === '待确认').length,
  scored: papers.filter((paper) => paper.scores !== null).length,
};
export const scoreDimensions = [
  {
    name: '创新性',
    description:
      '考察相对已有文献的实质增量：是否提出新结论、新机制或新方法，而不把已有结果的改写计作创新。',
  },
  {
    name: '学术意义',
    description:
      '考察问题的重要性与结果的推动作用：是否回应明确未决问题、解释关键现象，或补足现有理论的缺口。',
  },
  {
    name: '技术深度',
    description:
      '考察证明中克服的核心困难与方法深度。推导篇幅、公式数量或计算复杂本身不等于技术贡献。',
  },
  {
    name: '一般性',
    description:
      '考察结论适用的对象与假设范围：能否覆盖自然的一类问题，以及对维数、初始化、参数和结构有何限制。',
  },
  {
    name: '内容完整度',
    description: '考察定理与证明是否闭合，关键边界和反例是否处理充分，并清楚说明尚未解决的情况。',
  },
] as const;
// Scores follow each manuscript’s supplied review; unscored manuscripts sort last.
export const factoryPapers: FactoryPaper[] = [...papers].sort(compareFactoryPapers);
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
