"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import s from "./admin.module.css";

type P = { id: string; username: string; display_name: string; avatar_url: string };

export default function Dashboard({
  accountLabel,
  profiles,
}: {
  accountLabel: string;
  profiles: P[];
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  async function createProfile(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    if (data.ok) {
      router.push(`/admin/${data.profile.username}`);
    } else {
      setError(data.error || "Ошибка");
    }
  }

  return (
    <div className={s.shell}>
      <div className={s.topbar}>
        <span className={s.brand}>TreeLink</span>
        <div className={s.topActions}>
          <span className={s.accountTag}>{accountLabel}</span>
          <button className={s.btnGhost} onClick={logout}>
            Выйти
          </button>
        </div>
      </div>

      <div className={s.wrap}>
        <div className={s.sectionTitle}>Мои профили</div>

        <div className={s.profileGrid}>
          {profiles.map((p) => (
            <Link key={p.id} href={`/admin/${p.username}`} className={s.profileCard}>
              <div className={s.pcAvatar}>
                {p.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.avatar_url} alt="" className={s.pcAvatar} />
                ) : (
                  (p.display_name || p.username).slice(0, 1).toUpperCase()
                )}
              </div>
              <div className={s.pcInfo}>
                <div className={s.pcName}>{p.display_name || p.username}</div>
                <div className={s.pcUser}>/{p.username}</div>
              </div>
              <span className={s.btnGhost}>Открыть →</span>
            </Link>
          ))}
          {profiles.length === 0 && (
            <div className={s.pcUser}>Пока нет профилей. Создайте первый ниже.</div>
          )}
        </div>

        <div className={s.sectionTitle}>Новый профиль</div>
        {creating ? (
          <form className={s.panel} onSubmit={createProfile}>
            <label className={s.label}>Юзернейм (адрес страницы)</label>
            <div className={s.row}>
              <input
                className={s.input}
                placeholder="my_link"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
              <button className={s.btn} style={{ flex: "0 0 auto" }}>
                Создать
              </button>
            </div>
            <div className={s.error}>{error}</div>
            <div className={s.hintText}>Адрес будет: /{username || "my_link"}</div>
          </form>
        ) : (
          <button className={s.btn} onClick={() => setCreating(true)}>
            + Создать профиль
          </button>
        )}
      </div>
    </div>
  );
}
