"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import {
  formatAddress,
  formatMist,
  formatTierLabel,
  type ReputationProfile,
  type TierPolicy,
} from "../../lib/trade-routes/types";
import { ProgressBar } from "../ui/progress-bar";
import { StatusBadge } from "../ui/status-badge";

function getCompletionRate(profile: ReputationProfile) {
  const total = profile.successCount + profile.failCount;
  if (!total) return 0;
  return Math.round((profile.successCount / total) * 100);
}

function feeRateForTier(tier: number, policies: TierPolicy[]) {
  const policy = policies.find((item) => item.tier === tier);
  return policy ? `${(policy.commissionBps / 100).toFixed(1)}%` : "—";
}

function recommendedLane(profile: ReputationProfile | undefined) {
  if (!profile) {
    return {
      title: "Start with low-risk procure runs",
      note: "Build consistency before taking longer delivery routes.",
      type: "procure" as const,
    };
  }

  const completion = getCompletionRate(profile);
  if (completion >= 90 && profile.score >= 400) {
    return {
      title: "Take protected delivery routes",
      note: "Your profile is strong enough for higher-value delivery coordination.",
      type: "deliver" as const,
    };
  }

  if (completion >= 75) {
    return {
      title: "Push standard delivery routes",
      note: "You can grow score faster by closing mid-risk delivery orders.",
      type: "deliver" as const,
    };
  }

  return {
    title: "Build momentum with procure runs",
    note: "Shorter procure jobs are the fastest way to improve completion rate.",
    type: "procure" as const,
  };
}

