"use client";

import Link from "next/link";
import { TopNav } from "../components/top-nav";

export default function HomePage() {
  return (
    <div className="landing-page">
      <TopNav compact />

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero__copy">
            <p className="eyebrow">EVE Frontier x Sui</p>
            <h1>Frontier Trade Routes</h1>
            <p className="landing-hero__lede">
              A private logistics console for finding demand, taking routes, and completing delivery without exposing exact coordinates.
            </p>
            <div className="landing-actions">
              <Link href="/app" className="button primary">
                Enter App
              </Link>
              <Link href="/opportunities" className="button secondary">
                Scan Opportunities
              </Link>
            </div>
            <div className="landing-signal-row" aria-label="Core mechanics">
              <span className="landing-signal-chip">Fuzzy Heatmap</span>
              <span className="landing-signal-chip">Weighted Bidding</span>
              <span className="landing-signal-chip">Staged Reveal</span>
              <span className="landing-signal-chip">Recovery Pool</span>
            </div>
          </div>

          <div className="landing-hero__panel">
            <div className="landing-panel-card">
              <span className="eyebrow">Primary Surface</span>
              <strong>/app</strong>
              <p>Heatmap, live queue, and staged route flow.</p>
            </div>
            <div className="landing-panel-card">
              <span className="eyebrow">Support Tools</span>
              <strong>/contracts + /opportunities</strong>
              <p>Contract drafting and intel search stay secondary.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
