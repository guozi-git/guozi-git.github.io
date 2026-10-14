import data from './research-reviews.json';

export type ResearchReview = (typeof data.papers)[number];
export const researchReviews = new Map(
  data.papers.map((p) => [`P${String(p.id).padStart(3, '0')}`, p]),
);
export const mergedReviews = new Map(
  data.coverage.map((p) => [
    `P${String(p.excluded).padStart(3, '0')}`,
    [p.retained].flat().map((id) => `P${String(id).padStart(3, '0')}`),
  ]),
);
export const academicLevels = [
  ['S0', '无有效研究贡献', '低于 50'],
  ['S1', '基础研究成果', '50 ≤ 分数 < 65'],
  ['S2', '专业领域有效成果', '65 ≤ 分数 < 75'],
  ['S3', '强领域成果', '75 ≤ 分数 < 85'],
  ['S4', '顶级领域成果', '85 ≤ 分数 < 92'],
  ['S5', '领域突破', '92 ≤ 分数 < 97'],
  ['S6', '范式创造', '97 ≤ 分数 ≤ 100'],
] as const;
export const levelDescriptions: Record<string, string> = {
  S1: '存在有效但狭窄的补充或实例；尚不足以支撑更高层次的问题价值。',
  S2: '对特定算法或模型增加了可靠事实，但问题覆盖与方法迁移性仍有限。',
  S3: '具有明确、可供后续研究使用的理论增量；仍需更广的结构结论或更重要问题的闭合。',
  S4: '核心问题与新机制具有明确领域价值；尚未形成足以改变研究路线的普遍框架。',
};
export const originalityLabels: Record<string, string> = {
  O1: '有限补充',
  O2: '受限的新结果',
  O3: '实质理论增量',
  O4: '明确的新贡献',
};
