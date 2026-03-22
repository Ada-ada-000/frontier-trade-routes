import type { ReactNode } from "react";
import { Footer } from "./footer";
import { TopNav } from "./top-nav";

export function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="app-shell app-shell--full">
      <div className="app-shell__main">
        <TopNav />
        <main className="app-shell__content">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
