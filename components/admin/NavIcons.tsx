import React from "react";

const w = (p: React.ReactNode) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {p}
  </svg>
);

export const NavI = {
  search: w(<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>),
  profile: w(<><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></>),
  messages: w(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />),
  analytics: w(<><path d="M3 3v18h18" /><rect x="7" y="10" width="3" height="7" /><rect x="12" y="6" width="3" height="11" /><rect x="17" y="13" width="3" height="4" /></>),
  agency: w(<><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5M15 20c0-2 1-3.5 3-3.5s3 1.5 3 3.5" /></>),
  post: w(<><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>),
  sales: w(<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a4 4 0 0 1 8 0v2" /></>),
  tips: w(<><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.5a2.5 2 0 0 1 5 0c0 1.5-2.5 1.5-2.5 2.5M9.5 14.5a2.5 2 0 0 0 5 0" /></>),
  merch: w(<path d="M16 3 21 8v13H3V8l5-5M9 3a3 3 0 0 0 6 0" />),
  digital: w(<><rect x="2" y="4" width="20" height="14" rx="2" /><path d="M8 21h8M12 18v3" /></>),
  automation: w(<><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></>),
  course: w(<><path d="M3 6l9-3 9 3-9 3Z" /><path d="M3 6v8M21 6v8M7 9v5a5 3 0 0 0 10 0V9" /></>),
  leads: w(<><path d="M3 5h18M3 12h18M3 19h12" /></>),
  ambassador: w(<><circle cx="12" cy="9" r="5" /><path d="m8 13-2 8 6-3 6 3-2-8" /></>),
  ai: w(<><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" /></>),
  pro: w(<path d="M3 17l3-9 4 5 2-7 2 7 4-5 3 9z" />),
  help: w(<><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7M12 17h.01" /></>),
  bell: w(<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>),
  settings: w(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 7 2.6h.1A1.6 1.6 0 0 0 8 1.1V1a2 2 0 1 1 4 0v.1A1.6 1.6 0 0 0 17 2.6a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.1a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.4 1z" /></>),
  qr: w(<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 14v7M17 21h4" /></>),
  copy: w(<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>),
  collapse: w(<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></>),
  chevron: w(<path d="m6 9 6 6 6-6" />),
  plus: w(<path d="M12 5v14M5 12h14" />),
  link: w(<><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></>),
  heart: w(<path d="M19 14c1.5-1.5 3-3.3 3-5.5A4.5 4.5 0 0 0 12 6 4.5 4.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7Z" />),
  clock: w(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  music: w(<><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>),
  globe: w(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" /></>),
  cursor: w(<path d="m4 4 7 17 2-7 7-2Z" />),
  activity: w(<path d="M3 12h4l3 8 4-16 3 8h4" />),
  pie: w(<><path d="M12 3v9l7 5A9 9 0 1 0 12 3" /></>),
};
