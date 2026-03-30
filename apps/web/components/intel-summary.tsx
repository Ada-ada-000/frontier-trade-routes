import type { ReactNode } from "react";
import { type IntelEvent, type Opportunity, type RegionStatus } from "@eve/shared";
import { type AppLocale } from "../lib/i18n";

function threatDescriptor(level: number, locale: AppLocale) {
  if (level >= 2) return { label: locale === "zh" ? "高风险" : "High", tone: "🔴" };
  if (level === 1) return { label: locale === "zh" ? "偏高" : "Elevated", tone: "🟡" };
  return { label: locale === "zh" ? "稳定" : "Stable", tone: "🟢" };
}

function findHighestOpportunity(opportunities: Opportunity[]) {
  return opportunities.reduce((best, current) => {
    if (!best || current.opportunityScore > best.opportunityScore) {
      return current;
    }

    return best;
  }, opportunities[0]);
}

function findHighestRisk(regions: RegionStatus[]) {
  return regions.reduce((best, current) => {
    if (!best || current.combatActivity > best.combatActivity) {
      return current;
    }

    return best;
  }, regions[0]);
}

export function IntelSummary({
  opportunities,
  regionStatuses,
  intelEvents,
  action,
  locale = "en",
}: {
  opportunities: Opportunity[];
  regionStatuses: RegionStatus[];
  intelEvents: IntelEvent[];
  action?: ReactNode;
  locale?: AppLocale;
}) {
  const isZh = locale === "zh";
  const highestOpportunity = findHighestOpportunity(opportunities);
  const highestRisk = findHighestRisk(regionStatuses);
  const criticalCount = intelEvents.filter((event) => event.riskLevel === "critical").length;
  const threat = threatDescriptor(criticalCount, locale);
  const nextMove = highestOpportunity
    ? isZh
      ? `盯住 ${highestOpportunity.regionName} 的 ${highestOpportunity.resourceName}`
      : `Watch ${highestOpportunity.regionName} for ${highestOpportunity.resourceName}`
    : isZh
      ? "先关注当前最热区域"
      : "Watch the busiest region";

  const cards = [
    {
      label: isZh ? "最佳区域" : "Best region",
      value: highestOpportunity?.regionName ?? "—",
      note: highestOpportunity ? highestOpportunity.resourceName : isZh ? "暂无活跃航线" : "No live route",
    },
    {
      label: isZh ? "风险状态" : "Risk check",
      value: `${threat.tone} ${threat.label}`,
      note: isZh ? `${intelEvents.length} 条有效信号` : `${intelEvents.length} live signals`,
    },
    {
      label: isZh ? "下一步" : "Next move",
      value: nextMove,
      note: highestRisk
        ? isZh
          ? `${highestRisk.regionName} 的冲突压力最高`
          : `Combat highest in ${highestRisk.regionName}`
        : isZh
          ? "当前市场较平静"
          : "Market is quiet",
    },
  ];

  return (
    <section className="panel stack intel-summary-panel" id="intel">
      <div className="section-head">
        <div>
          <p className="eyebrow">{isZh ? "边境情报" : "Frontier Intel"}</p>
          <h2>{isZh ? "先看哪里值得出手" : "Find the next route"}</h2>
        </div>
        {action}
      </div>
      <div className="intel-summary-bar">
        {cards.map((card) => (
          <article key={card.label} className="intel-summary-bar__item">
            <span className="eyebrow">{card.label}</span>
            <strong>{card.value}</strong>
            <span className="subtle">{card.note}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
