// Acesso ao Postgres. Em produção: Neon (HTTP, sem conexão persistente — ideal para funções serverless).
// Nos testes: um driver injetado (PGlite, Postgres real em memória).
import { neon } from '@neondatabase/serverless';

const SCHEMA_VERSION = '4';
let driver = null;
let ready = null;

export function setDriver(fn) { driver = fn; ready = null; }
export function hasDatabase() { return !!(driver || dbUrl()); }
function dbUrl() { return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_PRISMA_URL || ''; }

function getDriver() {
  if (driver) return driver;
  const url = dbUrl();
  if (!url) { const e = new Error('Banco de dados não configurado'); e.status = 503; e.code = 'no_database'; throw e; }
  const sql = neon(url);
  driver = (text, params) => sql(text, params);
  return driver;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS app_config (key text PRIMARY KEY, value text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS users (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     email text NOT NULL UNIQUE,
     name text NOT NULL,
     password_hash text NOT NULL,
     token_version int NOT NULL DEFAULT 0,
     created_at timestamptz NOT NULL DEFAULT now(),
     last_seen timestamptz NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS states (
     user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
     data jsonb NOT NULL,
     summary jsonb NOT NULL DEFAULT '{}'::jsonb,
     version int NOT NULL DEFAULT 1,
     updated_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS decks (
     owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     id text NOT NULL,
     data jsonb,
     deleted boolean NOT NULL DEFAULT false,
     updated_at timestamptz NOT NULL DEFAULT now(),
     PRIMARY KEY (owner_id, id))`,
  `CREATE TABLE IF NOT EXISTS shares (
     code text PRIMARY KEY,
     owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
     deck jsonb NOT NULL,
     uses int NOT NULL DEFAULT 0,
     created_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS classes (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     name text NOT NULL,
     owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     join_code text NOT NULL UNIQUE,
     created_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS class_members (
     class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
     user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     role text NOT NULL DEFAULT 'student',
     joined_at timestamptz NOT NULL DEFAULT now(),
     PRIMARY KEY (class_id, user_id))`,
  `CREATE INDEX IF NOT EXISTS class_members_user ON class_members(user_id)`,
  `CREATE TABLE IF NOT EXISTS class_decks (
     class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
     deck_id text NOT NULL,
     deck jsonb NOT NULL,
     added_at timestamptz NOT NULL DEFAULT now(),
     PRIMARY KEY (class_id, deck_id))`,
  `CREATE TABLE IF NOT EXISTS rate_limits (key text PRIMARY KEY, window_start bigint NOT NULL, count int NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS ai_usage (
     user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     day date NOT NULL,
     units int NOT NULL DEFAULT 0,
     PRIMARY KEY (user_id, day))`,
  `CREATE TABLE IF NOT EXISTS audit_log (
     id bigserial PRIMARY KEY,
     user_id uuid,
     action text NOT NULL,
     meta jsonb,
     ip text,
     at timestamptz NOT NULL DEFAULT now())`,
  `CREATE INDEX IF NOT EXISTS audit_user ON audit_log(user_id, at DESC)`,
  `CREATE TABLE IF NOT EXISTS password_resets (
     token_hash text PRIMARY KEY,
     user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     created_by uuid,
     expires_at timestamptz NOT NULL,
     used_at timestamptz,
     created_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE INDEX IF NOT EXISTS password_resets_user ON password_resets(user_id)`,
  `INSERT INTO app_config(key, value) VALUES ('schema', '${SCHEMA_VERSION}') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`
];

async function migrate() {
  const run = getDriver();
  try {
    const r = await run(`SELECT value FROM app_config WHERE key = 'schema'`, []);
    if (r[0] && r[0].value === SCHEMA_VERSION) return;
  } catch (e) { /* tabela ainda não existe */ }
  for (const stmt of SCHEMA) await run(stmt, []);
}

export function ensureSchema() {
  if (!ready) ready = migrate().catch((e) => { ready = null; throw e; });
  return ready;
}

export async function q(text, params = []) { await ensureSchema(); return getDriver()(text, params); }
export async function q1(text, params = []) { const r = await q(text, params); return r[0] || null; }
