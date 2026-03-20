import Link from "next/link";
import {
  contractTypeLabels,
  describePrivacy,
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
          <h2>Trade-critical frontier regions</h2>
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
            <article key={region.id} className="panel status-card">
              <div className="section-head">
                <div>
                  <strong>{region.regionName}</strong>
                  <p className="muted">{region.summary}</p>
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
              <p className="muted small-copy">{describePrivacy(region.privacy)}</p>
              <div className="card-actions">
                <div>
                  <p className="subtle">Recommended contract</p>
                  <strong>{contractTypeLabels[suggestedType]}</strong>
                </div>
                <Link
                  href={`/contracts?type=${suggestedType}&resource=${encodeURIComponent(region.dominantResource)}&region=${encodeURIComponent(region.regionName)}`}
                  className="button secondary"
                >
                  Create contract
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
