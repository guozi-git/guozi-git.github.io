import { readFile, stat, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import process from 'node:process';
import { URL } from 'node:url';
import { log } from 'node:console';
const root = resolve('out');
const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
const site = process.env.NEXT_PUBLIC_SITE_URL;
async function walk(dir) {
  return (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((e) =>
        e.isDirectory() ? walk(resolve(dir, e.name)) : [resolve(dir, e.name)],
      ),
    )
  ).flat();
}
let references = 0;
for (const file of await walk(root)) {
  if (!file.endsWith('.html')) continue;
  const html = await readFile(file, 'utf8');
  for (const m of html.matchAll(/<(?:a|link|script|img)\b[^>]*\b(?:href|src)="([^"]+)"/g)) {
    const value = m[1].replaceAll('&amp;', '&');
    if (!value.startsWith('/') || value.startsWith('//')) continue;
    const pathname = new URL(value, 'https://local.test').pathname;
    assert(pathname.startsWith(`${base}/`), `Wrong prefix: ${value}`);
    const local = resolve(root, `.${decodeURIComponent(pathname.slice(base.length))}`);
    assert(local.startsWith(root));
    const info = await stat(local);
    if (info.isDirectory()) await stat(resolve(local, 'index.html'));
    references++;
  }
}
const allow = JSON.parse(await readFile('scripts/public-assets.json', 'utf8'));
for (const path of allow) {
  const bytes = await readFile(resolve(root, path));
  if (path.endsWith('.pdf')) assert.equal(bytes.subarray(0, 5).toString(), '%PDF-', path);
}
const sitemap = await readFile(resolve(root, 'sitemap.xml'), 'utf8');
const robots = await readFile(resolve(root, 'robots.txt'), 'utf8');
assert(!sitemap.includes('#'));
assert(!robots.includes('Disallow: /'));
if (site && process.env.INDEX_SITE === 'true') {
  const canonical = `${site.replace(/\/$/, '')}/`;
  assert(sitemap.includes(`<loc>${canonical}</loc>`));
  assert(sitemap.includes(`<loc>${canonical}paper-factory/</loc>`));
  assert(!sitemap.includes('/preview/'));
  for (const [path, suffix] of [
    ['index.html', ''],
    ['paper-factory/index.html', 'paper-factory/'],
  ]) {
    const html = await readFile(resolve(root, path), 'utf8');
    assert(html.includes(`rel="canonical" href="${canonical}${suffix}"`));
    assert(html.includes('content="index, follow"'));
  }
}
assert((await readFile(resolve(root, 'preview/index.html'), 'utf8')).includes('noindex'));
const version = JSON.parse(await readFile(resolve(root, 'version.json'), 'utf8'));
assert.match(version.commit, /^[a-f0-9]{40}$/);
log(
  `Export checked: ${references} HTML resource/link references; ${allow.length} allowed resources including all PDFs; SEO and version files.`,
);
