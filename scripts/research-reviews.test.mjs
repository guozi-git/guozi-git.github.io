import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { URL } from 'node:url';

const data = JSON.parse(readFileSync(new URL('../src/lib/research-reviews.json', import.meta.url)));
test('78 retained reviews preserve scoring gates and weighted scores', () => {
  assert.equal(data.papers.length, 78);
  assert.equal(data.papers.filter((p) => p.score_eligible).length, 73);
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
