import { NextRequest, NextResponse } from "next/server";
import { getSessionAccount } from "@/lib/auth";
import { getDashboard, getProfile } from "@/lib/repo";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const acc = await getSessionAccount();
  if (!acc) return NextResponse.json({ ok: false }, { status: 401 });

  const profileId = req.nextUrl.searchParams.get("profileId") || "";
  const days = Number(req.nextUrl.searchParams.get("days") || "7");
  const profile = getProfile(profileId);
  if (!profile || profile.account_id !== acc.id) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  return NextResponse.json({ ok: true, dashboard: getDashboard(profileId, days) });
}
