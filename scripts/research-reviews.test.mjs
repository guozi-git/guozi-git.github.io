import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { URL } from 'node:url';

const data = JSON.parse(readFileSync(new URL('../src/lib/research-reviews.json', import.meta.url)));
test('80 retained reviews preserve scoring gates and weighted scores', () => {
  assert.equal(data.papers.length, 80);
  assert.equal(data.papers.filter((p) => p.score_eligible).length, 75);
  assert.equal(data.papers.filter((p) => p.correctness === null).length, 4);
  assert.equal(data.papers.filter((p) => p.correctness === 'C2').length, 1);
  for (const p of data.papers) {
    if (p.score_eligible) {
      const weighted =
        p.dimensions.reduce((sum, n, i) => sum + n * [30, 25, 20, 15, 10][i], 0) / 100;
      assert.equal(p.research_score, weighted, p.id);
      assert.equal(p.correctness, 'C3');
      const expected = ['S0', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6'][
        [50, 65, 75, 85, 92, 97, 101].findIndex((n) => weighted < n)
      ];
      assert.equal(p.academic_level, expected);
    } else {
      assert.equal(p.dimensions, null);
      assert.equal(p.research_score, null);
      assert.equal(p.academic_level, null);
      assert.match(p.core_scope, /子结果/);
    }
    assert(!('source_path' in p));
    assert(!('audit_evidence' in p));
    assert(!('human_research_value' in p));
  }
});
test('coverage records point only to retained reviews', () => {
  const ids = new Set(data.papers.map((p) => p.id));
  assert.equal(data.coverage.length, 11);
  for (const row of data.coverage) {
    assert(!ids.has(row.excluded));
    for (const id of [row.retained].flat()) assert(ids.has(id));
  }
});

test('mechanics reviews retain supplied scores without inventing a core score', () => {
  for (const [id, dimensions, score] of [
    [92, [88, 81, 93, 65, 88], 83.8],
    [93, [84, 73, 94, 51, 82], 78.1],
  ]) {
    const review = data.papers.find((p) => p.id === id);
    assert(review, `Missing P${id}`);
    assert.deepEqual(review.dimensions, dimensions);
    assert.equal(review.research_score, score);
    assert.equal(review.core_score, null);
    assert.equal(review.core_contribution_level, 'C-S3');
    assert.equal(review.dimension_reasons.length, 5);
    assert.equal(review.review_date, '2026-10-15');
  }
});

test('additional manuscripts have unique IDs, intact public PDFs and English originals', async () => {
  const { createHash } = await import('node:crypto');
  const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));
  const additional = read('../src/lib/research-additional-papers.json');
  const old = read('../src/lib/factory-papers.json');
  const stage = read('../src/lib/research-stage-paper.json');
  const ids = [...old, stage, ...additional].map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  const allow = read('./public-assets.json');
  for (const p of additional) {
    assert.match(p.originalTitle, /^[A-Za-z][\x20-\x7e]+$/);
    assert.equal(p.topic, '数学力学与非线性动力学');
    assert(p.abstract.length > 500);
    assert(allow.includes(p.pdf.slice(1)));
    const pdf = readFileSync(new URL(`../public${p.pdf}`, import.meta.url));
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
    assert.equal(pdf.length, p.bytes);
    assert.equal(createHash('sha256').update(pdf).digest('hex'), p.sha256);
  }
});
