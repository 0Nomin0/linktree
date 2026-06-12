import { db } from "./db";
import {
  DEFAULT_DESIGN,
  DEFAULT_SETTINGS,
  type Account,
  type Design,
  type Link,
  type Profile,
  type QuickSettings,
} from "./types";
import { nanoid } from "nanoid";

function now() {
  return Date.now();
}

// node:sqlite отдаёт строки с null-прототипом — превращаем в обычные объекты,
// иначе их нельзя передать из Server в Client Components.
function plain<T>(row: unknown): T | undefined {
  return row ? ({ ...(row as object) } as T) : undefined;
}
function plainAll<T>(rows: unknown[]): T[] {
  return rows.map((r) => ({ ...(r as object) }) as T);
}

// ── Accounts ────────────────────────────────────────────────────────────
export function getAccountByKey(key: string): Account | undefined {
  return plain<Account>(
    db.prepare("SELECT * FROM accounts WHERE access_key = ?").get(key)
  );
}

export function getAccount(id: string): Account | undefined {
  return plain<Account>(db.prepare("SELECT * FROM accounts WHERE id = ?").get(id));
}

export function listAccounts(): Account[] {
  return plainAll<Account>(
    db.prepare("SELECT * FROM accounts ORDER BY created_at").all()
  );
}

export function createAccount(label: string, key: string): Account {
  const acc: Account = {
    id: nanoid(12),
    label,
    access_key: key,
    created_at: now(),
  };
  db.prepare(
    "INSERT INTO accounts (id, label, access_key, created_at) VALUES (?,?,?,?)"
  ).run(acc.id, acc.label, acc.access_key, acc.created_at);
  return acc;
}

// ── Profiles ────────────────────────────────────────────────────────────
export function parseDesign(json: string): Design {
  try {
    return { ...DEFAULT_DESIGN, ...JSON.parse(json) };
  } catch {
    return DEFAULT_DESIGN;
  }
}

export function parseSettings(json: string): QuickSettings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(json || "{}") };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function getProfileByUsername(username: string): Profile | undefined {
  return plain<Profile>(
    db.prepare("SELECT * FROM profiles WHERE username = ? COLLATE NOCASE").get(username)
  );
}

export function getProfile(id: string): Profile | undefined {
  return plain<Profile>(db.prepare("SELECT * FROM profiles WHERE id = ?").get(id));
}

export function listProfilesByAccount(accountId: string): Profile[] {
  return plainAll<Profile>(
    db.prepare("SELECT * FROM profiles WHERE account_id = ? ORDER BY created_at").all(accountId)
  );
}

export function usernameTaken(username: string, exceptId?: string): boolean {
  const row = db
    .prepare("SELECT id FROM profiles WHERE username = ? COLLATE NOCASE")
    .get(username) as { id: string } | undefined;
  return !!row && row.id !== exceptId;
}

export function createProfile(accountId: string, username: string): Profile {
  const t = now();
  const p: Profile = {
    id: nanoid(12),
    account_id: accountId,
    username,
    display_name: username,
    bio: "",
    avatar_url: "",
    design: JSON.stringify(DEFAULT_DESIGN),
    settings: JSON.stringify(DEFAULT_SETTINGS),
    created_at: t,
    updated_at: t,
  };
  db.prepare(
    `INSERT INTO profiles (id, account_id, username, display_name, bio, avatar_url, design, settings, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`
  ).run(
    p.id,
    p.account_id,
    p.username,
    p.display_name,
    p.bio,
    p.avatar_url,
    p.design,
    p.settings,
    p.created_at,
    p.updated_at
  );
  return p;
}

export function updateProfile(
  id: string,
  patch: Partial<
    Pick<Profile, "username" | "display_name" | "bio" | "avatar_url" | "design" | "settings">
  >
): void {
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [k, v] of Object.entries(patch)) {
    fields.push(`${k} = ?`);
    values.push(v);
  }
  if (!fields.length) return;
  fields.push("updated_at = ?");
  values.push(now());
  values.push(id);
  db.prepare(`UPDATE profiles SET ${fields.join(", ")} WHERE id = ?`).run(
    ...(values as never[])
  );
}

export function deleteProfile(id: string): void {
  db.prepare("DELETE FROM profiles WHERE id = ?").run(id);
}

// ── Links ───────────────────────────────────────────────────────────────
export function listLinks(profileId: string): Link[] {
  return plainAll<Link>(
    db.prepare("SELECT * FROM links WHERE profile_id = ? ORDER BY position, rowid").all(profileId)
  );
}

export function getLink(id: string): Link | undefined {
  return plain<Link>(db.prepare("SELECT * FROM links WHERE id = ?").get(id));
}

