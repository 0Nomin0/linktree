"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import s from "../admin.module.css";

export default function LoginPage() {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError(data.error || "Ошибка входа");
    }
  }

  return (
    <div className={s.loginScreen}>
      <form className={s.loginCard} onSubmit={submit}>
        <h1>TreeLink</h1>
        <p>Введите ключ доступа к аккаунту</p>
        <input
          className={s.input}
          type="password"
          placeholder="tl_xxxxxxxx"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          autoFocus
        />
        <div className={s.error}>{error}</div>
        <button className={`${s.btn} ${s.full}`} disabled={loading || !key}>
          {loading ? "Вход…" : "Войти"}
        </button>
      </form>
    </div>
  );
}
