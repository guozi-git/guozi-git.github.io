import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath, URL } from 'node:url';
import { log } from 'node:console';
import process from 'node:process';

const { values } = parseArgs({
  options: {
    port: { type: 'string', default: '3000' },
    hostname: { type: 'string', default: '127.0.0.1' },
    directory: { type: 'string' },
    'base-path': { type: 'string', default: process.env.NEXT_PUBLIC_BASE_PATH || '' },
  },
});
const root = values.directory
  ? resolve(values.directory)
  : fileURLToPath(new URL('../out/', import.meta.url));
const base = values['base-path'].replace(/\/$/, '');
if (base && !/^\/[A-Za-z0-9_-]+$/.test(base)) {
  throw new Error('Use an empty base path or /repository-name.');
}
await stat(resolve(root, 'index.html')); // Fail clearly if npm run build has not run.
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.otf': 'font/otf',
  '.xml': 'application/xml; charset=utf-8',
  '.pdf': 'application/pdf',
};
createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (base && pathname === base) {
      res.writeHead(308, { Location: `${base}/` }).end();
      return;
    }
    if (!pathname.startsWith(`${base}/`)) throw new Error('Outside site');
    let file = resolve(root, `.${pathname.slice(base.length)}`);
    if (file !== resolve(root) && !file.startsWith(`${resolve(root)}${sep}`)) {
      throw new Error('Outside export directory');
    }
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(req.method === 'HEAD' ? undefined : await readFile(resolve(root, '404.html')));
  }
}).listen(Number(values.port), values.hostname, () => {
  log(`Static preview: http://${values.hostname}:${values.port}${base}/`);
});
