// Детект встроенного браузера (in-app webview) по User-Agent.
// Используется и на сервере (для аналитики), и компилируется в клиентский скрипт.

export type UAInfo = {
  inApp: boolean;
  platform: string; // tiktok | instagram | facebook | snapchat | ... | ios | android | browser
  os: "ios" | "android" | "other";
};

export function parseUA(ua: string): UAInfo {
  const s = (ua || "").toLowerCase();
  const os: UAInfo["os"] = /iphone|ipad|ipod/.test(s)
    ? "ios"
    : /android/.test(s)
      ? "android"
      : "other";

  // Сигнатуры встроенных браузеров популярных приложений
  const apps: { id: string; test: RegExp }[] = [
    { id: "tiktok", test: /musical_ly|bytedance|tiktok|trill|aweme/ },
    { id: "instagram", test: /instagram/ },
    { id: "facebook", test: /fb_iab|fban|fbav|fbios/ },
    { id: "snapchat", test: /snapchat/ },
    { id: "pinterest", test: /pinterest/ },
    { id: "twitter", test: /twitter/ },
    { id: "line", test: /\bline\// },
    { id: "telegram", test: /telegram/ },
  ];

  for (const app of apps) {
    if (app.test.test(s)) return { inApp: true, platform: app.id, os };
  }

  // Общий признак webview без явного приложения
  const genericWebview =
    (os === "android" && /; wv\)/.test(s)) ||
    (os === "ios" && !/safari/.test(s) && /applewebkit/.test(s) && /mobile/.test(s));

  if (genericWebview) {
    return { inApp: true, platform: os === "ios" ? "ios-webview" : "android-webview", os };
  }

  return { inApp: false, platform: os === "other" ? "browser" : os, os };
}
