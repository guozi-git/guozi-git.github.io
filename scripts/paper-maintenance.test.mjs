import { Buffer } from 'node:buffer';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { importPaper, validate, repository, restoreSnapshot } from './paper-maintenance.mjs';

async function fixture() {
  await mkdir(resolve(repository, '.preview/maintenance-tests'), { recursive: true });
  const root = await mkdtemp(resolve(repository, '.preview/maintenance-tests/run-'));
  const p = JSON.parse(
    await readFile(resolve(repository, 'src/lib/factory-papers.json'), 'utf8'),
  )[0];
  for (const path of ['src/lib', 'scripts', 'public/papers'])
    await mkdir(resolve(root, path), { recursive: true });
  await writeFile(resolve(root, 'src/lib/factory-papers.json'), JSON.stringify([p]));
  await writeFile(resolve(root, 'scripts/public-assets.json'), JSON.stringify([p.pdf.slice(1)]));
  await copyFile(resolve(repository, `public${p.pdf}`), resolve(root, `public${p.pdf}`));
  return {
    root,
    p,
    input: resolve(root, 'input.json'),
    data: resolve(root, 'src/lib/factory-papers.json'),
  };
}
test('preview does not mutate; update backs up prior data and preserves untouched fields', async () => {
  const f = await fixture();
  const original = await readFile(f.data, 'utf8');
  await writeFile(
    f.input,
    JSON.stringify({ mode: 'update', paper: { id: f.p.id, limitation: 'Updated scope' } }),
  );
  const preview = await importPaper(f.input, { root: f.root });
  assert.equal(preview.mode, 'preview');
  assert.equal(await readFile(f.data, 'utf8'), original);
  const applied = await importPaper(f.input, { root: f.root, apply: true });
  const current = JSON.parse(await readFile(f.data, 'utf8'))[0];
  assert.equal(current.abstract, f.p.abstract);
  assert.equal(current.limitation, 'Updated scope');
  assert.equal(
    await readFile(resolve(applied.backup, 'src/lib/factory-papers.json'), 'utf8'),
    original,
  );
});
test('replacement PDF changes content version and keeps original bytes in backup', async () => {
  const f = await fixture();
  const bytes = await readFile(resolve(f.root, `public${f.p.pdf}`));
  await writeFile(
    resolve(f.root, 'revision.pdf'),
    Buffer.concat([bytes, Buffer.from('\n% revised\n')]),
  );
  await writeFile(
    f.input,
    JSON.stringify({
      mode: 'update',
      paper: { id: f.p.id, pages: f.p.pages },
      pdf: 'revision.pdf',
    }),
  );
  const result = await importPaper(f.input, { root: f.root, apply: true });
  const p = JSON.parse(await readFile(f.data, 'utf8'))[0];
  assert.notEqual(p.sha256, f.p.sha256);
  assert.deepEqual(await readFile(resolve(result.backup, `public${p.pdf}`)), bytes);
});
test('new manuscript imports, infers MSC grouping, registers PDF, preserves existing entries', async () => {
  const f = await fixture();
  const p = {
    ...f.p,
    id: 'P999',
    status: '待确认',
    scores: null,
    reasons: [],
    level: null,
    maturity: null,
    confidence: null,
    reviewNote: 'Waiting for review',
  };
  await writeFile(f.input, JSON.stringify({ mode: 'add', paper: p, pdf: `public${f.p.pdf}` }));
  await importPaper(f.input, { root: f.root, apply: true });
  const papers = JSON.parse(await readFile(f.data, 'utf8'));
  assert.equal(papers.length, 2);
  assert.equal(papers[1].id, 'P999');
  assert.deepEqual(papers[0], f.p);
  const assets = JSON.parse(await readFile(resolve(f.root, 'scripts/public-assets.json'), 'utf8'));
  assert(assets.includes('papers/P999.pdf'));
  await validate(papers, assets, f.root);
});
test('invalid imports fail before writing any production content', async () => {
  const f = await fixture(),
    before = await readFile(f.data, 'utf8');
  for (const input of [
    { mode: 'add', paper: f.p },
    { mode: 'update', paper: { id: 'P999' } },
    { mode: 'update', paper: { id: f.p.id, scores: [4] } },
    { mode: 'update', paper: { id: f.p.id, status: '待确认' } },
    { mode: 'update', paper: { id: f.p.id, msc: ['00BAD'] } },
    { mode: 'update', paper: { id: '../../escape' } },
    { mode: 'update', paper: { id: f.p.id }, pdf: `public${f.p.pdf}` },
    { mode: 'update', paper: { id: f.p.id, localPath: 'private' } },
  ]) {
    await writeFile(f.input, JSON.stringify(input));
    await assert.rejects(importPaper(f.input, { root: f.root, apply: true }));
    assert.equal(await readFile(f.data, 'utf8'), before);
  }
});
test('PDF corruption and missing export assets are rejected', async () => {
  const f = await fixture();
  await assert.rejects(validate([f.p], [], f.root));
  await writeFile(resolve(f.root, `public${f.p.pdf}`), 'invalid');
  await assert.rejects(validate([f.p], [f.p.pdf.slice(1)], f.root));
});

test('restoring an import returns data and PDF to their previous versions', async () => {
  const f = await fixture();
  const original = await readFile(f.data, 'utf8');
  await writeFile(
    f.input,
    JSON.stringify({ mode: 'update', paper: { id: f.p.id, limitation: 'Changed' } }),
  );
  const applied = await importPaper(f.input, { root: f.root, apply: true });
  await restoreSnapshot(applied.backup, { root: f.root, apply: true });
  assert.equal(await readFile(f.data, 'utf8'), original);
  await assert.rejects(restoreSnapshot(f.root, { root: f.root }));
});

test('restoring an addition preserves its PDF in trash and removes it from public data', async () => {
  const f = await fixture();
  const before = await readFile(f.data, 'utf8');
  await writeFile(
    f.input,
    JSON.stringify({ mode: 'add', paper: { ...f.p, id: 'P999' }, pdf: `public${f.p.pdf}` }),
  );
  const added = await importPaper(f.input, { root: f.root, apply: true });
  const restored = await restoreSnapshot(added.backup, { root: f.root, apply: true });
  assert.equal(await readFile(f.data, 'utf8'), before);
  assert((await readFile(resolve(restored.preserved, 'public/papers/P999.pdf'))).length > 0);
  await assert.rejects(readFile(resolve(f.root, 'public/papers/P999.pdf')));
});
