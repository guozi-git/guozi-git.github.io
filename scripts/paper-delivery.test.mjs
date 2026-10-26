import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (file) => JSON.parse(readFileSync(file, 'utf8'));
test('delivery catalog excludes detail text and preserves every original review', () => {
  const catalog = read('src/lib/.generated/catalog.json');
  const reviews = read('src/lib/research-reviews.json');
  assert.equal(catalog.factoryPapers.length, 79);
  assert.equal(catalog.reviewBatch.scored, 74);
  assert.equal(catalog.factoryPapers[0].id, 'P046');
  for (const paper of catalog.allFactoryPapers) {
    assert(!('abstract' in paper));
    assert(!('reasons' in paper));
    const detail = read(`src/lib/.generated/papers/${paper.id}.json`);
    assert.equal(detail.paper.id, paper.id);
    const source = reviews.papers.find((r) => r.id === Number(paper.id.slice(1)));
    assert.deepEqual(detail.review, source);
  }
  for (const source of reviews.papers) {
    const id = `P${String(source.id).padStart(3, '0')}`;
    assert.deepEqual(read(`src/lib/.generated/papers/${id}.json`).review, source);
  }
  const originals = [
    ...read('src/lib/factory-papers.json'),
    read('src/lib/research-stage-paper.json'),
    ...read('src/lib/research-additional-papers.json'),
  ];
  for (const source of originals) {
    const detail = read(`src/lib/.generated/papers/${source.id}.json`).paper;
    for (const key of ['originalTitle', 'abstract', 'pdf', 'sha256', 'msc', 'supplement'])
      assert.deepEqual(detail[key], source[key], `${source.id} ${key}`);
  }
});
