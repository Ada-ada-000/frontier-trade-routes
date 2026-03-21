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
