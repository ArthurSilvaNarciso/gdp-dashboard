// Autenticação: senha com bcrypt, sessão em JWT (HS256) num cookie HttpOnly, revogação por token_version.
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import crypto from 'node:crypto';
import { q, q1 } from './db.js';
import { HttpError, parseCookies, isSecure, clientIp } from './http.js';

export const COOKIE = 'mem_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dias
const RENEW_AFTER = 60 * 60 * 24 * 7; // renova a sessão depois de 7 dias
let dummyHash = null; // hash real usado quando o e-mail não existe (tempo de resposta igual)

let secretP = null;
async function secret() {
  const env = process.env.SESSION_SECRET;
  if (env && env.length >= 32) return new TextEncoder().encode(env);
  if (!secretP) {
    secretP = (async () => {
      // Sem variável de ambiente: gera um segredo forte uma única vez e guarda no banco.
      await q(`INSERT INTO app_config(key, value) VALUES ('jwt_secret', $1) ON CONFLICT (key) DO NOTHING`, [crypto.randomBytes(48).toString('base64url')]);
      const r = await q1(`SELECT value FROM app_config WHERE key = 'jwt_secret'`);
      return new TextEncoder().encode(r.value);
    })().catch((e) => { secretP = null; throw e; });
  }
  return secretP;
}

export const hashPassword = (pw) => bcrypt.hash(pw, 10);
export async function checkPassword(pw, hash) {
  if (!hash) { dummyHash = dummyHash || (await bcrypt.hash('memory-dummy', 10)); await bcrypt.compare(String(pw || ''), dummyHash); return false; }
  return bcrypt.compare(String(pw || ''), hash);
}

export function validatePassword(pw, email) {
  if (typeof pw !== 'string' || pw.length < 8) throw new HttpError(400, 'weak_password', 'A senha precisa ter pelo menos 8 caracteres.');
  if (Buffer.byteLength(pw) > 72) throw new HttpError(400, 'long_password', 'A senha pode ter no máximo 72 caracteres.');
  if (/^(\d)\1+$/.test(pw) || ['12345678', '123456789', '1234567890', 'password', 'senha123', 'senha1234', 'qwerty123', '87654321'].includes(pw.toLowerCase())) throw new HttpError(400, 'weak_password', 'Essa senha é muito fácil de adivinhar. Escolha outra.');
  if (email && pw.toLowerCase() === String(email).toLowerCase()) throw new HttpError(400, 'weak_password', 'A senha não pode ser igual ao e-mail.');
}

function cookie(req, value, maxAge) {
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${isSecure(req) ? '; Secure' : ''}`;
}
export async function issueSession(req, res, user) {
  const token = await new SignJWT({ tv: user.token_version })
    .setProtectedHeader({ alg: 'HS256' }).setSubject(user.id).setIssuedAt().setExpirationTime(MAX_AGE + 's')
    .sign(await secret());
  res.setHeader('Set-Cookie', cookie(req, token, MAX_AGE));
}
export function clearSession(req, res) { res.setHeader('Set-Cookie', cookie(req, '', 0)); }

export async function currentUser(req, res) {
  const tok = parseCookies(req.headers.cookie)[COOKIE];
  if (!tok) return null;
  let payload;
  try { ({ payload } = await jwtVerify(tok, await secret(), { algorithms: ['HS256'] })); } catch (e) { return null; }
  const u = await q1('SELECT id, email, name, token_version, created_at, last_seen FROM users WHERE id = $1', [payload.sub]);
  if (!u || u.token_version !== payload.tv) return null;
  const now = Date.now();
  if (res && payload.iat && now / 1000 - payload.iat > RENEW_AFTER) await issueSession(req, res, u);
  if (!u.last_seen || now - new Date(u.last_seen).getTime() > 10 * 60 * 1000) await q('UPDATE users SET last_seen = now() WHERE id = $1', [u.id]);
  return u;
}

export async function requireUser(req, res) {
  const u = await currentUser(req, res);
  if (!u) throw new HttpError(401, 'unauthorized', 'Entre na sua conta para continuar.');
  return u;
}

export const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name, createdAt: new Date(u.created_at).getTime() });

/* ---------- Limite de tentativas (janela fixa, atômico em uma instrução) ---------- */
export async function rateLimit(key, max, windowSec) {
  const nowS = Math.floor(Date.now() / 1000);
  const win = nowS - (nowS % windowSec);
  const r = await q1(
    `INSERT INTO rate_limits(key, window_start, count) VALUES ($1, $2, 1)
     ON CONFLICT (key) DO UPDATE SET count = CASE WHEN rate_limits.window_start = $2 THEN rate_limits.count + 1 ELSE 1 END, window_start = $2
     RETURNING count`, [key, win]);
  if (r && r.count > max) {
    const retry = win + windowSec - nowS;
    throw new HttpError(429, 'rate_limited', 'Muitas tentativas. Aguarde um pouco e tente de novo.', { retryAfter: retry });
  }
  if (Math.random() < 0.01) q(`DELETE FROM rate_limits WHERE window_start < $1`, [nowS - 86400]).catch(() => {});
}

/* ---------- Auditoria ---------- */
export async function audit(req, userId, action, meta = null) {
  try { await q('INSERT INTO audit_log(user_id, action, meta, ip) VALUES ($1, $2, $3::jsonb, $4)', [userId, action, meta ? JSON.stringify(meta) : null, clientIp(req)]); } catch (e) { /* auditoria nunca derruba a requisição */ }
}
