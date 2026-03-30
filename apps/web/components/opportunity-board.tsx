"use client";

import { useState } from "react";
import Link from "next/link";
import { localizePath, type AppLocale } from "../lib/i18n";
import { contractTypeLabels, recommendedContractType, type Opportunity } from "@eve/shared";
import { ProgressBar } from "./ui/progress-bar";

function localizeRecommendedType(type: "procure" | "deliver", locale: AppLocale) {
  if (locale !== "zh") return contractTypeLabels[type];
  return type === "deliver" ? "运输" : "采购";
}

export function OpportunityBoard({ opportunities, locale = "en" }: { opportunities: Opportunity[]; locale?: AppLocale }) {
  const isZh = locale === "zh";
  const [expanded, setExpanded] = useState(false);
  const visibleOpportunities = expanded ? opportunities : opportunities.slice(0, 2);

  return (
    <section className="panel stack">
      <div className="section-head">
        <div>
          <p className="eyebrow">{isZh ? "市场信号" : "Market Signals"}</p>
          <h2>{isZh ? "区域机会" : "Region signals"}</h2>
        </div>
        <div className="button-row">
          {opportunities.length > 2 ? (
            <button
              type="button"
              className="button tertiary"
              onClick={() => setExpanded((current) => !current)}
            >
              {expanded ? (isZh ? "收起" : "Show less") : isZh ? `再看 ${opportunities.length - 2} 条` : `Show ${opportunities.length - 2} more`}
            </button>
          ) : null}
          <Link href={localizePath("/contracts", locale)} className="button secondary">
            {isZh ? "快速发单" : "Quick Create"}
          </Link>
        </div>
      </div>
      <div className="opportunity-grid">
        {visibleOpportunities.map((opportunity) => (
          <article key={opportunity.id} className="opportunity-card">
            <div className="opportunity-head">
              <div>
                <p className="eyebrow">{isZh ? "机会" : "Regional opportunity"}</p>
                <strong>{opportunity.regionName}</strong>
                <p className="opportunity-subtitle">{opportunity.resourceName}</p>
              </div>
              <span className="score-chip">{opportunity.opportunityScore}</span>
            </div>
            <dl className="score-grid">
              <div>
                <dt>{isZh ? "需求" : "Demand"}</dt>
                <dd>
                  <span>{opportunity.demandScore}</span>
                  <ProgressBar value={opportunity.demandScore} tone="red" />
                </dd>
              </div>
              <div>
                <dt>{isZh ? "风险" : "Risk"}</dt>
                <dd>{opportunity.riskScore}</dd>
              </div>
              <div>
                <dt>{isZh ? "溢价" : "Premium"}</dt>
                <dd>{opportunity.adjustment > 0 ? `+${opportunity.adjustment}%` : `${opportunity.adjustment}%`}</dd>
              </div>
              <div>
                <dt>{isZh ? "动作" : "Action"}</dt>
                <dd>{localizeRecommendedType(recommendedContractType(opportunity), locale)}</dd>
              </div>
            </dl>
            <div className="card-footer">
              <Link
                href={localizePath(`/contracts?type=${recommendedContractType(opportunity)}&resource=${encodeURIComponent(opportunity.resourceName)}&region=${encodeURIComponent(opportunity.regionName)}`, locale)}
                className="button secondary"
                aria-label={`Create order for ${opportunity.regionName}`}
              >
                {isZh ? "创建订单" : "Post Order"}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
