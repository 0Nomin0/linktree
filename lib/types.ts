export type Account = {
  id: string;
  label: string;
  access_key: string;
  created_at: number;
};

export type Design = {
  bgType: "solid" | "gradient" | "image";
  bgColor: string;
  bgGradientFrom: string;
  bgGradientTo: string;
  bgImage: string;
  headerStyle: "classic" | "hero"; // classic = круглый аватар, hero = большое фото на фон
  accent: string; // цвет кнопок / иконок
  buttonTextColor: string;
  buttonShape: "rounded" | "pill" | "square";
  buttonStyle: "solid" | "outline" | "glass" | "soft" | "hard";
  textColor: string;
  font: "system" | "rounded" | "serif" | "mono";
  theme: string; // имя выбранного пресета-темы
};

export const DEFAULT_DESIGN: Design = {
  bgType: "gradient",
  bgColor: "#0e0e12",
  bgGradientFrom: "#2a1830",
  bgGradientTo: "#0e0e12",
  bgImage: "",
  headerStyle: "classic",
  accent: "#e1306c",
  buttonTextColor: "#ffffff",
  buttonShape: "rounded",
  buttonStyle: "glass",
  textColor: "#ffffff",
  font: "system",
  theme: "midnight",
};

// Quick Settings (тумблеры справа в LinkMe)
export type QuickSettings = {
  deeplinkBanner: boolean; // показывать баннер «открыть в браузере»
  addToContacts: boolean;
  totalFollowers: boolean;
  followersCount: number;
  shoutsMedia: boolean; // показывать блок Shouts/Media
  showIcon: boolean; // показывать иконку TreeLink в футере
};

export const DEFAULT_SETTINGS: QuickSettings = {
  deeplinkBanner: true,
  addToContacts: false,
  totalFollowers: false,
  followersCount: 0,
  shoutsMedia: true,
  showIcon: true,
};

export type Profile = {
  id: string;
  account_id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  design: string; // JSON в БД
  settings: string; // JSON в БД
  created_at: number;
  updated_at: number;
};

export type LinkKind = "link" | "social";
export type LinkSize = "big" | "medium" | "small" | "button";

export type Link = {
  id: string;
  profile_id: string;
  kind: LinkKind;
  title: string;
  url: string;
  image_url: string;
  icon: string;
  size: LinkSize;
  tint: string;
  position: number;
  enabled: number;
  force_external: number;
};

export type EventType = "view" | "click";
