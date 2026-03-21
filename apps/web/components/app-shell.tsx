 "use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Footer } from "./footer";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";

export function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-shell__main">
        <TopNav compact onMenuToggle={() => setSidebarOpen((current) => !current)} />
        <main className="app-shell__content">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
