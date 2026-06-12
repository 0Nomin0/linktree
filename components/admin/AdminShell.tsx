"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NavI } from "./NavIcons";
import s from "./AdminShell.module.css";

type Active = "dashboard" | "profile" | "analytics";

export default function AdminShell({
  username,
  accountLabel,
  active,
  pageTitle,
  children,
}: {
  username?: string;
  accountLabel: string;
  active: Active;
  pageTitle: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const bio = username ? `tree.link/${username}` : "";

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  function copyBio() {
    const url = `${window.location.origin}/${username}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  function NavItem({
    icon,
    label,
    href,
    badge,
    activeItem,
    onClick,
  }: {
    icon: React.ReactNode;
    label: string;
    href?: string;
    badge?: string;
    activeItem?: boolean;
    onClick?: () => void;
  }) {
    const inner = (
      <>
        <span className={s.navIcon}>{icon}</span>
        <span className={s.navLabel}>{label}</span>
        {badge && <span className={`${s.badge} ${s["badge_" + badge]}`}>{badge}</span>}
      </>
    );
    if (href)
      return (
        <Link href={href} className={`${s.navItem} ${activeItem ? s.navActive : ""}`}>
          {inner}
        </Link>
      );
    return (
      <button className={`${s.navItem} ${s.navMuted}`} onClick={onClick} type="button">
        {inner}
      </button>
    );
  }

  return (
    <div className={s.shell}>
      {/* ── Left sidebar ── */}
      <aside className={`${s.sidebar} ${navOpen ? s.sidebarOpen : ""}`}>
        <div className={s.logo}>
          <Link href="/admin" className={s.logoLink}>
            <span className={s.logoMark}>t</span> TreeLink
          </Link>
        </div>

        <nav className={s.nav}>
          <NavItem icon={NavI.profile} label="Profile" href="/admin" activeItem={active === "dashboard" || active === "profile"} />
          <NavItem
            icon={NavI.analytics}
            label="Analytics"
            href={username ? `/admin/${username}/analytics` : undefined}
            activeItem={active === "analytics"}
          />
        </nav>

        <div className={s.sidebarBottom}>
          <button className={s.promoCard} type="button">
            <span className={s.promoIcon}>{NavI.ai}</span>
            <span>
              <b>TreeLink AI</b>
              <small>Your assistant</small>
            </span>
          </button>
          <button className={`${s.promoCard} ${s.promoPro}`} type="button">
            <span className={s.promoIcon}>{NavI.pro}</span>
            <span>
              <b>Get TreeLink Pro</b>
              <small>Unlock everything</small>
            </span>
          </button>
          <button className={s.navItem} onClick={logout} type="button">
            <span className={s.navIcon}>{NavI.help}</span>
            <span className={s.navLabel}>Выйти ({accountLabel})</span>
          </button>
        </div>
      </aside>

      {navOpen && <div className={s.backdrop} onClick={() => setNavOpen(false)} />}

      {/* ── Main ── */}
      <div className={s.main}>
        <header className={s.topbar}>
          <div className={s.topLeft}>
            <button className={s.iconBtn} onClick={() => setNavOpen((v) => !v)} aria-label="menu">
              {NavI.collapse}
            </button>
            <span className={s.pageTitle}>{pageTitle}</span>
          </div>

          {username && (
            <div className={s.bioPill}>
              <span className={s.bioLabel}>Your Bio Link</span>
              <a href={`/${username}`} target="_blank" className={s.bioUrl}>
                {bio}
              </a>
              <button className={s.bioBtn} onClick={copyBio} aria-label="copy">
                {copied ? "✓" : NavI.copy}
              </button>
              <button className={s.bioBtn} aria-label="qr">
                {NavI.qr}
              </button>
            </div>
          )}

          <div className={s.topRight}>
            <button className={s.iconBtn}>{NavI.bell}</button>
            <button className={s.iconBtn}>{NavI.settings}</button>
            <div className={s.avatar}>{accountLabel.slice(-1)}</div>
          </div>
        </header>

        <div className={s.content}>{children}</div>
      </div>
    </div>
  );
}
