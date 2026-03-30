import Link from "next/link";
import {
  contractTypeLabels,
  recommendedContractType,
  riskLevelLabels,
  type Opportunity,
  type RegionStatus,
} from "@eve/shared";
import { localizePath, type AppLocale } from "../lib/i18n";

function findOpportunity(regionName: string, opportunities: Opportunity[]) {
  return opportunities.find((opportunity) => opportunity.regionName === regionName);
}

export function RegionStatusBoard({
  regionStatuses,
  opportunities,
  locale = "en",
}: {
  regionStatuses: RegionStatus[];
  opportunities: Opportunity[];
  locale?: AppLocale;
}) {
  const isZh = locale === "zh";
  const localizeType = (type: "procure" | "deliver") =>
    locale === "zh" ? (type === "deliver" ? "运输" : "采购") : contractTypeLabels[type];

  return (
    <section className="panel stack">
      <div className="section-head">
        <div>
          <p className="eyebrow">{isZh ? "区域状态" : "Region status"}</p>
          <h2>{isZh ? "重点贸易区域" : "Priority trade regions"}</h2>
        </div>
        <span className="subtle">{isZh ? "仅显示区域级聚合" : "Region-level aggregation only"}</span>
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
                  <p className="eyebrow">{isZh ? "区域状态" : "Region status"}</p>
                  <strong>{region.regionName}</strong>
                  <p className="opportunity-subtitle">{region.summary}</p>
                </div>
                <span className="status-pill">{riskLevelLabels[region.securityLevel]}</span>
              </div>
              <dl className="score-grid">
                <div>
                  <dt>{isZh ? "冲突" : "Combat"}</dt>
                  <dd>{region.combatActivity}</dd>
                </div>
                <div>
                  <dt>{isZh ? "物流" : "Logistics"}</dt>
                  <dd>{region.logisticsStability}</dd>
                </div>
                <div>
                  <dt>{isZh ? "资源压力" : "Resource pressure"}</dt>
                  <dd>{region.resourcePressure}</dd>
                </div>
                <div>
                  <dt>{isZh ? "舰队活动" : "Fleet activity"}</dt>
                  <dd>{region.fleetActivity}</dd>
                </div>
              </dl>
              <div className="card-footer">
                <div className="card-footer__meta">
                  <span className="eyebrow">{isZh ? "推荐动作" : "Best action"}</span>
                  <strong>{localizeType(suggestedType)}</strong>
                </div>
                <Link
                  href={localizePath(`/contracts?type=${suggestedType}&resource=${encodeURIComponent(region.dominantResource)}&region=${encodeURIComponent(region.regionName)}`, locale)}
                  className="button secondary"
                >
                  {isZh ? "创建订单" : "Post order"}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
