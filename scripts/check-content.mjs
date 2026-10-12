import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { log } from 'node:console';
import assert from 'node:assert/strict';
import { csCollection, favoriteCombination, otherCollection } from '../src/lib/cs-collection.ts';
import { swims } from '../src/lib/swimming.ts';
import { posts } from '../src/lib/posts.ts';
import { hearthstoneNotes } from '../src/lib/hearthstone.ts';
import { kit } from '../src/lib/equipment.ts';
function unique(rows, key) {
  assert.equal(new Set(rows.map((r) => r[key])).size, rows.length, `Duplicate ${key}`);
}
unique(csCollection, 'id');
unique(swims, 'date');
unique(posts, 'id');
for (const item of csCollection) {
  assert(
    existsSync(`public/cs/${item.id === 'gamma' ? 'gamma-inspect' : item.id}.webp`),
    `Missing image: ${item.id}`,
  );
  assert(!('price' in item), 'Do not store prices');
}
for (const id of favoriteCombination) assert(csCollection.some((i) => i.id === id));
assert(
  otherCollection.every((i) => !favoriteCombination.includes(i.id)),
  'Favorites duplicated',
);
for (const entries of Object.values(kit))
  for (const item of entries)
    if (item.image) assert(existsSync('public' + item.image), `Missing ${item.image}`);
for (const entry of swims) {
  assert(/^\d{4}-\d{2}-\d{2}$/.test(entry.date) && Number.isFinite(Date.parse(entry.date)));
  assert(/^\d+:[0-5]\d$/.test(entry.duration));
  for (const key of ['distance', 'pace', 'fastest', 'laps', 'strokes', 'activeCalories'])
    assert(Number.isFinite(entry[key]) && entry[key] >= 0, `Invalid swim ${key}`);
}
for (const section of hearthstoneNotes) unique(section.entries, 'id');
log('Content IDs, collection grouping, local assets and swimming values verified.');

const collection = JSON.parse(readFileSync('src/lib/atelier-papers.json', 'utf8'));
const publicAssets = JSON.parse(readFileSync('scripts/public-assets.json', 'utf8'));
unique(collection, 'id');
unique(collection, 'collectionNumber');
for (const paper of collection) {
  assert(Number.isSafeInteger(paper.collectionNumber) && paper.collectionNumber > 0);
  assert(
    paper.priority === undefined || (Number.isSafeInteger(paper.priority) && paper.priority >= 0),
  );
  assert(paper.scores.length === 5 && paper.reasons.length === 5);
  assert(paper.scores.every((score) => score >= 0 && score <= 5 && Number.isInteger(score * 2)));
  const pdf = readFileSync(`public${paper.pdf}`);
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  assert.equal(pdf.length, paper.bytes);
  assert.equal(createHash('sha256').update(pdf).digest('hex'), paper.sha256);
  assert(publicAssets.includes(paper.pdf.slice(1)));
}
log('Collection records, review dimensions and original PDFs verified.');
