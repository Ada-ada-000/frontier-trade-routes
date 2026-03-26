import type { ReactNode } from "react";
import { type IntelEvent, type Opportunity, type RegionStatus } from "@eve/shared";

function threatDescriptor(level: number) {
  if (level >= 2) return { label: "High", tone: "🔴" };
  if (level === 1) return { label: "Elevated", tone: "🟡" };
  return { label: "Stable", tone: "🟢" };
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
}: {
  opportunities: Opportunity[];
  regionStatuses: RegionStatus[];
  intelEvents: IntelEvent[];
  action?: ReactNode;
}) {
  const highestOpportunity = findHighestOpportunity(opportunities);
  const highestRisk = findHighestRisk(regionStatuses);
  const criticalCount = intelEvents.filter((event) => event.riskLevel === "critical").length;
  const threat = threatDescriptor(criticalCount);
  const nextMove = highestOpportunity
    ? `Watch ${highestOpportunity.regionName} for ${highestOpportunity.resourceName}`
    : "Watch the busiest region";

  const cards = [
    {
      label: "Best region",
      value: highestOpportunity?.regionName ?? "—",
      note: highestOpportunity ? highestOpportunity.resourceName : "No live route",
    },
    {
      label: "Risk check",
      value: `${threat.tone} ${threat.label}`,
      note: `${intelEvents.length} live signals`,
    },
    {
      label: "Next move",
      value: nextMove,
      note: highestRisk ? `Combat highest in ${highestRisk.regionName}` : "Market is quiet",
    },
  ];

  return (
    <section className="panel stack intel-summary-panel" id="intel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Frontier Intel</p>
          <h2>Find the next profitable route</h2>
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
      <div className="quick-guide">
        <div className="quick-guide__copy">
          <strong>Use this page to decide where to post or take the next run.</strong>
          <p className="muted">
            Start with the strongest region card, then open details only for reports you want to act on.
          </p>
        </div>
      </div>
    </section>
  );
}
