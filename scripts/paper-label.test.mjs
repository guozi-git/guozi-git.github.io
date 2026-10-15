import test from 'node:test';
import assert from 'node:assert/strict';
import { rankLabel } from '../src/lib/paper-label.ts';
test('rank label changes display only; unranked manuscripts have no fake rank', () => {
  const ranks = new Map([
    ['P046', 1],
    ['P088', 2],
  ]);
  assert.equal(rankLabel('P088', ranks), 'P002');
  assert.equal(rankLabel('P046', ranks), 'P001');
  assert.equal(rankLabel('P014', ranks), '未排名');
  assert.equal(ranks.get('P088'), 2);
});
