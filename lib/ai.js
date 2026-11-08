// IA no servidor: chama a API do Claude com streaming e repassa o texto ao app.
// A chave fica só no servidor (variável ANTHROPIC_API_KEY). Cota diária por usuário.
import { q, q1 } from './db.js';
import { HttpError } from './http.js';

export const aiEnabled = () => !!process.env.ANTHROPIC_API_KEY || !!globalThis.__MEMORY_FAKE_AI;
// Haiku para respostas rápidas (tutor, variações); Sonnet para gerar material completo (aulas e questões de um edital).
export const MODEL = () => process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5';
export const MODEL_PRO = () => process.env.ANTHROPIC_MODEL_PRO || 'claude-sonnet-5-5';
const DAILY_UNITS = () => Number(process.env.AI_DAILY_UNITS || 120);
// Teto diário somando todos os usuários: protege os créditos da API contra uso fora do normal.
const GLOBAL_DAILY_UNITS = () => Number(process.env.AI_GLOBAL_DAILY_UNITS || 4000);
// Registra tokens gastos por mês (painel da administração acompanha o consumo dos créditos).
export async function logAiUsage(model, usage) {
  if (!usage) return; const month = new Date().toISOString().slice(0, 7); const k = 'ai_tokens:' + month;
  try {
    const r = await q1(`SELECT value FROM app_config WHERE key = $1`, [k]); const v = r ? JSON.parse(r.value) : { calls: 0, models: {} };
    const m = (v.models[model] = v.models[model] || { in: 0, out: 0, calls: 0 });
    m.in += usage.input_tokens || 0; m.out += usage.output_tokens || 0; m.calls++; v.calls++;
    await q(`INSERT INTO app_config(key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`, [k, JSON.stringify(v)]);
  } catch (e) { /* medição nunca derruba a resposta */ }
}

export async function chargeAi(userId, units) {
  const r = await q1(
    `INSERT INTO ai_usage(user_id, day, units) VALUES ($1, (now() AT TIME ZONE 'America/Sao_Paulo')::date, $2)
     ON CONFLICT (user_id, day) DO UPDATE SET units = ai_usage.units + $2 RETURNING units`, [userId, units]);
  if (r.units > DAILY_UNITS()) throw new HttpError(429, 'ai_quota', 'Você atingiu o limite diário de uso da IA. Ele renova amanhã.');
  const g = await q1(`SELECT COALESCE(sum(units), 0)::int AS t FROM ai_usage WHERE day = (now() AT TIME ZONE 'America/Sao_Paulo')::date`);
  if (g && g.t > GLOBAL_DAILY_UNITS()) throw new HttpError(503, 'ai_busy', 'A IA do Memory atingiu o limite de uso de hoje. Ela volta amanhã.');
  return DAILY_UNITS() - r.units;
}

// Transmite a resposta do modelo como texto puro. Erros no meio do caminho viram um marcador final.
export async function streamCompletion(res, { system, messages, maxTokens, model }) {
  const mdl = model || MODEL();
  if (!aiEnabled()) throw new HttpError(503, 'ai_disabled', 'A IA não está configurada neste servidor.');
  let upstream;
  if (globalThis.__MEMORY_FAKE_AI) upstream = await globalThis.__MEMORY_FAKE_AI({ system, messages, maxTokens });
  else {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: mdl, max_tokens: maxTokens, stream: true, system, messages })
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
  let buf = '', out = '', stop = null; const usage = { input_tokens: 0, output_tokens: 0 };
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
        else if (ev.type === 'message_start' && ev.message && ev.message.usage) usage.input_tokens += ev.message.usage.input_tokens || 0;
        else if (ev.type === 'message_delta' && ev.delta) { stop = ev.delta.stop_reason || stop; if (ev.usage) usage.output_tokens = ev.usage.output_tokens || usage.output_tokens; }
        else if (ev.type === 'error') throw new Error((ev.error && ev.error.type) || 'stream_error');
      }
    }
    if (stop === 'refusal') res.write('\n\u0000ERR:refused');
  } catch (e) {
    res.write('\n\u0000ERR:ai_error');
  }
  res.end();
  if (!globalThis.__MEMORY_FAKE_AI) await logAiUsage(mdl, usage);
  return out;
}
