"use client";

import { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import PhonePreview, { type PreviewProfile } from "@/components/PhonePreview";
import ImageCropper from "@/components/ImageCropper";
import { NavI } from "@/components/admin/NavIcons";
import { SocialIcon, ICON_KEYS, ICON_BG } from "@/components/SocialIcons";
import type { Design, Link as TLink, LinkSize, QuickSettings } from "@/lib/types";
import s from "./edit.module.css";

type RightView = "dashboard" | "appearance" | "featured" | "platforms" | "editLink";

async function uploadBlob(blob: Blob): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", blob, "image.jpg");
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json();
  return data.ok ? data.url : null;
}

// Контекст для запуска обрезки картинки из любого под-компонента
type PickImage = (file: File, aspect: number, onUrl: (url: string) => void) => void;
const CropContext = createContext<PickImage>(() => {});
function usePickImage() {
  return useContext(CropContext);
}

const THEMES: { id: string; name: string; design: Partial<Design> }[] = [
  { id: "midnight", name: "Midnight", design: { bgType: "gradient", bgGradientFrom: "#2a1830", bgGradientTo: "#0e0e12", accent: "#e1306c", buttonStyle: "glass" } },
  { id: "ocean", name: "Ocean", design: { bgType: "gradient", bgGradientFrom: "#0f2027", bgGradientTo: "#2c5364", accent: "#29a9eb", buttonStyle: "glass" } },
  { id: "sunset", name: "Sunset", design: { bgType: "gradient", bgGradientFrom: "#ff512f", bgGradientTo: "#dd2476", accent: "#ffffff", buttonStyle: "soft" } },
  { id: "mono", name: "Mono", design: { bgType: "solid", bgColor: "#0d0d0d", accent: "#ffffff", buttonStyle: "outline" } },
  { id: "forest", name: "Forest", design: { bgType: "gradient", bgGradientFrom: "#134e5e", bgGradientTo: "#0b3d2e", accent: "#71c97a", buttonStyle: "soft" } },
  { id: "candy", name: "Candy", design: { bgType: "gradient", bgGradientFrom: "#fbc2eb", bgGradientTo: "#a18cd1", accent: "#ff4d8d", buttonStyle: "solid", textColor: "#1a1a1a", buttonTextColor: "#ffffff" } },
];

const SWATCHES = ["#e1306c", "#7c5cff", "#29a9eb", "#22c55e", "#f59e0b", "#ef4444", "#ffffff", "#111111"];

