"use client";

import { useState } from "react";
import Link from "next/link";
import { contractTypeLabels, recommendedContractType, type Opportunity } from "@eve/shared";
import { ProgressBar } from "./ui/progress-bar";

export function OpportunityBoard({ opportunities }: { opportunities: Opportunity[] }) {
  const [expanded, setExpanded] = useState(false);
  const visibleOpportunities = expanded ? opportunities : opportunities.slice(0, 2);

  return (
    <section className="panel stack">
      <div className="section-head">
        <div>
          <p className="eyebrow">Market Signals</p>
          <h2>Region signals</h2>
        </div>
        <div className="button-row">
          {opportunities.length > 2 ? (
            <button
              type="button"
              className="button tertiary"
              onClick={() => setExpanded((current) => !current)}
            >
              {expanded ? "Show less" : `Show ${opportunities.length - 2} more`}
            </button>
          ) : null}
          <Link href="/contracts" className="button secondary">
            Quick Create
          </Link>
        </div>
      </div>
      <div className="opportunity-grid">
        {visibleOpportunities.map((opportunity) => (
          <article key={opportunity.id} className="opportunity-card">
            <div className="opportunity-head">
              <div>
                <p className="eyebrow">Regional opportunity</p>
                <strong>{opportunity.regionName}</strong>
                <p className="opportunity-subtitle">{opportunity.resourceName}</p>
              </div>
              <span className="score-chip">{opportunity.opportunityScore}</span>
            </div>
            <dl className="score-grid">
              <div>
                <dt>Demand</dt>
                <dd>
                  <span>{opportunity.demandScore}</span>
                  <ProgressBar value={opportunity.demandScore} tone="red" />
                </dd>
              </div>
              <div>
                <dt>Supply</dt>
                <dd>
                  <span>{opportunity.supplyScore}</span>
                  <ProgressBar value={opportunity.supplyScore} tone="blue" />
                </dd>
              </div>
              <div>
                <dt>Risk</dt>
                <dd>{opportunity.riskScore}</dd>
              </div>
              <div>
                <dt>Premium</dt>
                <dd>{opportunity.adjustment > 0 ? `+${opportunity.adjustment}%` : `${opportunity.adjustment}%`}</dd>
              </div>
            </dl>
            <div className="card-footer">
              <div className="card-footer__meta">
                <span className="eyebrow">Best action</span>
                <strong>{contractTypeLabels[recommendedContractType(opportunity)]}</strong>
              </div>
              <Link
                href={`/contracts?type=${recommendedContractType(opportunity)}&resource=${encodeURIComponent(opportunity.resourceName)}&region=${encodeURIComponent(opportunity.regionName)}`}
                className="button secondary"
                aria-label={`Create order for ${opportunity.regionName}`}
              >
                Post Order
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
