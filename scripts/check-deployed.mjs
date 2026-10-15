/* global fetch, AbortSignal */
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import process from 'node:process';
import { URL } from 'node:url';
import { log } from 'node:console';
const site = new URL(process.argv[2]);
if (!site.pathname.endsWith('/')) throw new Error('Site URL must end with /');
const expected = process.argv[3];
const versionUrl = new URL('version.json', site);
versionUrl.searchParams.set('verify', expected || String(Date.now()));
const versionResponse = await fetch(versionUrl, { signal: AbortSignal.timeout(20000) });
assert.equal(versionResponse.status, 200, 'version.json');
const version = await versionResponse.json();
if (expected) {
  assert.equal(version.commit, expected, 'Deployed commit mismatch');
  assert.equal(version.dirty, false, 'Dirty deployment');
}
const allow = JSON.parse(await readFile('scripts/public-assets.json', 'utf8'));
const paths = ['', 'paper-factory/', 'sitemap.xml', 'robots.txt', ...allow];
const compiledAssets = new Set();
for (const path of ['', 'paper-factory/']) {
  const response = await fetch(new URL(path, site), { signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 200, path);
  const html = await response.text();
  for (const match of html.matchAll(/(?:src|href)="([^" ]*\/_next\/[^" ]+)"/g)) {
    const url = new URL(match[1].replaceAll('&amp;', '&'), site);
    assert.equal(url.origin, site.origin);
    assert(url.pathname.startsWith(site.pathname));
    compiledAssets.add(url.href);
  }
}
paths.push(...compiledAssets);
let index = 0;
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (index < paths.length) {
      const path = paths[index++];
      const response = await fetch(new URL(path, site), {
        method: 'HEAD',
        signal: AbortSignal.timeout(20000),
      });
      assert.equal(response.status, 200, path);
      if (path.endsWith('.pdf'))
        assert(response.headers.get('content-type')?.includes('application/pdf'), path);
    }
  }),
);
const missing = await fetch(new URL('missing-verification-page/', site), {
  method: 'HEAD',
  signal: AbortSignal.timeout(20000),
});
assert.equal(missing.status, 404, 'Missing page must remain 404');
log(
  `Deployed ${version.commit}: ${paths.length} page/resource/PDF URLs and 404 verified at ${site}`,
);
