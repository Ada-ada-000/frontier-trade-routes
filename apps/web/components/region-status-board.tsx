import Link from "next/link";
import {
  contractTypeLabels,
  recommendedContractType,
  riskLevelLabels,
  type Opportunity,
  type RegionStatus,
} from "@eve/shared";

function findOpportunity(regionName: string, opportunities: Opportunity[]) {
  return opportunities.find((opportunity) => opportunity.regionName === regionName);
}

export function RegionStatusBoard({
  regionStatuses,
  opportunities,
}: {
  regionStatuses: RegionStatus[];
  opportunities: Opportunity[];
}) {
  return (
    <section className="panel stack">
      <div className="section-head">
        <div>
          <p className="eyebrow">Region status</p>
          <h2>Priority trade regions</h2>
        </div>
        <span className="subtle">Region-level aggregation only</span>
      </div>
      <div className="region-status-list">
        {regionStatuses.map((region) => {
          const opportunity = findOpportunity(region.regionName, opportunities);
          const suggestedType = opportunity
            ? recommendedContractType(opportunity)
            : region.resourcePressure >= 65
              ? "deliver"
              : "procure";

          return (
            <article key={region.id} className="status-card">
              <div className="opportunity-head">
                <div>
                  <p className="eyebrow">Region status</p>
                  <strong>{region.regionName}</strong>
                  <p className="opportunity-subtitle">{region.summary}</p>
                </div>
                <span className="status-pill">{riskLevelLabels[region.securityLevel]}</span>
              </div>
              <dl className="score-grid">
                <div>
                  <dt>Combat</dt>
                  <dd>{region.combatActivity}</dd>
                </div>
                <div>
                  <dt>Logistics</dt>
                  <dd>{region.logisticsStability}</dd>
                </div>
                <div>
                  <dt>Resource pressure</dt>
                  <dd>{region.resourcePressure}</dd>
                </div>
                <div>
                  <dt>Fleet activity</dt>
                  <dd>{region.fleetActivity}</dd>
                </div>
              </dl>
              <div className="card-footer">
                <div className="card-footer__meta">
                  <span className="eyebrow">Best action</span>
                  <strong>{contractTypeLabels[suggestedType]}</strong>
                </div>
                <Link
                  href={`/contracts?type=${suggestedType}&resource=${encodeURIComponent(region.dominantResource)}&region=${encodeURIComponent(region.regionName)}`}
                  className="button secondary"
                >
                  Post order
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
