"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { localizePath, type AppLocale } from "../../lib/i18n";
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

function localizeTier(label: string, locale: AppLocale) {
  if (locale !== "zh") return label;
  return (
    {
      Bronze: "青铜",
      Silver: "白银",
      Gold: "黄金",
      Elite: "精英",
      Unranked: "未定级",
    }[label] ?? label
  );
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
  locale = "en",
}: {
  profiles: ReputationProfile[];
  tierPolicies: TierPolicy[];
  locale?: AppLocale;
}) {
  const isZh = locale === "zh";
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
  const localizedSuggestedLane = isZh
    ? {
        title: suggestedLane.type === "deliver" ? "优先接稳定运输单" : "先从低风险采购单开始",
        note:
          suggestedLane.type === "deliver"
            ? "你已经适合处理更高价值的运输协作，先稳住完成率。"
            : "短线采购单更容易稳定提升完成率和等级进度。",
      }
    : suggestedLane;
  const currentTierLabel = myProfile ? localizeTier(formatTierLabel(myProfile.tier), locale) : isZh ? "未定级" : "Unranked";
  const topTierLabel = topProfile ? localizeTier(formatTierLabel(topProfile.tier), locale) : isZh ? "实时" : "Live";

  return (
    <main className="page-stack">
      <section className="panel stack" id="reputation">
        <div className="section-head">
          <div>
            <p className="eyebrow">{isZh ? "声誉" : "Reputation"}</p>
            <h1>{isZh ? "等级与接单权限" : "Rank & Access"}</h1>
          </div>
          <StatusBadge label={currentTierLabel} />
        </div>
        <div className="button-row action-row">
          <Link href={localizePath(`/contracts?type=${suggestedLane.type}`, locale)} className="button primary">
            {isZh ? "找下一单" : "Find Next Order"}
          </Link>
          <Link href={localizePath("/app/insurance", locale)} className="button secondary">
            {isZh ? "查看保险" : "Open Coverage"}
          </Link>
          <button
            type="button"
            className="button tertiary"
            onClick={() => setShowTierRules((current) => !current)}
          >
            {showTierRules ? (isZh ? "收起等级规则" : "Hide Rank Rules") : isZh ? "等级规则" : "Tier Rules"}
          </button>
        </div>

        <div className="dashboard-grid">
          <article className="table-card">
            <div className="table-card__header">
              <div>
                <p className="eyebrow">{isZh ? "我的进度" : "My progress"}</p>
                <strong>{currentTierLabel}</strong>
              </div>
              <StatusBadge label={nextTier ? (isZh ? `下一档：${localizeTier(nextTier.label, locale)}` : `Next: ${nextTier.label}`) : isZh ? "最高等级" : "Top tier"} />
            </div>

            <div className="stats-grid">
              <div className="side-block">
                <span className="eyebrow">{isZh ? "声誉分" : "Score"}</span>
                <strong>{myProfile?.score ?? 0}</strong>
              </div>
              <div className="side-block">
                <span className="eyebrow">{isZh ? "完成率" : "Completion"}</span>
                <strong>{myProfile ? `${getCompletionRate(myProfile)}%` : "0%"}</strong>
              </div>
              <div className="side-block">
                <span className="eyebrow">{isZh ? "活跃质押" : "Active Bond"}</span>
                <strong>{myProfile ? formatMist(myProfile.activeStakeMist) : "0 SUI"}</strong>
              </div>
              <div className="side-block">
                <span className="eyebrow">{isZh ? "下一档" : "Next Tier"}</span>
                <strong>{nextTier ? (isZh ? `还差 ${progressNeeded} 分` : `${progressNeeded} pts needed`) : isZh ? "已解锁" : "Unlocked"}</strong>
              </div>
            </div>

            <ProgressBar value={progressValue} tone="orange" />
          </article>

          <article className="table-card">
            <div className="table-card__header">
              <div>
                <p className="eyebrow">{isZh ? "下一步" : "Next Move"}</p>
                <strong>{localizedSuggestedLane.title}</strong>
              </div>
              <StatusBadge label={topProfile ? (isZh ? `头部承运人：${topTierLabel}` : `Top carrier: ${formatTierLabel(topProfile.tier)}`) : isZh ? "实时" : "Live"} />
            </div>

            <div className="stack compact">
              <div className="stats-grid">
                <div className="side-block">
                  <span className="eyebrow">{isZh ? "当前费率" : "Current fee"}</span>
                  <strong>{feeRateForTier(myProfile?.tier ?? 0, sortedPolicies)}</strong>
                  <span className="subtle">{currentTierLabel}</span>
                </div>
                <div className="side-block">
                  <span className="eyebrow">{isZh ? "下一档解锁" : "Next unlock"}</span>
                  <strong>{nextTier ? localizeTier(nextTier.label, locale) : isZh ? "最高档" : "Top tier"}</strong>
                  <span className="subtle">
                    {nextTier ? (isZh ? `还差 ${progressNeeded} 分` : `${progressNeeded} pts remaining`) : isZh ? "当前可见权益已全部解锁" : "All visible benefits unlocked"}
                  </span>
                </div>
                <div className="side-block">
                  <span className="eyebrow">{isZh ? "推荐航线类型" : "Best route type"}</span>
                  <strong>{suggestedLane.type === "deliver" ? (isZh ? "运输" : "Deliver") : isZh ? "采购" : "Procure"}</strong>
                </div>
                <div className="side-block">
                  <span className="eyebrow">{isZh ? "保险权限" : "Coverage access"}</span>
                  <strong>{(myProfile?.score ?? 0) >= 200 ? (isZh ? "可用" : "Ready") : isZh ? "受限" : "Limited"}</strong>
                </div>
              </div>

              <div className="button-row action-row">
                <Link href={localizePath(`/contracts?type=${suggestedLane.type}`, locale)} className="button primary">
                  {isZh ? (suggestedLane.type === "deliver" ? "找运输单" : "找采购单") : `Find ${suggestedLane.type === "deliver" ? "Delivery" : "Procure"} Orders`}
                </Link>
                <Link href={localizePath("/app/insurance", locale)} className="button secondary">
                  {isZh ? "打开保险页" : "Open Coverage"}
                </Link>
                <Link href={localizePath("/opportunities#intel", locale)} className="button tertiary">
                  {isZh ? "查看情报" : "Scan Intel"}
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
                    <strong>{localizeTier(policy.label, locale)}</strong>
                    <StatusBadge label={isZh ? `${(policy.commissionBps / 100).toFixed(1)}% 费率` : `${(policy.commissionBps / 100).toFixed(1)}% fee`} />
                  </div>
                  <div className="stats-grid">
                    <div className="side-block">
                      <span className="eyebrow">{isZh ? "最低分数" : "Min score"}</span>
                      <strong>{policy.minScore}</strong>
                    </div>
                    <div className="side-block">
                      <span className="eyebrow">{isZh ? "最低质押" : "Min bond"}</span>
                      <strong>{formatMist(policy.minStakeMist)}</strong>
                    </div>
                    <div className="side-block">
                      <span className="eyebrow">{isZh ? "订单上限" : "Max order"}</span>
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
            <p className="eyebrow">{isZh ? "排行榜" : "Leaderboard"}</p>
            <h2>{isZh ? "头部承运人" : "Top carriers"}</h2>
          </div>
          {profiles.length > 5 ? (
            <button
              type="button"
              className="button tertiary"
              onClick={() => setShowAll((current) => !current)}
            >
              {showAll ? (isZh ? "只看前 5 名" : "Show top 5") : isZh ? `查看全部 ${profiles.length} 人` : `Show all ${profiles.length}`}
            </button>
          ) : null}
        </div>

        <div className="table-stack">
          {visibleProfiles.map((profile, index) => (
            <article key={profile.owner} className="table-card leaderboard-row">
              <div className="leaderboard-row__rank">
                <span className="eyebrow">{isZh ? "排名" : "Rank"}</span>
                <strong>#{index + 1}</strong>
              </div>
              <div className="leaderboard-row__carrier">
                <span className="eyebrow">{isZh ? "承运人" : "Carrier"}</span>
                <strong>{formatAddress(profile.owner)}</strong>
              </div>
              <div className="leaderboard-row__metric">
                <span className="eyebrow">{isZh ? "等级" : "Tier"}</span>
                <StatusBadge label={localizeTier(formatTierLabel(profile.tier), locale)} />
              </div>
              <div className="leaderboard-row__metric">
                <span className="eyebrow">{isZh ? "完成率" : "Completion"}</span>
                <strong>{getCompletionRate(profile)}%</strong>
              </div>
              <div className="leaderboard-row__metric">
                <span className="eyebrow">{isZh ? "完成航线" : "Routes"}</span>
                <strong>{profile.successCount}</strong>
              </div>
              <div className="leaderboard-row__metric">
                <span className="eyebrow">{isZh ? "费率" : "Fee Rate"}</span>
                <strong>{feeRateForTier(profile.tier, sortedPolicies)}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
