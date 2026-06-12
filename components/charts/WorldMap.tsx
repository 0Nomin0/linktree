"use client";

import { useMemo, useRef, useState } from "react";
import worldPaths from "./worldPaths.json";
import s from "./WorldMap.module.css";

const PATHS = worldPaths as Record<string, string>;

export type CountryStat = {
  code: string;
  name: string;
  value: number;
  avgPerHour?: number;
  peakHour?: number;
  activeDays?: number;
};

// Палитра интенсивности (низкая → высокая), как на референсе
const RAMP = ["#1f3a5f", "#1c5a8f", "#2b7fc4", "#49a0e0", "#7fc2f0"];

function intensityColor(v: number, max: number): string {
  if (v <= 0) return "#ffffff"; // нет данных — белый материк
  const t = Math.min(1, v / Math.max(1, max));
  const idx = Math.min(RAMP.length - 1, Math.floor(t * RAMP.length));
  return RAMP[idx];
}

function levelLabel(v: number, max: number): string {
  const t = v / Math.max(1, max);
  if (t > 0.66) return "HIGH";
  if (t > 0.33) return "MEDIUM";
  return "LOW";
}

export default function WorldMap({ data }: { data: CountryStat[] }) {
  const byCode = useMemo(() => {
    const m = new Map<string, CountryStat>();
    for (const d of data) m.set(d.code.toUpperCase(), d);
    return m;
  }, [data]);
  const max = useMemo(() => Math.max(1, ...data.map((d) => d.value)), [data]);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState<{ stat: CountryStat; x: number; y: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  function onEnter(code: string, e: React.MouseEvent) {
    const stat = byCode.get(code);
    if (!stat) return;
    const rect = wrapRef.current?.getBoundingClientRect();
    setHover({
      stat,
      x: e.clientX - (rect?.left ?? 0),
      y: e.clientY - (rect?.top ?? 0),
    });
  }
  function onMove(e: React.MouseEvent) {
    if (drag.current) {
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      setPan({ x: drag.current.px + dx, y: drag.current.py + dy });
      return;
    }
    if (hover) {
      const rect = wrapRef.current?.getBoundingClientRect();
      setHover((h) => (h ? { ...h, x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) } : h));
    }
  }
  function onDown(e: React.MouseEvent) {
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  }
  function onUp() {
    drag.current = null;
  }
  function reset() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  return (
    <div className={s.wrap} ref={wrapRef} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}>
      <div className={s.controls}>
        <button className={s.ctrlBtn} onClick={() => setZoom((z) => Math.min(5, z * 1.4))} aria-label="zoom in">+</button>
        <button className={s.ctrlBtn} onClick={() => setZoom((z) => Math.max(1, z / 1.4))} aria-label="zoom out">−</button>
        <button className={s.ctrlBtn} onClick={reset} aria-label="reset">⟳</button>
      </div>

      <svg
        viewBox="0 14 1000 428"
        className={s.svg}
        onMouseDown={onDown}
        style={{ cursor: drag.current ? "grabbing" : "grab" }}
      >
        <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
          <rect x={0} y={0} width={1000} height={500} fill="transparent" />
          {Object.entries(PATHS).map(([code, d]) => {
            const stat = byCode.get(code);
            const v = stat?.value ?? 0;
            const active = !!stat;
            return (
              <path
                key={code}
                d={d}
                fill={intensityColor(v, max)}
                stroke={active ? "#0a2540" : "#cfd8e3"}
                strokeWidth={0.4}
                className={active ? s.activeCountry : s.country}
                onMouseEnter={(e) => onEnter(code, e)}
                onMouseLeave={() => setHover(null)}
              />
            );
          })}
        </g>
      </svg>

      {hover && (
        <div className={s.tooltip} style={{ left: hover.x + 14, top: hover.y + 14 }}>
          <div className={s.tipHead}>📍 {hover.stat.code}</div>
          <div className={s.tipRow}>Events: <b>{hover.stat.value}</b></div>
          {hover.stat.avgPerHour !== undefined && (
            <div className={s.tipRow}>Avg/Hour: <b>{hover.stat.avgPerHour}</b></div>
          )}
          {hover.stat.peakHour !== undefined && (
            <div className={s.tipRow}>Peak Hour: <b>{hover.stat.peakHour}</b></div>
          )}
          {hover.stat.activeDays !== undefined && (
            <div className={s.tipRow}>Active Days: <b>{hover.stat.activeDays}</b></div>
          )}
          <div className={`${s.tipLevel} ${s["lvl" + levelLabel(hover.stat.value, max)]}`}>
            ● {levelLabel(hover.stat.value, max)}
          </div>
        </div>
      )}

      <div className={s.legend}>
        <span>ACTIVITY INTENSITY</span>
        <span className={s.legLow}>Low</span>
        <span className={s.ramp}>
          <i style={{ background: "#ffffff" }} />
          {RAMP.map((c) => (
            <i key={c} style={{ background: c }} />
          ))}
        </span>
        <span className={s.legHigh}>High</span>
      </div>
    </div>
  );
}
