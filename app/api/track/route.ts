import { NextRequest, NextResponse } from "next/server";
import { recordEvent } from "@/lib/repo";
import { resolveGeo } from "@/lib/geo";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profileId, linkId, type, inApp, platform } = body || {};
    if (!profileId || (type !== "view" && type !== "click")) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const { country, city } = await resolveGeo(req.headers);
    const referer = req.headers.get("referer") || "";
    const source = inApp ? String(platform || "") : refererSource(referer);
    recordEvent({
      profileId: String(profileId),
      linkId: linkId ? String(linkId) : null,
      type,
      inApp: !!inApp,
      platform: String(platform || ""),
      country,
      city,
      source,
      referer,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

function refererSource(ref: string): string {
  if (!ref) return "direct";
  try {
    const host = new URL(ref).hostname.replace("www.", "");
    if (host.includes("tiktok")) return "tiktok";
    if (host.includes("instagram")) return "instagram";
    if (host.includes("youtube") || host.includes("youtu.be")) return "youtube";
    if (host.includes("t.me") || host.includes("telegram")) return "telegram";
    if (host.includes("twitter") || host.includes("x.com")) return "twitter";
    return host;
  } catch {
    return "direct";
  }
}