export function createLink(profileId: string, kind: "link" | "social"): Link {
  const max = db
    .prepare("SELECT COALESCE(MAX(position), -1) AS m FROM links WHERE profile_id = ?")
    .get(profileId) as { m: number };
  const link: Link = {
    id: nanoid(12),
    profile_id: profileId,
    kind,
    title: "",
    url: "",
    image_url: "",
    icon: kind === "social" ? "instagram" : "",
    size: "big",
    tint: "",
    position: max.m + 1,
    enabled: 1,
    force_external: 1,
  };
  db.prepare(
    `INSERT INTO links (id, profile_id, kind, title, url, image_url, icon, size, tint, position, enabled, force_external)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    link.id,
    link.profile_id,
    link.kind,
    link.title,
    link.url,
    link.image_url,
    link.icon,
    link.size,
    link.tint,
    link.position,
    link.enabled,
    link.force_external
  );
  return link;
}

export function updateLink(
  id: string,
  patch: Partial<
    Pick<
      Link,
      "title" | "url" | "image_url" | "icon" | "size" | "tint" | "enabled" | "force_external"
    >
  >
): void {
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [k, v] of Object.entries(patch)) {
    fields.push(`${k} = ?`);
    values.push(v);
  }
  if (!fields.length) return;
  values.push(id);
  db.prepare(`UPDATE links SET ${fields.join(", ")} WHERE id = ?`).run(
    ...(values as never[])
  );
}

export function deleteLink(id: string): void {
  db.prepare("DELETE FROM links WHERE id = ?").run(id);
}

export function reorderLinks(profileId: string, orderedIds: string[]): void {
  const stmt = db.prepare(
    "UPDATE links SET position = ? WHERE id = ? AND profile_id = ?"
  );
  orderedIds.forEach((id, i) => stmt.run(i, id, profileId));
}

// ── Events / Analytics ──────────────────────────────────────────────────
export function recordEvent(e: {
  profileId: string;
  linkId?: string | null;
  type: "view" | "click";
  inApp: boolean;
  platform: string;
  referer: string;
  country?: string;
  city?: string;
  source?: string;
}): void {
  db.prepare(
    `INSERT INTO events (profile_id, link_id, type, in_app, platform, country, city, referer, source, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`
  ).run(
    e.profileId,
    e.linkId ?? null,
    e.type,
    e.inApp ? 1 : 0,
    e.platform,
    e.country ?? "",
    e.city ?? "",
    e.referer,
    e.source ?? "",
    now()
  );
}

const DAY = 24 * 60 * 60 * 1000;

function totalsBetween(profileId: string, from: number, to: number) {
  return db
    .prepare(
      `SELECT
         SUM(CASE WHEN type='view' THEN 1 ELSE 0 END) AS views,
         SUM(CASE WHEN type='click' THEN 1 ELSE 0 END) AS clicks,
         SUM(CASE WHEN type='view' AND in_app=1 THEN 1 ELSE 0 END) AS inApp
       FROM events WHERE profile_id = ? AND created_at >= ? AND created_at < ?`
    )
    .get(profileId, from, to) as {
    views: number | null;
    clicks: number | null;
    inApp: number | null;
  };
}

function pctChange(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

export type Dashboard = {
  range: { days: number };
  totals: {
    views: number;
    clicks: number;
    interactions: number;
    engagement: number; // %
    inAppViews: number;
  };
  delta: { views: number; clicks: number; interactions: number; engagement: number };
  prev: { views: number; clicks: number; interactions: number };
  byDay: { day: string; views: number; clicks: number }[];
  hourly: { hour: number; current: number; previous: number }[];
  realtime: { minute: string; visits: number; clicks: number }[];
  realtimeTotals: { visits: number; clicks: number; activity: number };
  sources: { source: string; count: number }[];
  countries: { code: string; count: number; activeDays: number; peakHour: number }[];
  cities: { city: string; count: number }[];
  byLink: { link_id: string; title: string; clicks: number }[];
  distribution: { clicks: number; views: number };
  activeDays: number;
  dailyAverage: number;
  growth: number;
};

export function getDashboard(profileId: string, days = 7): Dashboard {
  const nowMs = now();
  const start = nowMs - days * DAY;
  const prevStart = start - days * DAY;

  const t = totalsBetween(profileId, start, nowMs);
  const p = totalsBetween(profileId, prevStart, start);

  const views = t.views ?? 0;
  const clicks = t.clicks ?? 0;
  const interactions = views + clicks;
  const engagement = views ? Math.round((clicks / views) * 1000) / 10 : 0;

  const pViews = p.views ?? 0;
  const pClicks = p.clicks ?? 0;
  const pInteractions = pViews + pClicks;
  const pEngagement = pViews ? Math.round((pClicks / pViews) * 1000) / 10 : 0;

  // Просмотры/клики по дням
  const byDay = plainAll<{ day: string; views: number; clicks: number }>(
    db
      .prepare(
        `SELECT date(created_at/1000,'unixepoch') AS day,
                SUM(CASE WHEN type='view' THEN 1 ELSE 0 END) AS views,
                SUM(CASE WHEN type='click' THEN 1 ELSE 0 END) AS clicks
         FROM events WHERE profile_id=? AND created_at>=? AND created_at<?
         GROUP BY day ORDER BY day`
      )
      .all(profileId, start, nowMs)
  );

  // Почасовой паттерн (0..23) — текущий и предыдущий период
  const rawHourCur = plainAll<{ h: number; c: number }>(
    db
      .prepare(
        `SELECT CAST(strftime('%H', created_at/1000,'unixepoch') AS INTEGER) AS h, COUNT(*) AS c
         FROM events WHERE profile_id=? AND created_at>=? AND created_at<? GROUP BY h`
      )
      .all(profileId, start, nowMs)
  );
  const rawHourPrev = plainAll<{ h: number; c: number }>(
    db
      .prepare(
        `SELECT CAST(strftime('%H', created_at/1000,'unixepoch') AS INTEGER) AS h, COUNT(*) AS c
         FROM events WHERE profile_id=? AND created_at>=? AND created_at<? GROUP BY h`
      )
      .all(profileId, prevStart, start)
  );
  const hCur = new Map(rawHourCur.map((r) => [r.h, r.c]));
  const hPrev = new Map(rawHourPrev.map((r) => [r.h, r.c]));
  const hourly = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    current: hCur.get(hour) ?? 0,
    previous: hPrev.get(hour) ?? 0,
  }));

  // Real-time: последние 30 минут, бакеты по минутам
  const rtSince = nowMs - 30 * 60 * 1000;
  const rtRaw = plainAll<{ minute: string; visits: number; clicks: number }>(
    db
      .prepare(
        `SELECT strftime('%H:%M', created_at/1000,'unixepoch') AS minute,
                SUM(CASE WHEN type='view' THEN 1 ELSE 0 END) AS visits,
                SUM(CASE WHEN type='click' THEN 1 ELSE 0 END) AS clicks
         FROM events WHERE profile_id=? AND created_at>=? GROUP BY minute ORDER BY minute`
      )
      .all(profileId, rtSince)
  );
  const rtVisits = rtRaw.reduce((s, r) => s + r.visits, 0);
  const rtClicks = rtRaw.reduce((s, r) => s + r.clicks, 0);

  // Источники трафика
  const sources = plainAll<{ source: string; count: number }>(
    db
      .prepare(
        `SELECT CASE WHEN source='' THEN 'direct' ELSE source END AS source, COUNT(*) AS count
         FROM events WHERE profile_id=? AND type='view' AND created_at>=? AND created_at<?
         GROUP BY 1 ORDER BY count DESC`
      )
      .all(profileId, start, nowMs)
  );

  // География
  const countries = plainAll<{
    code: string;
    count: number;
    activeDays: number;
    peakHour: number;
  }>(
    db
      .prepare(
        `SELECT CASE WHEN country='' THEN 'XX' ELSE country END AS code,
                COUNT(*) AS count,
                COUNT(DISTINCT date(created_at/1000,'unixepoch')) AS activeDays,
                CAST(strftime('%H',
                  (SELECT e2.created_at FROM events e2
                   WHERE e2.profile_id=e.profile_id
                     AND (CASE WHEN e2.country='' THEN 'XX' ELSE e2.country END)=(CASE WHEN e.country='' THEN 'XX' ELSE e.country END)
                     AND e2.created_at>=? AND e2.created_at<?
                   GROUP BY strftime('%H', e2.created_at/1000,'unixepoch')
                   ORDER BY COUNT(*) DESC LIMIT 1)/1000,'unixepoch') AS INTEGER) AS peakHour
         FROM events e WHERE profile_id=? AND created_at>=? AND created_at<?
         GROUP BY 1 ORDER BY count DESC`
      )
      .all(start, nowMs, profileId, start, nowMs)
  );
  const cities = plainAll<{ city: string; count: number }>(
    db
      .prepare(
        `SELECT city, COUNT(*) AS count FROM events
         WHERE profile_id=? AND city<>'' AND created_at>=? AND created_at<?
         GROUP BY city ORDER BY count DESC LIMIT 20`
      )
      .all(profileId, start, nowMs)
  );

  const byLink = plainAll<{ link_id: string; title: string; clicks: number }>(
    db
      .prepare(
        `SELECT e.link_id, COALESCE(l.title,'(удалён)') AS title, COUNT(*) AS clicks
         FROM events e LEFT JOIN links l ON l.id=e.link_id
         WHERE e.profile_id=? AND e.type='click' AND e.created_at>=? AND e.created_at<?
         GROUP BY e.link_id ORDER BY clicks DESC`
      )
      .all(profileId, start, nowMs)
  );

  const activeDays = byDay.length;
  const dailyAverage = activeDays
    ? Math.round(interactions / activeDays)
    : 0;

  return {
    range: { days },
    totals: { views, clicks, interactions, engagement, inAppViews: t.inApp ?? 0 },
    delta: {
      views: pctChange(views, pViews),
      clicks: pctChange(clicks, pClicks),
      interactions: pctChange(interactions, pInteractions),
      engagement: Math.round((engagement - pEngagement) * 10) / 10,
    },
    prev: { views: pViews, clicks: pClicks, interactions: pInteractions },
    byDay,
    hourly,
    realtime: rtRaw,
    realtimeTotals: { visits: rtVisits, clicks: rtClicks, activity: rtVisits + rtClicks },
    sources,
    countries,
    cities,
    byLink,
    distribution: { clicks, views },
    activeDays,
    dailyAverage,
    growth: pctChange(interactions, pInteractions),
  };
}
