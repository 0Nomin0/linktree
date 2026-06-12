"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { NavI } from "@/components/admin/NavIcons";
import { AreaCompare, RealtimeLines, Donut, GroupedBars } from "@/components/charts/Charts";
import WorldMap, { type CountryStat } from "@/components/charts/WorldMap";
import type { Dashboard } from "@/lib/repo";
import s from "./analytics.module.css";

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", GB: "United Kingdom", CA: "Canada", MX: "Mexico", PL: "Poland",
  DE: "Germany", FR: "France", BR: "Brazil", IT: "Italy", ES: "Spain", NL: "Netherlands",
  AU: "Australia", IN: "India", TR: "Turkey", UA: "Ukraine", SE: "Sweden", NO: "Norway",
  PH: "Philippines", ID: "Indonesia", JP: "Japan", KR: "South Korea", AR: "Argentina",
  RU: "Russia", XX: "Unknown",
};
function flag(code: string): string {
  if (code === "XX" || code.length !== 2) return "🌐";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}
const SOURCE_COLORS: Record<string, string> = {
  tiktok: "#ec4899", instagram: "#a855f7", direct: "#64748b", youtube: "#ef4444",
  telegram: "#3b82f6", twitter: "#0ea5e9",
};

export default function AnalyticsView({
  accountLabel,
  username,
  profileId,
  days,
  initialDashboard,
}: {
  accountLabel: string;
  username: string;
  profileId: string;
  days: number;
  initialDashboard: Dashboard;
}) {
  const router = useRouter();
  const [d, setD] = useState<Dashboard>(initialDashboard);
  const [live, setLive] = useState(true);
  const [geo, setGeo] = useState<"countries" | "cities">("countries");

  useEffect(() => setD(initialDashboard), [initialDashboard]);

  // Live-обновление каждые 8 секунд
  useEffect(() => {
    if (!live) return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/analytics?profileId=${profileId}&days=${days}`);
        const j = await res.json();
        if (j.ok) setD(j.dashboard);
      } catch {}
    }, 8000);
    return () => clearInterval(t);
  }, [live, profileId, days]);

  function setRange(n: number) {
    router.push(`/admin/${username}/analytics?days=${n}`);
  }

  const dateLabel = (() => {
    const end = new Date();
    const start = new Date(end.getTime() - days * 86400000);
    const f = (x: Date) => x.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${f(start)} - ${f(end)}`;
  })();

  // данные графиков
  const rtVisits = d.realtime.map((x) => x.visits);
  const rtClicks = d.realtime.map((x) => x.clicks);
  const rtLabels = d.realtime.map((x) => x.minute);
  const hourCur = d.hourly.map((h) => h.current);
  const hourPrev = d.hourly.map((h) => h.previous);

  const geoData = geo === "countries"
    ? d.countries
        .filter((c) => c.code !== "XX")
        .map((c) => ({ key: c.code, label: COUNTRY_NAMES[c.code] || c.code, value: c.count, flag: flag(c.code) }))
    : d.cities.map((c) => ({ key: c.city, label: c.city, value: c.count, flag: "📍" }));
  const geoMax = Math.max(1, ...geoData.map((g) => g.value));
  const geoTotal = geoData.reduce((s, g) => s + g.value, 0);

  const srcTotal = Math.max(1, d.sources.reduce((s, x) => s + x.count, 0));

  // данные для карты мира
  const mapData: CountryStat[] = d.countries
    .filter((c) => c.code !== "XX")
    .map((c) => ({
      code: c.code,
      name: COUNTRY_NAMES[c.code] || c.code,
      value: c.count,
      avgPerHour: Math.round((c.count / 24) * 10) / 10,
      peakHour: c.peakHour,
      activeDays: c.activeDays,
    }));

  return (
    <AdminShell username={username} accountLabel={accountLabel} active="analytics" pageTitle="Analytics">
      <div className={s.wrap}>
        {/* Hero */}
        <div className={s.hero}>
          <h1 className={s.heroTitle}>Analytics</h1>
          <p className={s.heroSub}>Track performance and engagement</p>
          <div className={s.heroActions}>
            <button className={`${s.live} ${live ? "" : s.liveOff}`} onClick={() => setLive((v) => !v)}>
              <span className={s.dot} /> {live ? "Live" : "Paused"}
            </button>
            <button className={s.refresh} onClick={() => router.refresh()}>↻ Refresh</button>
          </div>
        </div>

        {/* Range */}
        <div className={s.rangeRow}>
          <div className={s.rangePill}>
            <span style={{ display: "flex", alignItems: "center", padding: "0 10px", color: "#8a8a98", fontSize: 13 }}>
              🕑 {dateLabel}
            </span>
            {[7, 30, 90].map((n) => (
              <button key={n} className={`${s.rangeBtn} ${days === n ? s.rangeActive : ""}`} onClick={() => setRange(n)}>
                {n}d
              </button>
            ))}
          </div>
        </div>

        {/* Stat cards */}
        <div className={s.statGrid}>
          <StatCard icon={NavI.profile} color="#8b5cf6" label="Profile Views" value={d.totals.views} delta={d.delta.views} />
          <StatCard icon={NavI.cursor} color="#ec4899" label="Link Clicks" value={d.totals.clicks} delta={d.delta.clicks} />
          <StatCard icon={NavI.globe} color="#22d3ee" label="Total Interactions" value={d.totals.interactions} delta={d.delta.interactions} />
          <StatCard icon={NavI.activity} color="#4ade80" label="Engagement Rate" value={`${d.totals.engagement}%`} delta={d.delta.engagement} suffix />
        </div>

        {/* Real-time */}
        <div className={s.card}>
          <div className={s.cardHead}>
            <div>
              <div className={s.cardTitle}>Real-Time Activity</div>
              <div className={s.cardSub}>Last 30 minutes</div>
            </div>
            <button className={`${s.live} ${live ? "" : s.liveOff}`} onClick={() => setLive((v) => !v)}>
              <span className={s.dot} /> Live
            </button>
          </div>
          <div className={s.rtTop}>
            <RtStat label="Total Visits" value={d.realtimeTotals.visits} icon={NavI.profile} />
            <RtStat label="Total Clicks" value={d.realtimeTotals.clicks} icon={NavI.cursor} />
            <RtStat label="Total Activity" value={d.realtimeTotals.activity} icon={NavI.clock} />
          </div>
          <div className={s.legend}>
            <span className={s.legendItem}><span className={s.legendDot} style={{ background: "#8b5cf6" }} /> Profile Visits</span>
            <span className={s.legendItem}><span className={s.legendDot} style={{ background: "#ec4899" }} /> Link Clicks</span>
          </div>
          {rtLabels.length > 1 ? (
            <RealtimeLines visits={rtVisits} clicks={rtClicks} labels={rtLabels} />
          ) : (
            <div className={s.empty}>Нет активности за последние 30 минут</div>
          )}
        </div>

        {/* Traffic sources + Live sources */}
        <div className={s.grid2}>
          <div className={s.card}>
            <div className={s.cardHead}>
              <div className={s.cardTitle}><span className={s.cardTitleIcon}>{NavI.pie}</span> Traffic Sources</div>
              <div style={{ textAlign: "right" }}>
                <div className={s.cardSub}>VISITS</div>
                <b style={{ fontSize: 20 }}>{d.sources.reduce((a, b) => a + b.count, 0)}</b>
              </div>
            </div>
            <div className={s.donutWrap}>
              <Donut
                size={180}
                data={d.sources.slice(0, 6).map((x) => ({ label: x.source, value: x.count, color: SOURCE_COLORS[x.source] || "#64748b" }))}
              />
              <div className={s.donutLegend}>
                {d.sources.slice(0, 6).map((x) => (
                  <div key={x.source} className={s.dlRow}>
                    <span className={s.dlDot} style={{ background: SOURCE_COLORS[x.source] || "#64748b" }} />
                    <span style={{ textTransform: "capitalize" }}>{x.source}</span>
                    <span className={s.dlVal}>{Math.round((x.count / srcTotal) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={s.card}>
            <div className={s.cardHead}>
              <div className={s.cardTitle}><span className={s.cardTitleIcon}>🗺</span> Live Sources</div>
              <button className={`${s.live}`}><span className={s.dot} /> Live</button>
            </div>
            <div className={s.sourceList}>
              {d.sources.length === 0 && <div className={s.empty}>No live source data yet in the current window.</div>}
              {d.sources.map((x) => (
                <div key={x.source} className={s.sourceRow}>
                  <span style={{ flex: "0 0 90px", textTransform: "capitalize" }}>{x.source}</span>
                  <span className={s.sourceBar}>
                    <span className={s.sourceFill} style={{ width: `${(x.count / srcTotal) * 100}%`, background: SOURCE_COLORS[x.source] || "#64748b" }} />
                  </span>
                  <span>{x.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Period comparison */}
        <div className={s.card}>
          <div className={s.cardTitle} style={{ marginBottom: 4 }}>Period Comparison</div>
          <div className={s.cardSub} style={{ marginBottom: 16 }}>Comparing current period with previous period</div>
          <div className={s.grid2}>
            <div className={s.card} style={{ margin: 0 }}>
              <div className={s.cardTitle} style={{ fontSize: 15, marginBottom: 12 }}>
                <span className={s.cardTitleIcon}>{NavI.analytics}</span> Comparison Overview
              </div>
              <GroupedBars
                groups={[
                  { label: "Link Clicks", current: d.totals.clicks, previous: d.prev.clicks },
                  { label: "Profile Visits", current: d.totals.views, previous: d.prev.views },
                  { label: "Total Activity", current: d.totals.interactions, previous: d.prev.interactions },
                ]}
              />
              <div className={s.legend} style={{ justifyContent: "center" }}>
                <span className={s.legendItem}><span className={s.legendDot} style={{ background: "#3b82f6" }} /> Current Period</span>
                <span className={s.legendItem}><span className={s.legendDot} style={{ background: "#93c5fd" }} /> Previous Period</span>
              </div>
            </div>
            <div className={s.card} style={{ margin: 0 }}>
              <div className={s.cardTitle} style={{ fontSize: 15, marginBottom: 12 }}>
                <span className={s.cardTitleIcon}>{NavI.pie}</span> Activity Distribution
              </div>
              <div className={s.donutWrap}>
                <Donut
                  size={190}
                  thickness={94}
                  data={[
                    { label: "Link Clicks", value: d.distribution.clicks, color: "#3b82f6" },
                    { label: "Profile Visits", value: d.distribution.views, color: "#22c55e" },
                  ]}
                />
                <div className={s.donutLegend}>
                  {(() => {
                    const tot = Math.max(1, d.distribution.clicks + d.distribution.views);
                    return (
                      <>
                        <div className={s.dlRow}><span className={s.dlDot} style={{ background: "#3b82f6" }} /> Link Clicks <span className={s.dlVal}>{Math.round((d.distribution.clicks / tot) * 100)}%</span></div>
                        <div className={s.dlRow}><span className={s.dlDot} style={{ background: "#22c55e" }} /> Profile Visits <span className={s.dlVal}>{Math.round((d.distribution.views / tot) * 100)}%</span></div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hourly */}
        <div className={s.card}>
          <div className={s.cardTitle} style={{ marginBottom: 14 }}>
            <span className={s.cardTitleIcon}>{NavI.activity}</span> Hourly Activity Pattern
          </div>
          <AreaCompare current={hourCur} previous={hourPrev} labels={d.hourly.map((h) => (h.hour % 3 === 0 ? `${h.hour}` : ""))} />
          <div className={s.legend} style={{ justifyContent: "center" }}>
            <span className={s.legendItem}><span className={s.legendDot} style={{ background: "#3b82f6" }} /> Current Period</span>
            <span className={s.legendItem}><span className={s.legendDot} style={{ background: "#22c55e" }} /> Previous Period</span>
          </div>
          <div className={s.miniStats}>
            <div className={s.miniStat}>
              <span className={s.miniLabel}>📅 Active Days</span>
              <div className={s.miniNum}>{d.activeDays}</div>
            </div>
            <div className={s.miniStat}>
              <span className={s.miniLabel}>📈 Daily Average</span>
              <div className={s.miniNum} style={{ color: "#4ade80" }}>{d.dailyAverage}</div>
            </div>
            <div className={s.miniStat}>
              <span className={s.miniLabel}>↗ Overall Growth</span>
              <div className={s.miniNum} style={{ color: d.growth >= 0 ? "#4ade80" : "#ff7a90" }}>
                {d.growth >= 0 ? "+" : ""}{d.growth}%
              </div>
            </div>
          </div>
        </div>

        {/* Geographic */}
        <div className={s.card}>
          <div className={s.geoHead}>
            <div>
              <div className={s.cardTitle}>Geographic Analytics</div>
              <div className={s.cardSub}>{geoData.length} locations • {geoTotal} events</div>
            </div>
            <div className={s.geoToggle}>
              <button className={`${s.geoToggleBtn} ${geo === "countries" ? s.geoToggleActive : ""}`} onClick={() => setGeo("countries")}>Countries</button>
              <button className={`${s.geoToggleBtn} ${geo === "cities" ? s.geoToggleActive : ""}`} onClick={() => setGeo("cities")}>Cities</button>
            </div>
          </div>

          <div className={s.geoGrid}>
            {geoData.slice(0, 5).map((g, i) => (
              <div key={g.key} className={s.geoCard}>
                <div className={s.geoRank}>
                  <span>#{i + 1}</span>
                  <span>{g.flag}</span>
                </div>
                <div className={s.geoBar} style={{ width: `${(g.value / geoMax) * 100}%` }} />
                <div className={s.geoCode}>{geo === "countries" ? g.key : g.label}</div>
                <div className={s.geoNum}>{g.value}</div>
              </div>
            ))}
          </div>

          {/* Интерактивная карта мира (в режиме стран) */}
          {geo === "countries" && mapData.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <WorldMap data={mapData} />
            </div>
          )}

          <div className={s.geoList}>
            {geoData.slice(5, 20).map((g) => (
              <div key={g.key} className={s.geoRow}>
                <span style={{ flex: "0 0 28px" }}>{g.flag}</span>
                <span style={{ flex: "0 0 150px" }}>{g.label}</span>
                <span className={s.geoRowBar}>
                  <span className={s.geoRowFill} style={{ width: `${(g.value / geoMax) * 100}%` }} />
                </span>
                <span style={{ flex: "0 0 40px", textAlign: "right" }}>{g.value}</span>
              </div>
            ))}
            {geoData.length === 0 && <div className={s.empty}>Нет данных по регионам</div>}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function StatCard({
  icon, color, label, value, delta, suffix,
}: {
  icon: React.ReactNode; color: string; label: string; value: number | string; delta: number; suffix?: boolean;
}) {
  const up = delta >= 0;
  return (
    <div className={s.stat}>
      <div className={s.statGlow} style={{ background: `radial-gradient(circle at 80% 0%, ${color}, transparent 70%)` }} />
      <div className={s.statTop}>
        <span className={s.statIcon} style={{ background: `${color}22`, color }}>{icon}</span>
        {label}
      </div>
      <div className={s.statNum}>{typeof value === "number" ? value.toLocaleString() : value}</div>
      <div className={`${s.delta} ${up ? s.deltaUp : s.deltaDown}`}>
        {up ? "↑" : "↓"} {Math.abs(delta)}{suffix ? "pp" : "%"}
      </div>
      <span className={s.deltaNote}>vs last period</span>
    </div>
  );
}

function RtStat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className={s.rtStat}>
      <div>
        <div className={s.rtLabel}>{label}</div>
        <div className={s.rtNum}>{value}</div>
        <div className={s.rtRate}>↗ {Math.round(value / 30)} / min</div>
      </div>
      <span className={s.rtIcon}>{icon}</span>
    </div>
  );
}