export default function EditProfile({
  accountLabel,
  username,
  initialProfile,
  initialDesign,
  initialSettings,
  initialLinks,
}: {
  accountLabel: string;
  username: string;
  initialProfile: { id: string } & PreviewProfile;
  initialDesign: Design;
  initialSettings: QuickSettings;
  initialLinks: TLink[];
}) {
  const router = useRouter();
  const profileId = initialProfile.id;
  const [profile, setProfile] = useState<PreviewProfile>(initialProfile);
  const [design, setDesign] = useState<Design>(initialDesign);
  const [settings, setSettings] = useState<QuickSettings>(initialSettings);
  const [links, setLinks] = useState<TLink[]>(initialLinks);
  const [view, setView] = useState<RightView>("dashboard");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [crop, setCrop] = useState<{ src: string; aspect: number; cb: (url: string) => void } | null>(null);

  // открыть обрезку для выбранного файла
  const pickImage: PickImage = (file, aspect, onUrl) => {
    const src = URL.createObjectURL(file);
    setCrop({ src, aspect, cb: onUrl });
  };
  async function applyCrop(blob: Blob) {
    if (!crop) return;
    const cb = crop.cb;
    URL.revokeObjectURL(crop.src);
    setCrop(null);
    const url = await uploadBlob(blob);
    if (url) cb(url);
  }

  // ── Persistence ──
  async function saveProfile(patch: Record<string, unknown>) {
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: profileId, ...patch }),
    });
  }
  function setDesignPatch(p: Partial<Design>) {
    const next = { ...design, ...p };
    setDesign(next);
    saveProfile({ design: next });
  }
  function setSettingsPatch(p: Partial<QuickSettings>) {
    const next = { ...settings, ...p };
    setSettings(next);
    saveProfile({ settings: next });
  }
  function setProfilePatch(p: Partial<PreviewProfile>) {
    const next = { ...profile, ...p };
    setProfile(next);
  }

  async function addLink(kind: "link" | "social") {
    const res = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, kind }),
    });
    const data = await res.json();
    if (data.ok) {
      setLinks((l) => [...l, data.link]);
      if (kind === "link") {
        setEditingId(data.link.id);
        setView("editLink");
      }
    }
  }
  async function patchLink(id: string, patch: Partial<TLink>) {
    setLinks((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    await fetch("/api/links", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
  }
  async function removeLink(id: string) {
    setLinks((ls) => ls.filter((l) => l.id !== id));
    await fetch("/api/links", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }
  async function reorder(next: TLink[]) {
    setLinks(next);
    await fetch("/api/links", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, orderedIds: next.map((l) => l.id) }),
    });
  }

  const editing = links.find((l) => l.id === editingId) || null;

  return (
    <CropContext.Provider value={pickImage}>
    {crop && (
      <ImageCropper
        src={crop.src}
        aspect={crop.aspect}
        onCancel={() => {
          URL.revokeObjectURL(crop.src);
          setCrop(null);
        }}
        onApply={applyCrop}
      />
    )}
    <AdminShell username={username} accountLabel={accountLabel} active="profile" pageTitle="Edit Profile">
      <div className={s.layout}>
        {/* ── Stage: live phone ── */}
        <div className={s.stage}>
          <div className={s.stageInner}>
            <PhonePreview
              profile={profile}
              design={design}
              links={links}
              settings={settings}
              editable
              onAddLink={() => addLink("link")}
              onEditLink={(id) => {
                setEditingId(id);
                setView("editLink");
              }}
              onEditProfile={() => setView("dashboard")}
            />
            <div className={s.stageActions}>
              <button className={s.btnGhost} onClick={() => setDesignPatch({})}>
                Restore Defaults
              </button>
              <a href={`/${username}`} target="_blank" className={s.btnWhite} style={{ padding: "9px 16px", borderRadius: 10, fontWeight: 600 }}>
                Show on Profile
              </a>
            </div>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className={s.panel}>
          {view === "dashboard" && (
            <DashboardPanel
              profile={profile}
              settings={settings}
              onProfile={setProfilePatch}
              onProfileSave={saveProfile}
              onToggle={setSettingsPatch}
              onFollowers={(n) => setSettingsPatch({ followersCount: n })}
              goAppearance={() => setView("appearance")}
              goFeatured={() => setView("featured")}
              goPlatforms={() => setView("platforms")}
            />
          )}
          {view === "appearance" && (
            <AppearancePanel design={design} onChange={setDesignPatch} onBack={() => setView("dashboard")} />
          )}
          {view === "featured" && (
            <FeaturedPanel
              links={links}
              onAdd={() => addLink("link")}
              onEdit={(id) => {
                setEditingId(id);
                setView("editLink");
              }}
              onRemove={removeLink}
              onReorder={reorder}
              onBack={() => setView("dashboard")}
            />
          )}
          {view === "platforms" && (
            <PlatformsPanel
              links={links}
              onAdd={() => addLink("social")}
              onPatch={patchLink}
              onRemove={removeLink}
              onBack={() => setView("dashboard")}
            />
          )}
          {view === "editLink" && editing && (
            <EditLinkPanel
              link={editing}
              onPatch={(p) => patchLink(editing.id, p)}
              onRemove={() => {
                removeLink(editing.id);
                setView("featured");
              }}
              onClose={() => setView("featured")}
            />
          )}
        </div>
      </div>
    </AdminShell>
    </CropContext.Provider>
  );
}

// ───────────────────────── Toggle ─────────────────────────
function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button className={`${s.toggle} ${on ? s.toggleOn : ""}`} onClick={onClick} type="button">
      <span className={s.knob} />
    </button>
  );
}

