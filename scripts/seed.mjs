// Seed: 3 аккаунта-ключа + демо-профиль + богатые демо-данные аналитики.
// Запуск: npm run seed   (идемпотентно: ключи не пересоздаются)
import { DatabaseSync } from "node:sqlite";
import { randomBytes } from "node:crypto";
import path from "node:path";
import fs from "node:fs";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, "app.db");

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");

db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY, label TEXT NOT NULL, access_key TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY, account_id TEXT NOT NULL, username TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL DEFAULT '', bio TEXT NOT NULL DEFAULT '', avatar_url TEXT NOT NULL DEFAULT '',
    design TEXT NOT NULL DEFAULT '{}', settings TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, kind TEXT NOT NULL DEFAULT 'link',
    title TEXT NOT NULL DEFAULT '', url TEXT NOT NULL DEFAULT '', image_url TEXT NOT NULL DEFAULT '',
    icon TEXT NOT NULL DEFAULT '', size TEXT NOT NULL DEFAULT 'big', tint TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0, enabled INTEGER NOT NULL DEFAULT 1, force_external INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT, profile_id TEXT NOT NULL, link_id TEXT, type TEXT NOT NULL,
    in_app INTEGER NOT NULL DEFAULT 0, platform TEXT NOT NULL DEFAULT '', country TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '', referer TEXT NOT NULL DEFAULT '', source TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL
  );
`);

// Миграции колонок для уже существующих БД
function ensureColumn(table, col, def) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
}
ensureColumn("profiles", "settings", "TEXT NOT NULL DEFAULT '{}'");
ensureColumn("links", "size", "TEXT NOT NULL DEFAULT 'big'");
ensureColumn("links", "tint", "TEXT NOT NULL DEFAULT ''");
ensureColumn("events", "country", "TEXT NOT NULL DEFAULT ''");
ensureColumn("events", "city", "TEXT NOT NULL DEFAULT ''");
ensureColumn("events", "source", "TEXT NOT NULL DEFAULT ''");

const id = (n = 12) => randomBytes(16).toString("base64url").slice(0, n);
const key = () => "tl_" + randomBytes(18).toString("base64url").slice(0, 24);
const now = Date.now();
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const weighted = (pairs) => {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [v, w] of pairs) {
    if ((r -= w) <= 0) return v;
  }
  return pairs[0][0];
};

// ── Аккаунты (только если их ещё нет) ──
let accounts = db.prepare("SELECT * FROM accounts ORDER BY created_at").all();
let firstProfileId;

if (accounts.length === 0) {
  accounts = [
    { label: "Account 1", id: id(), key: key() },
    { label: "Account 2", id: id(), key: key() },
    { label: "Account 3", id: id(), key: key() },
  ];
  const insAcc = db.prepare("INSERT INTO accounts (id,label,access_key,created_at) VALUES (?,?,?,?)");
  for (const a of accounts) insAcc.run(a.id, a.label, a.key, now);

  const DESIGN = JSON.stringify({
    bgType: "image", bgImage: "", bgColor: "#0e0e12", bgGradientFrom: "#2a1830", bgGradientTo: "#0e0e12",
    accent: "#e1306c", buttonTextColor: "#ffffff", buttonShape: "rounded", buttonStyle: "glass",
    textColor: "#ffffff", font: "system", theme: "midnight",
  });
  const SETTINGS = JSON.stringify({
    deeplinkBanner: true, addToContacts: false, totalFollowers: false, followersCount: 0,
    shoutsMedia: true, showIcon: true,
  });

  firstProfileId = id();
  db.prepare(
    `INSERT INTO profiles (id,account_id,username,display_name,bio,avatar_url,design,settings,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`
  ).run(firstProfileId, accounts[0].id, "mia_moon", "Mia Moon", "@mia_moon", "", DESIGN, SETTINGS, now, now);

  const insLink = db.prepare(
    `INSERT INTO links (id,profile_id,kind,title,url,image_url,icon,size,tint,position,enabled,force_external)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
  );
  insLink.run(id(), firstProfileId, "social", "", "https://instagram.com/", "", "instagram", "big", "", 0, 1, 1);
  insLink.run(id(), firstProfileId, "social", "", "https://t.me/", "", "telegram", "big", "", 1, 1, 1);
  insLink.run(id(), firstProfileId, "social", "", "https://youtube.com/", "", "youtube", "big", "", 2, 1, 1);
  insLink.run(id(), firstProfileId, "link", "Chat with me 💋", "https://t.me/", "", "", "big", "", 3, 1, 1);
  insLink.run(id(), firstProfileId, "link", "Telegram", "https://t.me/", "", "telegram", "big", "", 4, 1, 1);
  console.log("✅ Созданы 3 аккаунта и демо-профиль.\n");
} else {
  firstProfileId = (db.prepare("SELECT id FROM profiles ORDER BY created_at LIMIT 1").get() || {}).id;
  console.log("ℹ️  Аккаунты уже есть — ключи сохранены.\n");
}

// Запись ключей в .env.local (если только что создали)
if (accounts[0]?.key) {
  const envPath = path.join(process.cwd(), ".env.local");
  let env = "";
  try { env = fs.readFileSync(envPath, "utf8"); } catch {}
  const lines = env.split("\n").filter((l) => l && !l.startsWith("ACCOUNT_KEY_"));
  accounts.forEach((a, i) => lines.push(`ACCOUNT_KEY_${i + 1}=${a.key}`));
  fs.writeFileSync(envPath, lines.join("\n") + "\n");
}

// Аналитика наполняется ТОЛЬКО реальными заходами на страницу профиля.
// Никаких выдуманных событий не создаём.

if (accounts[0]?.key) {
  console.log("\n   Ключи для входа в /admin/login:\n");
  for (const a of accounts) console.log(`   ${a.label}:  ${a.access_key || a.key}`);
  console.log("\n   (также сохранены в .env.local)");
}
console.log("\n   Демо-профиль: http://localhost:3000/mia_moon");
console.log("   Аналитика:    http://localhost:3000/admin/mia_moon/analytics\n");
