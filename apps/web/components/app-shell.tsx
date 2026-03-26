import type { ReactNode } from "react";
import { Footer } from "./footer";
import { TopNav } from "./top-nav";

export function AppShell({
  children,
  showFooter = true,
  fullViewport = false,
}: {
  children: ReactNode;
  showFooter?: boolean;
  fullViewport?: boolean;
}) {
  return (
    <div className="app-shell app-shell--full">
      <div className={`app-shell__main ${fullViewport ? "app-shell__main--viewport" : ""}`}>
        <TopNav />
        <main className="app-shell__content">{children}</main>
        {showFooter ? <Footer /> : null}
      </div>
    </div>
  );
}
