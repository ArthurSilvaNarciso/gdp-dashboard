// Servidor local: serve o app (index.html + img/) e a API com Postgres em memória (PGlite).
// Uso: node dev/server.mjs [porta]   ·   DATABASE_URL=... node dev/server.mjs  (usa um Neon real)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { handle } from '../lib/app.js';
import { setDriver } from '../lib/db.js';

export async function start(port = 3000, opts = {}) {
  if (!process.env.DATABASE_URL && !opts.noDb) {
    const { PGlite } = await import('@electric-sql/pglite');
    const pg = new PGlite(opts.dataDir);
    setDriver(async (text, params) => (await pg.query(text, params)).rows);
  }
  process.env.COOKIE_INSECURE = '1';
  const root = path.resolve(opts.root || '.');
  const types = { '.html': 'text/html; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.js': 'text/javascript', '.json': 'application/json', '.mp4': 'video/mp4', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x');
    if (u.pathname.startsWith('/api/') || u.pathname === '/api') return handle(req, res);
    let p = decodeURIComponent(u.pathname); if (p === '/') p = '/index.html';
    const file = path.join(root, path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.statusCode = 404; return res.end('not found'); }
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(port, r));
  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.argv[2] || 3000);
  start(port).then(() => console.log('Memory em http://localhost:' + port));
}