// ───────────────────────── Dashboard panel ─────────────────────────
function DashboardPanel({
  profile,
  settings,
  onProfile,
  onProfileSave,
  onToggle,
  onFollowers,
  goAppearance,
  goFeatured,
  goPlatforms,
}: {
  profile: PreviewProfile;
  settings: QuickSettings;
  onProfile: (p: Partial<PreviewProfile>) => void;
  onProfileSave: (p: Record<string, unknown>) => void;
  onToggle: (p: Partial<QuickSettings>) => void;
  onFollowers: (n: number) => void;
  goAppearance: () => void;
  goFeatured: () => void;
  goPlatforms: () => void;
}) {
  const [tab, setTab] = useState<"content" | "ai">("content");
  const pickImage = usePickImage();

  const QS = [
    { key: "deeplinkBanner", icon: NavI.link, title: "Deeplink Banner", sub: "Help visitors switch to Safari/Chrome", pro: true },
    { key: "addToContacts", icon: NavI.profile, title: "Add to Contacts", sub: "Let visitors save you", pro: true },
    { key: "totalFollowers", icon: NavI.agency, title: "Total Followers", sub: "Show follower count", pro: true },
    { key: "shoutsMedia", icon: NavI.messages, title: "Shouts & Media", sub: "Show on profile", pro: true },
    { key: "showIcon", icon: NavI.pro, title: "TreeLink Icon", sub: "Show on profile", pro: true },
  ] as const;

  return (
    <>
      <div className={s.panelScroll}>
        <div className={s.segmented}>
          <button className={`${s.segBtn} ${tab === "content" ? s.segActive : ""}`} onClick={() => setTab("content")}>
            Add Content
          </button>
          <button className={`${s.segBtn} ${tab === "ai" ? s.segActive : ""}`} onClick={() => setTab("ai")}>
            AI Compliance
          </button>
        </div>

        {tab === "ai" ? (
          <div className={s.hintCenter} style={{ padding: 30 }}>
            AI-проверка контента на соответствие правилам площадок — скоро.
          </div>
        ) : (
          <>
            <div className={s.h2}>Profile Dashboard</div>

            {/* Профиль */}
            <div className={s.field}>
              <label className={s.label}>Имя</label>
              <input
                className={s.input}
                value={profile.display_name}
                onChange={(e) => onProfile({ display_name: e.target.value })}
                onBlur={(e) => onProfileSave({ display_name: e.target.value })}
              />
            </div>
            <div className={s.field}>
              <label className={s.label}>Описание / @username</label>
              <input
                className={s.input}
                value={profile.bio}
                onChange={(e) => onProfile({ bio: e.target.value })}
                onBlur={(e) => onProfileSave({ bio: e.target.value })}
              />
            </div>
            <div className={s.field}>
              <label className={s.label}>Фото профиля</label>
              <div className={s.row}>
                <input
                  className={s.input}
                  placeholder="URL"
                  value={profile.avatar_url}
                  onChange={(e) => onProfile({ avatar_url: e.target.value })}
                  onBlur={(e) => onProfileSave({ avatar_url: e.target.value })}
                />
                <label className={s.btnGhost} style={{ flex: "0 0 auto", cursor: "pointer", display: "grid", placeItems: "center" }}>
                  Загрузить
                  <input type="file" accept="image/*" hidden onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) pickImage(f, 4 / 5, (url) => { onProfile({ avatar_url: url }); onProfileSave({ avatar_url: url }); });
                    e.target.value = "";
                  }} />
                </label>
              </div>
            </div>

            <div className={s.sectionLabel}>Quick Settings</div>
            {QS.map((q) => (
              <div key={q.key}>
                <div className={s.qsRow}>
                  <span className={s.qsIcon}>{q.icon}</span>
                  <div className={s.qsText}>
                    <div className={s.qsTitle}>
                      {q.title} {q.pro && <span className={s.proTag}>PRO</span>}
                    </div>
                    <div className={s.qsSub}>{q.sub}</div>
                  </div>
                  <Toggle on={!!settings[q.key]} onClick={() => onToggle({ [q.key]: !settings[q.key] } as Partial<QuickSettings>)} />
                </div>
                {q.key === "totalFollowers" && settings.totalFollowers && (
                  <div className={s.field} style={{ marginTop: 8 }}>
                    <input
                      className={s.input}
                      type="number"
                      placeholder="Число подписчиков"
                      value={settings.followersCount}
                      onChange={(e) => onFollowers(Number(e.target.value) || 0)}
                    />
                  </div>
                )}
              </div>
            ))}

            <div className={s.sectionLabel}>My Links</div>
            <button className={s.linkCard} onClick={goPlatforms}>
              <span className={s.linkCardIcon}>{NavI.heart}</span>
              <span className={s.linkCardText}>
                <b>Manage Platforms</b>
                <small>Add or edit platform links</small>
              </span>
              <span className={s.linkCardPlus}>{NavI.plus}</span>
            </button>
            <button className={s.linkCard} onClick={goFeatured}>
              <span className={s.linkCardIcon}>{NavI.link}</span>
              <span className={s.linkCardText}>
                <b>Featured Links</b>
                <small>Add link</small>
              </span>
              <span className={s.linkCardPlus}>{NavI.plus}</span>
            </button>
            <button className={s.linkCard}>
              <span className={s.linkCardIcon}>{NavI.clock}</span>
              <span className={s.linkCardText}>
                <b>Link Scheduler <span className={s.proTag}>PRO</span></b>
                <small>Schedule links to go live</small>
              </span>
              <span className={s.linkCardPlus}>{NavI.plus}</span>
            </button>
            <button className={s.linkCard}>
              <span className={s.linkCardIcon}>{NavI.music}</span>
              <span className={s.linkCardText}>
                <b>Music Smart Link</b>
                <small>Add music links for multiple platforms</small>
              </span>
              <span className={s.linkCardPlus}>{NavI.plus}</span>
            </button>
          </>
        )}
      </div>

      <div className={s.bottomTabs}>
        <button className={s.bottomTabActive} onClick={goAppearance}>Appearance</button>
        <button className={s.bottomTab}>E-commerce</button>
        <button className={s.bottomTab}>Products</button>
        <button className={s.bottomTab}>Events</button>
        <button className={s.bottomTab}>Forms</button>
        <button className={s.bottomTab}>Analytics</button>
      </div>
    </>
  );
}

