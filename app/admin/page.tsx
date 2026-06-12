import { redirect } from "next/navigation";
import { getSessionAccount } from "@/lib/auth";
import { listProfilesByAccount } from "@/lib/repo";
import Dashboard from "./Dashboard";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const acc = await getSessionAccount();
  if (!acc) redirect("/admin/login");

  const profiles = listProfilesByAccount(acc.id).map((p) => ({
    id: p.id,
    username: p.username,
    display_name: p.display_name,
    avatar_url: p.avatar_url,
  }));

  return <Dashboard accountLabel={acc.label} profiles={profiles} />;
}
