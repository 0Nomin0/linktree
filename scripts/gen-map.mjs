// Генератор карты мира: качает Natural Earth geojson (страны с ISO-кодами),
// проецирует в equirectangular и пишет компактные SVG-пути в components/charts/worldPaths.json
// Запуск: node scripts/gen-map.mjs
import fs from "node:fs";
import path from "node:path";

const W = 1000;
const H = 500;
const URLS = [
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson",
  "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_admin_0_countries.geojson",
];

function project(lng, lat) {
  const x = ((lng + 180) / 360) * W;
  const y = ((90 - lat) / 180) * H;
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}

function ringToPath(ring) {
  let d = "";
  for (let i = 0; i < ring.length; i++) {
    const [lng, lat] = ring[i];
    const [x, y] = project(lng, lat);
    d += (i === 0 ? "M" : "L") + x + "," + y;
  }
  return d + "Z";
}

function geomToPath(geom) {
  let d = "";
  if (geom.type === "Polygon") {
    for (const ring of geom.coordinates) d += ringToPath(ring);
  } else if (geom.type === "MultiPolygon") {
    for (const poly of geom.coordinates) for (const ring of poly) d += ringToPath(ring);
  }
  return d;
}

async function main() {
  let geo = null;
  for (const url of URLS) {
    try {
      console.log("fetch", url);
      const res = await fetch(url);
      if (!res.ok) throw new Error("status " + res.status);
      geo = await res.json();
      break;
    } catch (e) {
      console.log("  fail:", e.message);
    }
  }
  if (!geo) {
    console.error("Не удалось скачать geojson. Проверь интернет.");
    process.exit(1);
  }

  const out = {};
  for (const f of geo.features) {
    const p = f.properties || {};
    let iso =
      p.ISO_A2_EH || p.ISO_A2 || p.iso_a2 || p.WB_A2 || p.POSTAL || "";
    iso = String(iso).toUpperCase();
    if (!iso || iso === "-99" || iso.length !== 2) continue;
    const d = geomToPath(f.geometry);
    if (!d) continue;
    // если страна уже есть (несколько фич) — соединяем
    out[iso] = (out[iso] || "") + d;
  }

  const dst = path.join(process.cwd(), "components", "charts", "worldPaths.json");
  fs.writeFileSync(dst, JSON.stringify(out));
  const kb = Math.round(fs.statSync(dst).size / 1024);
  console.log(`✅ ${Object.keys(out).length} стран → ${dst} (${kb} KB)`);
}

main();
