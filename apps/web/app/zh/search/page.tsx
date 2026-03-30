import Link from "next/link";
import {
  mockContracts,
  recommendedContractType,
} from "@eve/shared";
import { AppShell } from "../../../components/app-shell";
import { MockOpportunitiesAdapter, getOpportunitiesAdapter } from "../../../lib/opportunities";
import { getTradeRoutesSnapshot } from "../../../lib/trade-routes/server-data";
import { localizePath } from "../../../lib/i18n";

function localizeOrderMode(value: string) {
  return value === "urgent" ? "急单" : value === "competitive" ? "竞价单" : value;
}

function localizeOrderStatus(value: string) {
  return (
    {
      open: "开放中",
      assigned: "已接单",
      in_transit: "运输中",
      completed: "已完成",
      disputed: "争议中",
    }[value] ?? value
  );
}

function localizeContractType(type: "procure" | "deliver") {
  return type === "procure" ? "采购" : "运输";
}

function localizeContractStatus(status: string) {
  return (
    {
      open: "开放中",
      accepted: "已接单",
      completed: "已完成",
      cancelled: "已取消",
      expired: "已过期",
    }[status] ?? status
  );
}

function localizeIntelStatus(status: string) {
  return (
    {
      pending: "待验证",
      confirmed: "已验证",
      disputed: "有争议",
      false: "不可信",
    }[status] ?? status
  );
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function includesQuery(parts: Array<string | undefined>, query: string) {
  if (!query) return true;
  return parts.some((part) => part && normalize(part).includes(query));
}

export const dynamic = "force-dynamic";

export default async function SearchPageZh({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawQuery = typeof params.q === "string" ? params.q : "";
  const query = normalize(rawQuery);
  const opportunities = await getOpportunitiesAdapter().list().catch(async () => new MockOpportunitiesAdapter().list());
  const snapshot = await getTradeRoutesSnapshot();

  const matchingOrders = snapshot.orders.filter((order) =>
    includesQuery([order.originFuzzy, order.destinationFuzzy, order.cargoHint, order.orderMode, order.status], query),
  );
  const matchingContracts = mockContracts.filter((contract) =>
    includesQuery([contract.targetRegion, contract.resource, contract.contractType, contract.status], query),
  );
  const matchingOpportunities = opportunities.filter((opportunity) =>
    includesQuery([opportunity.regionName, opportunity.resourceName, opportunity.summary], query),
  );
  const matchingIntel = snapshot.intelReports.filter((report) =>
    includesQuery([report.regionFuzzy, report.orderHint, report.status], query),
  );
  const matchingRegions = snapshot.heatmap.filter((region) => includesQuery([region.region], query));
  const totalResults =
    matchingOrders.length +
    matchingContracts.length +
    matchingOpportunities.length +
    matchingIntel.length +
    matchingRegions.length;

  return (
    <AppShell locale="zh">
      <main className="page-stack">
        <section className="panel stack" id="search">
          <div className="section-head">
            <div>
              <p className="eyebrow">搜索</p>
              <h1>{rawQuery ? `“${rawQuery}” 的结果` : "搜索区域、资源和机会"}</h1>
            </div>
            <span className="subtle">{totalResults} 条匹配</span>
          </div>
        </section>
        {!rawQuery ? (
          <section className="panel stack">
            <div className="empty-state">
              <strong>按区域或资源搜索</strong>
              <p className="muted">可以试试 O3H-1FN、EH1-FQC、Rare Alloy 或 isotopes。</p>
            </div>
          </section>
        ) : null}

        {rawQuery && matchingOrders.length > 0 ? (
          <section className="panel stack">
            <div className="section-head">
              <div>
                <p className="eyebrow">航线任务</p>
                <h2>匹配到的接单池</h2>
              </div>
              <Link href={localizePath("/app#bidding-pool", "zh")} className="button secondary">打开任务池</Link>
            </div>
            <div className="search-grid">
              {matchingOrders.map((order) => (
                <article key={order.orderId} className="search-card">
                  <div className="table-card__header">
                    <div>
                      <p className="eyebrow">订单 #{order.orderId}</p>
                      <strong>{order.cargoHint}</strong>
                    </div>
                    <span className="status-pill is-open">{localizeOrderMode(order.orderMode)}</span>
                  </div>
                  <div className="stats-grid">
                    <div className="side-block"><span className="eyebrow">起点</span><strong>{order.originFuzzy}</strong></div>
                    <div className="side-block"><span className="eyebrow">终点</span><strong>{order.destinationFuzzy}</strong></div>
                  </div>
                  <div className="card-actions">
                    <span className="subtle">{localizeOrderStatus(order.status)}</span>
                    <Link href={localizePath("/app#bidding-pool", "zh")} className="button primary">查看任务</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {rawQuery && matchingContracts.length > 0 ? (
          <section className="panel stack">
            <div className="section-head">
              <div><p className="eyebrow">订单</p><h2>匹配到的合同</h2></div>
              <Link href={localizePath("/contracts#contracts", "zh")} className="button secondary">打开订单页</Link>
            </div>
            <div className="search-grid">
              {matchingContracts.map((contract) => (
                <article key={contract.id} className="search-card">
                  <div className="table-card__header">
                    <div><p className="eyebrow">{localizeContractType(contract.contractType)}</p><strong>{contract.targetRegion}</strong></div>
                    <span className="status-pill is-assigned">{localizeContractStatus(contract.status)}</span>
                  </div>
                  <p className="muted">{contract.resource} · {contract.quantity} · {contract.reward} SUI</p>
                  <div className="card-actions">
                    <span className="subtle">{contract.id}</span>
                    <Link href={localizePath(`/contracts/${contract.id}`, "zh")} className="button primary">查看合同</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {rawQuery && matchingOpportunities.length > 0 ? (
          <section className="panel stack">
            <div className="section-head">
              <div>
                <p className="eyebrow">机会</p>
                <h2>匹配到的商业机会</h2>
              </div>
              <Link href={localizePath("/opportunities#intel", "zh")} className="button secondary">打开情报页</Link>
            </div>
            <div className="search-grid">
              {matchingOpportunities.map((opportunity) => {
                const suggestedType = recommendedContractType(opportunity);
                return (
                  <article key={opportunity.id} className="search-card">
                    <div className="table-card__header">
                      <div>
                        <p className="eyebrow">{opportunity.resourceName}</p>
                        <strong>{opportunity.regionName}</strong>
                      </div>
                      <span className="score-chip">{opportunity.opportunityScore}</span>
                    </div>
                    <p className="muted">{opportunity.summary}</p>
                    <div className="card-actions">
                      <span className="subtle">{localizeContractType(suggestedType)}</span>
                      <Link
                        href={localizePath(`/contracts?type=${suggestedType}&resource=${encodeURIComponent(opportunity.resourceName)}&region=${encodeURIComponent(opportunity.regionName)}`, "zh")}
                        className="button primary"
                      >
                        创建订单
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {rawQuery && matchingIntel.length > 0 ? (
          <section className="panel stack">
            <div className="section-head">
              <div>
                <p className="eyebrow">情报报告</p>
                <h2>社区情报</h2>
              </div>
            </div>
            <div className="search-grid">
              {matchingIntel.map((event) => (
                <article key={event.reportId} className="search-card">
                  <div className="table-card__header">
                    <div>
                      <p className="eyebrow">情报报告</p>
                      <strong>{event.regionFuzzy}</strong>
                    </div>
                    <span className="status-pill">{localizeIntelStatus(event.status)}</span>
                  </div>
                  <p className="muted">
                    置信度 {(event.confidenceBps / 100).toFixed(0)}% · {event.supportCount} 支持
                  </p>
                  <div className="card-actions">
                    <span className="subtle">{event.disputeCount} 质疑</span>
                    <Link href={localizePath("/opportunities#intel", "zh")} className="button secondary">
                      打开情报流
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {rawQuery && matchingRegions.length > 0 ? (
          <section className="panel stack">
            <div className="section-head">
              <div>
                <p className="eyebrow">区域状态</p>
                <h2>附近区域情况</h2>
              </div>
            </div>
            <div className="search-grid">
              {matchingRegions.map((region) => (
                <article key={region.region} className="search-card">
                  <div className="table-card__header">
                    <div>
                      <p className="eyebrow">区域压力</p>
                      <strong>{region.region}</strong>
                    </div>
                    <span className="status-pill">热度 {region.intensity}</span>
                  </div>
                  <p className="muted">
                    {region.demandCount} 条航线 · {region.urgentCount} 条急单 · {region.insuredCount} 条已投保
                  </p>
                  <div className="card-actions">
                    <span className="subtle">压力值 {region.intensity}</span>
                    <Link
                      href={localizePath(`/contracts?region=${encodeURIComponent(region.region)}`, "zh")}
                      className="button primary"
                    >
                      打开航线
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {rawQuery && totalResults === 0 ? (
          <section className="panel stack">
            <div className="empty-state">
              <strong>没有直接匹配结果</strong>
              <p className="muted">换一个区域名、资源名或货物名再试试。</p>
            </div>
          </section>
        ) : null}
      </main>
    </AppShell>
  );
}
