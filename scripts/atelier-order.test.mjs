import test from 'node:test';
import assert from 'node:assert/strict';
import { orderAtelierPapers } from '../src/lib/atelier-order.ts';

test('manual priority takes precedence over scores and preserves accession order on ties', () => {
  const papers = [
    { id: 'A', collectionNumber: 1, priority: 30, level: 5 },
    { id: 'C', collectionNumber: 3, priority: 10, level: 3 },
    { id: 'B', collectionNumber: 2, priority: 10, level: 4 },
    { id: 'D', collectionNumber: 4, level: 5 },
  ];
  assert.deepEqual(
    orderAtelierPapers(papers).map((p) => p.id),
    ['B', 'C', 'A', 'D'],
  );
  assert.deepEqual(
    papers.map((p) => p.id),
    ['A', 'C', 'B', 'D'],
  );
  assert.equal(orderAtelierPapers(papers)[0].collectionNumber, 2);
});

test('empty collection and unprioritized new papers remain valid', () => {
  assert.deepEqual(orderAtelierPapers([]), []);
  assert.deepEqual(
    orderAtelierPapers([
      { id: 'B', collectionNumber: 2 },
      { id: 'A', collectionNumber: 1 },
    ]).map((p) => p.id),
    ['A', 'B'],
  );
});
