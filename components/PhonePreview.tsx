"use client";

import { useState } from "react";
import type { Design, Link, QuickSettings } from "@/lib/types";
import { SocialIcon, ICON_BG } from "./SocialIcons";
import s from "./PhonePreview.module.css";

export type PreviewProfile = {
  display_name: string;
  bio: string;
  avatar_url: string;
};

export function bgValue(d: Design): string {
  if (d.bgType === "image" && d.bgImage)
    return `center / cover no-repeat url("${d.bgImage}")`;
  if (d.bgType === "gradient")
    return `linear-gradient(160deg, ${d.bgGradientFrom}, ${d.bgGradientTo})`;
  return d.bgColor;
}

export function radiusValue(d: Design): number {
  return d.buttonShape === "pill" ? 999 : d.buttonShape === "square" ? 6 : 18;
}

export function cardStyle(d: Design, tint?: string): React.CSSProperties {
  const accent = tint || d.accent;
  if (d.buttonStyle === "outline")
    return { background: "transparent", border: `1.5px solid ${accent}`, color: d.buttonTextColor };
  if (d.buttonStyle === "glass")
    // без backdrop-filter — он тормозит при скролле (пересчёт каждый кадр)
    return {
      background: "rgba(28,28,38,0.85)",
      border: "1px solid rgba(255,255,255,0.08)",
      color: d.buttonTextColor,
    };
  if (d.buttonStyle === "soft")
    return { background: accent, color: d.buttonTextColor, boxShadow: `0 8px 20px ${accent}55` };
  if (d.buttonStyle === "hard")
    return { background: accent, color: d.buttonTextColor, boxShadow: `5px 5px 0 #00000088` };
  return { background: accent, color: d.buttonTextColor };
}

