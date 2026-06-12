"use client";

// Лёгкие SVG-графики без внешних зависимостей.
import React, { useId } from "react";

function smoothPath(points: [number, number][]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return d;
}

// ── Area chart с двумя сериями (current/previous) ──
export function AreaCompare({
  current,
  previous,
  labels,
  height = 240,
  colorA = "#3b82f6",
  colorB = "#22c55e",
}: {
  current: number[];
  previous: number[];
  labels: string[];
  height?: number;
  colorA?: string;
  colorB?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const W = 1000;
  const H = height;
  const pad = { t: 16, r: 12, b: 28, l: 30 };
  const max = Math.max(1, ...current, ...previous);
  const n = current.length;
  const x = (i: number) => pad.l + (i / Math.max(1, n - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);

  const ptsA = current.map((v, i) => [x(i), y(v)] as [number, number]);
  const ptsB = previous.map((v, i) => [x(i), y(v)] as [number, number]);
  const areaA = `${smoothPath(ptsA)} L ${x(n - 1)},${H - pad.b} L ${x(0)},${H - pad.b} Z`;
  const areaB = `${smoothPath(ptsB)} L ${x(n - 1)},${H - pad.b} L ${x(0)},${H - pad.b} Z`;

  const gridY = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`fa-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colorA} stopOpacity="0.35" />
          <stop offset="100%" stopColor={colorA} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`fb-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colorB} stopOpacity="0.25" />
          <stop offset="100%" stopColor={colorB} stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridY.map((g, i) => {
        const gy = pad.t + g * (H - pad.t - pad.b);
        return (
          <g key={i}>
            <line x1={pad.l} y1={gy} x2={W - pad.r} y2={gy} stroke="#ffffff12" strokeDasharray="4 6" />
            <text x={6} y={gy + 4} fontSize="11" fill="#6b7280">
              {Math.round(max * (1 - g))}
            </text>
          </g>
        );
      })}
      <path d={areaB} fill={`url(#fb-${uid})`} />
      <path d={smoothPath(ptsB)} fill="none" stroke={colorB} strokeWidth="2" strokeDasharray="5 4" />
      <path d={areaA} fill={`url(#fa-${uid})`} />
      <path d={smoothPath(ptsA)} fill="none" stroke={colorA} strokeWidth="2.5" />
      {labels.map((l, i) =>
        i % Math.ceil(n / 12) === 0 ? (
          <text key={i} x={x(i)} y={H - 8} fontSize="10" fill="#6b7280" textAnchor="middle">
            {l}
          </text>
        ) : null
      )}
    </svg>
  );
}

// ── Real-time line chart ──
export function RealtimeLines({
  visits,
  clicks,
  labels,
  height = 220,
}: {
  visits: number[];
  clicks: number[];
  labels: string[];
  height?: number;
}) {
  const W = 1000;
  const H = height;
  const pad = { t: 16, r: 14, b: 26, l: 30 };
  const max = Math.max(1, ...visits, ...clicks);
  const n = Math.max(visits.length, clicks.length, 2);
  const x = (i: number) => pad.l + (i / (n - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const line = (arr: number[]) =>
    arr.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)},${y(v)}`).join(" ");
  const gridY = [0, 0.33, 0.66, 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      {gridY.map((g, i) => {
        const gy = pad.t + g * (H - pad.t - pad.b);
        return (
          <g key={i}>
            <line x1={pad.l} y1={gy} x2={W - pad.r} y2={gy} stroke="#ffffff10" strokeDasharray="3 7" />
            <text x={6} y={gy + 4} fontSize="11" fill="#6b7280">
              {Math.round(max * (1 - g))}
            </text>
          </g>
        );
      })}
      <path d={line(visits)} fill="none" stroke="#8b5cf6" strokeWidth="2.5" />
      <path d={line(clicks)} fill="none" stroke="#ec4899" strokeWidth="2.5" />
      {labels.map((l, i) =>
        i % Math.ceil(n / 10) === 0 ? (
          <text key={i} x={x(i)} y={H - 8} fontSize="10" fill="#6b7280" textAnchor="middle">
            {l}
          </text>
        ) : null
      )}
    </svg>
  );
}

// ── Donut / pie ──
export function Donut({
  data,
  size = 220,
  thickness = 36,
  centerLabel,
  centerValue,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = Math.max(1, data.reduce((s, d) => s + d.value, 0));
  const r = size / 2 - thickness / 2 - 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <g transform={`rotate(-90 ${c} ${c})`}>
        {data.map((d, i) => {
          const frac = d.value / total;
          const len = frac * circ;
          const seg = (
            <circle
              key={i}
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return seg;
        })}
      </g>
      {centerValue && (
        <text x={c} y={c - 2} textAnchor="middle" fontSize="26" fontWeight="800" fill="#fff">
          {centerValue}
        </text>
      )}
      {centerLabel && (
        <text x={c} y={c + 18} textAnchor="middle" fontSize="12" fill="#8a8a98">
          {centerLabel}
        </text>
      )}
    </svg>
  );
}

// ── Grouped bars (comparison overview) ──
export function GroupedBars({
  groups,
  height = 260,
}: {
  groups: { label: string; current: number; previous: number }[];
  height?: number;
}) {
  const W = 700;
  const H = height;
  const pad = { t: 16, r: 12, b: 36, l: 36 };
  const max = Math.max(1, ...groups.flatMap((g) => [g.current, g.previous]));
  const gw = (W - pad.l - pad.r) / groups.length;
  const bw = gw * 0.28;
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const base = H - pad.b;
  const gridY = [0, 0.25, 0.5, 0.75, 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
      {gridY.map((g, i) => {
        const gy = pad.t + g * (H - pad.t - pad.b);
        return (
          <g key={i}>
            <line x1={pad.l} y1={gy} x2={W - pad.r} y2={gy} stroke="#ffffff10" strokeDasharray="4 6" />
            <text x={6} y={gy + 4} fontSize="11" fill="#6b7280">
              {Math.round(max * (1 - g))}
            </text>
          </g>
        );
      })}
      {groups.map((g, i) => {
        const cx = pad.l + i * gw + gw / 2;
        return (
          <g key={i}>
            <rect x={cx - bw - 3} y={y(g.current)} width={bw} height={base - y(g.current)} rx="4" fill="#3b82f6" />
            <rect x={cx + 3} y={y(g.previous)} width={bw} height={base - y(g.previous)} rx="4" fill="#93c5fd" />
            <text x={cx} y={H - 18} fontSize="11" fill="#9a9aa8" textAnchor="middle">
              {g.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
