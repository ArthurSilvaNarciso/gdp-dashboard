// IA no servidor: chama a API do Claude com streaming e repassa o texto ao app.
// A chave fica só no servidor (variável ANTHROPIC_API_KEY). Cota diária por usuário.
import { q1 } from './db.js';
import { HttpError } from './http.js';

export const aiEnabled = () => !!process.env.ANTHROPIC_API_KEY || !!globalThis.__MEMORY_FAKE_AI;
const MODEL = () => process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5';
const DAILY_UNITS = () => Number(process.env.AI_DAILY_UNITS || 120);

export async function chargeAi(userId, units) {
  const r = await q1(
    `INSERT INTO ai_usage(user_id, day, units) VALUES ($1, (now() AT TIME ZONE 'America/Sao_Paulo')::date, $2)
     ON CONFLICT (user_id, day) DO UPDATE SET units = ai_usage.units + $2 RETURNING units`, [userId, units]);
  if (r.units > DAILY_UNITS()) throw new HttpError(429, 'ai_quota', 'Você atingiu o limite diário de uso da IA. Ele renova amanhã.');
  return DAILY_UNITS() - r.units;
}

// Transmite a resposta do modelo como texto puro. Erros no meio do caminho viram um marcador final.
export async function streamCompletion(res, { system, messages, maxTokens }) {
  if (!aiEnabled()) throw new HttpError(503, 'ai_disabled', 'A IA não está configurada neste servidor.');
  let upstream;
  if (globalThis.__MEMORY_FAKE_AI) upstream = await globalThis.__MEMORY_FAKE_AI({ system, messages, maxTokens });
  else {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL(), max_tokens: maxTokens, stream: true, system, messages })
    });
  }
  if (!upstream.ok) {
    const code = upstream.status === 429 || upstream.status === 529 ? 'rate_limited' : 'ai_error';
    throw new HttpError(code === 'rate_limited' ? 429 : 502, code, code === 'rate_limited' ? 'A IA está ocupada agora. Tente em instantes.' : 'A IA não respondeu agora. Tente de novo.');
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Accel-Buffering', 'no');
  if (res.flushHeaders) res.flushHeaders();
  const reader = upstream.body.getReader();
  const dec = new TextDecoder();
  let buf = '', out = '', stop = null;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!line.startsWith('data:')) continue;
        let ev; try { ev = JSON.parse(line.slice(5)); } catch (e) { continue; }
        if (ev.type === 'content_block_delta' && ev.delta && ev.delta.type === 'text_delta') { out += ev.delta.text; res.write(ev.delta.text); }
        else if (ev.type === 'message_delta' && ev.delta) stop = ev.delta.stop_reason || stop;
        else if (ev.type === 'error') throw new Error((ev.error && ev.error.type) || 'stream_error');
      }
    }
    if (stop === 'refusal') res.write('\n\u0000ERR:refused');
  } catch (e) {
    res.write('\n\u0000ERR:ai_error');
  }
  res.end();
  return out;
}
