import type { ReactNode } from "react";
import Link from "next/link";
import { WalletPanel } from "./wallet-panel";

const links = [
  { href: "/", label: "Overview" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/contracts", label: "Contracts" },
];

export function AppShell({
  children,
  accent,
}: {
  children: ReactNode;
  accent?: ReactNode;
}) {
  return (
    <div className="app-frame">
      <header className="topbar">
        <Link href="/" className="brand-link">
          <span className="brand-mark">FT</span>
          <div className="brand-block">
            <strong>Frontier Trade Routes</strong>
            <p>Trusted frontier intel for player trade coordination.</p>
          </div>
        </Link>
        <nav className="nav">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link">
              {link.label}
            </Link>
          ))}
        </nav>
        <WalletPanel />
      </header>
      {accent}
      {children}
    </div>
  );
}
