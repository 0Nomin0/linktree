import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

// ── Расположение файла БД ───────────────────────────────────────────────
// Можно переопределить через переменную окружения DB_PATH.
const DATA_DIR = process.env.DB_DIR
  ? process.env.DB_DIR
  : path.join(process.cwd(), "data");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, "app.db");

// ── Singleton (важно при HMR в dev, чтобы не плодить соединения) ─────────
declare global {
  // eslint-disable-next-line no-var
  var __treelink_db: DatabaseSync | undefined;
}

function createDb(): DatabaseSync {
  const db = new DatabaseSync(DB_PATH);
  // busy_timeout: при параллельных подключениях (воркеры сборки) ждать, а не падать
  db.exec("PRAGMA busy_timeout = 8000;");
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  migrate(db);
  return db;
}

export const db: DatabaseSync = global.__treelink_db ?? createDb();
if (process.env.NODE_ENV !== "production") global.__treelink_db = db;

// ── Схема ───────────────────────────────────────────────────────────────
function migrate(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id          TEXT PRIMARY KEY,
      label       TEXT NOT NULL,
      access_key  TEXT NOT NULL UNIQUE,
      created_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id          TEXT PRIMARY KEY,
      account_id  TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      username    TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL DEFAULT '',
      bio         TEXT NOT NULL DEFAULT '',
      avatar_url  TEXT NOT NULL DEFAULT '',
      design      TEXT NOT NULL DEFAULT '{}',   -- JSON: тема/цвета/кнопки
      settings    TEXT NOT NULL DEFAULT '{}',   -- JSON: Quick Settings (тумблеры)
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS links (
      id          TEXT PRIMARY KEY,
      profile_id  TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      kind        TEXT NOT NULL DEFAULT 'link',  -- 'link' | 'social'
      title       TEXT NOT NULL DEFAULT '',
      url         TEXT NOT NULL DEFAULT '',
      image_url   TEXT NOT NULL DEFAULT '',
      icon        TEXT NOT NULL DEFAULT '',      -- для соц-иконок: instagram/telegram/youtube...
      size        TEXT NOT NULL DEFAULT 'big',   -- big | medium | small | button
      tint        TEXT NOT NULL DEFAULT '',      -- кастомный цвет карточки
      position    INTEGER NOT NULL DEFAULT 0,
      enabled     INTEGER NOT NULL DEFAULT 1,
      force_external INTEGER NOT NULL DEFAULT 1  -- применять deeplink-выход из webview
    );

    CREATE TABLE IF NOT EXISTS events (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id  TEXT NOT NULL,
      link_id     TEXT,
      type        TEXT NOT NULL,                 -- 'view' | 'click'
      in_app      INTEGER NOT NULL DEFAULT 0,    -- было ли открыто во встроенном webview
      platform    TEXT NOT NULL DEFAULT '',      -- tiktok/instagram/ios/android/...
      country     TEXT NOT NULL DEFAULT '',      -- ISO-код страны (US/GB/...)
      city        TEXT NOT NULL DEFAULT '',
      referer     TEXT NOT NULL DEFAULT '',
      source      TEXT NOT NULL DEFAULT '',      -- источник трафика (tiktok/instagram/direct/...)
      created_at  INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_links_profile ON links(profile_id, position);
    CREATE INDEX IF NOT EXISTS idx_events_profile ON events(profile_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_events_link ON events(link_id);
  `);

  // Миграции для уже существующих БД — добавляем недостающие колонки
  ensureColumn(db, "profiles", "settings", "TEXT NOT NULL DEFAULT '{}'");
  ensureColumn(db, "links", "size", "TEXT NOT NULL DEFAULT 'big'");
  ensureColumn(db, "links", "tint", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "events", "country", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "events", "city", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "events", "source", "TEXT NOT NULL DEFAULT ''");
}

function ensureColumn(db: DatabaseSync, table: string, col: string, def: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!cols.some((c) => c.name === col)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
  }
}

export { DB_PATH };
