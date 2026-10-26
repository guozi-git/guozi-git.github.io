// Execute the existing, trusted data modules at build time; do not duplicate ranking logic.
import ts from 'typescript';
import vm from 'node:vm';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, extname, sep } from 'node:path';
import { log } from 'node:console';
const sourceRoot = resolve('src/lib');
const modules = new Map();
function loadSource(file) {
  file = resolve(file);
  if (!file.startsWith(sourceRoot + sep)) throw new Error('Source escaped src/lib');
  if (!extname(file)) file += '.ts';
  if (modules.has(file)) return modules.get(file);
  if (file.endsWith('.json')) return JSON.parse(readFileSync(file, 'utf8'));
  const exports = {};
  modules.set(file, exports);
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(
    code,
    {
      exports,
      require: (name) => loadSource(resolve(dirname(file), name)),
    },
    { filename: file },
  );
  return exports;
}
const source = loadSource(resolve(sourceRoot, 'factory-papers.ts'));
const { researchReviews, mergedReviews } = loadSource(resolve(sourceRoot, 'research-reviews.ts'));
const fields = ['id', 'originalTitle', 'topic', 'symbol', 'msc', 'level', 'status'];
const lite = (paper) => Object.fromEntries(fields.map((key) => [key, paper[key]]));
const summaryFields = ['academic_level', 'originality', 'core_score', 'core_contribution_level'];
const catalog = {
  factoryPapers: source.factoryPapers.map(lite),
  allFactoryPapers: source.allFactoryPapers.map(lite),
  factoryTopics: source.factoryTopics,
  reviewBatch: source.reviewBatch,
  reviews: [...researchReviews].map(([id, review]) => [
    id,
    Object.fromEntries(summaryFields.map((key) => [key, review[key]])),
  ]),
  mergedReviews: [...mergedReviews],
};
const folder = resolve(sourceRoot, '.generated');
mkdirSync(resolve(folder, 'papers'), { recursive: true });
writeFileSync(resolve(folder, 'catalog.json'), JSON.stringify(catalog));
const papers = new Map(source.allFactoryPapers.map((paper) => [paper.id, paper]));
for (const paper of source.factoryPapers) papers.set(paper.id, paper);
for (const paper of loadSource(resolve(sourceRoot, 'atelier-papers.json'))) {
  if (!papers.has(paper.id)) papers.set(paper.id, paper);
}
for (const [id, paper] of papers) {
  if (!/^P\d{3}$/.test(id)) throw new Error(`Invalid paper id: ${id}`);
  writeFileSync(
    resolve(folder, `papers/${id}.json`),
    JSON.stringify({ paper, review: researchReviews.get(id) }),
  );
}
writeFileSync(
  resolve(folder, 'loaders.ts'),
  `// Generated from canonical sources. Do not edit.\nexport const loaders: Record<string, () => Promise<unknown>> = {\n${[...papers.keys()].map((id) => `'${id}': () => import('./papers/${id}.json').then(m => m.default),`).join('\n')}\n};\n`,
);
log(
  `Paper delivery: ${catalog.factoryPapers.length} catalog entries; ${papers.size} isolated details; canonical source data unchanged.`,
);