// ───────────────────────── Appearance panel ─────────────────────────
function AppearancePanel({
  design,
  onChange,
  onBack,
}: {
  design: Design;
  onChange: (p: Partial<Design>) => void;
  onBack: () => void;
}) {
  const pickImage = usePickImage();
  return (
    <div className={s.panelScroll}>
      <div className={s.panelHead}>
        <button className={s.backBtn} onClick={onBack}>← Назад</button>
        <span style={{ fontWeight: 700 }}>Appearance</span>
      </div>

      <div className={s.sectionLabel}>Темы</div>
      <div className={s.themeGrid}>
        {THEMES.map((t) => {
          const d = { ...design, ...t.design } as Design;
          const bg = d.bgType === "gradient" ? `linear-gradient(160deg, ${d.bgGradientFrom}, ${d.bgGradientTo})` : d.bgColor;
          return (
            <button
              key={t.id}
              className={`${s.themeCard} ${design.theme === t.id ? s.themeActive : ""}`}
              style={{ background: bg }}
              onClick={() => onChange({ ...t.design, theme: t.id })}
            >
              <span className={s.themeName} style={{ color: d.textColor || "#fff" }}>{t.name}</span>
            </button>
          );
        })}
      </div>

      <div className={s.sectionLabel}>Шапка профиля</div>
      <div className={s.sizeGrid} style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
        <button
          className={`${s.sizeBtn} ${design.headerStyle !== "hero" ? s.sizeActive : ""}`}
          onClick={() => onChange({ headerStyle: "classic" })}
        >
          <span className={s.sizeGlyph} style={{ borderRadius: "50%", width: 22, height: 22, alignSelf: "center" }} />
          Аватар
        </button>
        <button
          className={`${s.sizeBtn} ${design.headerStyle === "hero" ? s.sizeActive : ""}`}
          onClick={() => onChange({ headerStyle: "hero" })}
        >
          <span className={s.sizeGlyph} style={{ height: 30 }} />
          Большое фото
        </button>
      </div>
      <div className={s.hintText} style={{ marginBottom: 8 }}>
        «Большое фото» использует фото профиля как главную карточку и как размытый фон.
      </div>

      <div className={s.sectionLabel}>Фон</div>
      <div className={s.field}>
        <select className={s.select} value={design.bgType} onChange={(e) => onChange({ bgType: e.target.value as Design["bgType"] })}>
          <option value="solid">Сплошной цвет</option>
          <option value="gradient">Градиент</option>
          <option value="image">Картинка</option>
        </select>
      </div>
      {design.bgType === "solid" && (
        <div className={s.colorRow}>
          <input className={s.colorInput} type="color" value={design.bgColor} onChange={(e) => onChange({ bgColor: e.target.value })} />
          <span className={s.qsSub}>Цвет фона</span>
        </div>
      )}
      {design.bgType === "gradient" && (
        <div className={s.colorRow}>
          <input className={s.colorInput} type="color" value={design.bgGradientFrom} onChange={(e) => onChange({ bgGradientFrom: e.target.value })} />
          <input className={s.colorInput} type="color" value={design.bgGradientTo} onChange={(e) => onChange({ bgGradientTo: e.target.value })} />
          <span className={s.qsSub}>Сверху / снизу</span>
        </div>
      )}
      {design.bgType === "image" && (
        <div className={s.row}>
          <input className={s.input} placeholder="URL картинки" value={design.bgImage} onChange={(e) => onChange({ bgImage: e.target.value })} />
          <label className={s.btnGhost} style={{ flex: "0 0 auto", cursor: "pointer", display: "grid", placeItems: "center" }}>
            Загрузить
            <input type="file" accept="image/*" hidden onChange={(e) => {
              const f = e.target.files?.[0]; if (f) pickImage(f, 9 / 16, (url) => onChange({ bgImage: url }));
              e.target.value = "";
            }} />
          </label>
        </div>
      )}

      <div className={s.sectionLabel}>Кнопки</div>
      <div className={s.field}>
        <label className={s.label}>Стиль</label>
        <select className={s.select} value={design.buttonStyle} onChange={(e) => onChange({ buttonStyle: e.target.value as Design["buttonStyle"] })}>
          <option value="glass">Стекло</option>
          <option value="solid">Заливка</option>
          <option value="outline">Обводка</option>
          <option value="soft">Мягкая тень</option>
          <option value="hard">Жёсткая тень</option>
        </select>
      </div>
      <div className={s.field}>
        <label className={s.label}>Форма</label>
        <select className={s.select} value={design.buttonShape} onChange={(e) => onChange({ buttonShape: e.target.value as Design["buttonShape"] })}>
          <option value="rounded">Скруглённые</option>
          <option value="pill">Пилюля</option>
          <option value="square">Квадратные</option>
        </select>
      </div>
      <div className={s.field}>
        <label className={s.label}>Цвет акцента</label>
        <div className={s.colorRow}>
          {SWATCHES.map((c) => (
            <button key={c} className={`${s.swatch} ${design.accent === c ? s.swatchActive : ""}`} style={{ background: c }} onClick={() => onChange({ accent: c })} />
          ))}
          <input className={s.colorInput} type="color" value={design.accent} onChange={(e) => onChange({ accent: e.target.value })} />
        </div>
      </div>

      <div className={s.sectionLabel}>Текст</div>
      <div className={s.row}>
        <div className={s.field} style={{ flex: 1 }}>
          <label className={s.label}>Шрифт</label>
          <select className={s.select} value={design.font} onChange={(e) => onChange({ font: e.target.value as Design["font"] })}>
            <option value="system">Системный</option>
            <option value="rounded">Округлый</option>
            <option value="serif">С засечками</option>
            <option value="mono">Моноширинный</option>
          </select>
        </div>
        <div className={s.field} style={{ flex: "0 0 90px" }}>
          <label className={s.label}>Цвет</label>
          <input className={s.colorInput} type="color" value={design.textColor} onChange={(e) => onChange({ textColor: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Featured links list ─────────────────────────
function FeaturedPanel({
  links,
  onAdd,
  onEdit,
  onRemove,
  onReorder,
  onBack,
}: {
  links: TLink[];
  onAdd: () => void;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
  onReorder: (next: TLink[]) => void;
  onBack: () => void;
}) {
  const featured = links.filter((l) => l.kind === "link");
  function move(idx: number, dir: -1 | 1) {
    const arr = [...links];
    const ids = featured.map((f) => f.id);
    const a = ids[idx];
    const b = ids[idx + dir];
    if (!a || !b) return;
    const ia = arr.findIndex((l) => l.id === a);
    const ib = arr.findIndex((l) => l.id === b);
    [arr[ia], arr[ib]] = [arr[ib], arr[ia]];
    onReorder(arr);
  }
  return (
    <div className={s.panelScroll}>
      <div className={s.panelHead}>
        <button className={s.backBtn} onClick={onBack}>← Назад</button>
        <span style={{ fontWeight: 700 }}>Featured Links</span>
      </div>
      <button className={s.btn + " " + s.full} onClick={onAdd} style={{ marginBottom: 14 }}>
        + Добавить ссылку
      </button>
      {featured.map((l, i) => (
        <div key={l.id} className={s.linkCard} style={{ cursor: "default" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <button className={s.closeBtn} style={{ width: 22, height: 18 }} onClick={() => move(i, -1)}>▲</button>
            <button className={s.closeBtn} style={{ width: 22, height: 18 }} onClick={() => move(i, 1)}>▼</button>
          </div>
          <button className={s.linkCardText} style={{ background: "none", border: "none", textAlign: "left", color: "inherit", cursor: "pointer" }} onClick={() => onEdit(l.id)}>
            <b>{l.title || "Без названия"}</b>
            <small>{l.size} · {l.url || "нет ссылки"}</small>
          </button>
          <button className={s.closeBtn} onClick={() => onRemove(l.id)}>✕</button>
        </div>
      ))}
      {featured.length === 0 && <div className={s.hintCenter}>Пока нет ссылок.</div>}
    </div>
  );
}

// ───────────────────────── Edit one featured link ─────────────────────────
function EditLinkPanel({
  link,
  onPatch,
  onRemove,
  onClose,
}: {
  link: TLink;
  onPatch: (p: Partial<TLink>) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const [l, setL] = useState(link);
  const [useIcon, setUseIcon] = useState(!!link.icon);
  const [showColor, setShowColor] = useState(false);
  const pickImage = usePickImage();
  function set(p: Partial<TLink>) {
    setL({ ...l, ...p });
    onPatch(p);
  }
  const sizes: { id: LinkSize; label: string; glyph: string }[] = [
    { id: "big", label: "Big", glyph: s.sizeGlyph },
    { id: "medium", label: "Medium", glyph: `${s.sizeGlyph} ${s.sizeGlyphMed}` },
    { id: "small", label: "Small", glyph: `${s.sizeGlyph} ${s.sizeGlyphSm}` },
    { id: "button", label: "Button", glyph: `${s.sizeGlyph} ${s.sizeGlyphBtn}` },
  ];
  return (
    <>
      <div className={s.panelScroll}>
        <div className={s.panelHead}>
          <span style={{ fontWeight: 700, fontSize: 17 }}>Update Featured Link</span>
          <button className={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={s.previewImg}>
          {l.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={l.image_url} alt="" />
          ) : (
            <div style={{ display: "grid", placeItems: "center", height: "100%", color: "#666" }}>Нет картинки</div>
          )}
          {l.title && <span className={s.previewImgTitle}>{l.title}</span>}
        </div>
        <label className={s.btnGhost} style={{ display: "block", textAlign: "center", cursor: "pointer", marginBottom: 6 }}>
          Загрузить картинку
          <input type="file" accept="image/*" hidden onChange={(e) => {
            const f = e.target.files?.[0];
            const asp = l.size === "medium" ? 16 / 6 : l.size === "small" ? 1 : 16 / 11;
            if (f) pickImage(f, asp, (url) => set({ image_url: url }));
            e.target.value = "";
          }} />
        </label>
        <div className={s.hintCenter}>Find the look that fits you best</div>

        <div className={s.sizeGrid}>
          {sizes.map((sz) => (
            <button key={sz.id} className={`${s.sizeBtn} ${l.size === sz.id ? s.sizeActive : ""}`} onClick={() => set({ size: sz.id })}>
              <span className={sz.glyph} />
              {sz.label}
            </button>
          ))}
        </div>

        <div className={s.qsRow}>
          <div className={s.qsText}>
            <div className={s.qsTitle}>Use link icon</div>
          </div>
          <Toggle on={useIcon} onClick={() => { const v = !useIcon; setUseIcon(v); if (!v) set({ icon: "" }); else set({ icon: "link" }); }} />
        </div>
        {useIcon && (
          <div className={s.field}>
            <select className={s.select} value={l.icon} onChange={(e) => set({ icon: e.target.value })}>
              {ICON_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        )}

        <div className={s.field}>
          <input className={s.input} placeholder="https://…" value={l.url} onChange={(e) => set({ url: e.target.value })} />
        </div>
        <div className={s.field}>
          <input className={s.input} placeholder="Заголовок" value={l.title} onChange={(e) => set({ title: e.target.value })} />
        </div>

        <button className={s.linkCard} onClick={() => setShowColor((v) => !v)}>
          <span className={s.linkCardText}><b>Customize Color</b></span>
          <span className={s.linkCardPlus}>{NavI.chevron}</span>
        </button>
        {showColor && (
          <div className={s.colorRow} style={{ marginBottom: 12 }}>
            <button className={`${s.swatch} ${!l.tint ? s.swatchActive : ""}`} style={{ background: "#333" }} onClick={() => set({ tint: "" })} />
            {SWATCHES.map((c) => (
              <button key={c} className={`${s.swatch} ${l.tint === c ? s.swatchActive : ""}`} style={{ background: c }} onClick={() => set({ tint: c })} />
            ))}
            <input className={s.colorInput} type="color" value={l.tint || "#333333"} onChange={(e) => set({ tint: e.target.value })} />
          </div>
        )}

        <div className={s.qsRow}>
          <div className={s.qsText}>
            <div className={s.qsTitle}>Выходить из встроенного браузера</div>
            <div className={s.qsSub}>deeplink → Safari/Chrome</div>
          </div>
          <Toggle on={!!l.force_external} onClick={() => set({ force_external: l.force_external ? 0 : 1 })} />
        </div>

        <button className={s.btnDanger + " " + s.full} style={{ marginTop: 8, padding: 11, borderRadius: 10 }} onClick={onRemove}>
          Удалить ссылку
        </button>
      </div>
      <div className={s.panelFooter}>
        <button className={`${s.btnWhite} ${s.full}`} style={{ padding: 13, borderRadius: 12, fontWeight: 700, border: "none" }} onClick={onClose}>
          Update
        </button>
      </div>
    </>
  );
}

// ───────────────────────── Platforms (socials) ─────────────────────────
function PlatformsPanel({
  links,
  onAdd,
  onPatch,
  onRemove,
  onBack,
}: {
  links: TLink[];
  onAdd: () => void;
  onPatch: (id: string, p: Partial<TLink>) => void;
  onRemove: (id: string) => void;
  onBack: () => void;
}) {
  const socials = links.filter((l) => l.kind === "social");
  return (
    <div className={s.panelScroll}>
      <div className={s.panelHead}>
        <button className={s.backBtn} onClick={onBack}>← Назад</button>
        <span style={{ fontWeight: 700 }}>Manage Platforms</span>
      </div>
      <button className={s.btn + " " + s.full} onClick={onAdd} style={{ marginBottom: 14 }}>
        + Добавить платформу
      </button>
      {socials.map((l) => (
        <div key={l.id} className={s.linkCard} style={{ cursor: "default", flexWrap: "wrap" }}>
          <span className={s.linkCardIcon} style={{ background: ICON_BG[l.icon] || "#1c1c27", color: "#fff" }}>
            <SocialIcon icon={l.icon} size={18} />
          </span>
          <div style={{ flex: 1, minWidth: 140, display: "flex", flexDirection: "column", gap: 6 }}>
            <select className={s.select} value={l.icon} onChange={(e) => onPatch(l.id, { icon: e.target.value })}>
              {ICON_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            <input className={s.input} placeholder="https://…" value={l.url} onChange={(e) => onPatch(l.id, { url: e.target.value })} />
          </div>
          <button className={s.closeBtn} onClick={() => onRemove(l.id)}>✕</button>
        </div>
      ))}
      {socials.length === 0 && <div className={s.hintCenter}>Пока нет платформ.</div>}
    </div>
  );
}
