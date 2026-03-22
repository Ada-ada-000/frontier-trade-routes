import Link from "next/link";
import {
  contractTypeLabels,
  intelEventLabels,
  mockContracts,
  mockIntelEvents,
  mockRegionStatuses,
  recommendedContractType,
  riskLevelLabels,
} from "@eve/shared";
import { AppShell } from "../../components/app-shell";
import { MockOpportunitiesAdapter, getOpportunitiesAdapter } from "../../lib/opportunities";
import { mockOrders } from "../../lib/trade-routes/mock-data";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function includesQuery(parts: Array<string | undefined>, query: string) {
  if (!query) {
    return true;
  }

  return parts.some((part) => part && normalize(part).includes(query));
}

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawQuery = typeof params.q === "string" ? params.q : "";
  const query = normalize(rawQuery);

  const opportunities = await getOpportunitiesAdapter()
    .list()
    .catch(async () => {
      return new MockOpportunitiesAdapter().list();
    });

  const matchingOrders = mockOrders.filter((order) =>
    includesQuery(
      [order.originFuzzy, order.destinationFuzzy, order.cargoHint, order.orderMode, order.status],
      query,
    ),
  );

  const matchingContracts = mockContracts.filter((contract) =>
    includesQuery(
      [contract.targetRegion, contract.resource, contract.contractType, contract.status],
      query,
    ),
  );

  const matchingOpportunities = opportunities.filter((opportunity) =>
    includesQuery(
      [opportunity.regionName, opportunity.resourceName, opportunity.summary],
      query,
    ),
  );

  const matchingIntel = mockIntelEvents.filter((event) =>
    includesQuery(
      [event.regionName, event.resourceName, event.title, event.summary, event.type],
      query,
    ),
  );

  const matchingRegions = mockRegionStatuses.filter((region) =>
    includesQuery(
      [region.regionName, region.dominantResource, region.summary, region.securityLevel],
      query,
    ),
  );

  const totalResults =
    matchingOrders.length +
    matchingContracts.length +
    matchingOpportunities.length +
    matchingIntel.length +
    matchingRegions.length;

  return (
    <AppShell>
      <main className="page-stack">
        <section className="panel stack" id="search">
          <div className="section-head">
            <div>
              <p className="eyebrow">Search</p>
              <h1>{rawQuery ? `Results for ${rawQuery}` : "Search tasks and opportunities"}</h1>
            </div>
            <span className="subtle">{totalResults} matches</span>
          </div>
        </section>

        {!rawQuery ? (
          <section className="panel stack">
            <div className="empty-state">
              <strong>Search by region or resource</strong>
              <p className="muted">Try The Forge, Geminate, Refined Gas, or Rare Alloy.</p>
            </div>
          </section>
        ) : null}

        {rawQuery && matchingOrders.length > 0 ? (
          <section className="panel stack">
            <div className="section-head">
              <div>
                <p className="eyebrow">Route Tasks</p>
                <h2>Matching order board</h2>
              </div>
              <Link href="/app#bidding-pool" className="button secondary">
                Open Queue
              </Link>
            </div>
            <div className="search-grid">
              {matchingOrders.map((order) => (
                <article key={order.orderId} className="search-card">
                  <div className="table-card__header">
                    <div>
                      <p className="eyebrow">Order #{order.orderId}</p>
                      <strong>{order.cargoHint}</strong>
                    </div>
                    <span className="status-pill is-open">{order.orderMode}</span>
                  </div>
                  <div className="stats-grid">
                    <div className="side-block">
                      <span className="eyebrow">Origin</span>
                      <strong>{order.originFuzzy}</strong>
                    </div>
                    <div className="side-block">
                      <span className="eyebrow">Destination</span>
                      <strong>{order.destinationFuzzy}</strong>
                    </div>
                  </div>
                  <div className="card-actions">
                    <span className="subtle">{order.status}</span>
                    <Link href="/app#bidding-pool" className="button primary">
                      View task
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {rawQuery && matchingContracts.length > 0 ? (
          <section className="panel stack">
            <div className="section-head">
              <div>
                <p className="eyebrow">Contracts</p>
                <h2>Matching contracts</h2>
              </div>
              <Link href="/contracts#contracts" className="button secondary">
                Open Contracts
              </Link>
            </div>
            <div className="search-grid">
              {matchingContracts.map((contract) => (
                <article key={contract.id} className="search-card">
                  <div className="table-card__header">
                    <div>
                      <p className="eyebrow">{contractTypeLabels[contract.contractType]}</p>
                      <strong>{contract.targetRegion}</strong>
                    </div>
                    <span className="status-pill is-assigned">{contract.status}</span>
                  </div>
                  <p className="muted">
                    {contract.resource} · {contract.quantity} · {contract.reward} SUI
                  </p>
                  <div className="card-actions">
                    <span className="subtle">{contract.id}</span>
                    <Link href={`/contracts/${contract.id}`} className="button primary">
                      Open contract
                    </Link>
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
                <p className="eyebrow">Opportunities</p>
                <h2>Commercial opportunities</h2>
              </div>
              <Link href="/opportunities#intel" className="button secondary">
                Open Intel
              </Link>
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
                      <span className="subtle">{contractTypeLabels[suggestedType]}</span>
                      <Link
                        href={`/contracts?type=${suggestedType}&resource=${encodeURIComponent(opportunity.resourceName)}&region=${encodeURIComponent(opportunity.regionName)}`}
                        className="button primary"
                      >
                        Create contract
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
                <p className="eyebrow">Intel Events</p>
                <h2>Recent reports</h2>
              </div>
            </div>
            <div className="search-grid">
              {matchingIntel.map((event) => (
                <article key={event.id} className="search-card">
                  <div className="table-card__header">
                    <div>
                      <p className="eyebrow">{intelEventLabels[event.type]}</p>
                      <strong>{event.title}</strong>
                    </div>
                    <span className="status-pill">{riskLevelLabels[event.riskLevel]}</span>
                  </div>
                  <p className="muted">{event.regionName}</p>
                  <div className="card-actions">
                    <span className="subtle">{event.resourceName ?? "Intel"}</span>
                    <Link href="/opportunities#intel" className="button secondary">
                      Open feed
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
                <p className="eyebrow">Region Status</p>
                <h2>Nearby region conditions</h2>
              </div>
            </div>
            <div className="search-grid">
              {matchingRegions.map((region) => (
                <article key={region.id} className="search-card">
                  <div className="table-card__header">
                    <div>
                      <p className="eyebrow">{region.dominantResource}</p>
                      <strong>{region.regionName}</strong>
                    </div>
                    <span className="status-pill">{riskLevelLabels[region.securityLevel]}</span>
                  </div>
                  <p className="muted">{region.summary}</p>
                  <div className="card-actions">
                    <span className="subtle">Pressure {region.resourcePressure}</span>
                    <Link
                      href={`/contracts?resource=${encodeURIComponent(region.dominantResource)}&region=${encodeURIComponent(region.regionName)}`}
                      className="button primary"
                    >
                      Open route
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
              <strong>No direct matches</strong>
              <p className="muted">Try a region, resource, or cargo name.</p>
            </div>
          </section>
        ) : null}
      </main>
    </AppShell>
  );
}
