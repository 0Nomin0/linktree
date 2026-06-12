import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { getProfileByUsername, listLinks, parseDesign, parseSettings, recordEvent } from "@/lib/repo";
import { parseUA } from "@/lib/deeplink";
import { resolveGeo } from "@/lib/geo";
import ProfileView from "@/components/ProfileView";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = getProfileByUsername(username);
  if (!profile) return { title: "Не найдено" };
  const title = profile.display_name || profile.username;
  const desc = profile.bio || `@${profile.username}`;
  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: profile.avatar_url ? [profile.avatar_url] : [],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: profile.avatar_url ? [profile.avatar_url] : [],
    },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = getProfileByUsername(username);
  if (!profile) notFound();

  const links = listLinks(profile.id);
  const design = parseDesign(profile.design);
  const settings = parseSettings(profile.settings);

  // Запись просмотра (серверно, с разбором UA + реальное гео)
  const h = await headers();
  const ua = h.get("user-agent") || "";
  const info = parseUA(ua);
  const { country, city } = await resolveGeo(h);
  const source = info.inApp ? info.platform : refererSource(h.get("referer") || "");
  recordEvent({
    profileId: profile.id,
    type: "view",
    inApp: info.inApp,
    platform: info.platform,
    country,
    city,
    source,
    referer: h.get("referer") || "",
  });

  return (
    <ProfileView
      profile={{
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
      }}
      links={links}
      design={design}
      settings={settings}
    />
  );
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
