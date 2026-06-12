// Клиентская логика «выхода» из встроенного браузера (in-app webview).
// Цель: при переходе из TikTok/Instagram открыть ссылку в нормальном
// системном браузере / приложении, а не во вложенном webview.

export type Escape = {
  inApp: boolean;
  os: "ios" | "android" | "other";
  platform: string;
};

export function detectClient(): Escape {
  const ua = navigator.userAgent.toLowerCase();
  const os: Escape["os"] = /iphone|ipad|ipod/.test(ua)
    ? "ios"
    : /android/.test(ua)
      ? "android"
      : "other";

  let platform: string = os;
  let inApp = false;
  const sigs: [string, RegExp][] = [
    ["tiktok", /musical_ly|bytedance|tiktok|trill|aweme/],
    ["instagram", /instagram/],
    ["facebook", /fb_iab|fban|fbav|fbios/],
    ["snapchat", /snapchat/],
    ["pinterest", /pinterest/],
    ["twitter", /twitter/],
  ];
  for (const [id, re] of sigs) {
    if (re.test(ua)) {
      inApp = true;
      platform = id;
      break;
    }
  }
  if (!inApp) {
    if (os === "android" && /; wv\)/.test(ua)) {
      inApp = true;
      platform = "android-webview";
    } else if (os === "ios" && /applewebkit/.test(ua) && !/safari/.test(ua) && /mobile/.test(ua)) {
      inApp = true;
      platform = "ios-webview";
    }
  }
  return { inApp, os, platform };
}

// Превращает целевой URL в Android intent:// — это заставляет систему
// открыть ссылку во внешнем браузере (Chrome) вместо webview приложения.
export function toAndroidIntent(url: string): string {
  try {
    const u = new URL(url);
    const scheme = u.protocol.replace(":", "");
    const rest = url.slice(u.protocol.length + 2); // убираем "scheme://"
    return `intent://${rest}#Intent;scheme=${scheme};action=android.intent.action.VIEW;end`;
  } catch {
    return url;
  }
}

// Пытается открыть URL вне webview. Возвращает true, если предприняли попытку
// принудительного выхода (Android). На iOS форс невозможен — вернёт false,
// и вызывающий код должен показать подсказку.
export function tryEscape(url: string, esc: Escape): boolean {
  if (!esc.inApp) {
    window.location.href = url;
    return true;
  }

  if (esc.os === "android") {
    // intent:// открывает системный браузер из большинства webview
    window.location.href = toAndroidIntent(url);
    return true;
  }

  // iOS: вложенный webview нельзя форсированно покинуть.
  // Открываем ссылку (останется в webview) — подсказку показываем отдельно.
  window.location.href = url;
  return false;
}
