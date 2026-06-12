import { NextRequest, NextResponse } from "next/server";
import { getSessionAccount } from "@/lib/auth";
import {
  createProfile,
  deleteProfile,
  getProfile,
  updateProfile,
  usernameTaken,
} from "@/lib/repo";

export const runtime = "nodejs";

const USERNAME_RE = /^[a-zA-Z0-9_.]{2,32}$/;

// Создать профиль
export async function POST(req: NextRequest) {
  const acc = await getSessionAccount();
  if (!acc) return NextResponse.json({ ok: false }, { status: 401 });

  const { username } = await req.json().catch(() => ({}));
  if (!username || !USERNAME_RE.test(username)) {
    return NextResponse.json(
      { ok: false, error: "Юзернейм: 2–32 символа (буквы, цифры, _ .)" },
      { status: 400 }
    );
  }
  if (usernameTaken(username)) {
    return NextResponse.json({ ok: false, error: "Юзернейм занят" }, { status: 409 });
  }
  const p = createProfile(acc.id, username);
  return NextResponse.json({ ok: true, profile: p });
}

// Обновить профиль
export async function PATCH(req: NextRequest) {
  const acc = await getSessionAccount();
  if (!acc) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { id, ...patch } = body;
  const profile = getProfile(id);
  if (!profile || profile.account_id !== acc.id) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  if (patch.username !== undefined) {
    if (!USERNAME_RE.test(patch.username)) {
      return NextResponse.json({ ok: false, error: "Некорректный юзернейм" }, { status: 400 });
    }
    if (usernameTaken(patch.username, id)) {
      return NextResponse.json({ ok: false, error: "Юзернейм занят" }, { status: 409 });
    }
  }

  // design приходит как объект — сериализуем
  const allowed: Record<string, unknown> = {};
  for (const k of ["username", "display_name", "bio", "avatar_url"] as const) {
    if (patch[k] !== undefined) allowed[k] = String(patch[k]);
  }
  if (patch.design !== undefined) {
    allowed.design =
      typeof patch.design === "string" ? patch.design : JSON.stringify(patch.design);
  }
  if (patch.settings !== undefined) {
    allowed.settings =
      typeof patch.settings === "string" ? patch.settings : JSON.stringify(patch.settings);
  }
  updateProfile(id, allowed);
  return NextResponse.json({ ok: true });
}

// Удалить профиль
export async function DELETE(req: NextRequest) {
  const acc = await getSessionAccount();
  if (!acc) return NextResponse.json({ ok: false }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  const profile = getProfile(id);
  if (!profile || profile.account_id !== acc.id) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  deleteProfile(id);
  return NextResponse.json({ ok: true });
}
