import { notFound, redirect } from "next/navigation";
import { getSessionAccount } from "@/lib/auth";
import { getDashboard, getProfileByUsername } from "@/lib/repo";
import AnalyticsView from "./AnalyticsView";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ days?: string }>;
}) {
  const acc = await getSessionAccount();
  if (!acc) redirect("/admin/login");

  const { username } = await params;
  const sp = await searchParams;
  const days = Number(sp.days || "7");
  const profile = getProfileByUsername(username);
  if (!profile) notFound();
  if (profile.account_id !== acc.id) redirect("/admin");

  const dashboard = getDashboard(profile.id, days);

  return (
    <AnalyticsView
      accountLabel={acc.label}
      username={profile.username}
      profileId={profile.id}
      days={days}
      initialDashboard={dashboard}
    />
  );
}
