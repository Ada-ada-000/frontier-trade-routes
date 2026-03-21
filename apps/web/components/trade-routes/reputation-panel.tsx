"use client";

import { formatAddress, formatMist, type ReputationProfile } from "../../lib/trade-routes/types";

const tierLabels: Record<number, string> = {
  1: "Bronze",
  2: "Silver",
  3: "Gold",
};

export function ReputationPanel({ profiles }: { profiles: ReputationProfile[] }) {
  const topProfile = profiles[0];

  return (
    <main className="page-stack">
      <section className="panel stack">
        <div className="section-head">
          <div>
            <p className="eyebrow">Reputation Registry</p>
            <h1>Carrier trust and stake access control</h1>
          </div>
          <div className="hero-badge">Tiered / Gated Access</div>
        </div>
        <p className="hero-lede">
          Reputation determines which contracts a carrier can see, how much capital they can lock,
          and how quickly buyers trust them in weighted bidding.
        </p>
        <div className="metric-grid">
          <article className="metric-card">
            <p className="eyebrow">Top Carrier</p>
            <strong>{topProfile ? tierLabels[topProfile.tier] : "N/A"}</strong>
            <span>{topProfile ? `${topProfile.score} score / ${topProfile.successCount} wins` : "No profile data"}</span>
          </article>
          <article className="metric-card">
            <p className="eyebrow">Profiles</p>
            <strong>{profiles.length}</strong>
            <span>Visible seller records</span>
          </article>
          <article className="metric-card">
            <p className="eyebrow">Active Stake</p>
            <strong>
              {formatMist(
                String(profiles.reduce((total, profile) => total + Number(profile.activeStakeMist), 0)),
              )}
            </strong>
            <span>Capital currently locked</span>
          </article>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="panel stack" id="reputation">
          <div className="section-head">
            <div>
              <p className="eyebrow">Profiles</p>
              <h2>Seller ladder</h2>
            </div>
          </div>
          <div className="table-stack">
            {profiles.map((profile) => (
              <article key={profile.owner} className="table-card">
                <div className="table-card__header">
                  <div>
                    <p className="eyebrow">Carrier</p>
                    <strong>{formatAddress(profile.owner)}</strong>
                  </div>
                  <span className="status-pill is-open">{tierLabels[profile.tier] ?? `Tier ${profile.tier}`}</span>
                </div>
                <div className="stats-grid">
                  <div className="side-block">
                    <span className="eyebrow">Score</span>
                    <strong>{profile.score}</strong>
                  </div>
                  <div className="side-block">
                    <span className="eyebrow">Success</span>
                    <strong>{profile.successCount}</strong>
                  </div>
                  <div className="side-block">
                    <span className="eyebrow">Fail</span>
                    <strong>{profile.failCount}</strong>
                  </div>
                  <div className="side-block">
                    <span className="eyebrow">Active Stake</span>
                    <strong>{formatMist(profile.activeStakeMist)}</strong>
                  </div>
                  <div className="side-block">
                    <span className="eyebrow">Total Slashed</span>
                    <strong>{formatMist(profile.totalSlashedMist)}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel stack">
          <div className="section-head">
            <div>
              <p className="eyebrow">Tier Rules</p>
              <h2>Who can access premium routes</h2>
            </div>
          </div>
          <div className="table-stack">
            <article className="table-card">
              <div className="table-card__header">
                <strong>Gold Tier</strong>
                <span className="status-pill is-transit">High value lanes</span>
              </div>
              <p className="muted">
                Highest reputation band. Eligible for premium rewards, higher collateral routes, and
                preferred selection in competitive bidding.
              </p>
            </article>
            <article className="table-card">
              <div className="table-card__header">
                <strong>Silver Tier</strong>
                <span className="status-pill is-assigned">Mid-range access</span>
              </div>
              <p className="muted">
                Standard carrier access. Can fulfill routine contracts and build score toward better
                weighted visibility.
              </p>
            </article>
            <article className="table-card">
              <div className="table-card__header">
                <strong>Bronze Tier</strong>
                <span className="status-pill is-disputed">Restricted</span>
              </div>
              <p className="muted">
                New or low-trust carriers. Can only see lower-risk jobs until successful deliveries
                improve score and reduce failure ratio.
              </p>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
