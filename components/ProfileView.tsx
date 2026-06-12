"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Design, Link, QuickSettings } from "@/lib/types";
import { SocialIcon, ICON_BG } from "./SocialIcons";
import { detectClient, tryEscape, type Escape } from "./escape";
import { bgValue, radiusValue, cardStyle } from "./PhonePreview";
import styles from "./ProfileView.module.css";

type PublicProfile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
};

export default function ProfileView({
  profile,
  links,
  design,
  settings,
}: {
  profile: PublicProfile;
  links: Link[];
  design: Design;
  settings: QuickSettings;
}) {
  const [esc, setEsc] = useState<Escape | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [hintUrl, setHintUrl] = useState("");
  const [tab, setTab] = useState<"shouts" | "media">("shouts");
  const heroRef = useRef<HTMLElement | null>(null);
  const dimRef = useRef<HTMLDivElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setEsc(detectClient());
  }, []);

  const hero = design.headerStyle === "hero" && !!profile.avatar_url;

  // Затемнение фото и появление компактной шапки при скролле (как в LinkMe).
  // Прямое управление DOM через rAF — без перерендеров, не лагает.
  useEffect(() => {
    if (!hero) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = heroRef.current;
        if (!el) return;
        const h = el.offsetHeight || 1;
        const y = window.scrollY;
        const p = Math.min(1, y / (h * 0.8)); // 0..1 по мере прокрутки фото
        if (dimRef.current) dimRef.current.style.opacity = String(p * 0.92);
        if (pinRef.current) {
          const show = y > h * 0.5;
          pinRef.current.style.opacity = show ? "1" : "0";
          pinRef.current.style.transform =
            "translateX(-50%) translateY(" + (show ? "0" : "-100%") + ")";
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [hero, profile.avatar_url]);

  const socials = useMemo(() => links.filter((l) => l.kind === "social" && l.enabled), [links]);
  const cards = useMemo(() => links.filter((l) => l.kind === "link" && l.enabled), [links]);
  const radius = radiusValue(design);

  async function track(linkId: string | null) {
    try {
      await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          profileId: profile.id,
          linkId,
          type: "click",
          inApp: esc?.inApp ?? false,
          platform: esc?.platform ?? "",
        }),
      });
    } catch {}
  }

  function openLink(e: React.MouseEvent, link: Link) {
    e.preventDefault();
    track(link.id);
    const env = esc ?? detectClient();
    if (link.force_external && env.inApp) {
      const escaped = tryEscape(link.url, env);
      if (!escaped) {
        setHintUrl(link.url);
        setShowHint(true);
      }
    } else {
      window.location.href = link.url;
    }
  }

  // Фон: в hero-режиме — размытое главное фото, иначе обычный фон дизайна
  const bgStyle: React.CSSProperties = hero
    ? { backgroundImage: `url("${profile.avatar_url}")` }
    : { background: bgValue(design) };

  const socialsRow = socials.length > 0 && (
    <div className={styles.socials}>
      {socials.map((sLink) => (
        <a
          key={sLink.id}
          href={sLink.url}
          onClick={(e) => openLink(e, sLink)}
          className={styles.socialBtn}
          style={{ background: ICON_BG[sLink.icon] || ICON_BG.link }}
          aria-label={sLink.icon}
        >
          <SocialIcon icon={sLink.icon} size={18} />
        </a>
      ))}
    </div>
  );

  const content = (
    <>
      {hero ? (
        // ── HERO: большое фото вплотную к верху панели ──
        <header className={styles.hero} ref={heroRef}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={profile.avatar_url} alt={profile.display_name} className={styles.heroImg} />
          {/* затемнение при скролле */}
          <div className={styles.scrollDim} ref={dimRef} />
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <h1 className={styles.heroName}>{profile.display_name}</h1>
            {profile.bio && <p className={styles.heroUser}>{profile.bio}</p>}
            {settings.totalFollowers && (
              <p className={styles.followers}>
                <b>{settings.followersCount.toLocaleString()}</b> followers
              </p>
            )}
            {socialsRow}
          </div>
        </header>
      ) : (
        // ── CLASSIC: круглый аватар ──
        <header className={styles.header}>
          <div className={styles.avatarWrap}>
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={profile.display_name} className={styles.avatar} />
            ) : (
              <div className={styles.avatarPlaceholder}>{profile.display_name.slice(0, 1) || "?"}</div>
            )}
          </div>
          <h1 className={styles.name}>{profile.display_name}</h1>
          {profile.bio && <p className={styles.username}>{profile.bio}</p>}
          {settings.totalFollowers && (
            <p className={styles.followers}>
              <b>{settings.followersCount.toLocaleString()}</b> followers
            </p>
          )}
          {socialsRow}
        </header>
      )}

      <div className={styles.cards}>
        {cards.map((l) => (
          <a key={l.id} href={l.url} onClick={(e) => openLink(e, l)} className={styles.cardLink}>
            <CardBody link={l} design={design} radius={radius} />
          </a>
        ))}
      </div>

      {settings.shoutsMedia && (
        <>
          <div className={styles.tabs}>
            <button className={tab === "shouts" ? styles.tabActive : styles.tab} onClick={() => setTab("shouts")}>
              Shouts
            </button>
            <button className={tab === "media" ? styles.tabActive : styles.tab} onClick={() => setTab("media")}>
              Media
            </button>
          </div>
          <div className={styles.tabBody}>
            <div className={styles.emptyIcon}>📣</div>
            <p className={styles.empty}>{tab === "shouts" ? "No Shouts yet!" : "No Media yet!"}</p>
            <p className={styles.emptySub}>
              {tab === "shouts" ? "Shouts" : "Media"} posted by {profile.display_name} will appear here
            </p>
          </div>
        </>
      )}

      <footer className={styles.footer}>
        <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
        <span>·</span>
        <a href="#" onClick={(e) => e.preventDefault()}>Terms</a>
        <span>·</span>
        <a href="#" onClick={(e) => e.preventDefault()}>Report</a>
      </footer>
    </>
  );

  return (
    <div className={`${styles.root} font-${design.font}`} style={{ color: design.textColor }}>
      <div className={`${styles.bg} ${hero ? styles.bgHero : ""}`} style={bgStyle} />
      {/* затухание фона книзу — переход к цвету страницы */}
      <div className={hero ? styles.scrimHero : styles.scrim} />

      {/* компактная закреплённая шапка при скролле (hero) */}
      {hero && (
        <div className={styles.pinnedBar} ref={pinRef}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={profile.avatar_url} alt="" className={styles.pinnedAvatar} />
          <span className={styles.pinnedName}>{profile.display_name}</span>
        </div>
      )}

      {settings.deeplinkBanner && esc?.inApp && (
        <button className={styles.deeplinkBanner} onClick={() => setShowHint(true)}>
          ↗ Open in browser for the best experience
        </button>
      )}

      {hero ? (
        <div className={styles.panel}>{content}</div>
      ) : (
        <div className={styles.container}>{content}</div>
      )}

      {showHint && (
        <div className={styles.hintOverlay} onClick={() => setShowHint(false)}>
          <div className={styles.hintCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.hintArrow}>↗</div>
            <h3>Open in your browser</h3>
            <p>
              Tap «<b>•••</b>» at the top and choose <b>“Open in Safari”</b> so the link
              works correctly.
            </p>
            {hintUrl && (
              <a className={styles.hintLink} href={hintUrl} target="_blank" rel="noopener noreferrer">
                Continue anyway
              </a>
            )}
            <button className={styles.hintClose} onClick={() => setShowHint(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CardBody({ link, design, radius }: { link: Link; design: Design; radius: number }) {
  const style = cardStyle(design, link.tint);
  const hasImg = !!link.image_url && link.size !== "button";

  if (link.size === "small") {
    return (
      <div className={styles.cardSmall} style={{ ...style, borderRadius: radius }}>
        {hasImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={link.image_url} alt="" className={styles.smallThumb} />
        ) : link.icon ? (
          <span className={styles.smallIcon} style={{ background: ICON_BG[link.icon] || "#0003" }}>
            <SocialIcon icon={link.icon} size={16} />
          </span>
        ) : null}
        <span className={styles.smallTitle}>{link.title || "Link"}</span>
      </div>
    );
  }

  if (link.size === "button" || !hasImg) {
    return (
      <div className={styles.cardButton} style={{ ...style, borderRadius: radius }}>
        {link.icon && (
          <span className={styles.btnIcon}>
            <SocialIcon icon={link.icon} size={18} />
          </span>
        )}
        <span>{link.title || "Link"}</span>
      </div>
    );
  }

  return (
    <div className={link.size === "medium" ? styles.cardMedium : styles.cardBig} style={{ borderRadius: radius }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={link.image_url} alt="" />
      <span className={styles.cardImageTitle}>{link.title}</span>
      {link.icon && (
        <span className={styles.cardCorner} style={{ background: ICON_BG[link.icon] || "rgba(0,0,0,.5)" }}>
          <SocialIcon icon={link.icon} size={16} />
        </span>
      )}
    </div>
  );
}
