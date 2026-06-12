// Реальное определение гео по запросу.
// Порядок: 1) заголовки CDN (Cloudflare/Vercel) — бесплатно и мгновенно на проде;
//          2) внешний keyless IP-API как fallback (с кэшем в памяти);
//          3) пусто (локалка / приватный IP).

type Geo = { country: string; city: string };

const cache = new Map<string, { geo: Geo; at: number }>();
const TTL = 24 * 60 * 60 * 1000; // сутки

function isPrivate(ip: string): boolean {
  if (!ip) return true;
  if (ip === "::1" || ip.startsWith("127.")) return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80")) return true;
  return false;
}

export function clientIp(h: Headers): string {
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    h.get("x-vercel-forwarded-for") ||
    ""
  ).trim();
}

function fromHeaders(h: Headers): Geo {
  const country = (
    h.get("cf-ipcountry") ||
    h.get("x-vercel-ip-country") ||
    h.get("x-country-code") ||
    ""
  ).toUpperCase();
  let city = h.get("x-vercel-ip-city") || h.get("cf-ipcity") || "";
  try {
    city = decodeURIComponent(city);
  } catch {}
  return { country: country === "XX" ? "" : country, city };
}

// Внешний lookup (ip-api.com — без ключа, country+city). Таймаут 1.2с.
async function lookup(ip: string): Promise<Geo> {
  const hit = cache.get(ip);
  if (hit && Date.now() - hit.at < TTL) return hit.geo;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1200);
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,countryCode,city`,
      { signal: ctrl.signal, cache: "no-store" }
    );
    clearTimeout(t);
    const j = (await res.json()) as { status: string; countryCode?: string; city?: string };
    const geo: Geo =
      j.status === "success"
        ? { country: (j.countryCode || "").toUpperCase(), city: j.city || "" }
        : { country: "", city: "" };
    cache.set(ip, { geo, at: Date.now() });
    return geo;
  } catch {
    return { country: "", city: "" };
  }
}

// Главная функция: вернёт гео максимально быстро.
export async function resolveGeo(h: Headers): Promise<Geo> {
  const fromHdr = fromHeaders(h);
  if (fromHdr.country) return fromHdr; // CDN уже всё дал — fetch не нужен

  const ip = clientIp(h);
  if (isPrivate(ip)) return { country: "", city: "" }; // локалка
  return lookup(ip);
}