export default function PhonePreview({
  profile,
  design,
  links,
  settings,
  scale = true,
  editable = false,
  onAddLink,
  onEditLink,
  onEditProfile,
}: {
  profile: PreviewProfile;
  design: Design;
  links: Link[];
  settings: QuickSettings;
  scale?: boolean;
  editable?: boolean;
  onAddLink?: () => void;
  onEditLink?: (id: string) => void;
  onEditProfile?: () => void;
}) {
  const [tab, setTab] = useState<"shouts" | "media">("shouts");
  const socials = links.filter((l) => l.kind === "social" && l.enabled);
  const cards = links.filter((l) => l.kind === "link" && l.enabled);
  const radius = radiusValue(design);
  const hero = design.headerStyle === "hero" && !!profile.avatar_url;

  const socialsRow = socials.length > 0 && (
    <div className={s.socials}>
      {socials.map((l) => (
        <span key={l.id} className={s.social} style={{ background: ICON_BG[l.icon] || ICON_BG.link }}>
          <SocialIcon icon={l.icon} size={16} />
        </span>
      ))}
    </div>
  );

  return (
    <div className={`${s.phone} ${scale ? s.scaled : ""}`}>
      <div className={`${s.screen} font-${design.font}`} style={{ color: design.textColor }}>
        <div
          className={`${s.bg} ${hero ? s.bgHero : ""}`}
          style={hero ? { backgroundImage: `url("${profile.avatar_url}")` } : { background: bgValue(design) }}
        />
        <div className={hero ? s.scrimHero : s.scrim} />
        <div className={s.inner}>
          {settings.deeplinkBanner && (
            <div className={s.deeplinkBanner}>↗ Открыть в браузере для лучшего опыта</div>
          )}

          {hero ? (
            <div
              className={s.hero}
              onClick={editable ? onEditProfile : undefined}
              style={editable ? { cursor: "pointer" } : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={profile.avatar_url} alt="" className={s.heroImg} />
              <div className={s.heroOverlay} />
              <div className={s.heroContent}>
                <div className={s.heroName}>{profile.display_name || "Имя"}</div>
                {profile.bio && <div className={s.heroUser}>{profile.bio}</div>}
                {settings.totalFollowers && (
                  <div className={s.followers}>
                    <b>{settings.followersCount.toLocaleString()}</b> подписчиков
                  </div>
                )}
                {socialsRow}
              </div>
            </div>
          ) : (
            <div
              className={s.header}
              onClick={editable ? onEditProfile : undefined}
              style={editable ? { cursor: "pointer" } : undefined}
            >
              <div className={s.avatar}>
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="" />
                ) : (
                  <span>{(profile.display_name || "?").slice(0, 1)}</span>
                )}
              </div>
              <div className={s.name}>{profile.display_name || "Имя"}</div>
              {profile.bio && <div className={s.bio}>{profile.bio}</div>}
              {settings.totalFollowers && (
                <div className={s.followers}>
                  <b>{settings.followersCount.toLocaleString()}</b> подписчиков
                </div>
              )}
              {socialsRow}
            </div>
          )}

          <div className={s.cards}>
            {cards.map((l) =>
              editable ? (
                <button
                  key={l.id}
                  type="button"
                  className={s.editCard}
                  onClick={() => onEditLink?.(l.id)}
                  title="Редактировать кнопку"
                >
                  <PreviewCard link={l} design={design} radius={radius} />
                  <span className={s.editHint}>✎</span>
                </button>
              ) : (
                <PreviewCard key={l.id} link={l} design={design} radius={radius} />
              )
            )}
            {editable && (
              <button type="button" className={s.addTile} onClick={() => onAddLink?.()} style={{ borderRadius: radius }}>
                <span className={s.addPlus}>+</span> Добавить кнопку
              </button>
            )}
            {!editable && cards.length === 0 && <div className={s.placeholder}>Добавьте ссылку →</div>}
          </div>

          {settings.shoutsMedia && (
            <>
              <div className={s.tabs}>
                <button className={tab === "shouts" ? s.tabActive : s.tab} onClick={() => setTab("shouts")}>
                  Shouts
                </button>
                <button className={tab === "media" ? s.tabActive : s.tab} onClick={() => setTab("media")}>
                  Media
                </button>
              </div>
              <div className={s.tabBody}>
                <div className={s.emptyIcon}>📣</div>
                <div className={s.emptyTitle}>{tab === "shouts" ? "No Shouts yet!" : "No Media yet!"}</div>
                <div className={s.emptySub}>
                  {tab === "shouts" ? "Shouts" : "Media"} posted by {profile.display_name || "you"} will appear here
                </div>
              </div>
            </>
          )}
          <div className={s.footer}>
            <span>Privacy Policy</span> · <span>Terms</span> · <span>Report</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewCard({ link, design, radius }: { link: Link; design: Design; radius: number }) {
  const style = cardStyle(design, link.tint);
  const hasImg = !!link.image_url && link.size !== "button";

  if (link.size === "small") {
    return (
      <div className={s.cardSmall} style={{ ...style, borderRadius: radius }}>
        {hasImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={link.image_url} alt="" className={s.smallThumb} />
        ) : link.icon ? (
          <span className={s.smallIcon} style={{ background: ICON_BG[link.icon] || "#0003" }}>
            <SocialIcon icon={link.icon} size={16} />
          </span>
        ) : null}
        <span className={s.smallTitle}>{link.title || "Ссылка"}</span>
      </div>
    );
  }

  if (link.size === "button" || !hasImg) {
    return (
      <div className={s.cardButton} style={{ ...style, borderRadius: radius }}>
        {link.icon && (
          <span className={s.btnIcon}>
            <SocialIcon icon={link.icon} size={18} />
          </span>
        )}
        <span>{link.title || "Ссылка"}</span>
      </div>
    );
  }

  // big / medium — карточка с картинкой
  return (
    <div
      className={link.size === "medium" ? s.cardMedium : s.cardBig}
      style={{ borderRadius: radius }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={link.image_url} alt="" />
      <span className={s.imgTitle}>{link.title}</span>
      {link.icon && (
        <span className={s.imgCorner} style={{ background: ICON_BG[link.icon] || "#0006" }}>
          <SocialIcon icon={link.icon} size={15} />
        </span>
      )}
    </div>
  );
}
