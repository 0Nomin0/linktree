import { notFound, redirect } from "next/navigation";
import { getSessionAccount } from "@/lib/auth";
import { getProfileByUsername, listLinks, parseDesign, parseSettings } from "@/lib/repo";
import EditProfile from "./EditProfile";

export const dynamic = "force-dynamic";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const acc = await getSessionAccount();
  if (!acc) redirect("/admin/login");

  const { username } = await params;
  const profile = getProfileByUsername(username);
  if (!profile) notFound();
  if (profile.account_id !== acc.id) redirect("/admin");

  return (
    <EditProfile
      accountLabel={acc.label}
      username={profile.username}
      initialProfile={{
        id: profile.id,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
      }}
      initialDesign={parseDesign(profile.design)}
      initialSettings={parseSettings(profile.settings)}
      initialLinks={listLinks(profile.id)}
    />
  );
}
