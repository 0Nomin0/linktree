import { NextRequest, NextResponse } from "next/server";
import { getSessionAccount } from "@/lib/auth";
import {
  createLink,
  deleteLink,
  getLink,
  getProfile,
  reorderLinks,
  updateLink,
} from "@/lib/repo";

export const runtime = "nodejs";

async function ownProfileOr401(profileId: string) {
  const acc = await getSessionAccount();
  if (!acc) return { error: 401 as const };
  const profile = getProfile(profileId);
  if (!profile || profile.account_id !== acc.id) return { error: 404 as const };
  return { profile };
}

// Создать ссылку
export async function POST(req: NextRequest) {
  const { profileId, kind } = await req.json().catch(() => ({}));
  const r = await ownProfileOr401(profileId);
  if ("error" in r) return NextResponse.json({ ok: false }, { status: r.error });
  const link = createLink(profileId, kind === "social" ? "social" : "link");
  return NextResponse.json({ ok: true, link });
}

// Обновить ссылку
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { id, ...patch } = body;
  const link = getLink(id);
  if (!link) return NextResponse.json({ ok: false }, { status: 404 });
  const r = await ownProfileOr401(link.profile_id);
  if ("error" in r) return NextResponse.json({ ok: false }, { status: r.error });

  const allowed: Record<string, unknown> = {};
  for (const k of ["title", "url", "image_url", "icon", "size", "tint"] as const) {
    if (patch[k] !== undefined) allowed[k] = String(patch[k]);
  }
  for (const k of ["enabled", "force_external"] as const) {
    if (patch[k] !== undefined) allowed[k] = patch[k] ? 1 : 0;
  }
  updateLink(id, allowed);
  return NextResponse.json({ ok: true });
}

// Удалить ссылку
export async function DELETE(req: NextRequest) {
  const { id } = await req.json().catch(() => ({}));
  const link = getLink(id);
  if (!link) return NextResponse.json({ ok: false }, { status: 404 });
  const r = await ownProfileOr401(link.profile_id);
  if ("error" in r) return NextResponse.json({ ok: false }, { status: r.error });
  deleteLink(id);
  return NextResponse.json({ ok: true });
}

// Переупорядочить
export async function PUT(req: NextRequest) {
  const { profileId, orderedIds } = await req.json().catch(() => ({}));
  const r = await ownProfileOr401(profileId);
  if ("error" in r) return NextResponse.json({ ok: false }, { status: r.error });
  if (Array.isArray(orderedIds)) reorderLinks(profileId, orderedIds.map(String));
  return NextResponse.json({ ok: true });
}
