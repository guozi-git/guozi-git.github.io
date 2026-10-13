import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';
import { compareFactoryPapers } from '../src/lib/factory-order.ts';

const papers = JSON.parse(
  await readFile(new URL('../src/lib/factory-papers.json', import.meta.url), 'utf8'),
);
test('review snapshot preserves the supplied gate, ranking and 100-point scale', () => {
  assert.equal(papers.length, 87);
  assert.equal(papers.filter((p) => p.status === '通过').length, 83);
  assert.deepEqual(
    papers.filter((p) => p.status === '有条件通过').map((p) => p.id),
    ['P017'],
  );
  const pending = papers.filter((p) => p.scores === null);
  assert.deepEqual(pending.map((p) => p.id).sort(), ['P014', 'P015', 'P016']);
  assert(pending.every((p) => p.level === null && !p.reasons.length));
  const ranked = [...papers].sort(compareFactoryPapers);
  assert.deepEqual(
    ranked.slice(0, 7).map((p) => p.id),
    ['P062', 'P018', 'P041', 'P026', 'P088', 'P034', 'P066'],
  );
  const first = ranked[0];
  assert.deepEqual([first.level, first.maturity, ...first.scores], [90, 89, 88, 88, 93, 92, 91]);
  for (const p of papers) {
    assert.equal(p.scoreScale, 100);
    assert.equal(p.reviewDate, '2026-10-13');
    assert(p.overall && p.verificationReason);
  }
});

test('ties compare all three review dimensions before stable ID; unscored stays last', () => {
  const p = (id, scores, level = 80) => ({ id, scores, level });
  const input = [
    p('P001', [85, 84, 84]),
    p('P009', [86, 80, 80]),
    p('P004', [85, 85, 85]),
    p('P003', [85, 85, 85]),
    p('P005', [85, 85, 86]),
    p('P000', null, null),
  ];
  assert.deepEqual(
    input.sort(compareFactoryPapers).map((p) => p.id),
    ['P009', 'P005', 'P003', 'P004', 'P001', 'P000'],
  );
});

test('revised manuscripts and Burg supplement have matching public versions', () => {
  for (const [id, pages] of [
    ['P045', 23],
    ['P062', 42],
    ['P066', 17],
    ['P088', 40],
  ]) {
    assert.equal(papers.find((p) => p.id === id).pages, pages);
  }
  const burg = papers.find((p) => p.id === 'P088');
  assert.equal(burg.supplement.pages, 83);
  assert.equal(burg.supplement.pdf, '/papers/P088-supplement.pdf');
});
