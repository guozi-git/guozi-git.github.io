import catalog from './.generated/catalog.json';
import type { FactoryPaper } from './factory-papers';
import type { ResearchReview } from './research-reviews';
type Entry = Pick<
  FactoryPaper,
  'id' | 'originalTitle' | 'topic' | 'symbol' | 'msc' | 'level' | 'status'
>;
type Summary = Pick<
  ResearchReview,
  'academic_level' | 'originality' | 'core_score' | 'core_contribution_level'
>;
export const factoryPapers = catalog.factoryPapers as Entry[];
export const allFactoryPapers = catalog.allFactoryPapers as Entry[];
export const factoryTopics = catalog.factoryTopics;
export const reviewBatch = catalog.reviewBatch;
export const researchReviews = new Map(catalog.reviews as [string, Summary][]);
export const mergedReviews = new Map(catalog.mergedReviews as [string, string[]][]);
