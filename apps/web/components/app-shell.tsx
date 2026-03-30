import type { ReactNode } from "react";
import type { AppLocale } from "../lib/i18n";
import { Footer } from "./footer";
import { TopNav } from "./top-nav";

export function AppShell({
  children,
  showFooter = true,
  fullViewport = false,
  locale = "en",
}: {
  children: ReactNode;
  showFooter?: boolean;
  fullViewport?: boolean;
  locale?: AppLocale;
}) {
  return (
    <div className="app-shell app-shell--full">
      <div className={`app-shell__main ${fullViewport ? "app-shell__main--viewport" : ""}`}>
        <TopNav locale={locale} />
        <main className="app-shell__content">{children}</main>
        {showFooter ? <Footer locale={locale} /> : null}
      </div>
    </div>
  );
}