export function ReputationPanel({
  profiles,
  tierPolicies,
}: {
  profiles: ReputationProfile[];
  tierPolicies: TierPolicy[];
}) {
  const account = useCurrentAccount();
  const [showAll, setShowAll] = useState(false);
  const [showTierRules, setShowTierRules] = useState(false);

  const sortedPolicies = useMemo(
    () => tierPolicies.slice().sort((left, right) => left.minScore - right.minScore),
    [tierPolicies],
  );

  const topProfile = profiles[0];
  const myProfile = profiles.find((profile) => profile.owner === account?.address) ?? profiles[0];
  const nextTier = sortedPolicies.find((policy) => policy.minScore > (myProfile?.score ?? 0));
  const currentTier = sortedPolicies
    .filter((policy) => policy.minScore <= (myProfile?.score ?? 0))
    .at(-1);
  const previousFloor = currentTier?.minScore ?? 0;
  const progressNeeded = nextTier ? Math.max(nextTier.minScore - (myProfile?.score ?? 0), 0) : 0;
  const progressValue = nextTier
    ? (((myProfile?.score ?? 0) - previousFloor) /
        Math.max(nextTier.minScore - previousFloor, 1)) *
      100
    : 100;
  const visibleProfiles = showAll ? profiles : profiles.slice(0, 5);
  const suggestedLane = recommendedLane(myProfile);

  return (
    <main className="page-stack">
      <section className="panel stack" id="reputation">
        <div className="section-head">
          <div>
            <p className="eyebrow">Reputation</p>
            <h1>Improve your carrier rank</h1>
          </div>
          <StatusBadge label={myProfile ? formatTierLabel(myProfile.tier) : "Unranked"} />
        </div>

        <div className="quick-guide">
          <div className="quick-guide__copy">
            <strong>Your rank decides which orders you can see and how much fee you pay.</strong>
            <p className="muted">
              Focus on the next tier, keep your completion rate high, and take safer runs first.
            </p>
          </div>
          <div className="button-row action-row">
            <Link href={`/contracts?type=${suggestedLane.type}`} className="button primary">
              Find Next Order
            </Link>
            <button
              type="button"
              className="button secondary"
              onClick={() => setShowTierRules((current) => !current)}
            >
              {showTierRules ? "Hide Rank Rules" : "View Rank Rules"}
            </button>
          </div>
        </div>

        <div className="dashboard-grid">
          <article className="table-card">
            <div className="table-card__header">
              <div>
                <p className="eyebrow">My progress</p>
                <strong>{myProfile ? formatTierLabel(myProfile.tier) : "Unranked"}</strong>
              </div>
              <StatusBadge label={nextTier ? `Next: ${nextTier.label}` : "Top tier"} />
            </div>

            <div className="stats-grid">
              <div className="side-block">
                <span className="eyebrow">Score</span>
                <strong>{myProfile?.score ?? 0}</strong>
              </div>
              <div className="side-block">
                <span className="eyebrow">Completion</span>
                <strong>{myProfile ? `${getCompletionRate(myProfile)}%` : "0%"}</strong>
              </div>
              <div className="side-block">
                <span className="eyebrow">Active Bond</span>
                <strong>{myProfile ? formatMist(myProfile.activeStakeMist) : "0 SUI"}</strong>
              </div>
              <div className="side-block">
                <span className="eyebrow">Next Tier</span>
                <strong>{nextTier ? `${progressNeeded} pts needed` : "Unlocked"}</strong>
              </div>
            </div>

            <ProgressBar value={progressValue} tone="orange" />
            <p className="muted">
              {nextTier
                ? `Complete more routes to unlock ${nextTier.label} access and lower fees.`
                : "You are already at the highest visible access tier."}
            </p>

            <div className="button-row action-row">
              <Link href="/contracts" className="button primary">
                Open Orders
              </Link>
              <Link href="/app/insurance" className="button secondary">
                Open Coverage
              </Link>
            </div>
          </article>

          <article className="table-card">
            <div className="table-card__header">
              <div>
                <p className="eyebrow">What to do next</p>
                <strong>{suggestedLane.title}</strong>
              </div>
              <StatusBadge label={topProfile ? `Top carrier: ${formatTierLabel(topProfile.tier)}` : "Live"} />
            </div>

            <div className="stack compact">
              <p className="muted">{suggestedLane.note}</p>
              <div className="stats-grid">
                <div className="side-block">
                  <span className="eyebrow">Current fee</span>
                  <strong>{feeRateForTier(myProfile?.tier ?? 0, sortedPolicies)}</strong>
                  <span className="subtle">{myProfile ? formatTierLabel(myProfile.tier) : "Unranked"}</span>
                </div>
                <div className="side-block">
                  <span className="eyebrow">Next unlock</span>
                  <strong>{nextTier ? nextTier.label : "Top tier"}</strong>
                  <span className="subtle">
                    {nextTier ? `${progressNeeded} pts remaining` : "All visible benefits unlocked"}
                  </span>
                </div>
                <div className="side-block">
                  <span className="eyebrow">Best route type</span>
                  <strong>{suggestedLane.type === "deliver" ? "Deliver" : "Procure"}</strong>
                  <span className="subtle">Recommended by completion and score</span>
                </div>
                <div className="side-block">
                  <span className="eyebrow">Coverage access</span>
                  <strong>{(myProfile?.score ?? 0) >= 200 ? "Ready" : "Limited"}</strong>
                  <span className="subtle">Use insurance for higher-value coordination</span>
                </div>
              </div>

              <div className="button-row action-row">
                <Link href={`/contracts?type=${suggestedLane.type}`} className="button primary">
                  Find {suggestedLane.type === "deliver" ? "Delivery" : "Procure"} Orders
                </Link>
                <Link href="/app/insurance" className="button secondary">
                  Open Coverage
                </Link>
                <Link href="/opportunities#intel" className="button tertiary">
                  Scan Intel
                </Link>
              </div>
            </div>
          </article>
        </div>

        {showTierRules ? (
          <div className="accordion-content">
            <div className="table-stack">
              {sortedPolicies.map((policy) => (
                <article key={policy.tier} className="table-card compact-card">
                  <div className="table-card__header">
                    <strong>{policy.label}</strong>
                    <StatusBadge label={`${(policy.commissionBps / 100).toFixed(1)}% fee`} />
                  </div>
                  <div className="stats-grid">
                    <div className="side-block">
                      <span className="eyebrow">Min score</span>
                      <strong>{policy.minScore}</strong>
                    </div>
                    <div className="side-block">
                      <span className="eyebrow">Min bond</span>
                      <strong>{formatMist(policy.minStakeMist)}</strong>
                    </div>
                    <div className="side-block">
                      <span className="eyebrow">Max order</span>
                      <strong>{formatMist(policy.maxOrderValueMist)}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="panel stack">
        <div className="section-head">
          <div>
            <p className="eyebrow">Leaderboard</p>
            <h2>Top carriers</h2>
          </div>
          {profiles.length > 5 ? (
            <button
              type="button"
              className="button tertiary"
              onClick={() => setShowAll((current) => !current)}
            >
              {showAll ? "Show top 5" : `Show all ${profiles.length}`}
            </button>
          ) : null}
        </div>

        <div className="table-stack">
          {visibleProfiles.map((profile, index) => (
            <article key={profile.owner} className="table-card leaderboard-row">
              <div className="leaderboard-row__rank">
                <span className="eyebrow">Rank</span>
                <strong>#{index + 1}</strong>
              </div>
              <div className="leaderboard-row__carrier">
                <span className="eyebrow">Carrier</span>
                <strong>{formatAddress(profile.owner)}</strong>
              </div>
              <div className="leaderboard-row__metric">
                <span className="eyebrow">Tier</span>
                <StatusBadge label={formatTierLabel(profile.tier)} />
              </div>
              <div className="leaderboard-row__metric">
                <span className="eyebrow">Completion</span>
                <strong>{getCompletionRate(profile)}%</strong>
              </div>
              <div className="leaderboard-row__metric">
                <span className="eyebrow">Routes</span>
                <strong>{profile.successCount}</strong>
              </div>
              <div className="leaderboard-row__metric">
                <span className="eyebrow">Fee Rate</span>
                <strong>{feeRateForTier(profile.tier, sortedPolicies)}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
