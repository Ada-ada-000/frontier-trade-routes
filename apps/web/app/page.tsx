"use client";

import Link from "next/link";
import { useState } from "react";
import { TopNav } from "../components/top-nav";

type LandingTabId = "heatmap" | "bidding" | "reveal" | "risk";

const landingTabs: {
  id: LandingTabId;
  label: string;
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}[] = [
  {
    id: "heatmap",
    label: "Fuzzy Heatmap",
    eyebrow: "Intel Surface",
    title: "Regional heat only, never exact route coordinates.",
    body: "Public discovery is intentionally blurred into regional demand pressure. Sellers and buyers can spot where activity is building without turning the UI into a live targeting feed.",
    bullets: [
      "Region-level signal density",
      "No exact station or system disclosure",
      "Useful for demand scouting before commitment",
    ],
    primaryHref: "/app",
    primaryLabel: "Open Heatmap",
    secondaryHref: "/opportunities",
    secondaryLabel: "View Intel Feed",
  },
  {
    id: "bidding",
    label: "Weighted Bidding Pool",
    eyebrow: "Market Access",
    title: "Orders filter by reputation, stake, and delivery budget.",
    body: "Urgent jobs resolve fast while competitive jobs let buyers select the best reputation-to-price outcome. Sellers only see assignments that match their current credibility and stake capacity.",
    bullets: [
      "Urgent first-lock fulfillment",
      "Competitive buyer-side selection",
      "Stake-gated seller eligibility",
    ],
    primaryHref: "/contracts",
    primaryLabel: "View Orders",
    secondaryHref: "/app",
    secondaryLabel: "Open Queue",
  },
  {
    id: "reveal",
    label: "Staged Reveal",
    eyebrow: "Route Security",
    title: "Pickup reveals first. Destination unlocks after pickup proof.",
    body: "The system does not release the full route on acceptance. Sellers commit stake, receive pickup visibility, and unlock destination details only after they confirm pickup onchain or in the demo flow.",
    bullets: [
      "Stage 1 pickup disclosure",
      "Stage 2 destination disclosure",
      "Reduces instant route leakage risk",
    ],
    primaryHref: "/app",
    primaryLabel: "See Reveal Flow",
    secondaryHref: "/contracts",
    secondaryLabel: "Inspect Contract Flow",
  },
  {
    id: "risk",
    label: "Reputation + Insurance",
    eyebrow: "Trust Layer",
    title: "Reliability compounds upward. Failure triggers slashing and recovery.",
    body: "Carrier performance changes future access. Buyers can insure tasks, the pool compensates failed deliveries, and the protocol recovers capital from the responsible seller stake.",
    bullets: [
      "Tier-based seller access",
      "Slashing on fraud or failed runs",
      "Buyer recovery through the mutual pool",
    ],
    primaryHref: "/app/reputation",
    primaryLabel: "Open Reputation",
    secondaryHref: "/app/insurance",
    secondaryLabel: "Open Insurance",
  },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<LandingTabId>("heatmap");
  const activePanel = landingTabs.find((tab) => tab.id === activeTab) ?? landingTabs[0];

  return (
    <div className="landing-page">
      <TopNav compact />

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero__copy">
            <p className="eyebrow">EVE Frontier x Sui</p>
            <h1>Frontier Trade Routes</h1>
            <p className="landing-hero__lede">
              A privacy-aware logistics and intelligence market where public discovery stays fuzzy,
              sellers commit stake before route clarity, and insurance plus reputation shape trust.
            </p>
            <div className="landing-actions">
              <Link href="/app" className="button primary">
                Enter App
              </Link>
              <Link href="/contracts" className="button secondary">
                View Orders
              </Link>
              <a href="#overview" className="button tertiary">
                Learn More
              </a>
            </div>
          </div>

          <div className="landing-hero__panel">
            <div className="landing-panel-card">
              <span className="eyebrow">Signal Layer</span>
              <strong>Fuzzy Heatmap</strong>
              <p>Only regional pressure is public. Exact stations and full routes stay hidden.</p>
            </div>
            <div className="landing-panel-card">
              <span className="eyebrow">Execution Layer</span>
              <strong>Weighted Bidding Pool</strong>
              <p>Orders are gated by reputation, stake, and budget constraints before matching.</p>
            </div>
          </div>
        </section>

        <section id="overview" className="landing-features">
          <article className="landing-feature-card">
            <p className="eyebrow">01</p>
            <h2>Fuzzy Heatmap</h2>
            <p>Public route demand stays generalized into regional heat blocks.</p>
          </article>
          <article className="landing-feature-card">
            <p className="eyebrow">02</p>
            <h2>Weighted Bidding</h2>
            <p>Urgent and competitive orders respect stake locks and seller thresholds.</p>
          </article>
          <article className="landing-feature-card">
            <p className="eyebrow">03</p>
            <h2>Staged Reveal</h2>
            <p>Pickup unlocks first. Destination unlocks only after onchain pickup confirmation.</p>
          </article>
          <article className="landing-feature-card">
            <p className="eyebrow">04</p>
            <h2>Reputation + Insurance</h2>
            <p>Reliable carriers rise in tier while failed tasks trigger slashing and recovery.</p>
          </article>
        </section>

        <section className="landing-module panel">
          <div className="landing-module__head">
            <div>
              <p className="eyebrow">Interactive Briefing</p>
              <h2>Explore the four operating rules before entering the app.</h2>
            </div>
            <Link href="/app" className="button secondary">
              Enter Console
            </Link>
          </div>

          <div className="landing-tabs" role="tablist" aria-label="Frontier Trade Routes core mechanics">
            {landingTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`landing-tab${activeTab === tab.id ? " is-active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="landing-detail" role="tabpanel" aria-live="polite">
            <div className="landing-detail__copy">
              <p className="eyebrow">{activePanel.eyebrow}</p>
              <h3>{activePanel.title}</h3>
              <p>{activePanel.body}</p>
            </div>
            <ul className="landing-detail__list">
              {activePanel.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
            <div className="landing-detail__actions">
              <Link href={activePanel.primaryHref} className="button primary">
                {activePanel.primaryLabel}
              </Link>
              <Link href={activePanel.secondaryHref} className="button secondary">
                {activePanel.secondaryLabel}
              </Link>
            </div>
          </div>
        </section>

        <section className="landing-brief">
          <div>
            <p className="eyebrow">Why This Exists</p>
            <h2>Trusted logistics without turning route discovery into a live-coordinate exploit.</h2>
          </div>
          <p>
            Frontier Trade Routes is not a replacement for the official market. It is an external
            player coordination layer for contracts, route intelligence, and capital-backed delivery
            trust on Sui.
          </p>
        </section>
      </main>
    </div>
  );
}
