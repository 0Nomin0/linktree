import { NextRequest, NextResponse } from "next/server";
import { setSession, clearSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { key } = await req.json().catch(() => ({ key: "" }));
  if (!key || typeof key !== "string") {
    return NextResponse.json({ ok: false, error: "Введите ключ" }, { status: 400 });
  }
  const ok = await setSession(key.trim());
  if (!ok) {
    return NextResponse.json({ ok: false, error: "Неверный ключ" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
