"use client";

import { useEffect, useRef, useState } from "react";
import s from "./ImageCropper.module.css";

// Простой кроппер: pan (перетаскивание) + zoom (слайдер/колесо), экспорт через canvas.
// Без внешних зависимостей.
export default function ImageCropper({
  src,
  aspect,
  onCancel,
  onApply,
}: {
  src: string;
  aspect: number; // ширина/высота
  onCancel: () => void;
  onApply: (blob: Blob) => void;
}) {
  const VIEW_W = 320;
  const VIEW_H = Math.round(VIEW_W / aspect);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [busy, setBusy] = useState(false);

  // базовый масштаб — чтобы фото покрывало вьюпорт
  const baseScale = nat ? Math.max(VIEW_W / nat.w, VIEW_H / nat.h) : 1;
  const scale = baseScale * zoom;

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setNat({ w: img.naturalWidth, h: img.naturalHeight });
      setOff({ x: 0, y: 0 });
      setZoom(1);
    };
    img.src = src;
  }, [src]);

  function clamp(o: { x: number; y: number }) {
    if (!nat) return o;
    const w = nat.w * scale;
    const h = nat.h * scale;
    const minX = VIEW_W - w;
    const minY = VIEW_H - h;
    return {
      x: Math.min(0, Math.max(minX, o.x)),
      y: Math.min(0, Math.max(minY, o.y)),
    };
  }

  function onDown(e: React.PointerEvent) {
    drag.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    if (!drag.current) return;
    setOff(clamp({ x: drag.current.ox + (e.clientX - drag.current.x), y: drag.current.oy + (e.clientY - drag.current.y) }));
  }
  function onUp() {
    drag.current = null;
  }

  // центрируем при изменении зума
  useEffect(() => {
    setOff((o) => clamp(o));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, nat]);

  async function apply() {
    if (!imgRef.current || !nat) return;
    setBusy(true);
    const outW = Math.min(1200, Math.round(nat.w * (zoom)));
    const OUT_W = Math.max(400, Math.min(1200, outW));
    const OUT_H = Math.round(OUT_W / aspect);
    const canvas = document.createElement("canvas");
    canvas.width = OUT_W;
    canvas.height = OUT_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // область вьюпорта в координатах исходного изображения
    const sx = -off.x / scale;
    const sy = -off.y / scale;
    const sw = VIEW_W / scale;
    const sh = VIEW_H / scale;
    ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, OUT_W, OUT_H);
    canvas.toBlob(
      (blob) => {
        setBusy(false);
        if (blob) onApply(blob);
      },
      "image/jpeg",
      0.9
    );
  }

  return (
    <div className={s.overlay} onClick={onCancel}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={s.title}>Обрезка изображения</h3>
        <div
          className={s.view}
          style={{ width: VIEW_W, height: VIEW_H }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
        >
          {nat && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              draggable={false}
              className={s.img}
              style={{
                width: nat.w * scale,
                height: nat.h * scale,
                transform: `translate(${off.x}px, ${off.y}px)`,
              }}
            />
          )}
          <div className={s.grid} />
        </div>

        <div className={s.zoomRow}>
          <span>−</span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className={s.range}
          />
          <span>+</span>
        </div>

        <div className={s.actions}>
          <button className={s.btnGhost} onClick={onCancel}>Отмена</button>
          <button className={s.btnPrimary} onClick={apply} disabled={busy || !nat}>
            {busy ? "Обработка…" : "Применить"}
          </button>
        </div>
      </div>
    </div>
  );
}
