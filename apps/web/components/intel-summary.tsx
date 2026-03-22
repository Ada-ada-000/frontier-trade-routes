import { riskLevelLabels, type IntelEvent, type Opportunity, type RegionStatus } from "@eve/shared";

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
}: {
  opportunities: Opportunity[];
  regionStatuses: RegionStatus[];
  intelEvents: IntelEvent[];
}) {
  const highestOpportunity = findHighestOpportunity(opportunities);
  const highestRisk = findHighestRisk(regionStatuses);

  const cards = [
    {
      label: "Active alerts",
      value: intelEvents.length.toString(),
      note: `${intelEvents.filter((event) => event.riskLevel === "critical").length} critical`,
    },
    {
      label: "Top region",
      value: highestOpportunity?.regionName ?? "—",
      note: highestOpportunity ? `${highestOpportunity.opportunityScore} score` : "No data",
    },
    {
      label: "Risk hotspot",
      value: highestRisk?.regionName ?? "—",
      note: highestRisk ? riskLevelLabels[highestRisk.securityLevel] : "No data",
    },
    {
      label: "Verification",
      value: intelEvents[0]?.privacy?.verificationMode === "sui-anchor" ? "SUI" : "MOCK",
      note: "Anchor ready",
    },
  ];

  return (
    <section className="panel stack">
      <div className="section-head">
        <div>
          <p className="eyebrow">Frontier Intel</p>
          <h2>Intel snapshot</h2>
        </div>
        <span className="subtle">Live summary</span>
      </div>
      <div className="intel-summary-grid">
        {cards.map((card) => (
          <article key={card.label} className="panel stat-card">
            <p className="eyebrow">{card.label}</p>
            <strong>{card.value}</strong>
            <p className="muted">{card.note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
