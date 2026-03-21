import Link from "next/link";
import { contractTypeLabels, recommendedContractType, type Opportunity } from "@eve/shared";

export function OpportunityBoard({ opportunities }: { opportunities: Opportunity[] }) {
  return (
    <section className="panel stack">
      <div className="section-head">
        <div>
          <p className="eyebrow">Opportunity Feed</p>
          <h2>Region signals</h2>
        </div>
        <Link href="/contracts" className="button secondary">
          Create a contract
        </Link>
      </div>
      <div className="opportunity-grid">
        {opportunities.map((opportunity) => (
          <article key={opportunity.id} className="opportunity-card">
            <div className="opportunity-head">
              <div>
                <p className="eyebrow">Regional opportunity</p>
                <strong>{opportunity.regionName}</strong>
                <p className="opportunity-subtitle">{opportunity.resourceName}</p>
              </div>
              <span className="score-chip">{opportunity.opportunityScore}</span>
            </div>
            <p className="muted">{opportunity.summary}</p>
            <dl className="score-grid">
              <div>
                <dt>Demand</dt>
                <dd>{opportunity.demandScore}</dd>
              </div>
              <div>
                <dt>Supply</dt>
                <dd>{opportunity.supplyScore}</dd>
              </div>
              <div>
                <dt>Risk</dt>
                <dd>{opportunity.riskScore}</dd>
              </div>
              <div>
                <dt>Adjustment</dt>
                <dd>{opportunity.adjustment}</dd>
              </div>
            </dl>
            <div className="recommend-band">
              <span className="eyebrow">Suggested action</span>
              <strong>{contractTypeLabels[recommendedContractType(opportunity)]}</strong>
            </div>
            <div className="card-actions">
              <Link
                href={`/contracts?type=${recommendedContractType(opportunity)}&resource=${encodeURIComponent(opportunity.resourceName)}&region=${encodeURIComponent(opportunity.regionName)}`}
                className="button primary"
              >
                Create contract
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
