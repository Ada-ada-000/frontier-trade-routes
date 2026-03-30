"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { localizePath, type AppLocale } from "../lib/i18n";
import { WalletPanel } from "./wallet-panel";

export function TopNav({
  compact = false,
  showMenuButton = true,
  onMenuToggle,
  locale = "en",
}: {
  compact?: boolean;
  showMenuButton?: boolean;
  onMenuToggle?: () => void;
  locale?: AppLocale;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const overviewMatch = localizePath("/app", locale);
  const links =
    locale === "zh"
      ? [
          { href: localizePath("/app#overview", locale), label: "总览", match: localizePath("/app", locale) },
          { href: localizePath("/contracts#contracts", locale), label: "订单", match: localizePath("/contracts", locale) },
          { href: localizePath("/opportunities#intel", locale), label: "情报", match: localizePath("/opportunities", locale) },
          { href: localizePath("/app/reputation#reputation", locale), label: "声誉", match: localizePath("/app/reputation", locale) },
          { href: localizePath("/app/insurance#insurance", locale), label: "保险", match: localizePath("/app/insurance", locale) },
        ]
      : [
          { href: "/app#overview", label: "Overview", match: "/app" },
          { href: "/contracts#contracts", label: "Orders", match: "/contracts" },
          { href: "/opportunities#intel", label: "Intel", match: "/opportunities" },
          { href: "/app/reputation#reputation", label: "Reputation", match: "/app/reputation" },
          { href: "/app/insurance#insurance", label: "Insurance", match: "/app/insurance" },
        ];

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = query.trim();
    if (!nextQuery) {
      router.push(localizePath("/search", locale));
      return;
    }
    router.push(localizePath(`/search?q=${encodeURIComponent(nextQuery)}`, locale));
  }

  return (
    <header className={`top-nav ${compact ? "is-compact" : ""}`}>
      <div className="top-nav__bar">
        <div className="top-nav__left">
          {compact && showMenuButton ? (
            <button type="button" className="nav-icon-button mobile-only" onClick={onMenuToggle} aria-label="Open navigation">
              <span />
              <span />
              <span />
            </button>
          ) : null}
          <Link href={localizePath("/", locale)} className="brand-link">
            <span className="brand-mark brand-mark--image" aria-hidden="true">
              <Image src="/assets/ftr-logo.png" alt="" width={54} height={54} className="brand-mark__image" priority />
            </span>
            <span className="brand-copy">
              <strong>Frontier Trade Routes</strong>
              <small>EVE Frontier x Sui</small>
            </span>
          </Link>
        </div>

        <div className="top-nav__center">
          <form className="top-nav__search" onSubmit={onSubmit}>
            <span className="top-nav__search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={locale === "zh" ? "搜索区域或资源" : "Search"}
              aria-label={locale === "zh" ? "搜索" : "Search"}
            />
          </form>

          {links.map((link) => {
            const active =
              pathname === link.match || (link.match !== overviewMatch && pathname.startsWith(link.match));
            return (
              <Link key={link.href} href={link.href} className={`top-nav__link desktop-only ${active ? "is-active" : ""}`}>
                {link.label}
              </Link>
            );
          })}

          <div className="top-nav__wallet desktop-only">
            <WalletPanel compact={compact} locale={locale} />
          </div>
        </div>
      </div>
      <div className="top-nav__mobile-row mobile-only">
        <div className="top-nav__right">
          <WalletPanel compact={compact} locale={locale} />
        </div>
      </div>
    </header>
  );
}
