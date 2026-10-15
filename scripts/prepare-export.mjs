import { mkdir, readdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { log } from 'node:console';
import { execFileSync } from 'node:child_process';
import process from 'node:process';

const root = resolve('out');
const commit =
  process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
await writeFile(
  resolve(root, 'version.json'),
  JSON.stringify({
    commit,
    dirty: execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim().length > 0,
    builtAt: new Date().toISOString(),
    site: process.env.NEXT_PUBLIC_SITE_URL || null,
  }),
);
const allow = new Set(JSON.parse(await readFile('scripts/public-assets.json', 'utf8')));
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((e) => (e.isDirectory() ? files(resolve(dir, e.name)) : [resolve(dir, e.name)])),
    )
  ).flat();
}
for (const name of allow) await stat(resolve(root, name));
const excluded = [];
for (const source of await files(resolve('public'))) {
  const name = relative(resolve('public'), source).split(sep).join('/');
  if (allow.has(name)) continue;
  const target = resolve(root, name);
  if (!target.startsWith(`${root}${sep}`)) throw new Error('Export path escaped output directory');
  const size = (await stat(target)).size;
  await unlink(target); // Only generated copies; source assets and history remain intact.
  excluded.push({ name, size });
}
await mkdir('.preview', { recursive: true });
await writeFile(
  '.preview/export-assets-review.json',
  JSON.stringify({ included: [...allow], excluded }, null, 2),
);
log(
  `Export: ${allow.size} public assets retained; ${excluded.length} unused/source copies excluded (${excluded.reduce((sum, f) => sum + f.size, 0)} bytes).`,
);
