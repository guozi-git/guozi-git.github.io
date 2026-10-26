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
export * from './research-levels';
