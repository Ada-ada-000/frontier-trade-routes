"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletPanel } from "./wallet-panel";

const links = [
  { href: "/app#overview", label: "Overview", match: "/app" },
  { href: "/contracts#contracts", label: "Orders", match: "/contracts" },
  { href: "/opportunities#intel", label: "Intel", match: "/opportunities" },
  { href: "/app/reputation#reputation", label: "Reputation", match: "/app/reputation" },
  { href: "/app/insurance#insurance", label: "Insurance", match: "/app/insurance" },
];

export function TopNav({
  compact = false,
  onMenuToggle,
}: {
  compact?: boolean;
  onMenuToggle?: () => void;
}) {
  const pathname = usePathname();

  return (
    <header className={`top-nav ${compact ? "is-compact" : ""}`}>
      <div className="top-nav__left">
        {compact ? (
          <button type="button" className="nav-icon-button mobile-only" onClick={onMenuToggle} aria-label="Open navigation">
            <span />
            <span />
            <span />
          </button>
        ) : null}
        <Link href="/" className="brand-link">
          <span className="brand-mark">FT</span>
          <span className="brand-copy">
            <strong>Frontier Trade Routes</strong>
            <small>EVE Frontier x Sui</small>
          </span>
        </Link>
      </div>

      <nav className="top-nav__links desktop-only">
        {links.map((link) => {
          const active =
            pathname === link.match || (link.match !== "/app" && pathname.startsWith(link.match));
          return (
            <Link key={link.href} href={link.href} className={`top-nav__link ${active ? "is-active" : ""}`}>
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="top-nav__right">
        <div className="network-pill desktop-only">
          <span className="status-dot online" />
          <span>Command Net / Active</span>
        </div>
        <WalletPanel compact={compact} />
      </div>
    </header>
  );
}
