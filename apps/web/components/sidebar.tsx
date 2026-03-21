"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const primaryLinks = [
  { href: "/app", label: "Overview", code: "00" },
  { href: "/contracts", label: "Orders", code: "01" },
  { href: "/opportunities", label: "Intel", code: "02" },
  { href: "/app#reputation", label: "Reputation", code: "03" },
  { href: "/app#insurance", label: "Insurance", code: "04" },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div className={`shell-backdrop ${open ? "is-open" : ""}`} onClick={onClose} />
      <aside className={`shell-sidebar ${open ? "is-open" : ""}`}>
        <div className="sidebar-panel">
          <p className="eyebrow">Operations</p>
          <h2>Trade Command</h2>
          <p className="muted">
            Fuzzy route discovery, weighted bidding, staged reveal, and mutual insurance.
          </p>
        </div>

        <nav className="sidebar-nav">
          {primaryLinks.map((link) => {
            const active = pathname === link.href || (link.href !== "/app" && pathname.startsWith(link.href));
            return (
              <Link key={link.href} href={link.href} className={`sidebar-link ${active ? "is-active" : ""}`} onClick={onClose}>
                <span className="sidebar-link__code">{link.code}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-meta">
            <span className="eyebrow">Network</span>
            <strong>Mock / Testnet Ready</strong>
          </div>
          <div className="sidebar-meta">
            <span className="eyebrow">Disclosure</span>
            <strong>Region-only in public view</strong>
          </div>
        </div>
      </aside>
    </>
  );
}
