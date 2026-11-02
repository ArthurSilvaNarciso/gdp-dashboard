// Utilidades HTTP: corpo JSON com limite, respostas, erros padronizados, cookies, IP.

export class HttpError extends Error {
  constructor(status, code, message, extra) { super(message || code); this.status = status; this.code = code; this.extra = extra; }
}
export const bad = (code, message) => new HttpError(400, code, message);

export function send(res, status, body, headers = {}) {
  if (res.headersSent) return;
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  for (const k in headers) res.setHeader(k, headers[k]);
  res.end(JSON.stringify(body));
}

export async function readJson(req, limit = 256 * 1024) {
  if (req.method === 'GET' || req.method === 'HEAD') return {};
  // Na Vercel o corpo já pode vir lido; localmente lemos o stream.
  let pre;
  try { pre = req.body; } catch (e) { throw bad('invalid_json', 'JSON inválido.'); }
  if (pre !== undefined && pre !== null && typeof pre !== 'string' && !Buffer.isBuffer(pre)) {
    if (JSON.stringify(pre).length > limit) throw new HttpError(413, 'too_large', 'Conteúdo grande demais.');
    return pre;
  }
  let raw;
  if (typeof pre === 'string' || Buffer.isBuffer(pre)) raw = pre.toString();
  else {
    raw = await new Promise((resolve, reject) => {
      let size = 0; const chunks = [];
      req.on('data', (c) => { size += c.length; if (size > limit) { reject(new HttpError(413, 'too_large', 'Conteúdo grande demais.')); req.destroy(); } else chunks.push(c); });
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      req.on('error', reject);
    });
  }
  if (raw.length > limit) throw new HttpError(413, 'too_large', 'Conteúdo grande demais.');
  if (!raw.trim()) return {};
  try { const v = JSON.parse(raw); return v && typeof v === 'object' ? v : {}; } catch (e) { throw bad('invalid_json', 'JSON inválido.'); }
}

export function parseCookies(h) {
  const out = {};
  for (const part of String(h || '').split(';')) { const i = part.indexOf('='); if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); }
  return out;
}

export function clientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (xf) return String(xf).split(',')[0].trim().slice(0, 64);
  return String(req.headers['x-real-ip'] || (req.socket && req.socket.remoteAddress) || '0.0.0.0').slice(0, 64);
}

export function isSecure(req) {
  if (process.env.COOKIE_INSECURE === '1') return false;
  const proto = req.headers['x-forwarded-proto'];
  return proto ? String(proto).includes('https') : !!process.env.VERCEL;
}

// Proteção contra CSRF: mutações só com JSON e da mesma origem.
export function checkOrigin(req) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return;
  const origin = req.headers.origin;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (origin) {
    let oh = ''; try { oh = new URL(origin).host; } catch (e) { /* inválido */ }
    if (oh !== host) throw new HttpError(403, 'bad_origin', 'Origem não permitida.');
  }
  const ct = String(req.headers['content-type'] || '');
  if (!ct.includes('application/json')) throw new HttpError(415, 'json_required', 'Envie JSON.');
}

export const isEmail = (e) => typeof e === 'string' && e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
export const isUuid = (s) => typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
export const ms = (d) => (d instanceof Date ? d.getTime() : d ? new Date(d).getTime() : null);
