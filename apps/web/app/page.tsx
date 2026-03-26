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
              Privacy-aware logistics for discovering demand, posting routes, and locking commitment.
            </p>
            <div className="landing-actions">
              <Link href="/app" className="button primary">
                Enter App
              </Link>
              <Link href="/opportunities" className="button secondary">
                Open Intel
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
