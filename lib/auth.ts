import { cookies } from "next/headers";
import { getAccountByKey, getAccount } from "./repo";
import type { Account } from "./types";

const COOKIE = "tl_session";

// Сессия предельно простая: в httpOnly-cookie кладём access_key.
// Для нескольких доверенных аккаунтов этого достаточно.
export async function getSessionAccount(): Promise<Account | null> {
  const store = await cookies();
  const key = store.get(COOKIE)?.value;
  if (!key) return null;
  return getAccountByKey(key) ?? null;
}

export async function setSession(key: string): Promise<boolean> {
  const acc = getAccountByKey(key);
  if (!acc) return false;
  const store = await cookies();
  store.set(COOKIE, key, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 90, // 90 дней
  });
  return true;
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

// Проверка, что профиль принадлежит залогиненному аккаунту
export function accountOwnsProfile(account: Account, profileAccountId: string) {
  return account.id === profileAccountId;
}

export { getAccount };
